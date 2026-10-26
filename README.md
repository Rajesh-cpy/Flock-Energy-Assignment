# Flock Energy Meter API

A Node.js and Express REST API that wraps the legacy Urja Meter Ops portal and exposes meter information through a documented JSON interface.

The service handles portal authentication and cookie persistence, retrieves meter data, normalizes upstream values, and provides a consistent API for downstream consumers.

## Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Setup](#setup)
- [Running the API](#running-the-api)
- [API Endpoints](#api-endpoints)
- [Example Request and Response](#example-request-and-response)
- [Testing](#testing)
- [Assumptions and Design Decisions](#assumptions-and-design-decisions)
- [Trade-offs and Scope](#trade-offs-and-scope)
- [Limitations and Future Improvements](#limitations-and-future-improvements)
- [Project Documentation](#project-documentation)
- [Security](#security)

## Overview

The legacy portal provides smart-meter information through a browser-oriented interface. This project wraps its existing functionality in a REST API so that other applications can retrieve meter data without directly interacting with the portal.

The implementation focuses on read-only access to meter metadata, consumption readings, and geographical coordinates.

## Architecture

The project separates responsibilities into distinct layers:

- `src/clients/urjaClient.js` — communicates with the upstream portal, manages cookies, handles login, and contains internal signed-export functionality.
- `src/services/meterService.js` — orchestrates upstream requests and normalizes returned data.
- `src/utils/normalize.js` — converts numeric strings into numbers and represents invalid or missing numeric values as `null`.
- `src/app.js` — configures Express routes, validation, and error handling.
- `src/server.js` — loads environment configuration and starts the server.
- `src/openapi.js` — defines the OpenAPI specification used for API documentation.
- `tests/app.test.js` — tests API behavior using Vitest and Supertest.

## Technology Stack

- Node.js
- Express.js
- Axios
- axios-cookiejar-support
- tough-cookie
- Swagger UI Express
- Vitest
- Supertest

## Setup

### Prerequisites

- Node.js 20 or a version supported by the project's installed dependencies.
- npm.
- Network access to the configured Urja Meter Ops portal.
- Valid portal credentials.

### Installation

Clone or download the repository and navigate to the project directory.

Install dependencies:

```bash
npm install
```

Create a `.env` file in the project root using `.env.example` as a template.

Example configuration:

```env
PORT=3000
URJA_BASE_URL=https://urja-ops.flockenergy.tech
URJA_USERNAME=your-portal-username
URJA_PASSWORD=your-portal-password
```

Replace the placeholder values with the credentials provided for your environment. Never commit real credentials.

## Running the API

Start the server:

```bash
npm start
```

The default local address is:

`http://localhost:3000`

## API Endpoints

| Method | Endpoint                               | Description                              |
| ------ | -------------------------------------- | ---------------------------------------- |
| GET    | `/health`                              | Checks whether the service is running    |
| GET    | `/api/v1/meters?q=...&page=1`          | Lists or searches meters with pagination |
| GET    | `/api/v1/meters/{meterId}`             | Retrieves combined meter details         |
| GET    | `/api/v1/meters/{meterId}/consumption` | Retrieves energy consumption readings    |
| GET    | `/api/v1/meters/{meterId}/geo`         | Retrieves geographical coordinates       |

### 1. Health Check

```http
GET /health
```

### 2. Search Meters

```http
GET /api/v1/meters?q=J100000&page=1
```

Query parameters:

- `q`: Optional meter search term.
- `page`: Optional positive integer page number.

The response includes meter records and pagination metadata.

### 3. Get Meter Details

```http
GET /api/v1/meters/J100000
```

Returns meter metadata together with geographical information and energy readings.

### 4. Get Consumption Readings

```http
GET /api/v1/meters/J100000/consumption
```

Returns normalized energy readings, including available values such as `kwh`, `kvah`, and `voltR`.

### 5. Get Geographical Coordinates

```http
GET /api/v1/meters/J100000/geo
```

Returns latitude and longitude as numeric values where valid.

## Example Request and Response

Request:

```http
GET /api/v1/meters?q=J100000&page=1
```

Illustrative response shape:

```json
{
  "data": [
    {
      "meterId": "J100000",
      "serialNo": "SE33962",
      "make": "HPL"
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 20
}
```

This is an illustrative response based on fields observed during development. Actual fields and values depend on the upstream portal response. Verify the live response by running the API with valid credentials.

## API Documentation

Start the server and open:

- Swagger UI: `http://localhost:3000/docs`
- OpenAPI JSON endpoint: `http://localhost:3000/openapi.json`
- Repository specification: [`openapi.json`](./openapi.json)

The repository-level `openapi.json` should match the specification served by the application.

## Testing

Run the automated test suite:

```bash
npm test
```

The current test suite contains eight tests covering:

- Health-check behavior.
- Meter listing and pagination.
- Invalid page input.
- Combined meter details.
- Missing meters.
- Consumption readings.
- Geographical coordinates.
- Upstream failure handling.

The current tests mock the service layer. They validate API behavior but do not independently prove real portal authentication, cookie persistence, or expired-session recovery.

## Assumptions and Design Decisions

### Read-only integration

The wrapper retrieves information from the legacy portal without modifying portal records.

### Separation of responsibilities

The HTTP client, service layer, normalization utilities, and API routes have separate responsibilities. This makes the integration easier to maintain and test.

### Cookie-based authentication

Portal login and cookie persistence are handled in the upstream client rather than being repeated across individual route handlers.

### Data normalization

Valid numeric strings are converted into JSON numbers. Missing or invalid numeric values are represented as `null` rather than silently becoming zero.

Timestamps remain strings because their source format and timezone semantics should not be assumed.

### API versioning

Business endpoints are grouped under `/api/v1` to provide a clear public API namespace.

### Consistent error handling

The API validates request parameters and returns structured error responses instead of exposing raw upstream responses or internal implementation details.

## Trade-offs and Scope

This implementation prioritizes a small, understandable REST wrapper over building a broader data platform.

The following features were intentionally left out of the current scope:

- **Network hierarchy:** reconstructing meter relationships requires additional investigation into hierarchy data and data quality.
- **Local indexing:** filtering across a local dataset introduces synchronization and storage requirements.
- **Spatial queries:** location-based searches would require additional indexing and query capabilities.
- **Caching:** caching was not introduced because acceptable data staleness and freshness requirements have not been established.
- **Frontend application:** the REST API and Swagger UI provide a way to explore and evaluate the service without adding a separate frontend.
- **Public export endpoint:** internal signed-export functionality exists in the client, but export is not part of the current public API contract.

These features can be considered in future iterations based on product needs.

## Limitations and Future Improvements

With more time, I would prioritize the following improvements:

1. Add client-level tests for login, cookie persistence, concurrent unauthorized responses, successful reauthentication, and failed reauthentication.
2. Verify expired-session behavior against the actual portal and ensure retries are restricted to safe, repeatable requests.
3. Add integration tests using a controlled mock HTTP server.
4. Introduce structured logging and request identifiers while redacting credentials, cookies, and signing secrets.
5. Add continuous integration to run tests automatically on changes.
6. Investigate hierarchy reconstruction, caching, and local indexing after defining their data-quality, freshness, and scale requirements.

## Project Documentation

- [`PROTOCOL.md`](./PROTOCOL.md) — portal behavior, upstream endpoints, and integration notes.
- [`REFLECTION.md`](./REFLECTION.md) — lessons learned and answers to the assignment reflection questions.
- [`openapi.json`](./openapi.json) — OpenAPI 3.x specification for this API.

## Security

- Store credentials in `.env` and exclude that file from version control.
- Commit `.env.example` only with placeholder values.
- Never log passwords, session cookies, or signing secrets.
- Never expose signing secrets or sensitive authentication data through public API responses.
- Review staged files before committing or pushing to a public repository.
