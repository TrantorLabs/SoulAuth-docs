# API 约定

以下内容在所有端点上一致成立，后面几页的参考表不再重复它们。

## 基础地址

一切相对于 `APP_URL`。它是公开地址，同时也是 OIDC issuer，两者必须逐字符一致。

## 认证方式

共有三种机制，彼此**不可互换**。混淆它们是最常见的接入错误：

| 机制 | 怎么带 | 谁签发 | 谁用 |
|---|---|---|---|
| 会话令牌 | `Authorization: Bearer` | `POST /api/auth/login`、`POST /api/actors/authenticate` | 所有 `/api/*` 业务端点 |
| OIDC 访问令牌 | `Authorization: Bearer` | `POST /api/oidc/token` | **仅** `GET /api/oidc/userinfo` |
| 浏览器会话 | `soulauth_session` cookie | 登录流程 | `GET /api/oidc/authorize` |

两条后果值得说明：

- **会话令牌不是 OIDC 访问令牌。** 它们都是同一个头上的 bearer 令牌，
  它们都在 `Authorization: Bearer` 里，所以送错那个会得到一个看起来像凭证过期的 401。
- **Cookie 不认证 API。** 它服务浏览器与 OIDC 流程。只带 cookie 的 API 调用是未认证的。

下面每个端点都写明它收哪一种，或者它是公开的。

## 错误响应

全站只有一种错误形状：

```json
{
  "error": "missing_permission",
  "message": "Missing permission: soulauth:roles.read",
  "required_permission": "soulauth:roles.read"
}
```

- `error` 是**稳定的机器可读码**。按它分支。
- `message` 给人看。措辞在任何一个版本都可能改，它不进契约。
- 个别错误带有已文档化的补充字段：`missing_permission` 带 `required_permission`，
  `account_locked` 带 `locked_until_seconds`。这些字段是附加的。

<Status kind="tested" guard="conformance::j6" /> 守住「没有任何端点返回第二种形状」，
其中也包括它取代的那个真实缺口：曾经有一批端点用裸状态码作答，**响应体为空**，
调用方既拿不到码，也拿不到说明。

### 唯一的例外

OIDC 协议端点用 RFC 6749 §5.2 规定的形状：

```json
{ "error": "invalid_grant", "error_description": "Refresh token already used" }
```

这不是需要修正的不一致，规范就是这么要求的。

### 错误响应码

完整枚举，从契约的 `components.schemas.Error` 渲染而来。码是 snake_case，
而且绝不由字符串格式化生成，所以可以放心逐字比较。

<ErrorTable />

## 状态码

| | |
|---|---|
| `200` | 成功 |
| `204` | 成功，无响应体（角色与权限的分配） |
| `400` | 请求格式错误或校验不通过 |
| `401` | 凭证缺失、格式错误或被拒 |
| `403` | 已认证但无权限，或者主体类型不对 |
| `404` | 未找到；在「存在性本身敏感」的地方也用它代替 `403` |
| `409` | 冲突（邮箱或用户名已被占用） |
| `429` | 被限流，或账号/IP 处于锁定中 |
| `501` | 路由存在，但本部署没有配置这项功能 |
| `503` | 依赖短暂不可用，请求**没有被处理** |

这里给 `501` 而不是 `404`：在一个没有配置 OAuth 凭证的部署上，联邦登录端点并不是「未找到」——
路由存在，语义明确，只是运维还没填配置。返回 `404` 会让人去查错误的方向。

`503` 对重试逻辑很关键：它表示这个请求根本没有被处理，因此重试是安全的。
这和 `429` 正相反 —— 那是被有意拒绝的，立刻重试只会更糟。两者要分开分支。

## 记录标识符

记录标识符形如 `table:key`，例如 `actor_identity:lnhl…`。路径中带前缀与不带前缀
两种写法都接受：URL 里的冒号会被很多客户端库转义，而两种写法含义相同。

::: warning Resource ID 不是 subject
`ActorIdentity` 既有 record ID 也有 `subject_key`。它们是两个命名空间。
不要把其中一个当另一个用，也不要假定实现让它们相等。
:::

## 分页

支持分页的列表端点接受 `limit` 与 `offset`。响应是裸数组或裸对象，
没有信封，也没有 `data` 包装。

## 限流与锁定

认证端点同时受按 IP 的限流与按账号的锁定约束。两者都存在数据库里，
所以是跨副本共享的，而不是每个进程各算各的。超限返回 `429`；
锁定的响应带 `locked_until_seconds`。

## 接下来

| | |
|---|---|
| 认证端点 | [认证与会话](/zh/reference/authentication-and-sessions) |
| 每一个配置项 | [配置](/zh/reference/configuration) |
| 到底哪些标准适用 | [规范与符合性](/zh/security/standards-and-conformance) |
