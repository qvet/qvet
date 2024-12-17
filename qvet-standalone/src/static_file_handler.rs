use axum::body::{self};
use axum::extract::Path;
use axum::http::header;
use axum::http::HeaderValue;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use include_dir::{include_dir, Dir, File};

const STATIC_DIR: Dir<'_> = include_dir!("$CARGO_MANIFEST_DIR/include");

pub async fn static_path(Path(path): Path<String>) -> impl IntoResponse {
    static_file(path).await
}
pub async fn static_index() -> impl IntoResponse {
    static_file("index.html".to_owned()).await
}

async fn static_file(path: String) -> impl IntoResponse {
    let path = path.trim_start_matches('/');
    let file = get_file(path.to_owned()).or_else(|| get_file("index.html".to_owned()));
    tracing::info!("Serving static file {:?}", path);
    match file {
        None => Response::builder()
            .status(StatusCode::NOT_FOUND)
            .body(Box::new(body::Body::empty()))
            .unwrap(),
        Some((file, path)) => {
            const MAX_AGE_ONE_WEEK: &str = "max-age=604800";
            const MAX_AGE_ZERO: &str = "max-age=0";
            let cache_control_value = if path == "version-uncached" {
                MAX_AGE_ZERO
            } else {
                MAX_AGE_ONE_WEEK
            };

            let mime_type = mime_guess::from_path(path).first_or_text_plain();

            Response::builder()
                .status(StatusCode::OK)
                .header(
                    header::CONTENT_TYPE,
                    HeaderValue::from_str(mime_type.as_ref()).unwrap(),
                )
                .header(
                    header::CACHE_CONTROL,
                    HeaderValue::from_str(cache_control_value).unwrap(),
                )
                .body(Box::new(body::Body::from(file.contents())))
                .unwrap()
        }
    }
}

fn get_file(path: String) -> Option<(&'static File<'static>, String)> {
    STATIC_DIR.get_file(&path).map(|file| (file, path))
}
