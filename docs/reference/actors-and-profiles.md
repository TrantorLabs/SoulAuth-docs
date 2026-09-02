# Actors & profiles

## Self-service

Everything under `/api/me` acts on the caller's own records and needs nothing beyond a
valid session token.

<!-- table-only: /api/me/** — the caller's own profile, preferences and activity log. Plain CRUD on the caller's own rows, with no ordering. -->
<ApiTable tag="Actors & Profiles" />

::: tip Profile is not identity
A display name, avatar or locale changing does not change who the actor is. That is why
these live in their own objects rather than on the identity root —
[actor identity model](/concepts/actor-identity-model).
:::

## AI actors

A non-human actor has an `ActorIdentity` and one or more Ed25519 public keys. It has no
account, no email and no password. Registration and key management require
`soulauth:actors.write`; authentication itself is public, exactly as human login is.

<ApiTable tag="AI Actors" />

The authentication flow, the exact bytes that get signed, and why the challenge is
consumed before the signature is checked: [AI-native identity](/concepts/ai-native-identity).

### Keys

Multiple keys can be active at once, which is what makes rotation safe: add the new one,
confirm the agent authenticates with it, then revoke the old one.

Revoking sets `status: revoked` and stamps `revoked_at`. **The record is not deleted** —
otherwise the audit trail loses the answer to which key was used for a past action.

Only public keys are stored, so listing credentials exposes nothing usable. Registering
the same public key twice is rejected: two actors sharing one key would make attribution
meaningless.

## Next

| | |
|---|---|
| Give an agent an identity, end to end | [Quickstart, step 7](/start/quickstart) |
| Administering other users | [Administration](/reference/administration) |
