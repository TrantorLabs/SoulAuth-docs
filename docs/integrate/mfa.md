# Multi-factor authentication

TOTP, the six-digit kind, plus backup codes. Enrolling takes two calls, and after that
logging in takes two as well.

## Enrolment is two calls, not one

`POST /api/auth/mfa/setup` returns the shared secret and a set of backup codes. It does
**not** turn MFA on:

```bash
curl -X POST "$APP/api/auth/mfa/setup" -H "Authorization: Bearer $TOKEN"
# → { "secret": "...", "backup_codes": ["...", ...] }
```

At this point `GET /api/auth/mfa/status` still reports `enabled: false`. The user now has
the secret in their authenticator app and has to prove it works:

```bash
curl -X POST "$APP/api/auth/mfa/enable" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"totp_code":"123456"}'
```

A wrong code returns `400` and MFA stays off. The split exists so that an authenticator
set up incorrectly fails at `enable`, while the account is still reachable with the
password alone.

**Show the backup codes at `setup` and never again.** They are not retrievable later.

## Login becomes two calls

Once MFA is on, `POST /api/auth/login` stops returning a session:

```json
{ "mfa_required": true, "temp_token": "..." }
```

There is no `token` field in that response — a client that reads `token` unconditionally
will silently get nothing. Carry the `temp_token` to the second call:

```bash
curl -X POST "$APP/api/auth/mfa/login-verify" \
  -H 'Content-Type: application/json' \
  -d '{"temp_token":"'"$TEMP"'","totp_code":"123456"}'
```

That returns the real session token. A wrong code returns `401`, and so does a code that
has already been used.

## Codes do not come back

A code that succeeded once cannot be replayed, and neither can any code from an **earlier**
window. The server keeps a high-water mark of the last accepted step, so an attacker who
captures a code has, at most, the remainder of its 30-second window — not the full
±1-window tolerance that the algorithm would otherwise allow.

Practical consequence: a user who fat-fingers the code, waits, and then types the *same*
code again will be rejected. Your UI should tell them to wait for the next one.

## Backup codes

`login-verify` accepts `backup_code` in place of `totp_code`:

```bash
curl -X POST "$APP/api/auth/mfa/login-verify" \
  -H 'Content-Type: application/json' \
  -d '{"temp_token":"'"$TEMP"'","backup_code":"..."}'
```

Each one works once. There is no endpoint to regenerate them: a user who runs out has to
disable MFA and enrol again, which requires a working code — so a user who has lost both
the authenticator and the codes needs an administrator. Plan for that before you turn
this on.

## Turning it off

`POST /api/auth/mfa/disable` requires a current TOTP code, not just a session. Holding a
stolen session token is therefore not enough to strip the second factor off an account.

## Operational requirement

TOTP secrets are encrypted at rest with `MFA_SECRET_ENCRYPTION_KEY`. If you do not set
it, the key is derived from `JWT_SECRET` and the server warns at startup — and rotating
`JWT_SECRET` will then make every stored secret undecryptable, locking out every enrolled
user at once. Set it explicitly before anyone enrols. The warning is emitted by
`src/utils/crypto.rs`; there is no automated test asserting it, so this paragraph carries
no badge.

| | |
|---|---|
| Endpoint tables | [Authentication and sessions](/reference/authentication-and-sessions) |
| Recovering a locked-out user | [Operations and recovery](/operate/operations-and-recovery) |
| Password and email flows | [Passwords and email](/integrate/passwords-and-email) |
