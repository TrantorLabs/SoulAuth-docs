# Troubleshooting

Symptoms, in the order you are likely to meet them.

## It starts, `/health` is fine, the first write fails

The schema went into a different namespace/database pair than the process connects with.

```bash
surreal sql --endpoint http://127.0.0.1:8000 --user root --pass root \
  --namespace auth --database main --json <<< 'SELECT VALUE id FROM role:admin;'
```

Nothing back means the seed is not in the pair you just queried. Re-import with the
`--namespace` / `--database` that match `DATABASE_NAMESPACE` / `DATABASE_NAME`.

This is the single most common deployment failure, and it is nearly invisible: the
process starts, health checks pass, and nothing complains until a write.

## It refuses to start

The error names the setting. The three that catch people:

| Message mentions | Fix |
|---|---|
| `JWT_SECRET … must be at least 32 characters` | `openssl rand -hex 32` |
| `OIDC_RSA_PRIVATE_KEY_PEM … required when APP_URL is not a loopback address` | Generate and persist a signing key |
| `MFA_SECRET_ENCRYPTION_KEY … required when APP_URL is not a loopback address` | `openssl rand -base64 32` |

The last two only appear once `APP_URL` stops being loopback — which is to say, the first
time you deploy for real. That is intentional: both defaults work right up until they
destroy credentials.

## No bootstrap token in the log

It is printed only when **no administrator exists**. If one does, the log says so
instead:

```
INFO Bootstrap path closed: an administrator already exists
```

The token is printed at `warn` level so it survives the default log filter. If you see
neither line, you are looking at a different process or a filtered log.

## `invalid_grant` when exchanging a code

Work down this list:

- **`Client secret required for confidential client`** — the client is registered as
  `confidential` and you sent no secret.
- **`redirect_uri` differs** from the one in the authorize request by even one character.
  Exact match, no normalisation.
- **The code is already used.** They are single-use, and consumption happens before
  anything else.
- **The code expired.**
- **`code_verifier` does not match.** Almost always base64url padding left on, or `+`/`/`
  not translated to `-`/`_`.

## Client library rejects discovery

`issuer` must equal what the client expects, character for character. Compare:

```bash
curl -s $SOULAUTH/.well-known/openid-configuration | grep issuer
```

against your `APP_URL`. A trailing slash on one side is the usual culprit.

## Logout appears to do nothing

You cleared your own session but not SoulAuth's. The next login silently reuses the
still-valid identity provider session, so the user is back in the same account without
being asked.

Redirect to `end_session_endpoint` with `id_token_hint`. See
[browser & BFF](/integrate/browser-and-bff#logout).

## A user is still logged in after being suspended

Expected, briefly. Each instance caches resolved sessions; other replicas observe the
change within `AUTH_SESSION_CACHE_TTL_SECONDS` (default 5). Restart the replicas if you
need it immediately.

Instant cross-replica revocation is not implemented.

## Rate limited during testing

Login endpoints are rate limited per IP and accounts lock after repeated failures. Both
live in the database, so restarting the process does not clear them.

```bash
curl -X POST $SOULAUTH/api/security/unlock \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H 'Content-Type: application/json' \
  -d '{"identifier":"user@example.com","lockout_type":"User"}'
```

## Emails never arrive

Send failures are logged, not raised, so a broken SMTP host cannot turn "forgot password"
into a 500 or leak whether an address is registered through a timing difference. The cost
is that it is quiet — you have to go looking in the log.

```bash
grep -i 'smtp\|mail' /var/log/soulauth.log
```

`SMTP_HOST` and `SMTP_FROM` are required even with verification disabled, because reset
sends mail.

## `403` where you expected `401`

Two different meanings:

- **A permission is missing.** The body carries
  `{"error":"missing_permission","required_permission":"…"}`.
- **Wrong subject type.** An AI actor session on a human endpoint, or a human session on
  `/api/actors/me`. Both refuse explicitly rather than failing obscurely.

## Everything returns `429` from one address

Behind a proxy without `TRUST_PROXY_HEADERS=true`, every request looks like it comes from
the proxy, so one client's failures rate-limit everyone.

Turn it on — but **only** if SoulAuth cannot be reached directly. If it can, the header
is forgeable and rate limiting stops working entirely.

## Reading the errors

Every non-OIDC error carries a stable machine code:

```json
{ "error": "account_locked", "message": "…", "locked_until_seconds": 743 }
```

Branch on `error`, never on `message`. Every code is listed in
[API conventions](/reference/api-conventions#codes); OIDC endpoints use the RFC 6749
shape instead.

## Still stuck

Run the suites — they check the system against the contract and often localise the
problem faster than reading logs:

```bash
cargo test
./tests/integration.sh
./tests/deployment_walkthrough.sh
```

Then [open an issue](https://github.com/TrantorLabs/SoulAuth/issues).

## Next

| | |
|---|---|
| Recovery procedures | [Operations & recovery](/operate/operations-and-recovery) |
