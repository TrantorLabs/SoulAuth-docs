# 接入路径

共有四条接入路径，按正在构建的系统类型选择。

| 你在做的 | 用 | 从哪开始 |
|---|---|---|
| 有服务器的 Web 应用 | **BFF**。令牌留在服务器一侧，浏览器只持有 cookie | [浏览器与 BFF](/zh/integrate/browser-and-bff) |
| 没有后端的 SPA 或原生应用 | **公开客户端 + PKCE** | [浏览器与 BFF](/zh/integrate/browser-and-bff#公开客户端加-pkce) |
| 接收令牌的 API | **资源服务器**。只校验，不获取 | [校验令牌](/zh/integrate/verify-tokens) |
| 自动化任务或 AI 主体 | **AI 主体**。持有一把密钥，而不是一个账户 | [AI 原生身份](/zh/concepts/ai-native-identity) |

已经支持 OIDC 的系统（Grafana、Kubernetes 面板、各类现成应用）不需要写任何代码：
[注册一个客户端](/zh/integrate/register-a-client)，把发现 URL 给它，完事。

## 首先要回答的问题

**这个组件能否保管秘密？**

服务器可以，浏览器不行，用户能解包的移动端二进制同样不行。这个答案决定选
`confidential` 还是 `public`，而它决定的是客户端在令牌端点上怎么证明自己：
`confidential` 交出 secret（`client_secret_basic` 或 `client_secret_post`），
`public` 不交，只靠 PKCE。

把服务器登记成 `public`，代价是它换令牌时不带 secret、全靠 PKCE 顶着，
比听起来的损失小。反过来把浏览器应用登记成 `confidential`，
就得把 secret 打进任何人都能读的 bundle 里。

## 四条路径的共同要求

- **PKCE**，只收 `S256` —— public 客户端强制，confidential 客户端默认开启。
  两种都别关。
- **重定向 URI 精确匹配。** 没有通配符，没有前缀。
- **换码前先比 `state`。** 它就是 CSRF 防护。
- **每枚 ID Token 都校验 `iss` 与 `aud`**，并且 `alg` 由你自己钉死。
- **用户键在 `(iss, sub)` 上**，绝不只用 `sub`，也绝不用邮箱。

## AI 主体的不同之处

AI 主体不走 OIDC。它持有一枚 Ed25519 密钥，对一次性挑战签名，
不需要账户，不需要口令，也没有重定向。

## 接下来

| | |
|---|---|
| 先跑起来一个 | [快速上手](/zh/start/quickstart) |
| 注册客户端 | [注册客户端](/zh/integrate/register-a-client) |
