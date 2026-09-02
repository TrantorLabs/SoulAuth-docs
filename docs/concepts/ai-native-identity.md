# AI-native identity

An AI agent here is a subject in its own right: it has an identity, it holds a
credential, and it proves itself. There is no human account behind it.

<Status kind="supported" /> <Status kind="tested" guard="conformance::a6" />

## The problem this solves

Giving a bot an account runs, but three things do not work. All three come from the same
place: in that pattern, identity, account and credential are one row.

- **You cannot tell a person from a process.** No field distinguishes "a human logged in"
  from "a cron job ran"; both are a row in `user`.
- **You cannot replace the credential.** The password *is* the actor. After a leak there
  is no "new key, same actor" — you create a new account, and every audit row written
  before that points at an abandoned one.
- **You cannot attribute.** That row was created by one person and is then shared by
  several people and machines. The log records the account, not who used it.

SoulAuth keeps them as three objects.

## The objects

| Object | For an AI agent |
|---|---|
| `ActorIdentity` | Exists. `actor_kind: ai_actor`, its own durable `subject_key`. |
| `HumanAccount` | **Does not exist.** No email, no username, no password. |
| Credential | One or more Ed25519 public keys. SoulAuth holds only the public half. |
| Session | Ordinary — the `session` table keys on the identity root, not on a user row. |

That second row is the whole point, and it is asserted rather than promised: the
conformance suite checks that the AI authentication path contains no reference to
`human_account`, `password`, `email` or `username` at all.

<Figure2 locale="en" />

## How it authenticates

Two steps. The agent's private key never leaves the agent, and nothing reusable ever
travels over the wire.

### 1 · Ask for a challenge

```bash
curl -X POST $SOULAUTH/api/actors/challenge \
  -H 'Content-Type: application/json' \
  -d '{"actor_id":"actor_identity:lnhl…"}'
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

### 2 · Sign it, exchange it for a session

```bash
curl -X POST $SOULAUTH/api/actors/authenticate \
  -H 'Content-Type: application/json' \
  -d '{"actor_id":"…","nonce":"…","algorithm":"ed25519","signature":"…"}'
```

The session token comes back with `subject_type: agent` in its claims.

## What exactly gets signed

Four lines, joined with `\n`, no trailing newline:

```text
soulauth-ai-actor-auth/v1        ← domain separator, versioned
http://localhost:8080            ← the issuer
actor_identity:lnhl…             ← the actor
sp9kEQQT4evGROoc…                ← the nonce
```

Every line is load-bearing:

- **Line 1** means a signature made for this purpose can never be replayed as a
  signature for some future purpose. The version is in the string, so changing the
  payload structure invalidates old signatures by construction.
- **Line 2** stops a challenge captured from one deployment being replayed against
  another that happens to share an actor id.
- **Line 3** binds the proof to one actor. Line 4 binds it to one attempt.

::: tip Why the server hands you the payload
Letting every client library assemble those four lines itself is possible — and the
failure mode when one gets it subtly wrong is "the signature just doesn't verify",
which is miserable to debug. So the server returns the exact bytes.

This gives nothing away: the payload contains no secret, and the server **recomputes it
independently** before verifying. The copy you send back is never used.
:::

The signed content contains no JSON. JSON has no single byte
representation — key order, whitespace, escaping and number formatting all vary — so
"serialise then sign" always drags in a canonicalisation spec of its own. Four lines of
text cannot disagree with themselves.

## Replay, rotation, revocation

**A challenge is consumed before the signature is checked.** Not after. Checking first
would leave a window where two concurrent requests with the same nonce both verify. The
cost is that a failed attempt burns the challenge too. That is the behaviour you want:
letting a client retry signatures against one nonce turns it into a target.

**Multiple keys can be active at once.** That is what makes rotation safe: add the new
key, confirm the agent authenticates with it, then revoke the old one.

**Revoking a key changes its status; it does not delete the record.** Otherwise the
audit trail loses the answer to "which key was used for that action".

## Common confusions

::: details This is not RFC 7523, mTLS, or client credentials
The proof is not a JWT (7523), involves no transport-layer client certificate (8705),
does not go through `/api/oidc/token` (client credentials grant), and does not sign the
HTTP request itself (RFC 9421). It is a SoulAuth-native mechanism, and the registry says
so explicitly so that nobody assumes a standard is in play.
:::

::: details "AI actor" is not a claim about the agent's nature
Giving something an identity says it can be recognised and held accountable. It says
nothing about autonomy, agency or inner life. An identity system is not the right place
to take a position on that, and this one does not.
:::

::: details A machine identity is not automatically an AIActor
A service account, an API key or a workload identity answers "which program is calling".
An `ActorIdentity` answers "which actor is this, across time, independent of the
credential it currently holds". A key rotation must not create a new subject.
:::

::: details Equal standing is not equal implementation
Human and AI actors share one identity contract. They do not share an authentication
method, a lifecycle, or a set of account attributes — and they should not.
:::

## Next

| | |
|---|---|
| Register one and watch it authenticate | [Quickstart, step 7](/start/quickstart) |
| The objects in full | [Actor identity model](/concepts/actor-identity-model) |
| What a session token does *not* grant | [Identity vs authority](/spec/identity-vs-authority) |
