
use oauth2::AccessToken;
use axum::{
    http::StatusCode,
    extract::{self, Extension},
    response::Json,
};
use serde::{Serialize, Deserialize};
pub use oauth2::basic::BasicErrorResponse;
use crate::state::SharedState;


#[derive(Serialize, Deserialize)]
pub struct ListReposRequest {
    access_token: AccessToken,
}

#[derive(Serialize, Deserialize)]
pub struct Repo {
    owner: String,
    repo: String,
}

#[derive(Serialize, Deserialize)]
pub struct ListReposResponse {
    repos: Vec<Repo>,
}

pub async fn list_repos(
    Extension(_state): Extension<SharedState>,
    extract::Json(_payload): extract::Json<ListReposRequest>,
) -> Result<Json<ListReposResponse>, StatusCode> {
    let app_id = octocrab::models::AppId(std::env::var("GITHUB_APP_ID").unwrap().parse().expect("invalid app id"));
    let encoding_key = jsonwebtoken::EncodingKey::from_rsa_pem(&std::env::var("GITHUB_PRIVATE_KEY").unwrap().into_bytes()).expect("encoding key");
    let octocrab = octocrab::OctocrabBuilder::new().app(app_id, encoding_key).build().expect("octocrab build");
    let response = octocrab
    .apps()
    .installations()
    .send()
    .await.expect("octocrab error");
    log::info!("{response:?}");

    Ok(Json(ListReposResponse { repos: vec![]}))
}

