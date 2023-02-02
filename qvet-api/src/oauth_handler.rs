use axum::{
    extract::{self, Extension},
    response::Json,
};
pub use oauth2::basic::BasicErrorResponse;
use oauth2::reqwest::async_http_client;
use oauth2::{
    AccessToken, AuthorizationCode, CsrfToken, PkceCodeChallenge, PkceCodeVerifier, TokenResponse,
};
use serde::{Deserialize, Serialize};

use crate::state::SharedState;

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
    Extension(state): Extension<SharedState>,
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
    Extension(state): Extension<SharedState>,
    extract::Json(payload): extract::Json<Oauth2CallbackRequest>,
) -> Json<Oauth2CallbackResponse> {
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
        .expect("request failure");

    Json(Oauth2CallbackResponse {
        access_token: token_result.access_token().to_owned(),
    })
}
