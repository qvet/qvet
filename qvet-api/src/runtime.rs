use clap::Parser;

pub fn init_logging() {
    tracing_subscriber::fmt::init();
    tracing::debug!("Initialised logging");
}

#[derive(Parser)]
pub struct Args {
    #[arg(long)]
    pub bind: std::net::SocketAddr,
}

pub fn parse_args() -> Args {
    Args::parse()
}

use anyhow::{Context, Result};
use oauth2::{basic::BasicClient, AuthUrl, ClientId, ClientSecret, RedirectUrl, TokenUrl};

pub struct State {
    pub oauth2_client: BasicClient,
}

pub fn github_oauth2_client() -> Result<BasicClient> {
    let client_id = ClientId::new(std::env::var("GITHUB_CLIENT_ID").unwrap());
    let client_secret = ClientSecret::new(std::env::var("GITHUB_CLIENT_SECRET").unwrap());
    let oauth2_client = BasicClient::new(
        client_id,
        Some(client_secret),
        AuthUrl::new("https://github.com/login/oauth/authorize".to_string())
            .context("invalid github authorize url")?,
        Some(TokenUrl::new("https://github.com/login/oauth/access_token".to_string()).unwrap()),
    )
    // Set the URL the user will be redirected to after the authorization process.
    .set_redirect_uri(
        RedirectUrl::new("http://localhost:39105/oauth2/callback".to_string())
            .context("invalid oauth2 redirect url")?,
    );
    Ok(oauth2_client)
}

pub fn error_report(result: Result<()>) {
    if let Err(error) = result {
        tracing::error!("Runtime error:");
        for error in error.chain() {
            tracing::error!("--> {}", error);
        }
    }
}
