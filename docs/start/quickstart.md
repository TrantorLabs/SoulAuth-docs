# Quickstart

A running instance, a first administrator, and a working token — in about five minutes.

The commands in steps 1–6 correspond line by line to the deployment script CI runs on
every push (<Status kind="tested" guard="deployment_walkthrough.sh" />). Step 7 exercises
a path the integration suite covers, but the shell spelling here is written for
readability and is not itself executed. If one of them fails for you, that is a bug in
SoulAuth or in this page.
[Please open an issue.](https://github.com/TrantorLabs/SoulAuth/issues)

## You need

- [SurrealDB](https://surrealdb.com/install) v3
- A Rust toolchain (to build the binary), or a prebuilt `soulauth` binary
- `curl` and `openssl`
- Step 7 (AI actors) also needs a base64url encoder. GNU coreutils' `basenc` is the
  shortest spelling; macOS does not ship it, so substitute
  `openssl base64 -A | tr '+/' '-_'` for `basenc --base64url` (both are followed by
  `tr -d '='`).

::: tip Docker Compose is faster
One command instead of steps 1–4:

```bash
git clone https://github.com/TrantorLabs/SoulAuth && cd SoulAuth
printf 'JWT_SECRET=%s\nAPP_URL=http://localhost:8080\nSMTP_HOST=127.0.0.1\nSMTP_FROM=noreply@example.com\n' \
  "$(openssl rand -hex 32)" > .env
docker compose up -d
```

Then continue from [step 5](#_5-create-the-first-administrator) — the bootstrap token is
in `docker compose logs soulauth`.

<Status kind="tested" guard="ci.yml::docker" /> CI runs exactly this path on every push:
up, health check, bootstrap, login, protected endpoint, then a restart to confirm the
schema import stays idempotent.

The manual steps below are what the compose file runs. Follow them when your deployment
does not use compose.
:::

## 1 · Start the database

```bash
surreal start --bind 127.0.0.1:8000 --user root --pass root surrealkv://soulauth.db
```

Use `memory` instead of `surrealkv://soulauth.db` if you want a throwaway instance.

Note `surrealkv://`, not `file:`. `file:` is the SurrealDB 1.x form; on 3.x the server
exits with `Unable to load the specified datastore`, and the path in that message has the
prefix stripped (`filesoulauth.db`), which does not look like a scheme problem.

## 2 · Load the schema

SoulAuth issues no DDL — it never creates or alters a table, so its database account does
not need those rights. You import these two files once:

```bash
export DB="--endpoint http://127.0.0.1:8000 --user root --pass root \
  --namespace auth --database main"

surreal import $DB schema.sql
surreal import $DB initial_data.sql
```

Both files are safe to re-run. Every `DEFINE` in `schema.sql` carries `IF NOT EXISTS`
and every row in `initial_data.sql` is an `UPSERT`, so importing twice against an
initialised database is a no-op rather than an error. That matters for the Compose path
below, which re-imports on every start.

::: warning The namespace and database must match
`auth` / `main` here must be the same pair the process connects with — the one
`DATABASE_NAMESPACE` / `DATABASE_NAME` name. Import into the wrong pair and the process
**refuses to start**, with an error that prints the pair it actually used:

```
Database `auth` / `main` is not initialised: the seeded `admin` role is missing.
```

It used to start anyway and fail on the first write, which is why the walkthrough script
exists.
:::

## 3 · Configure

```bash
export DATABASE_URL=127.0.0.1:8000
export DATABASE_NAMESPACE=auth
export DATABASE_NAME=main
export DATABASE_USER=root
export DATABASE_PASS=root

export JWT_SECRET=$(openssl rand -hex 32)
export APP_URL=http://localhost:8080
export BIND_ADDR=127.0.0.1:8080
export SMTP_HOST=127.0.0.1
export SMTP_FROM=noreply@example.com
```

`APP_URL` is the public address, **not** the listen address. It decides the OIDC issuer,
the prefix of links in outgoing mail, and whether session cookies carry `Secure`.

A loopback `APP_URL` keeps you out of the production gate, which is why this quickstart
needs neither an OIDC signing key nor an MFA encryption key. That is also precisely why
these settings are not suitable for production — see the
[production checklist](/operate/production-checklist).

::: warning Pick either `.env` or `export`, not both
Startup calls `dotenvy::dotenv()`, which does **not** override variables already present
in the environment. Where both define a key, the exported one wins.

`JWT_SECRET=$(openssl rand -hex 32)` above generates a new secret every time it runs. If
you keep a `.env` and also re-run the exports in each new terminal, every token issued
before that shell becomes invalid — the symptom is "yesterday's token returns 401 today"
while neither config appears to have changed.

If you took the Docker Compose route, `.env` already exists; skip this section.

The five `DATABASE_*` values above are also the built-in defaults for a local setup
(`http://localhost:8000`, `root` / `root`, `auth` / `main`), so exporting them changes
nothing.
:::

## 4 · Run it

```bash
cargo build && ./target/debug/soulauth
```

```bash
curl http://localhost:8080/health
# {"status":"ok","uptime_seconds":3}
```

## 5 · Create the first administrator

There is no default account and no seeded password. Instead, a fresh instance prints a
one-time bootstrap token at startup:

```
WARN No administrator found. Bootstrap token for this process: 7f3a…
     Create the first administrator:
     curl -X POST http://localhost:8080/api/bootstrap/admin ...
```

Use it:

```bash
curl -X POST http://localhost:8080/api/bootstrap/admin \
  -H 'Content-Type: application/json' \
  -d '{"token":"7f3a…","email":"you@example.com","username":"admin","password":"CorrectHorse42!"}'
```

```json
{ "user_id": "7ad93d87-…", "email": "you@example.com", "is_admin": true }
```

Three things about this path worth knowing now:

- **The token belongs to that process.** `for this process` in the log is literal:
  restart soulauth and it prints a new one. While the process keeps running (`uptime_seconds`
  from `/health` climbing means it has not restarted), the same token stays valid.
- **It closes permanently.** Once an administrator exists, the same token is rejected —
  and it returns the same status as a wrong token, so a stale token cannot be used to
  probe whether an instance is initialised.
- **The password policy is not relaxed** because this is the first user. At least 12
  **characters** (`PASSWORD_MIN_LENGTH`, counted in characters, so one CJK character
  counts as one), and at least three of lowercase, uppercase, digit, symbol. The upper
  bound is 1024 **bytes** — that one is in bytes because it exists to stop an oversized
  input from burning Argon2 time. A rejection is `400` with `validation_error` and **does
  not consume the bootstrap token**, so you can retry straight away.
- **You never touch the database.** Going from empty to a usable administrator without
  hand-editing records is a requirement this project holds itself to, not a convenience.

## 6 · Get a token

The bootstrap response does not contain one — log in:

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"CorrectHorse42!"}'
```

```json
{
  "token": "eyJhbGciOi…",
  "user": {
    "id": "7ad93d87-…",
    "email": "you@example.com",
    "username": "admin",
    "is_admin": true,
    "verified": true,
    "account_status": "Active",
    "has_password": true,
    "last_login_at": 1787738966,
    "membership_level": "FREE",
    "membership_expiry": null,
    "created_at": "2026-08-26T10:09:26Z"
  }
}
```

```bash
curl http://localhost:8080/api/auth/me -H "Authorization: Bearer $TOKEN"
```

API authentication is `Authorization: Bearer` only. Cookies exist, but they serve the
browser and OIDC flows — not this.

## 7 · Optional — give an AI agent an identity

No email, no password, no account:

```bash
# Generate a key. The private half never leaves the agent.
openssl genpkey -algorithm ed25519 -out agent.pem
PUBKEY=$(openssl pkey -in agent.pem -pubout -outform DER | tail -c 32 | basenc --base64url | tr -d '=')

curl -X POST http://localhost:8080/api/actors \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d "{\"public_key\":\"$PUBKEY\",\"label\":\"nightly-runner\"}"
```

The agent then authenticates in two steps. Ask for a challenge:

```bash
curl -X POST http://localhost:8080/api/actors/challenge \
  -H 'Content-Type: application/json' -d "{\"actor_id\":\"$ACTOR_ID\"}"
```

```json
{
  "actor_id": "actor_identity:lnhl…",
  "nonce": "sp9kEQQT4evGROocexd1lw0Z5u7Bcmbpuahl9A-iPT4",
  "expires_at": 1787739106,
  "algorithm": "ed25519",
  "payload": "soulauth-ai-actor-auth/v1\nhttp://localhost:8080\nactor_identity:lnhl…\nsp9kEQQ…"
}
```

`payload` is exactly the bytes to sign — four lines, `\n`-joined, no trailing newline.
It is returned so that every client library does not have to reimplement the
canonicalisation and get it subtly wrong. The server recomputes it independently before
verifying; the copy you send back is never trusted.

Sign the `payload` verbatim, then exchange it. Two places to get wrong: write the file
with `printf '%s'` rather than `echo` (`echo` appends a newline, which becomes a fifth
line of the payload), and encode with base64url without padding (the server decodes with
`URL_SAFE_NO_PAD` <!-- cite-exempt: a Rust base64 engine constant, not a config key -->;
plain `base64` is rejected):

```bash
printf '%s' "$PAYLOAD" > payload.bin
SIG=$(openssl pkeyutl -sign -inkey agent.pem -rawin -in payload.bin \
      | basenc --base64url | tr -d '=\n')

curl -X POST http://localhost:8080/api/actors/authenticate \
  -H 'Content-Type: application/json' \
  -d "{\"actor_id\":\"$ACTOR_ID\",\"nonce\":\"$NONCE\",\"algorithm\":\"ed25519\",\"signature\":\"$SIG\"}"
```

The session token that comes back carries `subject_type: agent`. It works on
`/api/actors/me` and is **refused** on human endpoints. See
[AI-native identity](/concepts/ai-native-identity) for what that boundary covers.

## What you have now

A running identity provider, one administrator, and a session token. What you do **not**
have is a production deployment: no TLS, no OIDC signing key, root database credentials,
and an SMTP host that is probably not listening.

### Three pages you have to supply

SoulAuth is an API and ships no HTML. Three URLs have to render something, and by
default all three point back at SoulAuth itself — which answers 404:

| Path | Lands on | Point it somewhere with |
|---|---|---|
| `/api/oidc/authorize` with no session | `{APP_URL}/login` | `LOGIN_PAGE_URL` |
| The link in a verification mail | `{APP_URL}/verify-email?token=…` | `VERIFY_EMAIL_PAGE_URL` |
| The link in a password reset mail | `{APP_URL}/reset-password/{token}` | `RESET_PASSWORD_PAGE_URL` |

Everything above in this guide works without them — it is all direct API calls. Browser
SSO and the mail links are what stop at a blank page until you point these three at your
own frontend.

## Next

| | |
|---|---|
| Connect a web application | [Authorization Code flow](/integrate/authorization-code-flow) |
| Harden this before it faces anyone | [Production checklist](/operate/production-checklist) |
| Understand what a token does and does not grant | [Identity vs authority](/spec/identity-vs-authority) |
