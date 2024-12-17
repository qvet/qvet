use crate::state::SharedState;
use axum::http::StatusCode;
use axum::{
    extract::{self, State},
    response::{IntoResponse, Json, Response},
};
use axum_extra::extract::cookie::{Cookie, PrivateCookieJar, SameSite};
use oauth2::reqwest::async_http_client;
use oauth2::{
    basic::BasicTokenType, AccessToken, AuthorizationCode, CsrfToken, EmptyExtraTokenFields,
    PkceCodeChallenge, PkceCodeVerifier, RefreshToken, StandardTokenResponse, TokenResponse,
};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct Oauth2FlowState {
    csrf_token: CsrfToken,
    pkce_verifier: PkceCodeVerifier,
}

#[derive(Serialize, Deserialize)]
pub struct Oauth2InitiateRequest {
    redirect_origin: oauth2::url::Url,
}

#[derive(Serialize, Deserialize)]
pub struct Oauth2InitiateResponse {
    redirect_url: oauth2::url::Url,
    internal_state: String,
}

pub async fn oauth2_initiate(
    State(state): State<SharedState>,
    extract::Json(payload): extract::Json<Oauth2InitiateRequest>,
) -> Json<Oauth2InitiateResponse> {
    tracing::info!("Initiating oauth2 flow");
    // Construct the redirect location based on the request
    let mut redirect_url = payload.redirect_origin;
    redirect_url
        .path_segments_mut()
        .expect("valid url in redirect origin")
        .push("oauth2")
        .push("callback");

    // Generate a PKCE challenge.
    let (pkce_challenge, pkce_verifier) = PkceCodeChallenge::new_random_sha256();

    let client = &state.oauth2_client;
    // Generate the full authorization URL.
    let (authorize_url, csrf_token) = client
        .authorize_url(CsrfToken::new_random)
        .set_redirect_uri(std::borrow::Cow::Owned(oauth2::RedirectUrl::from_url(
            redirect_url,
        )))
        // Set the PKCE code challenge.
        .set_pkce_challenge(pkce_challenge)
        .url();

    let internal_state = Oauth2FlowState {
        csrf_token,
        pkce_verifier,
    };
    let internal_state = hex::encode(serde_json::to_string(&internal_state).expect("json failure"));
    // This is the URL you should redirect the user to, in order to trigger the authorization
    // process.
    Json(Oauth2InitiateResponse {
        redirect_url: authorize_url,
        internal_state,
    })
}

#[derive(Serialize, Deserialize)]
pub struct Oauth2CallbackRequest {
    code: AuthorizationCode,
    state: String,
    internal_state: String,
}

#[derive(Serialize, Deserialize)]
pub struct Oauth2CallbackResponse {
    access_token: AccessToken,
}

pub async fn oauth2_callback(
    State(state): State<SharedState>,
    jar: PrivateCookieJar,
    extract::Json(payload): extract::Json<Oauth2CallbackRequest>,
) -> Response {
    tracing::info!("Completing oauth2 flow");
    let internal_state: Oauth2FlowState =
        serde_json::from_slice(&hex::decode(payload.internal_state).expect("hex failure"))
            .expect("json failure");
    let token_result = &state
        .oauth2_client
        .exchange_code(payload.code)
        // Set the PKCE code verifier.
        .set_pkce_verifier(internal_state.pkce_verifier)
        .request_async(async_http_client)
        .await
        .map_err(|error| match &error {
            oauth2::RequestTokenError::Parse(_source, data) => {
                tracing::error!(
                    "Errored on response body: {}",
                    String::from_utf8_lossy(data)
                );
                error
            }
            _ => error,
        })
        .expect("request failure");

    let jar = set_refresh_token_cookie(jar, token_result, "exchange_code");
    (
        StatusCode::OK,
        jar,
        Json(Oauth2CallbackResponse {
            access_token: token_result.access_token().to_owned(),
        }),
    )
        .into_response()
}

const COOKIE_KEY_NAME_REFRESH_TOKEN: &str = "qvet-github-refresh-token";

pub async fn access_token(State(state): State<SharedState>, jar: PrivateCookieJar) -> Response {
    tracing::info!("New access token requested");
    let refresh_token = jar.get(COOKIE_KEY_NAME_REFRESH_TOKEN);
    let Some(refresh_token) = refresh_token else {
        return StatusCode::UNAUTHORIZED.into_response();
    };

    let refresh_token = RefreshToken::new(refresh_token.value().to_owned());

    let token_result = &state
        .oauth2_client
        .exchange_refresh_token(&refresh_token)
        .request_async(async_http_client)
        .await
        .expect("request failure");

    let jar = set_refresh_token_cookie(jar, token_result, "exchange_refresh_token");
    (
        StatusCode::OK,
        jar,
        Json(Oauth2CallbackResponse {
            access_token: token_result.access_token().to_owned(),
        }),
    )
        .into_response()
}

pub async fn logout(mut jar: PrivateCookieJar) -> Response {
    tracing::info!("Logout");
    let refresh_token = jar.get(COOKIE_KEY_NAME_REFRESH_TOKEN);
    if let Some(refresh_token) = refresh_token {
        jar = jar.remove(refresh_token);
    }

    (StatusCode::OK, jar).into_response()
}

pub fn set_refresh_token_cookie(
    jar: PrivateCookieJar,
    token_result: &StandardTokenResponse<EmptyExtraTokenFields, BasicTokenType>,
    operation_id: &str,
) -> PrivateCookieJar {
    if let Some(refresh_token) = token_result.refresh_token() {
        let cookie = Cookie::build((
            COOKIE_KEY_NAME_REFRESH_TOKEN,
            refresh_token.secret().to_owned(),
        ))
        .path("/")
        .secure(true)
        .http_only(true)
        .same_site(SameSite::Strict);
        jar.add(cookie)
    } else {
        tracing::warn!("No refresh token in {operation_id} response");
        jar
    }
}
