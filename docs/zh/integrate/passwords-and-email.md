# 口令与邮件

四条流程共用同一个机制：一枚通过邮件送达的一次性令牌。注册与验证、密码重置，
以及给社交登录建出来的账号设第一个密码。

这几条都不是 OIDC，是 SoulAuth 自己的端点，由你的前端直接调用。

## 先把邮件通道准备好

这里有两件事，别混在一起看：

- **配置是启动必填。** `SMTP_HOST` 与 `SMTP_FROM` 缺任一，进程起不来。
- **能不能真的发出去，得自己测。** 发信失败不阻断请求，只写一条日志。SMTP 不可达时
  服务照常启动、关掉邮箱验证的注册照常成功、重置请求照常返回 200（那是防枚举的
  设计），只有信永远不到。上线后请实际走一遍注册和重置，确认收得到。

邮箱验证**默认关闭**：`EMAIL_VERIFICATION_ENABLED=false`。关闭时
`POST /api/auth/register` 直接建出一个可用账号，不发任何信。打开之后，
同一个调用照样建账号，但用户必须点过链接才算已验证。

## 注册，然后验证

```bash
curl -X POST "$APP/api/auth/register" \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","username":"you","password":"CorrectHorse42!"}'
```

`EMAIL_VERIFICATION_ENABLED=true` 时会发出一封信，主题 `Verify your email address`，
正文里是一个形如 `{VERIFY_EMAIL_PAGE_URL}?token=…` 的链接。**那个页面要你自己写**，
SoulAuth 不提供。页面从查询串里取出 `token`，再调：

```bash
curl "$APP/api/auth/verify-email/$TOKEN"
```

`200` 表示已验证。令牌对不上返回 `401`。用户把信弄丢了，
`POST /api/auth/resend-verification` 可以重发一封。

令牌不以原样入库：表里存的是 SHA-256 指纹，所以拿到数据库转储的人手里不会
多出一条能用的验证链接。
<Status kind="tested" guard="conformance::b4b" />

## 重置密码

两次调用、两枚不同的令牌，外加一个常让人意外的行为：

```bash
curl -X POST "$APP/api/auth/request-password-reset" \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com"}'
```

**从未注册过的地址同样返回 `200`，且不发信。** 给「查无此人」一个不同的答复，
这个端点就成了查某个地址是不是本站用户的工具。所以你的界面该说
「如果该地址已注册，我们发了一封信」，而不是「请查收邮件」——后面这句只有一半
情况下是真的。

信的主题是 `Reset your password`，链接以 `reset-password/{token}` 结尾。
你的页面拿到这枚令牌之后回传：

```bash
curl -X POST "$APP/api/auth/reset-password" \
  -H 'Content-Type: application/json' \
  -d '{"token":"'"$TOKEN"'","new_password":"BrandNewHorse43!"}'
```

`200`，旧密码当场失效。**令牌是一次性的**，同一枚再提交一次返回 `401`，
哪怕新密码完全合法。

申请端点限流 3 次 / 15 分钟。替用户自动重试的界面会把他自己锁在重置流程外面。

## 社交登录之后设第一个密码

Google 或 GitHub 建出来的账号根本没有密码。`initialize-password` 用来设一个，
而且只对这种账号有效：

```bash
curl -X POST "$APP/api/auth/initialize-password" \
  -H "Authorization: Bearer $SESSION_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"password":"BrandNewHorse43!"}'
```

它要求一个有效会话（没有则 `401`），并且在账号已经有密码时拒绝。这条拒绝很重要：
没有它，任何拿到会话的人都能在不证明自己知道旧密码的情况下设一个新密码 ——
那就是改密，只是换了个端点名。

## 口令规则处处一致

注册、重置、初始化走的是同一套策略：长度下限取 `PASSWORD_MIN_LENGTH`（默认 12），
再加上大写、小写、数字、符号四类中至少占三类。建第一个管理员的引导路径同样执行
它 —— 排在第一个不构成豁免。

不通过时返回 `400`，机器码在 `error` 字段里，
见 [API 约定](/zh/reference/api-conventions)。

| | |
|---|---|
| 端点表 | [认证与会话](/zh/reference/authentication-and-sessions) |
| 加第二重因子 | [多因子认证](/zh/integrate/mfa) |
| Google 与 GitHub | [社交登录](/zh/integrate/social-login) |
