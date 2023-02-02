use anyhow::{Context, Result};
use oauth2::{basic::BasicClient, AuthUrl, ClientId, ClientSecret, RedirectUrl, TokenUrl};

pub fn github_oauth2_client(
    github_client_id: String,
    github_client_secret: String,
) -> Result<BasicClient> {
    let client_id = ClientId::new(github_client_id);
    let client_secret = ClientSecret::new(github_client_secret);
    let oauth2_client = BasicClient::new(
        client_id,
        Some(client_secret),
        AuthUrl::new("https://github.com/login/oauth/authorize".to_string())
            .context("invalid github authorize url")?,
        Some(TokenUrl::new("https://github.com/login/oauth/access_token".to_string()).unwrap()),
    )
    // Set the URL the user will be redirected to after the authorization process.
    .set_redirect_uri(
        RedirectUrl::new("http://localhost:39105/oauth2/callback".to_string())
            .context("invalid oauth2 redirect url")?,
    );
    Ok(oauth2_client)
}
