# Engineering Reflection

## Design Decisions

### Separation of Responsibilities

The application separates upstream communication, business logic, request handling, and data normalization.

- The client layer manages HTTP requests, authentication, and cookies.
- The service layer combines upstream data and normalizes responses.
- The Express application handles routes, validation, and error responses.
- The OpenAPI specification documents the public API contract.

This structure improves maintainability and makes individual layers easier to test.

### Session Management

The legacy portal uses cookie-based authentication. A persistent cookie jar allows session cookies to be reused across requests.

A shared login promise avoids duplicate initial login attempts when multiple requests arrive concurrently.

Unauthorized-response recovery is designed to reauthenticate and retry a request once. This behavior requires dedicated tests and verification against the real portal's session-expiration behavior.

### Data Normalization

The upstream portal may return numeric values as strings. Converting valid numeric strings into numbers creates a more consistent API contract and simplifies client-side processing.

Invalid or missing numeric values are represented as `null` rather than silently treated as zero.

### API Documentation

OpenAPI provides a machine-readable description of the API, while Swagger UI makes it easier to explore endpoints and inspect example responses.

Keeping documentation aligned with actual response structures reduces integration confusion.

## Testing Strategy

Vitest and Supertest are used to test the Express application without requiring the upstream portal for every test.

The current test suite covers:

- Health-check behavior
- Meter listing and pagination
- Invalid pagination
- Combined meter details
- Missing meters
- Consumption readings
- Geographical coordinates
- Upstream failure handling

Service mocking makes these tests deterministic. However, mocked tests do not establish that real portal authentication, cookie persistence, or session recovery works under every condition.

## Challenges and Lessons Learned

### Legacy Authentication

Integrating with an existing portal requires reproducing its expected login request and retaining session cookies. Authentication behavior should be verified against actual portal responses rather than inferred from status codes alone.

### Consistent Responses

Normalization and centralized error handling help keep the public API predictable even when upstream responses are inconsistent.

### Testing Boundaries

Mocking the service layer isolates route behavior, but integration tests are still needed to verify communication with the actual upstream client.

## Future Improvements

- Add dedicated authentication-recovery tests.
- Add integration tests for cookie persistence and expired sessions.
- Improve structured logging and request tracing without logging secrets.
- Add rate limiting and appropriate request validation for production deployments.
- Define timeouts and retry policies based on upstream behavior.
- Add continuous integration to run tests on every change.
- Review the API contract whenever the upstream portal changes.

## Conclusion

The project demonstrates how to wrap a legacy authenticated service with a documented REST API while separating responsibilities, normalizing data, and testing key application behaviors.

The main remaining areas for improvement are integration-level authentication testing, operational observability, and production security hardening.
