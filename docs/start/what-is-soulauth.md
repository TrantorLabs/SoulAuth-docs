# What SoulAuth is

**Actor-native identity infrastructure for Human and AIActor subjects.**

SoulAuth is open-source identity and authentication infrastructure built by
**TRANTOR LABS, Singapore**. It is implemented in Rust, supports self-hosting and
OpenID Connect, can serve Web, Backend, API and AI / Agent systems on its own, and
integrates natively with SoulseedOS.

Traditional identity systems assume the subject is a Human User; a bot, service account
or agent is a special object hanging off a human account or an application. As AI moves
from a one-shot call towards an Actor that keeps understanding, judging, calling tools
and taking part in real-world action, a more basic question surfaces:

> **Who is being authenticated?**

SoulAuth starts from that question and puts **Actor Identity** at the centre of the
identity model. Human and AIActor can both be first-class subjects; they may hold
different credentials, authentication methods and lifecycles, but they enter the same
Actor-native Identity Contract.

## An Actor-centred identity model

<Figure2 locale="en" />

First-class standing for Human and AIActor does not mean the two share credentials,
capabilities, lifecycles, permissions or legal status. It means each can independently
be a subject that is identifiable, authenticable, able to establish an AuthSession, able
to be expressed through a token, and attributable in the audit trail.

**Actor Identity is the identity root; a credential is how a subject proves itself.**
A human can use a password, MFA or an external identity; an AIActor uses a key-based
credential suited to a machine subject. The paths converge on one Authentication Core
and produce a standardised Authenticated Identity / Claims.

SoulAuth proves who an Actor is. It does not grant that Actor any power to act just
because authentication succeeded. In a Soulseed environment the AIActor itself is
defined by SoulseedAGI; SoulAuth authenticates that subject through a controlled
Canonical Actor Binding, and never defines, modifies or owns its Mind.

## Why Actor-native identity

Large language models already provide increasingly strong generation, understanding,
reasoning and tool use. We prefer to read an LLM as the general compute of the
intelligence era, something like a CPU: it supplies intelligence, but it does not by
itself produce the identity, continuity, accountability and governance order that a
long-lived intelligent system needs.

Once AI stops being a single call and becomes a continuously existing Actor, the system
has to answer, reliably: who is understanding, who is judging, who is acting, and to
whom the result belongs.

That is why SoulAuth is **Actor First**. Before memory, knowledge, judgment, action and
accountability, establish a stable *who*.

So SoulAuth does not keep the traditional `User` as the root of every identity object,
and it is not a `type = ai` column added to a user table. A few boundaries hold
throughout:

```text
Actor Identity ≠ Account
Actor Identity ≠ Credential
Actor Identity ≠ Client

Authentication ≠ Authority
```

Human Account, Identity Binding, Credential and Client each have their own
responsibility, and none of them can stand in for Actor Identity.

The fuller ontology is developed in
[AI-native identity](/concepts/ai-native-identity),
[Actor identity model](/concepts/actor-identity-model) and
[Identity vs authority](/spec/identity-vs-authority).

## Soulseed: AGI infrastructure above the LLM

SoulAuth runs on its own, but it is not an isolated thought project. It is also part of
TRANTOR LABS' answer to the question of AGI infrastructure.

Our reading is this: if the LLM supplies the intelligence, a system built for long-lived
AIActors still needs a Mind above it, continuous operation, governance, applications,
and the order required to enter public reality.

<Figure1 locale="en" />

The infrastructure divides into four layers of responsibility.

**SoulseedAGI — the mind kernel** defines the AIActor and its continuous Mind.

**SoulseedOS — the runtime and governance operating system** keeps that Mind running
continuously, safely and under governance.

**Soulseed Apps — the application layer** turns Mind and operating-system capability
into real applications.

**Public Reality Infrastructure** carries the public facts and trust that must be
verifiable across subjects.

SoulAuth occupies the identity-infrastructure position in this stack. It is not a part of
SoulseedAGI and not an internal module of SoulseedOS. It keeps its own boundary: it can
be composed by SoulseedOS, and it can serve entirely different systems on its own.

> **SoulseedAGI defines the subject and its Mind, SoulAuth authenticates the subject,
> SoulseedOS runs and governs it.**

The full relationship is developed in
[Soulseed and Mind OS](/spec/soulseed-and-mind-os).

## What SoulAuth is responsible for, and what it is not

SoulAuth's boundary ends at a **trustworthy identity fact**.

| Capability | Core responsibility |
|---|---|
| **Actor Identity** | Establish who the currently authenticable digital subject is |
| **Credential** | Manage what an Actor uses to prove itself |
| **Authentication** | Decide whether the presented credential holds |
| **AuthSession** | Maintain an authentication state that has been established |
| **Token & Federation** | Express the identity fact through tokens, OIDC and SSO |
| **Control Plane** | Manage identities, credentials, clients and Auth-local RBAC |
| **Security Protection** | Protect the credential, authentication, session, token and key lifecycles |
| **Audit & Attribution** | Record who became the current identity, and through what process |

SoulAuth does not define a Mind and does not stand in for a higher governance system.
A successful authentication does not by itself produce a mandate, a business permission,
a governance decision, a lease, or the right to act in the real world.

The shortest form of the boundary:

> **Identity answers "who", authority answers "why this Actor may act here and now".**

SoulAuth's Auth-local RBAC governs SoulAuth itself. It is not the final authority engine
for Soulseed as a whole, nor for any other business system.

## SoulAuth architecture

<Figure3 locale="en" />

SoulAuth takes **Actor Identity** as the identity root and separates Human Account,
Identity Binding and Credential. Credentials enter the Authentication Core to establish
a trustworthy identity fact, **AuthSession** carries authentication continuity, and
**Token & Federation** then hands that fact to external consumers as tokens, OIDC, SSO
and claims.

**Control Plane, Security Protection and Audit & Attribution** cut across the whole
identity lifecycle; **Persistence & Infrastructure** underneath provides the data, keys,
external IdPs and adapters that bound the runtime.

SoulAuth can keep a small operational surface by default, a Rust service and a
SurrealDB. A simple physical deployment does not license mixing the domains inside it:

> **One Database ≠ One Domain.**

Identity, Credential, AuthSession, OIDC, Security and Audit still have distinct logical
sources, lifecycles and responsibility boundaries even when one database carries them
all.

The full architecture is developed in
[SoulAuth architecture](/concepts/architecture).

## Two ways to use it

### Standalone

SoulAuth can act as an independent identity provider for conventional Web, Backend, API
and AI / Agent systems, offering complete identity capability through authentication,
AuthSession, OIDC, tokens and claims.

```text
SoulAuth
   ↓
Any Application
```

### Soulseed

Inside Soulseed, SoulAuth supplies SoulseedOS with authenticated Actor identity facts
through a stable adapter. For a canonical AIActor already defined by SoulseedAGI,
SoulAuth can maintain a controlled identity binding, but never reads, modifies or owns
its Mind.

```text
SoulseedAGI
Canonical AIActor
      │
Canonical Actor Binding
      ▼
   SoulAuth
      │
Authenticated Identity
      ▼
  SoulseedOS
```

Both ways use the same SoulAuth core. Soulseed is the native integration direction, not
a prerequisite for using SoulAuth.

## Why Rust

SoulAuth is written in Rust because identity infrastructure needs explicit data
ownership, strong type boundaries, memory safety and predictable system behaviour.

We want Identity, Credential, AuthSession and the other security boundaries to exist not
only in the architecture documents but, as far as possible, as constraints the code
itself finds hard to violate.

## Security and trust

Security and audit are not peripheral capabilities added after SoulAuth is deployed.
They are part of the identity infrastructure itself.

SoulAuth treats credentials, authentication, AuthSession, tokens, keys, external IdPs
and audit as explicit security boundaries, and builds continuous protection around MFA,
lockout, replay protection, token reuse detection, key lifecycle and a tamper-evident
audit log.

The fuller security model is defined by these documents:

**[Security model](/security/security-model)** defines the assets, trust boundaries and
security assumptions.

**[Threat model](/security/threat-model)** defines the main threats: credential theft,
token theft, replay, a malicious client, a compromised database.

**[Authentication protection](/security/authentication-protection)** defines MFA,
lockout, rate limiting, replay protection and key lifecycle.

**[Standards and conformance](/security/standards-and-conformance)** defines protocol
conformance and Actor-native architecture conformance.

The process for reporting a security problem is defined in `SECURITY.md`.

## Getting started

Coming to SoulAuth for the first time, this is the order to take it in:

**This page** decides whether SoulAuth fits your system.

**[Quickstart](/start/quickstart)** brings up a local instance and completes a first
authentication.

**[Integration path](/start/integration-path)** picks the right route among Web
application, Backend / API, OIDC client, AI / Agent system and SoulseedOS.

Once the integration is done, run the
[production checklist](/operate/production-checklist) before going live.

## About SoulAuth

The goal is not to lock identity capability inside one application, one model or one
ecosystem, but to provide identity infrastructure that is **independently deployable,
built on open standards, and composed with other systems through stable contracts**.

It can enter Soulseed or stand alone; it can serve conventional applications or
AI-native systems; it can be used as a standard OIDC provider or become the identity
layer of a larger Actor-based architecture. A consumer never needs to read SoulAuth's
private database, and should not have to depend on its internals to use it correctly.

SoulAuth is built by **TRANTOR LABS, Singapore**.

TRANTOR LABS is not focused on a single AI product but on a more basic question of the
AGI era: once intelligence becomes a general capability, how should subject, judgment,
identity, accountability, governance and public reality be organised into infrastructure
that actually runs.

> **Philosophy defines the question; engineering verifies the answer.**
