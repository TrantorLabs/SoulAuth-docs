# OIDC 与客户端

## 支持范围

授权码流程 + PKCE（只收 `S256`，public 客户端强制）、RS256 ID Token、发现文档、JWKS，
以及带复用检测的刷新令牌轮换。

implicit 与 hybrid 流程未实现。client credentials、device code、
resource owner password credentials 也都没有。

发现文档里列的都是已经实现的能力，没有前瞻性条目，
由 <Status kind="tested" guard="conformance::h10" /> 守住。

## OIDC 协议端点

<ApiTable tag="OIDC" />

`/.well-known/openid-configuration` 同时挂在站点根路径**和** `/api/oidc/` 前缀下。
同一个处理器、两个路径，因为客户端库对它该在哪儿的预期不一致。

## 客户端管理

<ApiTable tag="OIDC Clients" />

客户端注册表是整个 SSO 面的信任根：能改 `redirect_uris` 就能劫持任意登录。
因此单列 `soulauth:oidc_clients.read` / `.write` 两条权限，默认只授予 `admin`。

客户端密钥以哈希存储。`regenerate-secret` **只返回一次**新密钥，此后读不回来。

删除客户端是禁用而不是删记录，这样已经签发给它的令牌仍然可归因。

## 刷新令牌的轮换

轮换是强制的。每次刷新都会消费掉旧令牌并签发新的，同时吊销旧的访问令牌。

出示一枚已被消费的刷新令牌，会被当作**泄露证据**而不是重试：
这个用户在这个客户端下的**全部 OIDC 访问令牌与刷新令牌都会被删除**。
其它客户端、以及用户的 SoulAuth 会话都不受影响。

刷新过程不允许提权，新 scope 必须是原 scope 的子集。

## `sub` 到底对什么稳定

::: warning 弱于模型所描述的
`sub` 目前带的是遗留 `user` 行的键，不是身份根。
因此它只在那一行的生命周期内稳定，**弱于** OIDC Core 期待的「永不重新分配」。

如果你需要一个能挺过账号重建的 subject 标识，`sub` 今天给不了你。
这一条作为具名 caveat 记在[规范与符合性](/zh/security/standards-and-conformance)里。
:::

两件 `sub` 明确不是的事：

- **不是 `ActorIdentity` 的 resource ID。** 不同命名空间。
- **不是邮箱地址。** 邮箱会变，subject 不能变。

一个 OIDC subject 只在它的 issuer 范围内有意义，所以标识用户要用 `(iss, sub)` 这一对。
单拿 `sub` 跨 issuer 比对，两个不同 provider 的用户只要 `sub` 撞上就会解析成同一个人。

## 令牌校验

对着 JWKS 在本地校验 ID Token。不要指望 introspection：
`/introspect`（RFC 7662）**未实现**，`/revoke`（RFC 7009）也没有。
SoulAuth 有内部吊销语义，但那不是标准化的 wire 协议。

完整说明：[校验令牌](/zh/integrate/verify-tokens)。

## 接下来

| | |
|---|---|
| 注册客户端并跑通流程 | [授权码流程](/zh/integrate/authorization-code-flow) |
| 究竟哪些 RFC 适用 | [规范与符合性](/zh/security/standards-and-conformance) |
