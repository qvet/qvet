use oauth2::basic::BasicClient;
use std::sync::Arc;

pub struct State {
    pub oauth2_client: BasicClient,
}

pub type SharedState = Arc<State>;
