# Browser & BFF

A browser cannot keep a secret, so the two architectures below differ in where the tokens
live rather than in the OIDC flow itself.

## Pick one of two

| | Backend for Frontend | Public client + PKCE |
|---|---|---|
| Client type | `confidential` | `public` |
| Where tokens live | your server | the browser |
| Browser holds | a session cookie | the tokens themselves |
| Needs a server | yes | no |
| XSS exposure | the session cookie, if not `HttpOnly` | **every token** |

**Choose BFF if you have a server.** Not because the other is broken — a public client
with PKCE is a legitimate, specified pattern — but because token custody in a browser
means any XSS becomes token theft, and no amount of care in your own code protects you
from a compromised dependency.

## BFF

The browser talks to your server. Your server talks to SoulAuth. Tokens never reach
JavaScript.

```
Browser ──cookie──▶ Your BFF ──tokens──▶ SoulAuth
```

1. `GET /login` on your server generates `state` and the PKCE pair, stores them against
   the browser session, and redirects to `/api/oidc/authorize`.
2. `GET /callback` on your server compares `state`, exchanges the code
   ([step 4](/integrate/authorization-code-flow)), and stores the tokens **server-side**.
3. Your server sets its own session cookie:

```js
res.cookie('session', sessionId, {
  httpOnly: true,   // JavaScript cannot read it
  secure: true,     // HTTPS only
  sameSite: 'lax',  // survives the OIDC redirect back; 'strict' does not
  path: '/',
})
```

Use `sameSite: 'lax'`. `'strict'` drops the cookie on the cross-site redirect
back from the identity provider, and the symptom is a login loop that works on localhost
and fails in production.

::: warning A BFF is not a token proxy
Do not add an endpoint that hands the access token to the browser, and do not forward
arbitrary browser-supplied requests upstream with the token attached. Either one gives
back exactly the exposure the pattern exists to remove.

Expose your own endpoints. Let the BFF decide what each one is allowed to do.
:::

## Public client + PKCE

No server, so no secret. Register with `"client_type": "public"` and omit
`client_secret` at the token endpoint.

The rest of the flow is identical. PKCE carries the security here, and the server forces
it on for public clients: send `require_pkce: false` at registration and it is ignored.

Storage, from least bad to worst:

- **In memory only.** Tokens die on refresh; the user re-authenticates through the
  identity provider session, which is usually invisible to them.
- **`sessionStorage`.** Survives reload, scoped to the tab. Readable by any script on
  the page.
- **`localStorage`.** Survives everything, including the attacker's script. Avoid.

::: danger XSS is total compromise here
With tokens in the browser there is no mitigation that survives script execution —
a strict CSP raises the bar, it does not remove the exposure. That is the trade you are
accepting, and it should be a decision rather than a default.
:::

## CORS

`CORS_ALLOWED_ORIGINS` is an explicit allowlist. It is empty by default, and wildcards
are not accepted — a wildcard plus credentials means any site can call SoulAuth carrying
your user's `Authorization` header.

```bash
CORS_ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com
```

A BFF does not need this at all: the browser only ever talks to your own origin.

## Logout

Two separate things, and users notice when you only do one:

```js
// 1. End your own session
res.clearCookie('session')

// 2. End the SoulAuth session
res.redirect(`${SOULAUTH}/api/oidc/logout` +
  `?id_token_hint=${idToken}&post_logout_redirect_uri=${encodeURIComponent(RETURN_URL)}`)
```

Skip the second and the next login silently reuses the still-valid identity provider
session — the user clicks "log out", clicks "log in", and is back in the same account
without being asked. It looks like the logout did nothing.

`post_logout_redirect_uris` must be registered on the client, same exact-match rule as
`redirect_uris`.

## Next

| | |
|---|---|
| The flow itself | [Authorization Code flow](/integrate/authorization-code-flow) |
| Validating what you receive | [Verify tokens](/integrate/verify-tokens) |
