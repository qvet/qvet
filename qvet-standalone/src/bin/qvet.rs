use qvet_api::runtime;
use qvet_api::serve;
use qvet_api::api_app;
use qvet_standalone::wrap_api;

async fn run(args: runtime::Args) -> anyhow::Result<()> {
    let app = api_app(runtime::github_oauth2_client()?);
    let app = wrap_api(app);
    serve(&args.bind, app).await?;
    Ok(())
}

#[tokio::main]
async fn main() {
    runtime::init_logging();
    let args = runtime::parse_args();

    runtime::error_report(run(args).await);
}
