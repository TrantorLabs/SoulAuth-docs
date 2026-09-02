# Passwords and email

Four flows share one mechanism: a single-use token delivered by email. Registration and
verification, password reset, and setting a first password on an account that was created
through a social login.

None of these are OIDC. They are SoulAuth's own endpoints, and your frontend calls them
directly.

## What you need running

Two separate things, easy to conflate:

- **The configuration is required to start.** Without `SMTP_HOST` and `SMTP_FROM` the
  process will not come up.
- **Whether mail actually leaves is something you have to test.** A failed send does not
  fail the request — it writes a log line. With SMTP unreachable the service still
  starts, registration with verification off still succeeds, and a reset request still
  returns 200 (that is the enumeration-resistant design). The mail simply never arrives.
  Walk through a real registration and a real reset after you deploy.

Verification is **off by default**: `EMAIL_VERIFICATION_ENABLED=false`. With it off,
`POST /api/auth/register` creates a usable account immediately and sends nothing. Turn it
on and the same call creates the account but the user must click through before the
account is verified.

## Register, then verify

```bash
curl -X POST "$APP/api/auth/register" \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","username":"you","password":"CorrectHorse42!"}'
```

With `EMAIL_VERIFICATION_ENABLED=true` this sends one message, subject
`Verify your email address`, containing a link of the form
`{VERIFY_EMAIL_PAGE_URL}?token=…`. That page is **yours to build** — SoulAuth does not
serve it. It reads `token` from the query string and calls:

```bash
curl "$APP/api/auth/verify-email/$TOKEN"
```

`200` marks the account verified. A token that does not match returns `401`. If the user
lost the mail, `POST /api/auth/resend-verification` issues a new one.

The token is never stored as sent: the row keeps a SHA-256 fingerprint, so a database
dump does not hand anyone a working verification link.
<Status kind="tested" guard="conformance::b4b" />

## Reset a password

Two calls, two different tokens, and one behaviour that surprises people:

```bash
curl -X POST "$APP/api/auth/request-password-reset" \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com"}'
```

**This returns `200` for an address that has never registered, and sends nothing.** A
different answer for "no such account" would turn the endpoint into a way to test whether
an address is a user here. Your UI should say "if that address is
registered, we sent a link" rather than "check your inbox", because the second is only
true half the time.

The message has subject `Reset your password` and a link ending in
`reset-password/{token}`. Your page takes that token and posts it back:

```bash
curl -X POST "$APP/api/auth/reset-password" \
  -H 'Content-Type: application/json' \
  -d '{"token":"'"$TOKEN"'","new_password":"BrandNewHorse43!"}'
```

`200` and the old password stops working immediately. **The token is consumed** — posting
it a second time returns `401`, even with a valid new password.

The request endpoint is rate limited at 3 attempts per 15 minutes, so a UI that retries
on the user's behalf will lock them out of their own reset.

## First password after a social login

An account created through Google or GitHub has no password at all. `initialize-password`
sets one, and it only works for that case:

```bash
curl -X POST "$APP/api/auth/initialize-password" \
  -H "Authorization: Bearer $SESSION_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"password":"BrandNewHorse43!"}'
```

It requires a live session (`401` without one) and refuses if the account already has a
password. That refusal matters: without it, anyone holding a session could set a new
password without proving they know the old one, which is a password change wearing a
different name.

## Password rules apply everywhere

Registration, reset and initialize all run the same policy — minimum length from
`PASSWORD_MIN_LENGTH` (12 by default) plus at least three of upper, lower, digit, symbol.
The bootstrap path that creates your first administrator runs it too; being first does not
buy an exemption.

Failures come back as `400` with the machine code in `error`, described in
[API conventions](/reference/api-conventions).

| | |
|---|---|
| Endpoint tables | [Authentication and sessions](/reference/authentication-and-sessions) |
| Adding a second factor | [Multi-factor authentication](/integrate/mfa) |
| Google and GitHub | [Social login](/integrate/social-login) |
