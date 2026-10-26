# Engineering Reflection

## 1. What assumptions did I make?

I assumed the legacy portal should be treated as a read-only system and that its existing login flow and session cookies could be reused to retrieve meter information. I also assumed that numeric strings should be converted into numbers where valid, while missing or invalid numeric values should be represented as `null`. I preserved timestamps as strings rather than assuming their format or timezone.

## 2. Which part was the most difficult, and how did I get unstuck?

The most challenging part was integrating with a portal designed primarily for browser interaction rather than direct API consumers. I investigated its network requests, identified the login request and required headers, and implemented cookie persistence using Axios and a cookie jar. Separating the client, service, normalization, and routing layers helped me isolate issues and keep the implementation manageable.

## 3. If I had another day, what would I improve?

I would add dedicated tests for cookie persistence, expired sessions, concurrent unauthorized requests, and failed reauthentication. I would also add integration tests against a controlled mock server, improve structured logging without exposing sensitive information, and configure continuous integration. After improving reliability, I would investigate network hierarchy reconstruction and caching based on actual product requirements.

## 4. What mistake did I make while solving this?

During development, I encountered package installation and test-discovery issues, and I needed to correct the Git setup before preparing the repository. These experiences taught me to inspect command output carefully, make incremental changes, and verify the test and version-control configuration instead of assuming everything was configured correctly.

## 5. If I were reviewing my own submission, what would I criticise?

The eight tests validate API route behavior by mocking the service layer, but they do not prove that live portal authentication or expired-session recovery works end to end. I would ask for dedicated tests of the upstream client, stronger verification of session-expiration behavior, and confirmation that the static OpenAPI specification matches the specification served by the application. I would also expect the README to state the project's scope and remaining limitations clearly.
