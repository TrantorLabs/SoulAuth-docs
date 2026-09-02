# Identity vs authority

A successful authentication answers **who**. It does not answer **may they**, and it
never will. This page draws the line and shows where each of the five questions around it
actually gets answered.

## Five questions, not one

| | Answers | Owned by |
|---|---|---|
| **Identity** | Who is this actor? | SoulAuth |
| **Authentication** | Has that identity been proven, to the required strength, just now? | SoulAuth |
| **Authority** | Why does this actor have standing to do this kind of thing in this domain? | your application |
| **Authorization decision** | Is *this specific request* allowed? | your application |
| **Effect** | Did reality actually change, and what came of it? | your application |

They are related and they are not substitutes. SoulAuth answers the first two and stops.

The failure mode is treating an answer to an earlier question as an answer to a later
one: *the token verified, therefore the operation is permitted.* That inference is
never valid.

## Authority is scoped to a domain

Authority is not an attribute an actor carries around. It exists **within a domain**,
and the same actor holds different authority in different ones.

An actor who administers your billing system has no standing in your deployment
pipeline unless that pipeline grants it. Nothing about the identity changes as they move
between the two; what changes is which domain is asking.

This is why SoulAuth's own RBAC governs **only SoulAuth's control plane** — who may
register an OIDC client, who may read the audit log. It is not a permission service for
your application: SoulAuth does not know what resources your domain has, or what the
rules over them are.

## What authentication can and cannot do

Authentication conditions can **constrain** an authorization decision. They cannot
**create** authority.

Requiring MFA for a sensitive operation is a legitimate constraint: it narrows when an
existing authority may be exercised. But no strength of authentication grants an
authority the actor did not already have. `acr` and `amr` describe how someone
authenticated; they do not describe what they may do.

The inverse also holds: an authority that exists is not exercisable if the
authentication behind it is too weak or too stale for the operation at hand.

## Authenticated is not currently eligible

A valid token proves an authentication happened. It does not prove the actor is still
eligible *right now*.

Between issuance and use, the actor may have been suspended, had a role removed, or had
the resource move out of their scope. Anything that treats a still-valid token as
standing permission has confused a past event with a present state.

Practically: check authority at the moment of the operation, not at the moment of login.

::: warning How current is "current" here
Revocation reaches other replicas within
`AUTH_SESSION_CACHE_TTL_SECONDS`. A token can therefore remain accepted briefly after
the underlying identity was suspended. The default is 5 seconds, so the window is small
but not zero. A single-instance deployment has no window at all: the instance that
handled the revocation is the only one serving traffic.
:::

## Continuity does not freeze anything

An identity persisting over time is a property of the identity, not a promise about
authority.

`Agent-17` can remain the same actor across years while its permissions are revoked,
its scope narrowed, and its access to a particular domain withdrawn entirely. Stable
identity is what makes those changes *attributable* — it is not what makes them
impossible.

## Claims and tokens mean only what their contract says

**Claims** describe the authentication event and the subject. `sub`, `iss`, `auth_time`,
`sid`, and the profile claims permitted by scope. None of them is an authorization
statement, and a client that reads `email_verified` as "may access billing" has invented
a rule the issuer never made.

**Access tokens** are proof that a client was authorised *by the resource owner, for the
scopes shown*. OAuth scope is a delegation boundary — the outer limit of what a client
may attempt on someone's behalf. It is not a grant of authority to the user, and not a
statement about what your application should permit.

A scope named `admin` grants nothing. It means the user agreed the client could ask.

## Authority is not execution

Even with authority, an operation can legitimately fail:

- a domain precondition does not hold (the account is closed, the resource is locked);
- a concurrent change made the operation moot;
- the effect was rejected downstream.

And the reverse: a failed precondition does not mean the actor lacked authority. Keeping
these separate is what makes an error message truthful — *you may not do this* and
*this cannot be done right now* are different sentences, and telling a user the wrong
one sends them to fix the wrong thing.

Likewise, an authorization decision is not an effect. "Allowed" means the attempt may
proceed; whether reality changed is a separate fact, and only the effect belongs in a
statement about what happened.

## Delegation does not replace identity

When one actor acts on behalf of another, both remain in the record. Delegation adjusts
authority and attribution; it does not overwrite who acted.

An audit entry that says only "the account owner did it" when an agent acted under
delegation has destroyed the one fact the entry existed to preserve.

## AI actors

Everything above applies unchanged — and one point deserves emphasis, because it is the
tempting shortcut with non-human actors:

**A long-lived identity is not long-lived authority.** An AI actor's identity is durable
precisely so that its authority can be adjusted, narrowed and revoked while attribution
still holds. Durable identity exists to make revocation meaningful, not to avoid it.

## The Soulseed boundary

In a Soulseed deployment, authenticating an actor grants no governance standing there.
SoulAuth holds a reference to a canonical actor; it does not gain the ability to define
or modify one. [Soulseed & Mind OS →](/spec/soulseed-and-mind-os)

## In one line

> SoulAuth tells you, with evidence, who is on the other end of this request.
> Everything you do with that answer is yours.

## Next

| | |
|---|---|
| The objects behind identity | [Actor identity model](/concepts/actor-identity-model) |
| What this release actually enforces | [Security model](/security/security-model) |
| Why the layers are separated | [Specification](/spec/) |
