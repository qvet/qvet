use anyhow::Context;
use qvet_standalone::wrapped_api;
use sync_wrapper::SyncWrapper;

#[shuttle_service::main]
async fn axum(
    #[shuttle_secrets::Secrets] secret_store: shuttle_secrets::SecretStore,
) -> shuttle_service::ShuttleAxum {
    let client_id = secret_store
        .get("GITHUB_CLIENT_ID")
        .context("github client id")?;
    let client_secret = secret_store
        .get("GITHUB_CLIENT_SECRET")
        .context("github client secret")?;

    let app = wrapped_api(client_id, client_secret)?;
    let sync_wrapper = SyncWrapper::new(app);

    Ok(sync_wrapper)
}
