# Verify tokens

Your resource server receives a token. What do you check, and what can you check?

## Know which token you have

SoulAuth issues two things that both arrive as `Authorization: Bearer`, and they are
validated completely differently:

| | Looks like | Validate by |
|---|---|---|
| **ID token** | a JWT, three dot-separated parts | verifying the RS256 signature against JWKS, locally |
| **OIDC access token** | an opaque random string | calling `/api/oidc/userinfo` |
| **Session token** | a JWT (internal format) | not your business — it is SoulAuth's own, not part of the OIDC contract |

Do not try to decode an access token. It is not a JWT and there is nothing inside it.

## Validate an ID token

Fetch the signing keys once and cache them:

```bash
curl $SOULAUTH/api/oidc/jwks
```

```json
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "alg": "RS256",
      "kid": "NQ4bDUKBAh7-vNWDafyrzg",
      "n": "17tOyWFGO6oyeTjofeGwLvIhpQj0RYf6IJ3hTA2i…",
      "e": "AQAB"
    }
  ]
}
```

Match on `kid` from the token header. Refetch when you see an unknown `kid` — that is
how key rotation is meant to be handled, rather than on a timer.

### Node

```js
import { createRemoteJWKSet, jwtVerify } from 'jose'

const JWKS = createRemoteJWKSet(new URL(`${SOULAUTH}/api/oidc/jwks`))

const { payload } = await jwtVerify(idToken, JWKS, {
  issuer: SOULAUTH,          // must match the discovery `issuer` exactly
  audience: CLIENT_ID,
  algorithms: ['RS256'],     // pin it — never accept the token's own claim
})
```

### Python

```python
from jwt import PyJWKClient
import jwt

jwks = PyJWKClient(f"{SOULAUTH}/api/oidc/jwks")
key = jwks.get_signing_key_from_jwt(id_token).key

payload = jwt.decode(
    id_token, key,
    algorithms=["RS256"],       # a list you control, not one read from the token
    audience=CLIENT_ID,
    issuer=SOULAUTH,
)
```

### What every library must check

Libraries differ in what they verify by default. Confirm all of these:

- **Signature** against a key from JWKS.
- **`alg` pinned to `RS256`** by your code. Accepting the token's declared algorithm is
  the `alg: none` class of vulnerability.
- **`iss`** equals your configured issuer, exactly.
- **`aud`** contains your `client_id`. A token minted for a different client is a valid
  signature and the wrong token.
- **`exp` / `iat`** with a small clock skew allowance — seconds, not minutes.
- **`nonce`** matches the one you sent, if you sent one.

## Validate an access token

Opaque, so there is nothing to verify locally:

```bash
curl $SOULAUTH/api/oidc/userinfo -H "Authorization: Bearer $ACCESS_TOKEN"
```

```json
{
  "sub": "cc661281-9821-485d-a1f7-0c314e37d7f4",
  "email": "a@e.com",
  "email_verified": true,
  "preferred_username": "admin",
  "updated_at": 1787796557
}
```

A `401` means the token is invalid, expired or revoked. Fields are trimmed to the granted
scope, so `null` means "not in scope", not "not set".

Every call is a round trip. Cache the result against the token for a period you are
willing to be wrong for — that window is your revocation lag.

## Identify the user correctly

Key your records on **`(iss, sub)`**, never `sub` alone. A `sub` value is only meaningful
relative to its issuer; comparing bare `sub` values across providers is a cross-provider
account takeover.

Never key on email. Emails change hands.

::: warning How stable `sub` really is
It carries the legacy user row key, so it is stable for that
row's lifetime rather than being permanently non-reassignable.
[The caveat in full](/security/standards-and-conformance).
:::

## Revocation

There is no revocation endpoint to call and no push notification. Your options:

- Keep access-token lifetimes short (default 3600s) and refresh.
- Call `/userinfo` when an action matters enough to justify the round trip.
- Accept the window, and state its length in your own docs.

## Next

| | |
|---|---|
| Getting tokens in the first place | [Authorization Code flow](/integrate/authorization-code-flow) |
| Which RFCs apply | [Standards & conformance](/security/standards-and-conformance) |
