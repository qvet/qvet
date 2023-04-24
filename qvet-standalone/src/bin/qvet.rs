use qvet_api::runtime;
use qvet_api::serve;
use qvet_standalone::wrapped_api;

async fn run(args: runtime::Args) -> anyhow::Result<()> {
    let (client_id, client_secret) = runtime::github_credentials_from_env()?;
    let cookie_key = runtime::cookie_key_from_env()?;
    let app = wrapped_api(client_id, client_secret, cookie_key)?;
    let bind = runtime::bind_env_fallback(args.bind)?;
    serve(&bind, app).await?;
    Ok(())
}

#[tokio::main]
async fn main() {
    runtime::init_logging();
    let args = runtime::parse_args();

    runtime::error_report(run(args).await);
}
