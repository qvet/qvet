use anyhow::{Context, Result};
use clap::Parser;
use oauth2::basic::BasicClient;

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

pub struct State {
    pub oauth2_client: BasicClient,
}

pub fn github_credentials_from_env() -> Result<(String, String)> {
    Ok((
        std::env::var("GITHUB_CLIENT_ID").context("github client id")?,
        std::env::var("GITHUB_CLIENT_SECRET").context("github client secret")?,
    ))
}

pub fn error_report(result: Result<()>) {
    if let Err(error) = result {
        tracing::error!("Runtime error:");
        for error in error.chain() {
            tracing::error!("--> {}", error);
        }
    }
}
