# qvet

Quickly vet your releases for QA.

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

### Events

- Create
  - To listen for a new tag (release) being created
- Push
  - To listen for new commits being pushed to master
- Status
  - To listen for QA statuses being updated

## Development

Start the two services in development/hot reload mode. Respectively:

- `web` with `cd web && npm install && npm run dev`
- `api` with `cd api && cargo watch -x 'run -- --bind 0.0.0.0:3000`
