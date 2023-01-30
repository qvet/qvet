FROM busybox:1-musl
COPY target/x86_64-unknown-linux-musl/release/qvet /opt/qvet/qvet

ENTRYPOINT ["/opt/qvet/qvet"]
