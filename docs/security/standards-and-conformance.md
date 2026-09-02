# Standards & conformance

Which external specifications apply, to what extent, and which ones do **not**.

## The five flags

Each specification carries five independent judgements. **None implies another:**

<Status kind="implemented" glossary /> the code path exists ·
<Status kind="supported" glossary /> we carry its contract ·
<Status kind="tested" glossary /> automated evidence covers it ·
<Status kind="conformant" glossary /> verified against the specification text ·
<Status kind="certified" glossary /> a standards body says so

A specification can be `implemented: true, supported: true, conformant: false` — which is
where most of this list sits, and saying so plainly is the point of having five flags
instead of one word.

## The registry

<StandardsTable />

## Three distinctions worth memorising

These are the claims most often assumed, and each is false here:

**Internal revocation semantics ≠ RFC 7009 support.** SoulAuth does revoke tokens — on
password change, on account suspension, on refresh-token reuse. There is no `/revoke`
endpoint. The behaviour exists; the standardised wire protocol does not.

**Internal token lookup ≠ RFC 7662 introspection.** An access token is a row in a
database, so of course the server can look it up. That is an implementation detail, not
an introspection endpoint. Verify ID tokens locally against JWKS.

**Issuing access tokens ≠ RFC 9068 conformance.** SoulAuth issues access tokens. It does
not claim they follow the JWT profile that RFC 9068 specifies.

## Next

| | |
|---|---|
| Verifying tokens correctly | [Verify tokens](/integrate/verify-tokens) |
| The security model behind these choices | [Security model](/security/security-model) |
