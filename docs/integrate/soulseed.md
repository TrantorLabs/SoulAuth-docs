# Soulseed integration

Optional. SoulAuth runs standalone by default, and most deployments never touch this
page.

## What the integration is

In a Soulseed deployment, the canonical actor is defined by **SoulseedAGI**, not here.
SoulAuth authenticates that actor and holds a reference to it —
`actor_identity.canonical_actor_ref`.

```
SoulseedAGI          SoulAuth              SoulseedOS
defines the actor    authenticates it      operates and governs
```

The direction matters and does not reverse: holding a reference gives SoulAuth no
ability to define, modify or reason about a Mind, a SubjectIntent or a memory. It
authenticates; it does not decide who someone is.

## What crosses the boundary

Only an authentication fact: *this request is that actor, proven at this time, by this
method.*

Not crossing it:

- **Authority.** A successful authentication grants no Soulseed governance standing.
  [Identity vs authority](/spec/identity-vs-authority)
- **Definition.** `canonical_actor_ref` is a pointer. SoulAuth never writes the far side.
- **Profile data.** What Soulseed knows about an actor is Soulseed's.

## `canonical_actor_ref` is a controlled claim

It is **not** exposed to third-party OIDC clients by default. A reference into another
system's identity domain is a controlled integration claim, not a public profile field —
publishing it by default would leak the topology of a deployment to every relying party.

## Standalone is not degraded

An actor with no Soulseed binding is a complete, valid SoulAuth actor. Standalone mode
is the default, not a fallback: `identity_source` is `local` and
`canonical_actor_ref` is empty.

Nothing on this site assumes Soulseed. If you are not running it, you can stop here.

## Next

| | |
|---|---|
| The ownership boundary in full | [Soulseed & Mind OS](/spec/soulseed-and-mind-os) |
| The identity objects | [Actor identity model](/concepts/actor-identity-model) |
