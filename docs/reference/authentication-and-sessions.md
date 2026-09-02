# Authentication & sessions

## How a session works

A session token is a signed JWT. The database keeps only its **SHA-256 fingerprint**,
never the token itself. That is enough for revocation lookups, and whoever reads the row
does not come away with a usable token. <Status kind="tested" guard="conformance::b4b" />

Session state is **derived, not stored**. There is no status column:

| State | How it is expressed |
|---|---|
| active | `expires_at` is in the future and the row exists |
| expired | `expires_at` has passed |
| revoked | the row is gone |

So there is no second source of truth to drift out of sync — but also no enum to read.
Anything the API says about a session is computed at read time.

Multiple concurrent sessions are allowed, with no limit. `GET /api/auth/sessions` lists
the caller's own, and `POST /api/auth/logout-all` revokes the whole set — useful as a
"sign out everywhere" control after a password change.

There is a second entry point, `POST /api/auth/admin/login`, which takes the same
credentials but refuses any account that is not an administrator. It exists so an admin
console can reject a normal user at the login screen rather than after it; it grants
nothing extra, and a normal `POST /api/auth/login` by an administrator produces the same
session.

::: warning Revocation is not instant across replicas
Each instance caches resolved sessions. A logout, password
change or suspension takes effect immediately on the instance that handled it; other
instances observe it within `AUTH_SESSION_CACHE_TTL_SECONDS`. Single-instance
deployments are unaffected.
:::

## Endpoints

<ApiTable tag="Authentication" />

## First administrator

A fresh instance has no accounts. It prints a one-time bootstrap token at startup; that
token creates the first administrator without touching the database.

<ApiTable tag="Bootstrap" />

The gate closes permanently once an administrator exists. Every rejection — wrong token,
right token after the gate closed, wrong token after the gate closed — returns the **same
status and the same body**, so a stale token cannot be used to probe whether an instance
has been initialised. <Status kind="tested" guard="conformance::h12" /> The password
policy is not relaxed for this path.

## Health

<ApiTable tag="Health" />

## Multi-factor

TOTP with backup codes. Login returns a short-lived challenge token rather than a
session; the second step exchanges it.

TOTP secrets are encrypted at rest with `MFA_SECRET_ENCRYPTION_KEY`. Backup codes are
Argon2 hashes, verified one at a time.

::: warning The development fallback
With no `MFA_SECRET_ENCRYPTION_KEY` set, the key is derived
from `JWT_SECRET` and a warning is logged. Rotating `JWT_SECRET` would then make every
stored TOTP secret undecryptable.

This path only exists for loopback development: with a non-loopback `APP_URL` the process
**refuses to start** without a dedicated key. See
[production checklist](/operate/production-checklist).
:::

## Federated login

Google and GitHub, when configured. A binding records that an external subject is the
same actor — it is not a credential, and matching is always on
`(provider, provider_subject)` as a pair.

If credentials are not configured, these endpoints return `501`, not `404`. See
[API conventions](/reference/api-conventions#status-codes).

## Next

| | |
|---|---|
| AI actors authenticate differently | [Actors & profiles](/reference/actors-and-profiles) |
| OIDC token endpoints | [OIDC & clients](/reference/oidc-and-clients) |
| What a session token does not grant | [Identity vs authority](/spec/identity-vs-authority) |
