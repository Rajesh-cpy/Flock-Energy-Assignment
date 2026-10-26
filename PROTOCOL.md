# Protocol Notes: Urja Meter Ops

## Purpose

This document describes how the Flock Energy Meter API communicates with the legacy Urja Meter Ops portal. It records the observed request patterns, authentication approach, available meter data, normalization behavior, and areas requiring further verification.

## Upstream Endpoints

| Operation      | HTTP Request                          | Purpose                                                                 |
| -------------- | ------------------------------------- | ----------------------------------------------------------------------- |
| Login          | `POST /login`                         | Establish a portal session                                              |
| Meter search   | `GET /portal/meters/search?q=&page=1` | Search and list meters                                                  |
| Meter energy   | `GET /portal/meters/{meterId}/energy` | Retrieve consumption readings                                           |
| Meter location | `GET /portal/meters/{meterId}/geo`    | Retrieve geographical coordinates                                       |
| Signing key    | `GET /portal/keys`                    | Retrieve the secret used by the internal export flow                    |
| Signed export  | `GET /portal/export?page=...`         | Internal signed-export capability, not exposed as a public API endpoint |

## Authentication and Session Management

The client submits URL-encoded `email` and `password` fields to the portal's `/login` endpoint.

The login request includes headers observed during investigation, including:

- `Content-Type: application/x-www-form-urlencoded`
- `Origin`
- `Referer`
- `X-Sveltekit-Action`

The response is checked for the expected redirect-style login result.

### Cookie Persistence

The client uses `tough-cookie` with `axios-cookiejar-support` to retain session cookies between requests. This allows subsequent protected requests to reuse the portal session without manually handling cookie headers in each service.

### Shared Login Attempt

The client tracks authentication state and uses a shared login promise so that concurrent initial requests can wait for the same login operation rather than each starting a separate login.

### Expired Sessions

The client includes response-interceptor logic intended to detect `401 Unauthorized`, reauthenticate, and retry an eligible request once.

This behavior requires dedicated tests for expired cookies, concurrent unauthorized responses, successful reauthentication, and failed reauthentication. The existing Express tests mock the service layer and therefore do not prove session recovery end to end.

A `403 Forbidden` response should not automatically be treated as an expired session unless that behavior is confirmed through observation and testing.

## Data Available Through the Portal

### Meter Metadata

The meter search endpoint accepts a search query and page number and returns meter records with pagination metadata.

During development, the portal reported 403 meters. A sample record used in testing had the following fields:

- Meter ID: `J100000`
- Serial number: `SE33962`
- Make: `HPL`
- Installation status: `Decommissioned`

These are observations from the investigated portal state and may change.

### Energy Readings

The meter energy endpoint returns an array of readings. Observed fields include:

- `timestamp`
- `kwh`
- `kvah`
- `voltR`

The numeric fields may arrive as strings from the upstream portal.

### Geographical Coordinates

The geo endpoint returns latitude and longitude. The wrapper normalizes valid coordinate values into JSON numbers.

## Data Normalization

The service layer normalizes upstream values before returning them to API consumers.

- Valid numeric strings are converted into JSON numbers.
- Missing or invalid numeric values become `null`.
- Timestamp strings are preserved rather than reformatted without certainty about their format and timezone.
- The public API exposes structured JSON rather than forwarding raw upstream payloads unchanged.

This keeps the public API more consistent and reduces the amount of portal-specific parsing required by downstream consumers.

## Signed Export Capability

The client contains an internal signed-export flow.

The flow retrieves a signing secret from `/portal/keys`, constructs a canonical message using the HTTP method, path, query string, and Unix timestamp, and creates an HMAC-SHA256 signature.

The public export route was removed from the API contract. The signing secret must never be returned to callers or written to logs.

## Error Handling

The wrapper validates pagination input, returns `404` when a requested meter cannot be found, and maps upstream failures to a safe `502` response.

The service depends on the upstream portal's availability, endpoint contracts, authentication behavior, and response formats.

## Known Limitations and Future Investigation

- Add dedicated tests for cookie persistence and expired-session recovery.
- Confirm whether any authentication failures use `403` rather than `401`.
- Investigate whether the portal's hierarchy data can be reconstructed reliably.
- Evaluate whether a bulk export path should be exposed in a future version.
- Define freshness requirements before introducing caching.
- Evaluate local indexing only when there is a demonstrated need for cross-attribute or spatial queries.

Unverified behaviors are intentionally documented as areas for further investigation rather than proven facts.
