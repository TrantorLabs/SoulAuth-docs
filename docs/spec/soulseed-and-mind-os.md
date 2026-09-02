# Soulseed & Mind OS

Optional. SoulAuth runs standalone by default, and most deployments never need this page.

It exists to state one boundary: **who owns which fact**. SoulAuth stores a reference to
the canonical actor and never writes to it; if it could edit that definition, the two
systems would no longer be separable and neither could be deployed without the other.

## Three systems, three sources of truth

| System | Owns | Does not own |
|---|---|---|
| **SoulseedAGI** | What an actor *is* — the canonical actor, its mind, its intent | how that actor proves itself |
| **SoulAuth** | Identity and authentication — `ActorIdentity`, credentials, sessions | what the actor is, what it may do |
| **SoulseedOS** | Operation and governance — what runs, under what policy | who anyone is |

The arrows only point one way. SoulAuth authenticates an actor that SoulseedAGI defined;
it never writes back.

<Figure1 locale="en" />

## What crosses the boundary

Exactly one thing: an authentication fact.

> *This request is that actor, proven at this time, by this method.*

Nothing else. In particular:

- **Not authority.** A successful authentication grants no Soulseed governance standing.
  [Identity vs authority](/spec/identity-vs-authority)
- **Not definition.** `actor_identity.canonical_actor_ref` is a pointer. SoulAuth reads
  it; the far side owns it.
- **Not profile data.** What Soulseed knows about an actor stays with Soulseed.

## A reference is not ownership

`canonical_actor_ref` records that a local `ActorIdentity` corresponds to an actor
defined elsewhere. Holding that reference gives SoulAuth no ability to create, modify or
reason about a mind, an intent, or a memory.

The distinction gets challenged in one specific situation: someone proposes that SoulAuth
"just also store" a little Soulseed state, because it is right there. Once it does, the
two can no longer be deployed independently.

::: warning It is a controlled claim
`canonical_actor_ref` is **not** exposed to third-party OIDC clients by default. A
pointer into another system's identity domain is integration state, not a public profile
field. Publishing it by default would tell every relying party which other system this
deployment is wired to.
:::

## Standalone is the default, not a fallback

An actor with no Soulseed binding is a complete, valid SoulAuth actor. In standalone
mode `identity_source` is `local` and `canonical_actor_ref` is empty, and nothing about
authentication behaves differently.

This is a design constraint rather than an accident: if SoulAuth could not run without
Soulseed, then Soulseed would be part of the authentication trust base, and every
SoulAuth deployment would inherit its availability and its threat model.

Nothing else on this site assumes Soulseed. If you are not running it, you can stop
reading here.

## Cooperation happens through contracts

Where the systems do interact, they interact through published contracts — the OIDC
surface, the machine-readable registries — not through shared tables or shared internal
types.

An adapter may **project** a binding into whatever shape a consumer needs. It may not
**create** one: only SoulAuth writes `identity_binding`, and only after the external
subject has actually been verified.

## Architecture relationship is not release capability

This page describes how the systems relate. It says nothing
about which parts of that relationship the current release implements.

## Next

| | |
|---|---|
| Handing an authentication fact to Soulseed | [Soulseed integration](/integrate/soulseed) |
| The identity objects | [Actor identity model](/concepts/actor-identity-model) |
| What authentication does not grant | [Identity vs authority](/spec/identity-vs-authority) |
