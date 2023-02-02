use qvet_api::runtime;
use qvet_api::serve;
use qvet_standalone::wrapped_api;


async fn run(args: runtime::Args) -> anyhow::Result<()> {
    let app = wrapped_api()?;
    serve(&args.bind, app).await?;
    Ok(())
}

#[tokio::main]
async fn main() {
    runtime::init_logging();
    let args = runtime::parse_args();

    runtime::error_report(run(args).await);
}
