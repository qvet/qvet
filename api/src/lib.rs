use axum::{
    extract::{ Extension},
    routing::{get, post},
    Router,
};
use oauth2::{
    ClientId, ClientSecret
};
use std::sync::Arc;
pub use oauth2::basic::BasicErrorResponse;

mod error;
mod oauth_handler;
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
    log::info!("Received Ctrl+C");
}

/// Listen at the given address for a single OAuth2 code grant callback.
pub async fn serve(address: &std::net::SocketAddr, client_id: ClientId, client_secret: ClientSecret) -> Result<()> {
    let state = Arc::new(State::new(client_id, client_secret)?);

    let app = Router::new()
        .route("/", get(root))
        .route("/health", get(health))
        .route("/oauth2/initiate", get(oauth_handler::oauth2_initiate))
        .route("/oauth2/callback", post(oauth_handler::oauth2_callback))
        .layer(Extension(state.clone()));

    axum::Server::bind(address)
        .serve(app.into_make_service())
        .with_graceful_shutdown(shutdown_signal())
        .await
        .map_err(Error::Listener)?;

    Ok(())
}


pub async fn root() -> &'static str {
    "qvet"
}

pub async fn health() -> &'static str {
    "ok"
}
