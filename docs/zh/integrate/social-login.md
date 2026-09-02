# 社交登录

Google 与 GitHub。两个都是可选的：凭据留空，SoulAuth 照常运行，
那几条路由返回错误，而不是在启动时直接失败。
<Status kind="tested" guard="integration.sh" />

## 配置

```bash
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# 配了任一 provider 就必填，否则拒绝启动。
# 它是回调的前缀：SoulAuth 会把 provider 名字接在后面。
OAUTH_REDIRECT_URL=https://auth.example.com/api/auth/callback
```

`OAUTH_REDIRECT_URL` 的判据与端点覆盖相同：必须是绝对的 https URL，
明文 http 只允许精确指向环回地址。

SoulAuth 会把 provider 名字接在后面，所以在 provider 那边登记的回调地址是
`${OAUTH_REDIRECT_URL}/google` 与 `${OAUTH_REDIRECT_URL}/github`。按上面这个值，
它们正好落在本服务真正提供的两条路由上：`/api/auth/callback/google` 与
`/api/auth/callback/github`。必须与 provider 侧逐字符一致。

## 流程

把浏览器送到 `GET /api/auth/login/google`（或 `GET /api/auth/login/github`，
往下两者行为完全一致）。SoulAuth 重定向到 provider，
同时下发一个 `soulauth_oauth_state` cookie：带 `HttpOnly`，里面的 nonce
与重定向 URL 里的 `state` 参数是绑定的。

provider 把用户送回 `GET /api/auth/callback/google?code=…&state=…`。
SoulAuth 在做任何别的事之前，先拿 `state` 与 cookie 对一遍。

**两半缺一不可。** 带着合法 `state` 但没有 cookie 的回调返回 `400`，
cookie 里 nonce 对不上的同样返回 `400`。这一对就是全部的 CSRF 防御：
能诱使受害者浏览器访问某个回调 URL 的攻击者，没法同时把那个 cookie 也设上。
<Status kind="tested" guard="integration.sh" />

成功时返回 `303`，重定向目标落在你的 `APP_URL` 之内，绝不会是请求里带来的任意
地址。登录入口只接受自己签发的 state，所以没有 `return_to` 之类的口子可钻。

## 账号会发生什么

provider 回调之后有三种结果，取决于它返回什么：

**新邮箱。** 建一个账号，并与 provider 的 subject 建立关联。再次登录复用这两者，
不会重复建号，也不会重复建关联。

**provider 侧邮箱未验证。** 返回 `403`，且什么都不写：不建账号，不建关联。
放行的话，任何人只要在 provider 侧填一个不属于自己的未验证地址，
就能顶掉对应的本地账号。
<Status kind="tested" guard="integration.sh" />

**邮箱撞上已有的本地账号。** 把 provider 身份关联到那个账号上。
结果是一个账号两条入口，不是两个账号。

## 用「一对」做键，不要只用 subject

关联按 `(provider, provider_subject)` 成对匹配。只按 subject 匹配的话，
数字 id 为 `4001` 的 GitHub 用户，和 `sub` 为字符串 `"4001"` 的 Google 账号
会变成同一个人。这条规则同样适用于你自己的应用：把用户键在 `(iss, sub)` 上，
永远不要只用 `sub`。

## 回调之后

账号建好了，但没有密码。产品上需要的话，那是 `initialize-password`，
见[口令与邮件](/zh/integrate/passwords-and-email)。

| | |
|---|---|
| 端点表 | [认证与会话](/zh/reference/authentication-and-sessions) |
| 绑定为什么是独立对象 | [Actor 身份模型](/zh/concepts/actor-identity-model) |
| 这防的是什么攻击 | [威胁模型](/zh/security/threat-model) |
