# 管理

## 用户管理

以下端点用于读取与修改**其他主体**的记录，全部受权限管控，每个端点都写明所需的权限。

<!-- table-only: /api/users/** — 账号的增删改查与状态/会员变更。每个调用各自独立，彼此之间没有顺序，方法、所需权限、请求 schema 都在渲染出来的表里。 -->
<ApiTable tag="Administration" />

::: tip `/api/users` 与 `/api/me` 的区别
`/api/users/*` 按 id 作用于别人，需要权限。`/api/me/*` 作用于自己，只需一枚会话。
它们曾经共用同一个前缀，于是产生了 `/api/users/users/:user_id` 这样的路径—— <!-- cite-exempt: 描述已修复的旧路径 -->
<Status kind="tested" guard="conformance::j7" /> 现在会拒绝重复的路径段。
:::

## 角色与权限

角色、权限的管理以及对主体的分配都在 `/api/rbac` 下，已在上表中。
<!-- table-only: /api/rbac/** — 角色与权限的增删改查，加上授予/撤销。每个调用彼此
     独立：建角色、建权限、把权限挂到角色上、把角色挂到主体上，顺序随你。方法、
     所需权限、请求体 schema 都在表里，那就是全部契约。 -->

有两个端点值得单独说明，因为它们开销小且实用：
`/api/rbac/check/permission/:permission_name` 与 `/api/rbac/check/role/:role_name`
回答的是**调用方自己**，只需一枚会话。

## 权限清单

<PermissionTable />

::: warning 一条没有任何 handler 检查的权限，比没有这条权限更糟
它看起来像访问控制，实际什么也没管住。`conformance::j1` 双向断言——
种子里有而没人检查的，或者代码里检查而种子从没建过的，都会让套件变红。
:::

## 安全运维接口

用于查询锁定状态与手工解锁。

<ApiTable tag="Security" />

解锁操作是幂等的：对一个未被锁定的账号执行解锁，返回 `false` 而不是报错。
上锁与解锁都会写审计——只记上锁不记解锁的话，审计里会留下一串永远没有下文的事件。

## 运营看板

<!-- table-only: /api/ops/** — 一个只读聚合，给看板用，没有顺序可言。 -->
<ApiTable tag="Operations" />

::: warning 会员状态不该挂在身份根上
`membership_level` 与 `membership_expiry` 挂在遗留的
`user` 行上，而且总览端点里硬编码了定价档位。商业状态不是身份状态。
:::

## 接下来

| | |
|---|---|
| 审计与报表 | [审计](/zh/reference/audit) |
| 每一个配置项 | [配置](/zh/reference/configuration) |
