use axum::Router;
use http::StatusCode;
use axum::routing::get;
use axum::extract::Path;
use axum::body::{self, Empty, Full};
use axum::response::{Response, IntoResponse};
use include_dir::{include_dir, Dir, File};
use http::header;
use http::HeaderValue;

pub fn wrap_api(api: Router) -> Router {
    let app = Router::new()
        .nest("/api", api)
        .route("/*path", get(static_path))
        .route("/", get(static_index));
    app
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
    STATIC_DIR.get_file(&path).map(|file| (file , path))
}
