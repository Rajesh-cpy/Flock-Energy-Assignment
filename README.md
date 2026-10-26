# Flock Energy Meter API

A Node.js and Express REST API that wraps the legacy Urja Operations portal and exposes meter information through normalized, documented endpoints.

## Features

- Automatic portal authentication and cookie-based session management
- Meter listing with search and pagination
- Meter details combining metadata, geographical coordinates, and energy readings
- Separate endpoints for meter consumption and location
- Normalized numeric values and consistent JSON responses
- Centralized error handling
- OpenAPI 3.0.3 specification and Swagger UI
- Automated tests using Vitest and Supertest

## Tech Stack

- Node.js (ES modules)
- Express.js
- Axios
- axios-cookiejar-support
- tough-cookie
- Swagger UI Express
- Vitest
- Supertest

## Prerequisites

- Node.js 20 or a compatible supported version
- npm
- Valid credentials for the legacy Urja Operations portal

## Installation

Clone or download the repository, then run:

```bash
npm install
```

Create a `.env` file in the project root using the following configuration:

```env
PORT=3000
URJA_BASE_URL=https://your-urja-portal-url
URJA_USERNAME=your-portal-username
URJA_PASSWORD=your-portal-password
```

Replace the example values with the actual portal configuration. Never commit real credentials.

## Running the Application

Start the API:

```bash
npm start
```

The default local address is:

`http://localhost:3000`

## API Endpoints

| Method | Endpoint                              | Description                     |
| ------ | ------------------------------------- | ------------------------------- |
| GET    | `/health`                             | Health check                    |
| GET    | `/api/v1/meters`                      | List and search meters          |
| GET    | `/api/v1/meters/:meterId`             | Get combined meter details      |
| GET    | `/api/v1/meters/:meterId/consumption` | Get energy consumption readings |
| GET    | `/api/v1/meters/:meterId/geo`         | Get geographical coordinates    |

### List and Search Meters

```http
GET /api/v1/meters?q=J100000&page=1
```

Query parameters:

- `q`: Optional meter search term.
- `page`: Optional positive integer page number.

The response includes meter data and pagination metadata.

### Get Meter Details

```http
GET /api/v1/meters/J100000
```

Returns meter metadata together with geographical information and energy readings.

### Get Energy Consumption

```http
GET /api/v1/meters/J100000/consumption
```

Returns normalized energy readings, including numeric consumption values where available.

### Get Geographical Coordinates

```http
GET /api/v1/meters/J100000/geo
```

Returns latitude and longitude as numeric values.

## API Documentation

Start the server and open:

- Swagger UI: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/openapi.json`

## Testing

Run the automated test suite:

```bash
npm test
```

The tests cover health checks, meter listing, input validation, meter details, missing meters, consumption, geographical coordinates, and upstream failure handling.

## Error Handling

The API uses HTTP status codes to communicate request outcomes. These include:

- `200`: Successful request
- `400`: Invalid request parameters
- `404`: Meter not found or route unavailable
- `502`: Upstream portal or request failure

Refer to the actual response body and OpenAPI specification for the documented error format.

## Project Structure

```text
src/
  clients/
    urjaClient.js
  services/
    meterService.js
  utils/
    normalize.js
  routes/
  middleware/
  app.js
  server.js
  openapi.js
tests/
  app.test.js
.env
.env.example
.gitignore
package.json
```

## Security Notes

- Credentials are provided through environment variables.
- Session cookies are managed by a cookie jar.
- Sensitive authentication data must not be logged or committed.
- The portal remains the upstream source of meter information.

## Limitations

- Availability depends on the legacy portal and its authentication behavior.
- The API does not independently persist meter data.
- Upstream response changes may require updates to normalization and error handling.
- Authentication recovery should be verified against real expired-session behavior.

## License

Add the license applicable to this project, if required.
