# Specification

This section describes the **architecture** — the object model, the boundaries, and the
rules that hold regardless of which release you are running.

These pages are separate from the rest of the site because they age differently. The
Integrate and Reference pages track what the current release does, and change with it.
These describe the model, and change only when the model does — which so far it has not.

::: warning Architecture responsibility ≠ current supported capability
:::

## The object model

Five objects. They are separate because merging any two of them destroys a property
somebody depends on later.

| Object | Answers | Merging it away costs you |
|---|---|---|
| **ActorIdentity** | Who is this, durably? | The ability to keep attribution stable when everything else about the actor changes |
| **HumanAccount** | How does a person manage their login? | The ability for a non-human actor to exist without fake human attributes |
| **Credential** | What can prove it right now? | The ability to rotate or revoke proof without destroying identity |
| **IdentityBinding** | Which external subject is the same actor? | The ability to tell "same person, different IdP" from "same credential" |
| **Client** | Which application is asking? | The ability to scope what any one integration can see |

<Figure2 locale="en" />

Read [Actor Identity Model](/concepts/actor-identity-model) for how these are used.

## Boundaries this system will not cross

These are not implementation limits that a later release lifts. They are declarations
about what authentication *is*.

- **Authentication grants no authority.** A successful authentication produces a
  statement about *who*. It creates no application permission, no governance standing,
  and no right to act in the world.
  [Identity vs Authority →](/spec/identity-vs-authority)
- **SoulAuth authenticates actors; it does not define them.** In a Soulseed deployment,
  the canonical actor is defined elsewhere. SoulAuth holds a reference, not the
  definition. [Soulseed & Mind OS →](/spec/soulseed-and-mind-os)
- **A `retired` actor's `subject_key` is never reassigned.** An identity can stop
  authenticating, but its identifier is not handed to another actor afterwards —
  otherwise the same subject in an old claim or audit row means two different actors at
  two different times.

## Where authority comes from

A claim on this site is only as good as the layer that can back it. Five layers, and
they are not interchangeable:

| Layer | Can answer | Lives in |
|---|---|---|
| Semantic documentation | what a concept *means* | these pages |
| **Machine contract** | what this release *exposes* | `contracts/*.yaml` in the repo |
| External normative | what a standard *requires* | RFC / OIDC spec text |
| Runtime | what the code *does* | `src/` |
| Evidence | how any of it is *proven* | `tests/` |

The rule between them: **meaning flows down, evidence flows up.** A concept can guide an
implementation. But the sentence "we support X" can only be earned from below — by a
runtime that does it and a test that shows it.

This is why endpoints, configuration keys, permission names and standards claims are not
written by hand on these pages. They live in machine-readable registries that a test
suite checks against the running code, and the site renders them.

## The status words

They are a vocabulary, not adjectives. Five of them form a ladder of strength, and
**none of them implies another**:

<Status kind="implemented" glossary /> <Status kind="supported" glossary /> <Status kind="tested" glossary /> <Status kind="conformant" glossary /> <Status kind="certified" glossary />

One more sits outside that ladder rather than on it:

<Status kind="deprecated" glossary /> still present, scheduled for removal

Click any badge for its exact meaning. Two consequences worth stating outright:

- `implemented` does **not** mean `supported`. Code existing is not a promise to keep it.
- Nothing in SoulAuth is `certified`. Certification comes from a standards organisation's
  formal process; declaring it about yourself does not create it.
