use axum::routing::get;
use axum::Router;
use axum_extra::extract::cookie::Key;
use qvet_api::api_app;
use qvet_api::github_oauth2_client;
use qvet_api::redacted::Redacted;

mod static_file_handler;

pub fn wrapped_api(
    client_id: String,
    client_secret: Redacted<String>,
    cookie_key: Key,
) -> anyhow::Result<Router> {
    let app = api_app(github_oauth2_client(client_id, client_secret)?, cookie_key);
    Ok(wrap_api(app))
}

pub fn wrap_api(api: Router) -> Router {
    Router::new()
        .nest("/api", api)
        .route("/{*path}", get(static_file_handler::static_path))
        .route("/", get(static_file_handler::static_index))
}
