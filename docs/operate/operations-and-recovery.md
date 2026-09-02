# Operations & recovery

Day-two work: rotating things, backing things up, and what to do when something has
gone wrong.

## Backups

One thing to back up — the SurrealDB data directory. It holds identities, credentials,
sessions, clients and audit rows.

```bash
systemctl stop soulauth
tar czf soulauth-$(date +%F).tar.gz /var/lib/surrealdb/
systemctl start soulauth
```

Two things live **outside** the database and are just as necessary for a restore:

- `JWT_SECRET`
- the OIDC signing key (`OIDC_RSA_PRIVATE_KEY_PATH`) and `MFA_SECRET_ENCRYPTION_KEY`

Restore the database without those and every session dies, every issued ID token fails
verification, and **every stored TOTP secret becomes undecryptable**. Keep them wherever
you keep secrets, and test that you can actually get them back.

## Rotating secrets

### `JWT_SECRET`

Rotating it invalidates every session — everyone is logged out. That is the expected
cost, not a failure.

::: danger Rotate the MFA key first, or not at all
If `MFA_SECRET_ENCRYPTION_KEY` was never set explicitly, the MFA key is **derived from
`JWT_SECRET`**. Rotating `JWT_SECRET` then locks out every MFA user permanently — their
stored TOTP secrets can no longer be decrypted, and there is no recovery beyond having
them re-enrol.

Set a dedicated `MFA_SECRET_ENCRYPTION_KEY` before you ever touch `JWT_SECRET`.
A non-loopback `APP_URL` already makes it required, which is what the gate is there for.
:::

### OIDC signing key

**One key at a time.** SoulAuth loads a single signing key and JWKS publishes exactly
that one — there is no key ring, so you cannot serve the old key alongside the new one.

Rotating it therefore invalidates every ID token signed with the previous `kid`
immediately, and refetching JWKS does not help a client holding one: the old key is gone
from the document. Rotate during a window where a brief round of failed ID token
validation is acceptable, or plan for clients to re-authenticate.

### Client secrets

```bash
curl -X POST $SOULAUTH/api/oidc/clients/$CLIENT_ID/regenerate-secret \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Returned once. The old secret stops working immediately, so deploy the new one to the
client in the same maintenance window.

## Locked-out accounts

```bash
# Who is locked
curl $SOULAUTH/api/security/lockout -H "Authorization: Bearer $ADMIN_TOKEN"

# Unlock (idempotent — returns false if it was not locked)
curl -X POST $SOULAUTH/api/security/unlock \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H 'Content-Type: application/json' \
  -d '{"identifier":"user@example.com","lockout_type":"User"}'
```

Both dimensions can be unlocked — `User` and `Ip`. Both lock and unlock are audited;
recording only locks would leave a trail of events that never resolve.

Requires `soulauth:security.write`.

## Suspending an actor

```bash
curl -X PUT $SOULAUTH/api/users/$USER_ID/status \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H 'Content-Type: application/json' \
  -d '{"account_status":"Suspended"}'
```

Suspension stops **future** authentication. Existing sessions on other replicas keep
working for up to `AUTH_SESSION_CACHE_TTL_SECONDS`. If that matters, restart the
replicas.

History is not rewritten: past authentications, audit rows and attribution remain. A
suspended actor is one that can no longer authenticate, not one that never existed.

## Suspected credential compromise

**A user's password.** Suspend, force a reset, unsuspend. Their sessions die on the
password change.

**A client secret.** Regenerate it. Existing access tokens stay valid until they expire —
that window is `access_token_lifetime`, 3600s by default.

**An AI actor's key.** Revoke that credential. The actor keeps its identity and any other
active keys, which is the entire reason multiple keys are allowed.

```bash
curl -X DELETE $SOULAUTH/api/actors/$ACTOR_ID/credentials/$CREDENTIAL_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**`JWT_SECRET`.** Read the rotation warning above first, then rotate. Everyone is logged
out.

**The database.** Sessions, access tokens, refresh tokens, authorization codes, reset and
verification tokens are all stored as SHA-256 fingerprints, so a database read yields no
usable credential. <Status kind="tested" guard="conformance::b4b" /> Passwords are
Argon2. TOTP secrets are encrypted — with a key that, if you never set one explicitly,
derives from `JWT_SECRET`.

## Cleanup

A background task runs hourly: expired sessions, expired reset tokens, expired OIDC
artifacts, stale rate-limit rows, stale lockout records. Nothing to schedule.

Audit rows are **not** cleaned up. If you need retention limits, that is your policy to
apply.

## Monitoring

```bash
curl $SOULAUTH/health                     # public
curl $SOULAUTH/api/audit/system-health \
  -H "Authorization: Bearer $ADMIN_TOKEN"  # needs soulauth:security.read
```

Worth alerting on: `login_failed` rate, `account_locked` rate, `permission_denied` on
admin endpoints, and any `panicked` in the process log.

## Next

| | |
|---|---|
| Diagnosing a specific failure | [Troubleshooting](/operate/troubleshooting) |
| What the audit log can and cannot prove | [Audit](/reference/audit) |
