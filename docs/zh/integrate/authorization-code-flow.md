# 授权码流程

以下是完整流程，所用数值均取自一个真实运行的实例。public 客户端强制启用 PKCE，
confidential 客户端默认启用；只要用了 PKCE，就只接受 `S256`。

先要有一个[已注册的客户端](/zh/integrate/register-a-client)。

## 1 · 读发现文档

不要把端点 URL 写死，启动时读取一次即可：

```bash
curl $SOULAUTH/.well-known/openid-configuration
```

同一份文档在 `/api/oidc/.well-known/openid-configuration` 上也有一份，内容完全相同。
RFC 8414 的客户端找的是根路径那个，所以用根路径，把另一个当别名看待。

```json
{
  "issuer": "http://localhost:8400",
  "authorization_endpoint": "http://localhost:8400/api/oidc/authorize",
  "token_endpoint": "http://localhost:8400/api/oidc/token",
  "userinfo_endpoint": "http://localhost:8400/api/oidc/userinfo",
  "jwks_uri": "http://localhost:8400/api/oidc/jwks",
  "end_session_endpoint": "http://localhost:8400/api/oidc/logout",
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["RS256"],
  "scopes_supported": ["openid", "profile", "email"],
  "token_endpoint_auth_methods_supported": ["client_secret_post", "client_secret_basic", "none"],
  "code_challenge_methods_supported": ["S256"]
}
```

`issuer` 必须与你配置的 `APP_URL` 逐字符一致。这里不一致会让每个客户端的发现校验
失败，而报错信息很少说明真正原因。

## 2 · 生成 PKCE 与 state

每次事务都重新生成，绝不复用：

```js
const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)))
const challenge = base64url(
  await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)),
)
const state = base64url(crypto.getRandomValues(new Uint8Array(16)))

// base64url 且不带 padding —— 那个 '=' 很要紧，带着它验不过
function base64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
```

把 `verifier` 与 `state` 保存在服务端（或 `HttpOnly` cookie 中），与该浏览器会话关联。
`verifier` 是秘密，真正上网络的是 `challenge`。

## 3 · 把浏览器送去 /authorize

```
GET /api/oidc/authorize
  ?response_type=code
  &client_id=client_1787796518211crEBwUSf
  &redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback
  &scope=openid%20profile%20email
  &state=<state>
  &nonce=<nonce>
  &code_challenge=<challenge>
  &code_challenge_method=S256
```

`nonce` 的生成方式与 `state` 相同：每次事务新生成、只留在服务端。但两者防的不是
一件事：`state` 挡的是你没发起过的回调，`nonce` 把 ID Token 绑定到**这一次**授权
请求上，于是为更早那次签发的令牌没法被重放进这个会话。SoulAuth 全程带着它：
`authorize` 收下、随授权码存库、再回填成 ID Token 的 `nonce` claim，
[验证令牌](/zh/integrate/verify-tokens)那页要你比对的就是这个 claim。

这个端点校验的是**浏览器会话 cookie**，而不是 bearer 令牌。用户未登录时会被重定向到
登录页，完成后再回到此处。

成功后 SoulAuth 重定向回来：

```
http://localhost:3000/callback?code=Lq7x44VjIgPc7uRcqs0bT4l2piIEUq0K&state=xyz
```

::: warning 先比 `state`，再做别的
如果回传的 `state` 与你存的那个不相等，停。不要去换码。这次比较就是这条流程
**全部**的 CSRF 防护。
:::

## 4 · 换码

```bash
curl -X POST $SOULAUTH/api/oidc/token \
  -u "$CLIENT_ID:$CLIENT_SECRET" \
  -d grant_type=authorization_code \
  -d code=$CODE \
  -d redirect_uri=http://localhost:3000/callback \
  -d code_verifier=$VERIFIER \
  -d client_id=$CLIENT_ID
```

客户端凭证放在 `Authorization: Basic` 头中（`client_secret_basic`）**或**表单体中
（`client_secret_post`），二者只能选其一。两处都送会被拒绝，而不是默默取用其中一个。

```json
{
  "access_token": "bOMx8HOdBWyYw5dqtY0DKY3Z71Se2KlD",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "L3dwm5hTpde66kylboglQnH49cRJgdZ1…",
  "id_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6…",
  "scope": "openid profile email"
}
```

请注意访问令牌的形态：它是一个**不透明字符串**，不是 JWT，不要尝试解码。
`id_token` 才是 JWT。

## 5 · ID Token

上面这次兑换解出来的 payload：

```json
{
  "iss": "http://localhost:8400",
  "sub": "cc661281-9821-485d-a1f7-0c314e37d7f4",
  "aud": "client_1787796557277jsCJNBsU",
  "exp": 1787796858,
  "iat": 1787796558,
  "auth_time": 1787796557,
  "sid": "f9b5683d-f8c5-4c24-b70a-48c189cbef6c",
  "email": "a@e.com",
  "email_verified": true,
  "preferred_username": "admin"
}
```

`sid` 总是存在：取不到会话引用时 SoulAuth 拒绝签名，而不是签发一枚残缺的令牌。

Claims 按授予的 scope 裁剪：没有 `email` scope 就没有 `email`，
没有 `profile` 就没有 `preferred_username`。

[正确地校验它 →](/zh/integrate/verify-tokens)

::: warning `sub` 到底对什么稳定
`sub` 带的是遗留 user 行的键，所以只在那一行的生命周期内
稳定，弱于 OIDC Core 期待的「永不重新分配」。请把记录键在 `(iss, sub)` 上，
并在假定更多之前先读[这条 caveat](/zh/security/standards-and-conformance)。
:::

## 6 · 刷新

```bash
curl -X POST $SOULAUTH/api/oidc/token \
  -u "$CLIENT_ID:$CLIENT_SECRET" \
  -d grant_type=refresh_token -d refresh_token=$REFRESH_TOKEN
```

轮换是强制的：旧刷新令牌被消费，旧访问令牌被吊销。**立刻保存新的那枚。**

::: danger 复用被当作泄露处理
出示一枚已被消费的刷新令牌不算重试。SoulAuth 会删掉**这个用户在这个客户端下的
全部 OIDC 访问令牌与刷新令牌**。其它客户端下的令牌不受影响，用户的 SoulAuth 会话
也不受影响 —— 这是按客户端划定范围的吊销，不是全局登出。

真正的并发竞争走的是另一条路：两次同时刷新中后到的那一次在原子消费上落败，
直接拿到 `invalid_grant`，并不会触发上面那次吊销。触发吊销的是出示一枚**已经被
标记为已消费**的令牌。

最常见的原因是客户端并发发起了两次刷新，然后留下了输的那一枚。请按会话串行化刷新。
:::

刷新时 scope 不能变大：新 scope 必须是原 scope 的子集。

## 常见失败原因

| 现象 | 原因 |
|---|---|
| `invalid_grant: Client secret required for confidential client` | 注册成了 `confidential` 但没送密钥 |
| 客户端库的发现校验失败 | `APP_URL` 与客户端预期的 issuer 不一致，常常就差一个尾斜杠 |
| 一个看起来没问题的码报 `invalid_grant` | 码已用过、已过期，或 `redirect_uri` 与第 3 步差了一个字符 |
| verifier 看着对但验签失败 | base64url 的 padding 没去掉，或 `+` `/` 没换成 `-` `_` |

## 接下来

| | |
|---|---|
| 在你的资源服务器上校验令牌 | [校验令牌](/zh/integrate/verify-tokens) |
| 从浏览器应用里做这件事 | [浏览器与 BFF](/zh/integrate/browser-and-bff) |
