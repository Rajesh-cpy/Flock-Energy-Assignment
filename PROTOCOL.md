# Protocol and Integration Notes

## Overview

This application provides a REST interface over the legacy Urja Operations portal. The Express API receives client requests, delegates the work to the service layer, and uses an Axios client to communicate with the upstream portal.

## Request Flow

1. A client sends a request to the Express API.
2. The route validates relevant request parameters.
3. The service layer calls the portal client.
4. The portal client authenticates when necessary.
5. The upstream response is normalized by the service layer.
6. The API returns a JSON response or a structured error.

## Authentication

The portal client uses environment-based credentials:

- `URJA_BASE_URL`
- `URJA_USERNAME`
- `URJA_PASSWORD`

The login request submits URL-encoded credentials to `/login` and includes the headers expected by the portal.

The client uses `axios-cookiejar-support` and `tough-cookie` to retain cookies between requests.

A shared login promise prevents multiple simultaneous requests from initiating separate initial login operations.

## Session Recovery

The client detects unauthorized responses using HTTP status `401`.

When a protected request receives an unauthorized response, the client can attempt reauthentication and retry the original request once.

The retry must be limited to one attempt per request to prevent infinite loops.

Actual expired-session behavior depends on how the upstream portal responds. Session recovery should be tested against the portal, including failed login and concurrent unauthorized requests.

## Upstream Endpoints

| Operation             | Upstream endpoint                    |
| --------------------- | ------------------------------------ |
| Login                 | `POST /login`                        |
| Meter search          | `GET /portal/meters/search`          |
| Meter energy          | `GET /portal/meters/:meterId/energy` |
| Meter location        | `GET /portal/meters/:meterId/geo`    |
| Signing key retrieval | `GET /portal/keys`                   |
| Signed export         | `GET /portal/export`                 |

The signing-key and export operations are internal client capabilities and are not necessarily exposed as public API endpoints.

## Data Normalization

The service layer converts numeric strings to numbers where appropriate. Missing or invalid numeric values are represented as `null`, and timestamps are preserved as strings.

This gives consumers a more consistent response format than exposing the legacy portal's raw payloads.

## Error Handling

The application handles invalid parameters, missing meters, and upstream failures.

Upstream errors should be logged without exposing credentials, cookies, signing secrets, or other sensitive data. Public API responses should avoid leaking internal implementation details.

## Security Considerations

- Keep `.env` out of version control.
- Use `.env.example` only for placeholder values.
- Never log authentication credentials or session cookies.
- Use HTTPS for production traffic.
- Keep dependencies updated.
- Restrict retries to appropriate requests.
- Avoid exposing internal signing secrets through public responses.

## Known Limitations

The integration depends on the legacy portal's endpoint contracts, authentication behavior, and response formats. Changes to those contracts may require updates to the client or normalization layer.
