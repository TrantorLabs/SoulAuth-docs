# Administration

## Users

Reading and modifying **other** actors' records. All of it is permission-gated; each
endpoint names the permission it requires.

<!-- table-only: /api/users/** — account CRUD and status/membership changes. Each call stands alone: no ordering between them, and the rendered table carries the method, the required permission and the request schema. -->
<ApiTable tag="Administration" />

::: tip `/api/users` vs `/api/me`
`/api/users/*` acts on somebody else by id and requires a permission. `/api/me/*` acts on
yourself and needs only a session. They used to share a prefix, which produced paths like
`/api/users/users/:user_id` <!-- cite-exempt: 描述已修复的旧路径 --> —
<Status kind="tested" guard="conformance::j7" /> now rejects duplicated path segments.
:::

## Roles & permissions

Role and permission management, plus assignment to actors, live under `/api/rbac` and
appear in the table above.
<!-- table-only: /api/rbac/** — role and permission CRUD plus grant/revoke. Every call is
     independent: create a role, create a permission, attach one to the other, attach the
     role to an actor, in whatever order suits you. The table carries the method, the
     required permission and the body schema, which is the whole contract. -->

Two endpoints are worth calling out because they are cheap and useful in a client:
`/api/rbac/check/permission/:permission_name` and `/api/rbac/check/role/:role_name` answer for the
**calling** actor and need only a session.

## The permission vocabulary

<PermissionTable />

::: warning A permission that no handler checks is worse than no permission
It looks like access control while granting nothing. `conformance::j1` asserts in both
directions — a permission in the seed that no handler checks, or a handler checking a
permission that the seed never creates, both turn the suite red.
:::

## Security operations

Lockout inspection and manual unlock.

<ApiTable tag="Security" />

Unlocking is idempotent: unlocking an account that is not locked returns `false` rather
than erroring. Both lock and unlock are audited — recording only lockouts would leave a
trail of events that never resolve.

## Operations

<!-- table-only: /api/ops/** — a single read-only aggregate for dashboards. Nothing to sequence. -->
<ApiTable tag="Operations" />

::: warning Membership does not belong on the identity root
`membership_level` and `membership_expiry` hang off the legacy
`user` row, and the overview endpoint hard-codes pricing tiers. Commercial state is not
identity state.
:::

## Next

| | |
|---|---|
| Audit and reporting | [Audit](/reference/audit) |
| Every configuration key | [Configuration](/reference/configuration) |
