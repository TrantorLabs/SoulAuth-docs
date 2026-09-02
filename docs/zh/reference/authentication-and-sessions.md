# 认证与会话

## 会话的工作方式

会话令牌是一枚签名 JWT。数据库中只保存它的 **SHA-256 指纹**，从不保存令牌本身。
指纹足够用来做吊销查询，而读到这一行的人拿不到可用的会话令牌。
<Status kind="tested" guard="conformance::b4b" />

会话状态是**派生的，不是存储的**。没有状态列：

| 状态 | 怎么表达 |
|---|---|
| active | `expires_at` 在未来且记录存在 |
| expired | `expires_at` 已过 |
| revoked | 记录已删除 |

因此不存在第二个会漂移的事实源，但也没有枚举可供读取。API 关于会话的任何陈述
都是读取时计算出来的。

系统允许多个并发会话，且没有数量上限。`GET /api/auth/sessions` 列出调用方自己的
会话，`POST /api/auth/logout-all` 一次性吊销全部 —— 改完密码之后做「退出所有设备」
用的就是它。

还有第二个入口 `POST /api/auth/admin/login`，收同样的凭据，但拒绝任何非管理员账号。
它的用处是让管理后台在登录界面上就把普通用户挡住，而不是放进去再挡；它不额外授予
任何东西，管理员走普通的 `POST /api/auth/login` 拿到的是同一个会话。

::: warning 跨副本的吊销不是瞬时的
每个实例会缓存已解析的会话。登出、改密、停用在处理它的
那个实例上立刻生效；其它实例在 `AUTH_SESSION_CACHE_TTL_SECONDS` 之内观察到。
单实例部署不受影响。
:::

## 认证端点

<ApiTable tag="Authentication" />

## 第一个管理员

全新实例没有任何账号。它在启动时打印一枚一次性引导令牌；用它创建第一个管理员，
全程不碰数据库。

<ApiTable tag="Bootstrap" />

一旦存在管理员，这道门**永久关闭**。此后所有拒绝——令牌错、关门后拿对的令牌、
关门后拿错的令牌——都返回**同一个状态码与同一份响应体**，因此一枚失效令牌无法
用来探测某个实例是否已初始化。<Status kind="tested" guard="conformance::h12" />
这条路径不放宽口令策略。

## 健康检查

<ApiTable tag="Health" />

## 二次验证（MFA）

采用 TOTP 加备用码。第一步登录返回的是一枚短期挑战令牌而不是会话，第二步用它兑换会话。

TOTP 密钥用 `MFA_SECRET_ENCRYPTION_KEY` 加密落库。备用码是 Argon2 哈希，逐条校验。

::: warning 开发期的回落路径
未设置 `MFA_SECRET_ENCRYPTION_KEY` 时，密钥从 `JWT_SECRET`
派生并打印告警。此后轮换 `JWT_SECRET` 会让所有已存的 TOTP 密钥无法解密。

这条路径只为环回地址上的开发存在：`APP_URL` 非环回时，缺专用密钥进程**拒绝启动**。
见[生产清单](/zh/operate/production-checklist)。
:::

## 联邦登录

配置之后支持 Google 与 GitHub。绑定记录的是「某个外部主体与这个主体是同一个」。
它不是凭证，而且匹配永远按 `(provider, provider_subject)` 成对进行。

未配置凭证时这些端点返回 `501` 而不是 `404`，理由见
[API 约定](/zh/reference/api-conventions#状态码)。

## 接下来

| | |
|---|---|
| AI 主体的认证方式不同 | [主体与档案](/zh/reference/actors-and-profiles) |
| OIDC 的令牌端点 | [OIDC 与客户端](/zh/reference/oidc-and-clients) |
| 会话令牌**不**授予什么 | [身份与权限的边界](/zh/spec/identity-vs-authority) |
