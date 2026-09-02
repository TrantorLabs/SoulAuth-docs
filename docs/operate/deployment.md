# Deployment

This page is the full deployment guide. Its **core steps** also exist as an executable
copy in the code repository: the deployment steps in `DEPLOYMENT.md` (`DEPLOYMENT.zh-CN.md`
in Chinese) are run line by line by `tests/deployment_walkthrough.sh`, which CI executes
on every push, from an empty database to a working administrator.
<Status kind="tested" guard="deployment_walkthrough.sh" />

That copy carries only the steps themselves. Docker Compose, systemd, reverse proxies and
upgrades are below.

## What you deploy

One Rust binary and a SurrealDB instance. No runtime, no application server, no sidecar.

The binary is **not** statically linked: it is built for the GNU target and dynamically
links glibc and OpenSSL (`oauth2` and `lettre` both use native-tls). Copying it onto a
different distribution, or into a `FROM scratch` image, will fail on the missing
libraries. The provided container runs it on `debian:bookworm-slim` with
`ca-certificates` and `libssl3` installed, which is the shape to reproduce.

## 1 · Database

```bash
surreal start --bind 0.0.0.0:8000 --user root --pass root \
  surrealkv:///var/lib/surrealdb/soulauth.db
```

For production give SoulAuth a scoped account rather than `root`, and put TLS in front —
see the [production checklist](/operate/production-checklist).

**Version.** SurrealDB 3.x. The suite is run against 3.0.0 and 3.2.4, and CI pins 3.2.4;
2.x is not supported and the CLI flags below do not exist there. The two 3.x releases
differ in how `surreal import` treats a file without `OPTION IMPORT;` — 3.0 imports it,
3.2 rejects every `DEFINE` and leaves no tables. `schema.sql` carries that line, so both
work; keep it if you edit the file.

## 2 · Schema

SoulAuth issues no DDL. It cannot create or alter its own tables; that boundary is
structural, not a setting. You import the two files once:

```bash
DB="--endpoint http://127.0.0.1:8000 --user root --pass root \
    --namespace auth --database main"

surreal import $DB schema.sql
surreal import $DB initial_data.sql
```

::: danger The namespace and database must match the process
`auth` / `main` here must equal `DATABASE_NAMESPACE` / `DATABASE_NAME` below. Get it
wrong and the process refuses to start, naming the pair it actually connected to.

The flag is `--endpoint`. `--conn` is the pre-3.x spelling and fails with an unhelpful
message.
:::

`initial_data.sql` seeds the system roles and permissions. Skipping it leaves you unable
to bootstrap an administrator.

## 3 · Configuration

```bash
DATABASE_URL=127.0.0.1:8000
DATABASE_NAMESPACE=auth
DATABASE_NAME=main
DATABASE_USER=root
DATABASE_PASS=root

JWT_SECRET=<openssl rand -hex 32>
APP_URL=http://localhost:8080
BIND_ADDR=127.0.0.1:8080
SMTP_HOST=127.0.0.1
SMTP_FROM=noreply@example.com
```

Every key: [configuration reference](/reference/configuration).

## 4 · Run

```bash
./soulauth
curl http://localhost:8080/health
# {"status":"ok","uptime_seconds":3}
```

## 5 · First administrator

The startup log prints a one-time bootstrap token:

```
WARN No administrator found. Bootstrap token for this process: 7f3a…
```

```bash
curl -X POST http://localhost:8080/api/bootstrap/admin \
  -H 'Content-Type: application/json' \
  -d '{"token":"7f3a…","email":"admin@example.com","username":"admin","password":"CorrectHorse42!"}'
```

The gate closes permanently once an administrator exists. **Do not create the first
admin by writing to the database** — that path predates the bootstrap endpoint and the
public documentation forbids it.

## Docker Compose

`docker-compose.yml` does steps 1–4 in one command.

<Status kind="tested" guard="ci.yml::docker" /> CI executes it on every push, all the way
through to a working administrator, then re-runs both imports against the populated
database and logs in again — that is the check that re-importing stays a no-op.

It is for local use: the passwords are development defaults and SurrealDB has no TLS.
Production goes through the steps above plus the
[production checklist](/operate/production-checklist).

## systemd

```ini
[Unit]
Description=SoulAuth
After=network.target

[Service]
Type=simple
User=soulauth
EnvironmentFile=/etc/soulauth/env
ExecStart=/usr/local/bin/soulauth
Restart=on-failure
RestartSec=5

NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/soulauth

[Install]
WantedBy=multi-user.target
```

Keep `/etc/soulauth/env` at mode `0600` — it holds `JWT_SECRET`.

## Reverse proxy

```nginx
location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Set `TRUST_PROXY_HEADERS=true` **only** if SoulAuth cannot be reached without going
through the proxy. Otherwise a client forges `X-Forwarded-For` and walks past IP rate
limiting.

## Upgrading

1. Read the release notes for schema changes.
2. Back up the SurrealDB data directory.
3. Re-import `schema.sql` and `initial_data.sql` in full. You do not have to work out
   which statements are new — every `DEFINE` carries `IF NOT EXISTS` and the seed data
   is all `UPSERT`, so re-importing is a no-op for anything already there. Skipping this
   step is what breaks an upgrade that adds a table: the endpoint that uses it fails at
   runtime, not at startup.
4. Replace the binary and restart.

Rolling restarts are fine as long as every replica shares the same `JWT_SECRET` and OIDC
signing key. They must, or tokens from one replica fail against another's JWKS.

## Verify it yourself

```bash
./tests/deployment_walkthrough.sh
```

Zero failures means the path runs from an empty database to a usable administrator.

## Next

| | |
|---|---|
| Harden it | [Production checklist](/operate/production-checklist) |
| Backups, rotation, incidents | [Operations & recovery](/operate/operations-and-recovery) |
