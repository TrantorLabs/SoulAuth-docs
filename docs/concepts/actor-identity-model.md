# Actor identity model

An actor is stored as five objects. This page goes through them one at a time: what each
holds, and how it relates to the identity root.

## The anchor

`ActorIdentity` answers one question — **who is this, durably** — and nothing else.

| Field | Meaning |
|---|---|
| `subject_key` | The stable subject. Generated, never derived from email or username. |
| `actor_kind` | `human` or `ai_actor` |
| `identity_source` | `local`, `external`, or `soulseed` — how this identity entered |
| `canonical_actor_ref` | Soulseed deployments only: a reference to an actor defined elsewhere |
| `status` | `active` can authenticate; `suspended` cannot, reversibly; `retired` cannot, permanently, and its `subject_key` is never reassigned |

Two design decisions in that table are worth spelling out.

**`subject_key` is generated, not derived.** If it were derived from the email address,
then the day someone changes their address you get one of two outcomes. Either the
subject changes with it — every audit row written before the change now points at an
identifier nothing resolves, and every downstream application that keyed users on `sub`
sees a stranger. Or it does not change, in which case the value was never a derivation,
just a stored string with a misleading name.

**Only `active` can authenticate**, and an unrecognised status value is treated as
suspended rather than active. A typo in the status column should stop authentication,
not silently permit it.

::: tip Resource ID ≠ subject
`ActorIdentity` has a record ID *and* a `subject_key`. They are different namespaces.
An implementation may give them the same value; that is a choice, not an equivalence,
and no API contract should assume it.
:::

## What surrounds it

<Figure2 locale="en" />

All four objects below hang off `actor_identity`, and all four are optional.

**There is no `AIActor` object to match `HumanAccount`.** An AI actor is an
`actor_identity` row with `actor_kind = ai_actor` and no `human_account` row under it —
the schema has `actor_identity`, `human_account`, `ai_actor_credential` and
`ai_actor_challenge`, and no fifth table. The human side needs an extra row for an email
address and a username; the non-human side does not, so none is created.

### HumanAccount — how a person manages their login

`email`, `username`, `username_normalized`, `email_verified`.

Changing an email address changes this row. It does not change the actor. That
separation is the reason an AI agent can exist without any of these fields —
[AI-native identity](/concepts/ai-native-identity).

### Credential — what can prove the actor right now

For AI actors this is a real, separate table: `ai_actor_credential`, holding
`public_key`, `algorithm`, `label`, `status`, `last_used_at`. SoulAuth stores only public
keys there, so reading that table grants nobody the ability to impersonate anyone.

**An identity outlives any credential it holds.** Rotating a key, losing a key, revoking
a key: none of these produce a new actor, so audit rows written under the old key still
resolve to the same one.

### IdentityBinding — which external subject is the same actor

`provider`, `provider_subject`, `binding_type`, `verification_state`, `revoked_at`.

A binding resolves *correspondence*: "the GitHub user `4001` is this actor". It is not a
credential and it is not an authentication.

::: details Why matching on the external subject alone is a real vulnerability
`(provider, provider_subject)` must be matched as a pair. Matching on the subject alone
means a GitHub account with numeric id `4001` resolves to the same actor as a Google
account whose `sub` is the string `"4001"` — a cross-provider account takeover with no
exploit code required.
:::

### Client — which application is asking

Registered OIDC clients. A client is a party in the protocol, never the subject of the
authentication.

## Continuity

None of these change the actor: an email change, a username change, a key rotation, MFA
being turned on and off again, sign-ins arriving through different clients.

Setting `status` to `retired` is the one step that does not reverse. `suspended` only
stops authentication for now and can be set back to `active`; after `retired` the actor
can never authenticate again, and its `subject_key` is never given to another actor.

That is why `retired` does not delete the row: the row stays, so the
`actor_subject_idx` unique index keeps holding that `subject_key`. Delete it and the same
value could later be assigned to someone else, at which point a subject in an old audit
row means two different actors at two different times.

::: warning No endpoint sets an actor to `retired` today
`PUT /api/users/{user_id}/status` takes an account status
(`Active` / `Inactive` / `Suspended` / `Deleted`) and does sync the identity root, but the
mapping is `Active → active` and **everything else to `suspended`**.

That is deliberately conservative: V1's `Deleted` and the identity root's `retired` do not
mean the same thing — `retired` also carries "this `subject_key` is never reused" — and
the transition does not treat them as equivalent. `retired` can therefore only be written
by internal code; there is no way to reach it by following this documentation.
:::

::: warning What `sub` is stable across, today
The OIDC `sub` currently carries the legacy `user` row key,
not the identity root. So it is stable for the lifetime of that row — weaker than the
"never reassigned" guarantee the model describes. If you need a subject identifier
that survives account rebuilds, `sub` does not give it to you yet. Recorded in the
[standards registry](/security/standards-and-conformance) as a named caveat.
:::

## Standalone and Soulseed

Standalone is the default: SoulAuth is the whole identity domain, `identity_source` is
`local`, and `canonical_actor_ref` is empty.

In a Soulseed deployment the canonical actor is defined by SoulseedAGI, and
`canonical_actor_ref` holds a reference to it. SoulAuth authenticates that actor; it does
not gain the ability to define or modify it. The reference is a controlled integration
claim and is not exposed to third-party OIDC clients by default.
[Soulseed & Mind OS →](/spec/soulseed-and-mind-os)

## Next

| | |
|---|---|
| The agent case end to end | [AI-native identity](/concepts/ai-native-identity) |
| What a successful authentication does *not* grant | [Identity vs authority](/spec/identity-vs-authority) |
| Why these objects exist at all | [Specification](/spec/) |
