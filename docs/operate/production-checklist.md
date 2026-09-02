# Production checklist

An instance configured the way the quickstart configures it runs, but is not ready to be
reached from outside. Below is what to change before it is.

## What the process refuses to do for you

Three of these are not advice — SoulAuth **will not start** if you get them wrong.

### `JWT_SECRET` must be at least 32 characters

```bash
openssl rand -hex 32
```

Shorter and startup fails with the reason named.

### A non-loopback `APP_URL` demands two more keys

Set `APP_URL` to anything that is not loopback and both of these become mandatory:

```bash
# Persistent OIDC signing key — without it every restart invalidates all issued
# ID tokens, and replicas sign with different keys.
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out oidc-signing.pem
export OIDC_RSA_PRIVATE_KEY_PATH=/etc/soulauth/oidc-signing.pem

# Dedicated MFA key — derived from JWT_SECRET otherwise, which means rotating
# JWT_SECRET locks every MFA user out permanently.
export MFA_SECRET_ENCRYPTION_KEY=$(openssl rand -base64 32)
export AUDIT_INTEGRITY_KEY=$(openssl rand -base64 32)
```

Both defaults would work in the sense of not erroring, and both would quietly destroy
credentials later. Refusing to start is the correct behaviour for a default whose failure
mode is delayed and irreversible.

### Plaintext HTTP is rejected for non-loopback hosts

`APP_URL=http://auth.example.com` fails at startup. Use `https://`.

## Get `APP_URL` exactly right

It is the **public** address, not the listen address, and it decides four things:

- the OIDC `issuer` — must match character for character, or every client's discovery
  check fails;
- the prefix of links in outgoing mail;
- whether session cookies carry `Secure` (`https://` → yes);
- whether the production gate above applies.

```bash
APP_URL=https://auth.example.com     # public
BIND_ADDR=127.0.0.1:8080             # behind the proxy
```

::: warning `BIND_ADDR` defaults to `0.0.0.0:8080`
Leave it unset and the process listens on **every interface**. Behind a proxy that is
rarely what you want, and it is what makes `TRUST_PROXY_HEADERS` dangerous below: the
header is only safe when SoulAuth cannot be reached except through the proxy.
:::

A trailing slash mismatch between `APP_URL` and what a client expects for `issuer` is a
genuinely common and genuinely confusing failure.

## Database

The quickstart uses `root:root` over plaintext. Neither belongs in production.

```bash
DATABASE_URL=https://db.internal:8000     # https:// enables TLS
DATABASE_USER=soulauth
DATABASE_PASS=<generated>
DATABASE_NAMESPACE=auth
DATABASE_NAME=main
```

Give the service an account scoped to that namespace and database, not `root`.
Connecting in plaintext to a non-loopback database logs a warning once — treat it as an
error.

::: warning Import the schema into the pair the process connects with
Getting `DATABASE_NAMESPACE` / `DATABASE_NAME` wrong at import time produces a service
that starts, answers `/health` with `ok`, and fails on the first write. This is why the
repository carries an executable deployment walkthrough rather than only prose.
:::

## Behind a proxy

```bash
TRUST_PROXY_HEADERS=true
```

::: danger Only if SoulAuth cannot be reached directly
With this on, `X-Forwarded-For` is believed. If anything can reach SoulAuth without
passing through your proxy, a client can forge that header and walk straight past IP
rate limiting and IP lockout.

Bind to loopback or a private interface, and make the proxy the only route in.
:::

## CORS

Empty by default. Wildcards are not accepted — a wildcard plus credentials lets any site
call SoulAuth carrying your user's `Authorization` header.

```bash
CORS_ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com
```

A BFF architecture needs none of this: the browser only talks to your own origin.

## Tune the lockout

Defaults are 5 attempts, 15 minutes, 60-minute window, both user and IP dimensions on.
A public-facing service and an internal tool have genuinely different tolerances here —
these are meant to be changed.

```bash
LOCKOUT_MAX_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15
LOCKOUT_RESET_WINDOW_MINUTES=60
LOCKOUT_USER_ENABLED=true
LOCKOUT_IP_ENABLED=true
```

Counters live in the database, so they are shared across replicas rather than per
process.

## Email actually has to work

`SMTP_HOST` and `SMTP_FROM` are required even with email verification disabled, because
password reset sends mail.

Send failures are logged, not raised, so a broken SMTP host cannot turn "forgot password"
into a 500 or let a response-time difference reveal whether an address is registered. The cost is that a misconfigured mail server is
**silent**. Send yourself a reset before you believe it works.

## Running more than one instance

Stateless for authentication; instances share the database and never talk to each other.

- Every replica needs the **same** `JWT_SECRET`, OIDC signing key,
  `MFA_SECRET_ENCRYPTION_KEY` and `AUDIT_INTEGRITY_KEY`. Different signing keys means
  tokens issued by one replica fail verification against another's JWKS.
- Every replica needs a **different** `SOULAUTH_INSTANCE_ID`. This is the one setting
  that must not match: it names the replica's own audit hash chain, and two replicas
  sharing an id collide on the unique index, which silently drops the later one's audit
  events. It is required in production for exactly that reason: the default only tells
  apart processes on one host, so guessing it would be the failure mode itself.
- Rate limiting and lockout are shared, since they are in the database.
- **Revocation is not instant.** Each instance caches resolved sessions; others observe a
  logout or suspension within `AUTH_SESSION_CACHE_TTL_SECONDS` (default 5). Lower it for
  faster propagation at the cost of more database reads.

## Before you open it up

```bash
curl https://auth.example.com/health
curl https://auth.example.com/.well-known/openid-configuration   # issuer == APP_URL?
```

- [ ] `JWT_SECRET` generated, ≥ 32 chars, identical on every replica
- [ ] OIDC signing key persisted to disk, identical on every replica
- [ ] `MFA_SECRET_ENCRYPTION_KEY` set explicitly
- [ ] `AUDIT_INTEGRITY_KEY` set explicitly, and `GET /api/audit/integrity` reports
      `intact: true` once the first checkpoint has been issued
- [ ] `APP_URL` is `https://` and matches `issuer` in discovery
- [ ] Database over TLS with a scoped account, not `root`
- [ ] Schema imported into the namespace/database pair the process uses
- [ ] `TRUST_PROXY_HEADERS` on **only** if direct access is impossible
- [ ] `CORS_ALLOWED_ORIGINS` explicitly listed
- [ ] A password reset email actually arrived
- [ ] First administrator created via the bootstrap token, not by editing the database
- [ ] Backups cover four things: the SurrealDB data directory, `JWT_SECRET`, the OIDC
      signing key, `MFA_SECRET_ENCRYPTION_KEY` and `AUDIT_INTEGRITY_KEY`. Losing the last
      one makes every existing checkpoint unverifiable. The database alone does not restore —
      see [Operations & recovery](/operate/operations-and-recovery)

## Next

| | |
|---|---|
| Day-two operations | [Operations & recovery](/operate/operations-and-recovery) |
| When something breaks | [Troubleshooting](/operate/troubleshooting) |
