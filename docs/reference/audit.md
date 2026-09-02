# Audit

## What gets recorded

Authentication events — successful and failed logins, OAuth logins, logout, password
reset, MFA failure, permission denial, rate-limit violation, account lock and unlock.

Two rules the writer holds to:

- **It never blocks the request.** `record` puts the event on a queue and returns; a
  dedicated writer drains it, retries transient database errors, and the queue is
  flushed during shutdown. The user's operation never waits on the audit write, and a
  normal restart does not cost you queued events.
- **It never records credentials.** Only the action, category, status, IP, user agent
  and a small set of non-sensitive context fields.
- **It is tamper-evident.** Each row is chained to the previous one by hash, and the
  chain head is signed hourly with a key held outside the database. `GET
  /api/audit/integrity` re-derives the chain and verifies the checkpoints, reporting the
  first break if there is one.
  <Status kind="tested" guard="conformance::f4" />

Rows written before an upgrade to a chained build have no chain of their own. The report
counts them separately as `unchained` rather than treating them as a break — an upgrade
should not accuse your existing history of having been tampered with. Only rows written
from then on are covered.

## Endpoints

<!-- table-only: /api/audit/** — read-only reports over a time window. They take the same shape of query parameter and are independent of one another. -->
<ApiTable tag="Audit" />

Dashboard and reporting queries accept a time window. Requests are clamped server-side,
so an absurd `days` value returns a bounded window instead of attempting to scan
everything.

## Next

| | |
|---|---|
| Who can read audit data | [Administration](/reference/administration) |
| What the security model does and does not cover | [Threat model](/security/threat-model) |
