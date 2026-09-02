# Architecture

One Rust binary and one database. The source is split by responsibility into
`src/routes/`, `src/models/` and `src/services/`, and five invariants across that split
have tests, listed below.

## The shape

<Figure3 locale="en" />

That figure maps **logical responsibilities**. It is not a call sequence and not a
deployment diagram — everything in it runs inside a single process today.

## Boundaries the code holds to

These are enforced, not aspirational. Each names the test that keeps it true.

| Boundary | Guard |
|---|---|
| No plaintext bearer credential is ever stored — sessions, access and refresh tokens, authorization codes, password-reset and email-verification tokens all persist as SHA-256 fingerprints | <Status kind="tested" guard="conformance::b4b" /> |
| One error shape across the whole API: a stable machine code plus a human message, never a bare status with an empty body | <Status kind="tested" guard="conformance::j6" /> |
| The AI actor path never touches human account structures | <Status kind="tested" guard="conformance::a6" /> |
| Every endpoint, config key and permission name in the published contract exists in the running code — and nothing in the running code is missing from it | <Status kind="tested" guard="conformance::j4" /> |
| The service cannot alter its own schema | schema import is an operator step |

That last one has no test because there is nothing to assert against: SoulAuth issues no
DDL at all. The two SQL files are imported by whoever deploys it, and the database account
the service runs as does not need schema rights.

## Persistence

SurrealDB, one namespace and database pair, configured together. Logical stores in the
figure — identity, credential, session, audit — are responsibilities, not separate
databases.

::: warning The namespace/database pair is a real failure mode
Import the schema into a different pair than the process connects with and the service
refuses to start. The check looks for the seeded `admin` role in the pair it just
connected to, and the error names that pair.
:::

## Next

| | |
|---|---|
| The objects | [Actor identity model](/concepts/actor-identity-model) |
| Deploying it | [Deployment](/operate/deployment) |
| Why the boundaries exist | [Specification](/spec/) |
