# Configuration

Configuration comes from **process environment variables only**. A `.env` file in the
working directory is read at startup. There is no configuration file format, no remote
configuration, and no runtime reload — changing anything means restarting the process.

## The production gate

A non-loopback `APP_URL` is how SoulAuth recognises a real deployment. Three things
follow from it, and none of them is a warning — the process **refuses to start**:

- `APP_URL` must be **https**. Over plaintext the session cookie loses `Secure`, mail
  links go out unencrypted, and the OIDC `issuer` violates the Discovery spec, which
  conforming relying parties reject.
- `OIDC_RSA_PRIVATE_KEY_PATH` (or `_PEM`) becomes required.
- `MFA_SECRET_ENCRYPTION_KEY` becomes required.

The last two have defaults that would silently destroy already-issued credentials if a
real deployment ran on them: an ephemeral signing key invalidates every ID token on
restart, and an MFA key derived from `JWT_SECRET` becomes undecryptable the day that
secret is rotated. Neither shows up until it is already an incident.

The [quickstart](/start/quickstart) uses `http://localhost:8080`, which is a loopback
address, so it needs neither — and for the same reason its settings cannot be deployed
as they are.

## `APP_URL` is not the listen address

`APP_URL` is the **public** address. It determines:

- the OIDC `issuer` — which must match character for character, or every client's
  discovery check fails;
- the prefix of links in outgoing mail;
- whether session cookies carry `Secure`;
- whether the production gate above applies.

`BIND_ADDR` is what the process listens on. In any deployment behind a proxy these two
differ.

## All keys

<ConfigTable />

## Next

| | |
|---|---|
| Getting a deployment right | [Production checklist](/operate/production-checklist) |
| What each setting protects against | [Security model](/security/security-model) |
