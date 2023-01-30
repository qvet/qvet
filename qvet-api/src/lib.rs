use axum::{
    extract::Extension,
    routing::{get, post},
    Router,
};
use oauth2::basic::BasicClient;
use std::sync::Arc;
use tower_http::{
    trace::{DefaultOnResponse, TraceLayer},
    LatencyUnit,
};
use tracing::Level;

mod error;
mod oauth_handler;
pub mod runtime;
mod state;

pub use crate::error::Error;
use crate::error::Result;
use crate::state::State;

/// Tokio signal handler that will wait for a user to press CTRL+C.
/// We use this in our hyper `Server` method `with_graceful_shutdown`.
async fn shutdown_signal() {
    tokio::signal::ctrl_c()
        .await
        .expect("Expect shutdown signal handler");
    tracing::info!("Received Ctrl+C");
}

pub fn api_app(oauth2_client: BasicClient) -> Router {
    let state = Arc::new(State { oauth2_client });
    Router::new()
        .route("/", get(root))
        .route("/health", get(health))
        .route("/oauth2/initiate", get(oauth_handler::oauth2_initiate))
        .route("/oauth2/callback", post(oauth_handler::oauth2_callback))
        .layer(Extension(state.clone()))
        .layer(
            TraceLayer::new_for_http().on_response(
                DefaultOnResponse::new()
                    .level(Level::INFO)
                    .latency_unit(LatencyUnit::Micros),
            ),
        )
}

/// Listen at the given address for a single OAuth2 code grant callback.
pub async fn serve(address: &std::net::SocketAddr, app: Router) -> Result<()> {
    tracing::info!("Listening on {address:?}");
    axum::Server::bind(address)
        .serve(app.into_make_service())
        .with_graceful_shutdown(shutdown_signal())
        .await
        .map_err(Error::Listener)?;

    Ok(())
}

async fn root() -> &'static str {
    "qvet"
}

async fn health() -> &'static str {
    "ok"
}
