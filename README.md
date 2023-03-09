<p align="center">
  <img src="./img/qvet_icon.png" width="128px" height="128px">
  
  <h3 align="center">qvet</h3>

  <p align="center">
    Quickly vet your releases for QA.
  </p>
</p>

## Overview

`qvet` has two main components:

- `web`: The shiny dashboard UI. Most functionality is here.
- `api`: A lightweight backend, used where secrets are required.

All data is stored in Github, there is no additional persistent store/database required.

## Github App Configuration

### Permissions

- Commit statuses: Read and Write
  - To read and set QA status
- Contents: Read only
  - To read branches, commits and tags

### Events (currently not required)

- Create
  - To listen for a new tag (release) being created
- Push
  - To listen for new commits being pushed to master
- Status
  - To listen for QA statuses being updated

## Development

Start the two services in development/hot reload mode. Respectively:

- `web` with `cd web && npm install && npm run dev`
- `api` with `cd api && cargo watch -x 'run -- --bind 0.0.0.0:3000'`

## Standalone deployment

For convenience, `qvet` can run bundled in a single binary.

### Docker

For convenience, this binary is available in a thin docker image wrapper.

To build a new release, run `./qvet-standalone/scripts/build.sh`, which will produce an image named `qvet-standalone`.

This can then be invoked as follows:

```bash
docker run -d --rm --name ci-qvet --init -e GITHUB_CLIENT_ID -e GITHUB_CLIENT_SECRET -e QVET_COOKIE_KEY -p 39106:39105 qvet-standalone --bind 0.0.0.0:39105
```

#### Environment variables

| Environment Variable   | Example                           | Purpose                        | Notes                                                          |
| ---------------------- | --------------------------------- | ------------------------------ | -------------------------------------------------------------- |
| `GITHUB_CLIENT_ID`     | `Iv1.0123456789abcdef`            | Github App Client Id           | Required                                                       |
| `GITHUB_CLIENT_SECRET` | random hexadecimal, 40 characters | Github App Client Secret       | Required                                                       |
| `QVET_COOKIE_KEY`      | random hexadecimal, 64 characters | qvet private cookie encryption | Optional. If unset, a random key will be generated at runtime. |
