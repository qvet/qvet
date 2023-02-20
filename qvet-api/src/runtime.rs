use anyhow::{anyhow, Context, Result};
use clap::Parser;
use oauth2::basic::BasicClient;
use axum_extra::extract::cookie::Key;

pub fn init_logging() {
    tracing_subscriber::fmt().with_ansi(false).init();
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

const ENV_QVET_COOKIE_KEY: &str = "QVET_COOKIE_KEY";

pub fn cookie_key_from_env() -> Result<Key> {
    let Ok(raw_key) = std::env::var(ENV_QVET_COOKIE_KEY) else {
        tracing::warn!("{ENV_QVET_COOKIE_KEY} not set, using random cookie key");
        return Ok(Key::generate());
    };

    // Key must be at minimum 512 bits
    let raw_key_len = raw_key.len();
    if raw_key_len < 64 {
        return Err(anyhow!("{ENV_QVET_COOKIE_KEY} too short: must be 64 bytes, got: {raw_key_len} bytes"))
    }
    Ok(Key::from(raw_key.as_bytes()))
}

pub fn error_report(result: Result<()>) {
    if let Err(error) = result {
        tracing::error!("Runtime error:");
        for error in error.chain() {
            tracing::error!("--> {}", error);
        }
    }
}
