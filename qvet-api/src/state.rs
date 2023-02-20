use std::ops::Deref;
use oauth2::basic::BasicClient;
use axum::extract::FromRef;
use axum_extra::extract::cookie::Key;
use std::sync::Arc;

pub struct State {
    pub oauth2_client: BasicClient,
    pub cookie_key: Key,
}

// this impl tells `SignedCookieJar` how to access the key from our state
impl FromRef<SharedState> for Key {
    fn from_ref(state: &SharedState) -> Self {
        state.cookie_key.clone()
    }
}
#[derive(Clone)]
pub struct SharedState(pub Arc<State>);

// deref so you can still access the inner fields easily
impl Deref for SharedState {
    type Target = State;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}
