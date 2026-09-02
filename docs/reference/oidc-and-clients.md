# OIDC & clients

## What is supported

Authorization Code flow with PKCE (`S256` only, forced for public clients), RS256 ID
tokens, discovery, JWKS, and refresh-token rotation with reuse detection.

Implicit and hybrid flows are not implemented. Neither are client credentials, device
code, or resource owner password credentials.

The discovery document lists what is implemented and nothing aspirational, and
<Status kind="tested" guard="conformance::h10" /> keeps it that way.

## Protocol endpoints

<ApiTable tag="OIDC" />

`/.well-known/openid-configuration` is served at the site root **and** under the
`/api/oidc/` prefix. Same handler, two paths, because client libraries differ on which
they expect.

## Client management

<ApiTable tag="OIDC Clients" />

The client registry is the trust root of the whole SSO surface: whoever can change
`redirect_uris` can hijack any login. Hence the separate `soulauth:oidc_clients.read` /
`.write` permissions, granted only to `admin` by default.

Client secrets are stored as hashes. `regenerate-secret` returns the new secret **once**
— it cannot be read back afterwards.

Deleting a client disables it rather than removing the row, so tokens already issued to
it remain attributable.

## Refresh tokens

Rotation is mandatory: each refresh consumes the old token and issues a new one, and
the old access token is revoked at the same time.

Presenting an already-consumed refresh token is treated as evidence of compromise, not
as a retry — **every OIDC access and refresh token that user holds for that client is
deleted**. Other clients and the user's SoulAuth session are not affected.

Scope cannot escalate on refresh: the new scope must be a subset of the original.

## What `sub` is stable across

::: warning Weaker than the model describes
`sub` currently carries the legacy `user` row key, not the
identity root. It is therefore stable for the lifetime of that row — which is **weaker**
than the "never reassigned" guarantee OIDC Core expects.

If you need a subject identifier that survives an account being rebuilt, `sub` does not
give it to you today. Recorded as a named caveat in
[standards & conformance](/security/standards-and-conformance).
:::

Two things `sub` is definitely not:

- **Not the `ActorIdentity` resource ID.** Different namespace.
- **Not an email address.** Emails change; subjects must not.

An OIDC subject is only meaningful inside its issuer, so identify users by the pair
`(iss, sub)`. Compare `sub` alone across issuers and two users from different providers
resolve to the same person as soon as their subjects collide.

## Verifying tokens

Validate ID tokens locally against JWKS. Do not expect introspection:
`/introspect` (RFC 7662) is **not implemented**, and neither is `/revoke` (RFC 7009).
SoulAuth has internal revocation semantics; they are not the standardised wire protocol.

Full detail: [verify tokens](/integrate/verify-tokens).

## Next

| | |
|---|---|
| Register a client and run the flow | [Authorization Code flow](/integrate/authorization-code-flow) |
| Exactly which RFCs apply | [Standards & conformance](/security/standards-and-conformance) |
