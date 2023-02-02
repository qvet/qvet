use axum::body::{self, Empty, Full};
use axum::extract::Path;
use axum::response::{IntoResponse, Response};
use axum::routing::get;
use axum::Router;
use http::header;
use http::HeaderValue;
use http::StatusCode;
use include_dir::{include_dir, Dir, File};
use qvet_api::api_app;
use qvet_api::github_oauth2_client;

pub fn wrapped_api(client_id: String, client_secret: String) -> anyhow::Result<Router> {
    let app = api_app(github_oauth2_client(client_id, client_secret)?);
    Ok(wrap_api(app))
}

pub fn wrap_api(api: Router) -> Router {
    Router::new()
        .nest("/api", api)
        .route("/*path", get(static_path))
        .route("/", get(static_index))
}

const STATIC_DIR: Dir<'_> = include_dir!("$CARGO_MANIFEST_DIR/include");

async fn static_path(Path(path): Path<String>) -> impl IntoResponse {
    static_file(path).await
}
async fn static_index() -> impl IntoResponse {
    static_file("index.html".to_owned()).await
}

async fn static_file(path: String) -> impl IntoResponse {
    let path = path.trim_start_matches('/');
    let file = get_file(path.to_owned()).or_else(|| get_file("index.html".to_owned()));
    tracing::info!("Serving static file {:?}", path);
    match file {
        None => Response::builder()
            .status(StatusCode::NOT_FOUND)
            .body(body::boxed(Empty::new()))
            .unwrap(),
        Some((file, path)) => {
            let mime_type = mime_guess::from_path(path).first_or_text_plain();
            Response::builder()
                .status(StatusCode::OK)
                .header(
                    header::CONTENT_TYPE,
                    HeaderValue::from_str(mime_type.as_ref()).unwrap(),
                )
                .body(body::boxed(Full::from(file.contents())))
                .unwrap()
        }
    }
}

fn get_file(path: String) -> Option<(&'static File<'static>, String)> {
    STATIC_DIR.get_file(&path).map(|file| (file, path))
}
