# Authorization Code flow

The whole flow, with real values from a running instance. PKCE is forced on for public
clients and on by default for confidential ones; whenever it is used, only `S256` is
accepted.

You need a [registered client](/integrate/register-a-client) first.

## 1 · Read the discovery document

Never hard-code endpoint URLs — read them once at startup:

```bash
curl $SOULAUTH/.well-known/openid-configuration
```

The same document is also served at `/api/oidc/.well-known/openid-configuration`. Both
return identical content; the root path is the one RFC 8414 clients look for, so prefer
it and treat the other as an alias.

```json
{
  "issuer": "http://localhost:8400",
  "authorization_endpoint": "http://localhost:8400/api/oidc/authorize",
  "token_endpoint": "http://localhost:8400/api/oidc/token",
  "userinfo_endpoint": "http://localhost:8400/api/oidc/userinfo",
  "jwks_uri": "http://localhost:8400/api/oidc/jwks",
  "end_session_endpoint": "http://localhost:8400/api/oidc/logout",
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["RS256"],
  "scopes_supported": ["openid", "profile", "email"],
  "token_endpoint_auth_methods_supported": ["client_secret_post", "client_secret_basic", "none"],
  "code_challenge_methods_supported": ["S256"]
}
```

`issuer` must match your configured `APP_URL` character for character. A mismatch here
fails every client's discovery validation, and the error message rarely says why.

## 2 · Generate PKCE and state

Fresh per transaction, never reused:

```js
const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)))
const challenge = base64url(
  await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)),
)
const state = base64url(crypto.getRandomValues(new Uint8Array(16)))

// base64url with no padding — the '=' matters, it will not verify with it
function base64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
```

Store `verifier` and `state` server-side (or in a `HttpOnly` cookie) against this
browser session. `verifier` is the secret; `challenge` is what goes over the wire.

## 3 · Send the browser to /authorize

```
GET /api/oidc/authorize
  ?response_type=code
  &client_id=client_1787796518211crEBwUSf
  &redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback
  &scope=openid%20profile%20email
  &state=<state>
  &nonce=<nonce>
  &code_challenge=<challenge>
  &code_challenge_method=S256
```

Generate `nonce` the same way as `state` — fresh per transaction, kept server-side — but
they defend different things. `state` catches a callback you did not start; `nonce` binds
the ID Token to *this* authorization request, so a token minted for an earlier one cannot
be replayed into this session. SoulAuth carries it through: `authorize` stores it with the
code and puts it back as the `nonce` claim, which the [verification
page](/integrate/verify-tokens) tells you to compare.

This endpoint authenticates the **browser session cookie**, not a bearer token. If the
user is not logged in they are redirected to the login page and return here afterwards.

On success SoulAuth redirects back:

```
http://localhost:3000/callback?code=Lq7x44VjIgPc7uRcqs0bT4l2piIEUq0K&state=xyz
```

::: warning Compare `state` before anything else
If the returned `state` does not equal the one you stored, stop. Do not exchange the
code. That comparison is the entire CSRF defence for this flow.
:::

## 4 · Exchange the code

```bash
curl -X POST $SOULAUTH/api/oidc/token \
  -u "$CLIENT_ID:$CLIENT_SECRET" \
  -d grant_type=authorization_code \
  -d code=$CODE \
  -d redirect_uri=http://localhost:3000/callback \
  -d code_verifier=$VERIFIER \
  -d client_id=$CLIENT_ID
```

Client credentials go in the `Authorization: Basic` header (`client_secret_basic`) **or**
the form body (`client_secret_post`) — not both. Sending both is rejected rather than
silently preferring one.

```json
{
  "access_token": "bOMx8HOdBWyYw5dqtY0DKY3Z71Se2KlD",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "L3dwm5hTpde66kylboglQnH49cRJgdZ1…",
  "id_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6…",
  "scope": "openid profile email"
}
```

Note what the access token is: an **opaque string**, not a JWT. Do not try to decode it.
The `id_token` is the JWT.

## 5 · The ID token

Decoded payload from the exchange above:

```json
{
  "iss": "http://localhost:8400",
  "sub": "cc661281-9821-485d-a1f7-0c314e37d7f4",
  "aud": "client_1787796557277jsCJNBsU",
  "exp": 1787796858,
  "iat": 1787796558,
  "auth_time": 1787796557,
  "sid": "f9b5683d-f8c5-4c24-b70a-48c189cbef6c",
  "email": "a@e.com",
  "email_verified": true,
  "preferred_username": "admin"
}
```

`sid` is always present — if the session reference cannot be resolved, SoulAuth refuses
to sign rather than issuing a token without it.

Claims are trimmed to the granted scope: no `email` without the `email` scope, no
`preferred_username` without `profile`.

[Validate it properly →](/integrate/verify-tokens)

::: warning What `sub` is stable across
`sub` carries the legacy user row key, so it is stable for that
row's lifetime — weaker than the "never reassigned" guarantee OIDC Core expects. Key your
records on `(iss, sub)` and read the
[caveat](/security/standards-and-conformance) before assuming more.
:::

## 6 · Refreshing

```bash
curl -X POST $SOULAUTH/api/oidc/token \
  -u "$CLIENT_ID:$CLIENT_SECRET" \
  -d grant_type=refresh_token -d refresh_token=$REFRESH_TOKEN
```

Rotation is mandatory: the old refresh token is consumed and the old access token
revoked. **Store the new one immediately.**

::: danger Reuse is treated as compromise
Presenting an already-consumed refresh token is not a retry. SoulAuth deletes **every
OIDC access and refresh token this user holds for this client**. Tokens at other clients
are untouched, and so is the user's SoulAuth session — this is scoped revocation, not a
global logout.

A true race is handled separately: the second of two simultaneous refreshes loses the
atomic consume and gets a plain `invalid_grant`, without the revocation above. What
triggers revocation is presenting a token that was already marked consumed.

The usual cause is a client that races two refreshes and keeps the loser's token.
Serialise refreshes per session.
:::

Scope cannot grow on refresh: the new scope must be a subset of the original.

## Common failures

| Symptom | Cause |
|---|---|
| `invalid_grant: Client secret required for confidential client` | Registered as `confidential` but no secret sent |
| Discovery validation fails in the client library | `APP_URL` ≠ the issuer the client expects, often a trailing slash |
| `invalid_grant` on a code that looks fine | Code already used, expired, or `redirect_uri` differs from step 3 by one character |
| Signature check fails on a correct-looking verifier | base64url padding left on, or `+` / `/` not translated to `-` / `_` |

## Next

| | |
|---|---|
| Validate tokens at your resource server | [Verify tokens](/integrate/verify-tokens) |
| Doing this from a browser app | [Browser & BFF](/integrate/browser-and-bff) |
