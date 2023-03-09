use std::fmt;

/// Hold some data in a debug-proof container.
///
/// Prevents accidental leaking of secrets to logs.
#[derive(Clone, PartialEq, Eq)]
pub struct Redacted<T>(pub T);

impl<T> Redacted<T> {
    pub fn new(inner: impl Into<T>) -> Self {
        Self(inner.into())
    }
}

/// We manually implement this to only print a few characters of the secret.
impl<T> fmt::Debug for Redacted<T>
where
    T: std::ops::Deref<Target = str>,
{
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            r#"Redacted("{}***")"#,
            self.0.chars().take(4).collect::<String>()
        )
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use pretty_assertions::assert_eq;

    #[test]
    fn redacted_string_debug() {
        let cases = [
            ("", r#"Redacted("***")"#),
            ("min", r#"Redacted("min***")"#),
            ("secret", r#"Redacted("secr***")"#),
            (
                "1f6792b5-4b19-41e4-83a9-4a7c21d72f49",
                r#"Redacted("1f67***")"#,
            ),
        ];
        for (input, expected) in cases {
            assert_eq!(format!("{:?}", Redacted(input)), expected);
        }
    }
}
