use clap::Parser;
use oauth2::{ClientId, ClientSecret};
use qvet_api::serve;

#[derive(Parser)]
struct Args {
    #[arg(long)]
    bind: std::net::SocketAddr,
}

async fn run(args: Args) -> anyhow::Result<()> {
    let client_id = ClientId::new(std::env::var("GITHUB_CLIENT_ID").unwrap());
    let client_secret = ClientSecret::new(std::env::var("GITHUB_CLIENT_SECRET").unwrap());
    serve(&args.bind, client_id, client_secret).await?;
    Ok(())
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();
    // env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).init();
    log::debug!("Initialised logging");

    let args = Args::parse();
    ::dotenv::dotenv().ok();

    if let Err(error) = run(args).await {
        log::error!("Runtime error:");
        for error in error.chain() {
            log::error!("--> {}", error);
        }
    }
}
