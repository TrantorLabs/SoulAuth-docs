# Security model

What SoulAuth protects, how, and where its responsibility ends.

## What it protects

Three things, and nothing beyond them:

1. **Credentials at rest** — nobody who reads the database gains the ability to
   authenticate as anyone.
2. **The authentication decision** — a claim of identity cannot be forged, replayed or
   escalated.
3. **Attribution** — the record of who authenticated, when, and by what method.

Authorization for *your* application is not on that list. A successful authentication
says who; it grants nothing. [Identity vs authority](/spec/identity-vs-authority)

## Credentials at rest

| Secret | How it is stored |
|---|---|
| Passwords | Argon2 |
| MFA backup codes | Argon2, verified one at a time |
| TOTP secrets | ChaCha20-Poly1305, reversible because generating a code needs the secret |
| Client secrets | Argon2 |
| PKCE verifiers | SHA-256, compared in constant time |
| Session tokens | SHA-256 fingerprint |
| OIDC access & refresh tokens | SHA-256 fingerprint |
| Authorization codes | SHA-256 fingerprint |
| Password-reset tokens | SHA-256 fingerprint |
| Email-verification tokens | SHA-256 fingerprint |

<Status kind="tested" guard="conformance::b4b" /> asserts that none of those columns
holds plaintext, and that the hash function is a real one rather than an encoding.

### Where the keys themselves live

The table above is about what the database holds. Three secrets are deliberately **not**
in it, because they are what the database contents are checked against:

| Key | What it does | Where it lives |
|---|---|---|
| `JWT_SECRET` | Signs session tokens | Process environment |
| OIDC signing key | Signs ID tokens | A file, or the process environment |
| `MFA_SECRET_ENCRYPTION_KEY` | Encrypts stored TOTP secrets | Process environment |
| `AUDIT_INTEGRITY_KEY` | Signs audit checkpoints | Process environment |

Keeping the audit key out of the database is what makes a checkpoint mean anything: an
attacker who reaches the database can rewrite rows and recompute the hash chain, but
cannot produce signatures that match. Someone who reaches the process environment can.
That is the boundary these four keys sit on, and it is why the production checklist
treats them as backup material in their own right rather than as part of a database
dump.

### Why two different algorithms

Passwords are low-entropy and human-chosen, so a slow hash is what makes offline
cracking expensive — Argon2.

Bearer tokens are 32-byte random values or signed JWTs. There is nothing to guess, and
they are looked up on **every authenticated request**. A slow hash buys nothing here and
would add tens of milliseconds to every request. Hence Argon2 for passwords and SHA-256
for tokens: the two defend against different attacks.

### The session case is worth stating

`session.token` used to hold the complete signed JWT — byte for byte what the client
holds. One database read was every live session in the system. It now holds a
fingerprint, which serves revocation lookups equally well.

## The authentication decision

**Passwords.** Argon2, with a dummy hash computed at startup so that a login for a
non-existent account takes the same time as one for a real account.

**MFA.** TOTP with a replay high-water mark persisted per user, so the same code cannot
be reused — including across replicas.

**Lockout and rate limiting.** Per account and per IP, both stored in the database and
therefore shared across replicas.

**AI actors.** Ed25519 over a server-issued single-use challenge. Domain-separated and
issuer-bound, so a signature cannot be replayed into another purpose or another
deployment. The challenge is consumed *before* the signature is verified, closing the
concurrent-use window. [AI-native identity](/concepts/ai-native-identity)

**OIDC.** Authorization Code with PKCE — forced on for public clients, on by default for
confidential ones, `S256` only. Refresh tokens rotate;
reusing a consumed one is treated as compromise and revokes the whole token family.

## Boundaries the design will not cross

**The service cannot change its own schema.** SoulAuth issues no DDL; the two SQL files
are imported by an operator. An authentication service that can rewrite its own tables
can rewrite its own constraints.

**Errors do not leak internals.** Database and server errors collapse to a single
`internal_error` code. Non-existent account and wrong password are indistinguishable.
Bootstrap returns the same status for a wrong token as for an already-initialised
instance, so a stale token cannot probe deployment state.

**Public keys only, for agents.** SoulAuth never holds an agent's private key. Unlike a
password hash, the stored value is not even a target for offline attack.

## Next

| | |
|---|---|
| Specific attacks and what stops them | [Threat model](/security/threat-model) |
| Brute force, lockout, MFA in detail | [Authentication protection](/security/authentication-protection) |
| Deploying safely | [Production checklist](/operate/production-checklist) |
