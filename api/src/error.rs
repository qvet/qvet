use thiserror::Error;

/// Errors that may lead to the OAuth2 code grant not being successfully completed.
#[derive(Error, Debug)]
pub enum Error {
    /// There was an error with our local server listening for the response.
    #[error("Internal error in listener")]
    Listener(hyper::Error),

    #[error("Invalid configuration: {message}")]
    InvalidConfiguration {
        message: String,
    },
}

pub type Result<T> = std::result::Result<T, Error>;
