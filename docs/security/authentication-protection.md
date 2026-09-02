# Authentication protection

The mechanisms guarding the login path, and how to tune them.

## Password storage

Argon2, with a per-password salt. `PASSWORD_MIN_LENGTH` defaults to 12 and is enforced
everywhere — including the bootstrap path, which does not relax policy on the grounds
that it is the first user.

## Timing

A login for an address that does not exist verifies against a **dummy hash** computed at
startup, so it costs the same as a real attempt. Without that, response time answers
"is this address registered?" more reliably than any error message.

## Lockout

Two independent dimensions, both stored in the database and therefore shared across
replicas:

```bash
LOCKOUT_MAX_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15
LOCKOUT_RESET_WINDOW_MINUTES=60
LOCKOUT_USER_ENABLED=true    # per account
LOCKOUT_IP_ENABLED=true      # per source address
```

`LOCKOUT_RESET_WINDOW_MINUTES` is the window failures accumulate over. Five failures
spread across two hours will not lock an account with the defaults; five in ten minutes
will.

A locked response is `429` carrying `locked_until_seconds`, so a client can show a
countdown instead of guessing.

::: tip Tune these to the deployment
A public consumer service and an internal admin tool have genuinely different tolerances.
Tightening `LOCKOUT_MAX_ATTEMPTS` on an internal tool costs little; loosening
`LOCKOUT_DURATION_MINUTES` on a public one avoids turning a forgotten password into a support
ticket.
:::

Administrators can unlock either dimension —
[operations & recovery](/operate/operations-and-recovery#locked-out-accounts).

## Rate limiting

Applied per IP to the authentication endpoints, separately from lockout. Lockout protects
one account; rate limiting protects the endpoint.

Counters are in the database, so they survive a restart and are shared across replicas.
That surprises people during testing: restarting the process does not clear them.

::: danger Behind a proxy this depends on one setting
Without `TRUST_PROXY_HEADERS=true`, every request appears to come from the proxy and one
client's failures rate-limit everyone.

With it on while SoulAuth is directly reachable, a client forges `X-Forwarded-For` and
bypasses both rate limiting and IP lockout entirely.

Bind to loopback, make the proxy the only route, then turn it on.
:::

## Multi-factor

TOTP with backup codes.

**Secrets** are encrypted with ChaCha20-Poly1305 under `MFA_SECRET_ENCRYPTION_KEY`.
Reversible, necessarily — generating a code requires the secret.

**Backup codes** are Argon2 hashes, checked one at a time. They are not reversible
because nothing needs to read them back.

**Replay** is prevented by persisting the last accepted TOTP step per user. The same code
cannot be used twice, including on a different replica, because the high-water mark is in
the database.

**The two-step flow** returns a short-lived challenge token from the first step rather
than a session. Only the second step issues one, so a correct password alone never
produces a usable credential.

::: warning The derived-key trap
With no `MFA_SECRET_ENCRYPTION_KEY` set, the key derives from
`JWT_SECRET` and a warning is logged. Rotating `JWT_SECRET` then makes every stored TOTP
secret undecryptable — every MFA user locked out, with no recovery but re-enrolment.

Only reachable in loopback development: a non-loopback `APP_URL` refuses to start without
a dedicated key.
:::

## Sessions

Stored as SHA-256 fingerprints, never as tokens.
<Status kind="tested" guard="conformance::b4b" />

Revoked immediately on logout, password change and account suspension — on the instance
that handled it. Other replicas observe within `AUTH_SESSION_CACHE_TTL_SECONDS`
(default 5). `logout-all` revokes every session for an actor at once.

No IP or device binding. Both break legitimate users on mobile networks more often than
they stop attackers, so neither is imposed.

## Agent authentication

An AI actor never sends a reusable secret. It signs a server-issued single-use challenge:

- consumed **before** verification, so concurrent use cannot both succeed;
- bound to one actor and one issuer, so it cannot be replayed elsewhere;
- 120-second lifetime;
- Ed25519 only — a single-entry allowlist, because negotiable algorithms are how
  signature schemes get downgraded.

[The four signed lines](/concepts/ai-native-identity)

## Audit

Every authentication event is recorded: successes, failures with a categorised reason,
lockouts, unlocks, permission denials, rate-limit violations.

Writes never block the request and never contain credentials. Events go onto a queue that
a dedicated writer drains, retrying on transient database errors, and the queue is
flushed before the process exits — so shutting down does not cost you the events that
were still in flight.

The log is tamper-evident, in two layers:

- **A hash chain.** Every row carries a `seq`, a `previous_hash` and an `event_hash`
  computed over its own content plus the link. Editing one row breaks its own hash;
  deleting one breaks the next row's link and leaves a gap in `seq`.
- **Signed checkpoints.** A chain on its own can be recomputed end to end by whoever
  holds database write access, so the chain head is signed hourly with an Ed25519 key
  from `AUDIT_INTEGRITY_KEY` — a key that does not live in the database. A recomputed
  chain no longer matches the signatures already issued.

**One chain per replica.** The sequence is assigned in memory by the writing process, so
each replica keeps its own chain, identified by `SOULAUTH_INSTANCE_ID`. Two replicas
sharing an id collide on the unique index and the later one's audit events are rejected,
so the setting is required once `APP_URL` is not loopback rather than guessed from the
hostname.

`GET /api/audit/integrity` re-derives every chain and verifies each checkpoint against
this instance's own public key. It reports how many chains it covered and, if a chain is
broken, which one and where.
<Status kind="tested" guard="conformance::f4" />

## Next

| | |
|---|---|
| Specific attacks | [Threat model](/security/threat-model) |
| Tuning for production | [Production checklist](/operate/production-checklist) |
