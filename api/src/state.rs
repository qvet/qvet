use oauth2::{ ClientId, ClientSecret, basic::BasicClient, AuthUrl, TokenUrl, RedirectUrl};
use crate::error::{Result, Error};
use std::sync::Arc;

pub struct State {
    pub oauth2_client: BasicClient,
}

impl State {
    pub fn new(client_id: ClientId, client_secret: ClientSecret) -> Result<Self> {
        // Create an OAuth2 client by specifying the client ID, client secret, authorization URL and
        // token URL.
        let oauth2_client = BasicClient::new(
            client_id,
            Some(client_secret),
            AuthUrl::new("https://github.com/login/oauth/authorize".to_string()).unwrap(),
            Some(TokenUrl::new("https://github.com/login/oauth/access_token".to_string()).unwrap()),
        )
        // Set the URL the user will be redirected to after the authorization process.
        .set_redirect_uri(RedirectUrl::new("http://localhost:39105/oauth2/callback".to_string()).map_err(|_| Error::InvalidConfiguration { message: "Invalid redirect url".to_string()})?);
        Ok(Self { oauth2_client })
    }
}

pub type SharedState = Arc<State>;

