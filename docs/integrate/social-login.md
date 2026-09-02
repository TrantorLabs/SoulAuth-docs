# Social login

Google and GitHub. Both are optional: leave the credentials unset and SoulAuth runs
normally, with those routes returning an error instead of failing at startup.
<Status kind="tested" guard="integration.sh" />

## Configuration

```bash
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# Required as soon as any provider is configured, or startup fails.
# It is the callback prefix: SoulAuth appends the provider name to it.
OAUTH_REDIRECT_URL=https://auth.example.com/api/auth/callback
```

`OAUTH_REDIRECT_URL` follows the same rule as the endpoint overrides: an absolute https
URL, or plaintext http only for an exact loopback host.

SoulAuth appends the provider name, so the redirect URIs to register on the provider side
are `${OAUTH_REDIRECT_URL}/google` and `${OAUTH_REDIRECT_URL}/github`. With the value
above those resolve to the two routes this service actually serves,
`/api/auth/callback/google` and `/api/auth/callback/github`. They must match what the
provider has, exactly.

## The flow

Send the browser to `GET /api/auth/login/google` (or `GET /api/auth/login/github` — the
two behave identically from here on). SoulAuth redirects to the provider and,
at the same time, sets a `soulauth_oauth_state` cookie — `HttpOnly`, and holding a nonce
that is bound to the `state` parameter in the redirect URL.

The provider sends the user back to `GET /api/auth/callback/google?code=…&state=…`.
SoulAuth checks the `state` against the cookie before doing anything else.

**Both halves are required.** A callback carrying a valid `state` but no cookie is
rejected with `400`, and so is one whose cookie nonce does not match. That pair is the
whole CSRF defence: an attacker who can get a victim's browser to visit a callback URL
cannot also set that cookie.
<Status kind="tested" guard="integration.sh" />

On success the response is a `303` redirect to a location inside your `APP_URL`. It is
never an arbitrary URL from the request — the login entry point only accepts state it
issued itself, so there is no `return_to` for an attacker to smuggle in.

## What happens to the account

Three cases, depending on what the provider returns:

**New email.** An account is created and linked to the provider subject. Signing in again
reuses both — no duplicate account, no duplicate link.

**Email not verified at the provider.** Rejected with `403`, and nothing is written: no
account, no link. Accepting it would let anyone put an unverified address they do not own
into their provider profile and take over the matching local account.
<Status kind="tested" guard="integration.sh" />

**Email matches an existing local account.** The provider identity is linked to that
account. You get one account with two ways in, not two accounts.

## Key users on the pair, not on the subject

Links match on `(provider, provider_subject)` together. Matching on the subject alone
would make a GitHub user with numeric id `4001` and a Google account whose `sub` is the
string `"4001"` the same person. The same rule applies to your own application: key users
on `(iss, sub)`, never `sub` by itself.

## After the callback

The account exists but has no password. If your product wants one, that is
`initialize-password` — see [Passwords and email](/integrate/passwords-and-email).

| | |
|---|---|
| Endpoint tables | [Authentication and sessions](/reference/authentication-and-sessions) |
| Why bindings are separate objects | [Actor identity model](/concepts/actor-identity-model) |
| The attack this defends against | [Threat model](/security/threat-model) |
