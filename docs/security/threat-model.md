# Threat model

Specific attacks, what stops them, and what does not.

## Database read

**An attacker obtains a copy of the database.**

They get: email addresses, usernames, Argon2 password hashes, encrypted TOTP secrets,
Ed25519 **public** keys, and SHA-256 fingerprints of every bearer credential.

They cannot: authenticate as anyone. Fingerprints are not tokens; public keys are not
private keys. <Status kind="tested" guard="conformance::b4b" />

They can, given time: crack weak passwords offline. Argon2 makes that expensive, not
impossible — password policy still matters.

::: warning Unless they also have `JWT_SECRET`
TOTP secrets are encrypted with `MFA_SECRET_ENCRYPTION_KEY`. If that was never set
explicitly, it **derives from `JWT_SECRET`** — so a database dump plus the environment
file yields working TOTP codes. A non-loopback `APP_URL` forces a dedicated key for
exactly this reason.
:::

## Stolen session token

**A token leaks through a log, a proxy or an XSS.**

It works until it expires or is revoked. Sessions are not bound to an IP or a device:
both break legitimate users on mobile networks more often than they stop attackers.

Mitigations: keep `JWT_EXPIRATION` short; log out on suspicion; watch the audit log for a
session appearing from an implausible address.

Revocation reaches other replicas within one cache TTL.

## Intercepted authorization code

**An attacker captures the code from the redirect.**

PKCE stops it. The code is worthless without the `code_verifier`, which never leaves the
legitimate client. Only `S256` is accepted — `plain` is rejected at the authorize step,
because a `plain` challenge equals the verifier and provides no protection against
exactly this.

Which binding is load-bearing depends on the client type. For a **public** client PKCE is
the only one, so the server forces it on and an administrator cannot turn it off. A
**confidential** client also has its secret: PKCE defaults to on and *may* be disabled, in
which case an intercepted code is worthless without the client secret rather than without
the verifier. Both bindings is the right answer;
[registering a client](/integrate/register-a-client#confidential-or-public) says so too.

Also required: exact-match redirect URIs, so a code cannot be sent somewhere else in the
first place.

## Stolen refresh token

**An attacker obtains a refresh token and redeems it.**

Rotation makes this loud rather than silent. Whoever redeems second presents a consumed
token, and that is treated as compromise: **every OIDC access and refresh token that user
holds for that client is deleted**. The legitimate user loses that client's access —
which is the correct outcome, and also the signal. Their SoulAuth session and their
tokens at other clients are not touched.

## Brute force

**Password guessing.**

Per-account lockout (5 attempts, 15 minutes by default) and per-IP rate limiting, both in
the database and therefore shared across replicas.

Argon2 makes each attempt expensive server-side too. Login timing is equalised with a
dummy hash so that a non-existent account is indistinguishable from a wrong password.

## Account enumeration

**Working out which addresses are registered.**

- Login: same error, same timing, for unknown account and wrong password.
- Password reset: always returns success. Mail failures are swallowed rather than raised,
  because a 500 on registered addresses only would itself be the oracle.
- Bootstrap: same status for a wrong token and for an already-initialised instance.
- AI actor challenge: same error for unknown actor and for suspended actor.

## Cross-provider takeover

**An attacker with a Google account whose `sub` is `"4001"` targets the GitHub user with
numeric id `4001`.**

Bindings match on `(provider, provider_subject)` as a pair. Matching on subject alone
would make these the same actor — no exploit code required, just a coincidence of
identifiers.

The same rule applies to *you*: key users on `(iss, sub)`, never `sub` alone.

## Malicious OIDC client

**Someone with client-management access adds a redirect URI they control.**

Nothing in the protocol prevents this — whoever can edit `redirect_uris` can hijack any
login. It is contained by permissions instead: `soulauth:oidc_clients.write` is granted
only to `admin` by default, and every change is audited.

Treat that permission as full account access: whoever holds it can create an actor that
authenticates.

## Forged client IP

**A client sets `X-Forwarded-For` to evade IP rate limiting.**

Only possible if `TRUST_PROXY_HEADERS=true` **and** SoulAuth is reachable without going
through the proxy. Bind to loopback and make the proxy the only route.

Off by default for this reason.

## Replayed agent signature

**An attacker captures a signed challenge response.**

Four defences in the signed bytes themselves: the nonce is single-use and consumed before
verification; it is bound to one actor; the issuer is in the payload, so a signature from
another deployment does not verify; and a versioned domain separator means it cannot be
replayed into a different purpose. [The four lines](/concepts/ai-native-identity)

## XSS in your application

**Attacker script runs on your page.**

Not something SoulAuth can prevent. What it changes is the blast radius:

- **BFF** — tokens are on your server; an `HttpOnly` cookie is not readable by script.
- **Public client** — tokens are in the browser, so script execution is total
  compromise.

That difference is the main argument for [BFF](/integrate/browser-and-bff).

## Next

| | |
|---|---|
| What each protection is | [Security model](/security/security-model) |
| Brute force in detail | [Authentication protection](/security/authentication-protection) |
