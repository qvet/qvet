use crate::redacted::Redacted;
use anyhow::{anyhow, Context, Result};
use axum_extra::extract::cookie::Key;
use clap::Parser;
use oauth2::basic::BasicClient;
use std::net::SocketAddr;

pub fn init_logging() {
    tracing_subscriber::fmt().with_ansi(false).init();
    tracing::debug!("Initialised logging");
}

#[derive(Parser)]
pub struct Args {
    #[arg(long)]
    pub bind: Option<SocketAddr>,
}

pub fn parse_args() -> Args {
    Args::parse()
}

pub struct State {
    pub oauth2_client: BasicClient,
}

const ENV_GITHUB_CLIENT_ID: &str = "GITHUB_CLIENT_ID";
const ENV_GITHUB_CLIENT_SECRET: &str = "GITHUB_CLIENT_SECRET";

pub fn github_credentials_from_env() -> Result<(String, Redacted<String>)> {
    let client_id = std::env::var(ENV_GITHUB_CLIENT_ID).context("github client id")?;
    tracing::info!("{ENV_GITHUB_CLIENT_ID} loaded: {client_id:?}");
    let client_secret =
        Redacted::new(std::env::var(ENV_GITHUB_CLIENT_SECRET).context("github client secret")?);
    tracing::info!("{ENV_GITHUB_CLIENT_SECRET} loaded: {client_secret:?}");
    Ok((client_id, client_secret))
}

const ENV_QVET_COOKIE_KEY: &str = "QVET_COOKIE_KEY";

pub fn cookie_key_from_env() -> Result<Key> {
    let Ok(raw_key) = std::env::var(ENV_QVET_COOKIE_KEY) else {
        // If we aren't loading a cookie key from env, early return a random one
        tracing::warn!("{ENV_QVET_COOKIE_KEY} not set, using random cookie key");
        return Ok(Key::generate());
    };

    // Otherwise, check it's valid, then load it
    let raw_key: Redacted<String> = Redacted::new(raw_key);
    tracing::info!("{ENV_QVET_COOKIE_KEY} loaded: {raw_key:?}");

    // Key must be at minimum 512 bits
    let raw_key_len = raw_key.0.len();
    if raw_key_len < 64 {
        return Err(anyhow!(
            "{ENV_QVET_COOKIE_KEY} too short: must be 64 bytes, got: {raw_key_len} bytes"
        ));
    }
    Ok(Key::from(raw_key.0.as_bytes()))
}

pub fn error_report(result: Result<()>) {
    if let Err(error) = result {
        tracing::error!("Runtime error:");
        for error in error.chain() {
            tracing::error!("--> {}", error);
        }
    }
}

fn bind_from_env() -> Result<SocketAddr> {
    let mut bind: SocketAddr = "0.0.0.0:3000".parse().expect("invalid default bind");
    if let Ok(port) = std::env::var("PORT") {
        let port = port.parse().context("PORT was not a valid port number")?;
        bind.set_port(port);
    }
    Ok(bind)
}

pub fn bind_env_fallback(bind: Option<SocketAddr>) -> Result<SocketAddr> {
    if let Some(bind) = bind {
        Ok(bind)
    } else {
        bind_from_env()
    }
}
