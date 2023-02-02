use qvet_standalone::wrapped_api;
use sync_wrapper::SyncWrapper;

#[shuttle_service::main]
async fn axum() -> shuttle_service::ShuttleAxum {
    let app = wrapped_api()?;
    let sync_wrapper = SyncWrapper::new(app);

    Ok(sync_wrapper)
}