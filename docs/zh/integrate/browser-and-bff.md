# 浏览器与 BFF

浏览器保管不住秘密，所以下面两种架构的区别在于令牌存在哪，而不在 OIDC 流程本身。

## 两种架构，二选一

| | Backend for Frontend | 公开客户端 + PKCE |
|---|---|---|
| 客户端类型 | `confidential` | `public` |
| 令牌放在哪 | 你的服务器 | 浏览器 |
| 浏览器持有 | 一个会话 cookie | 令牌本身 |
| 需要服务器 | 是 | 否 |
| XSS 暴露面 | 会话 cookie（若非 `HttpOnly`） | **全部令牌** |

**有服务器就选 BFF。** 这不是因为另一种做法有问题：公开客户端加 PKCE 是正当且
有规范依据的模式。真正的理由是，令牌托管在浏览器里意味着任何 XSS 都会变成令牌失窃，
而自己的代码写得再小心，也挡不住一个被投毒的依赖。

## BFF 模式

浏览器只与你的服务器通信，服务器再与 SoulAuth 通信。令牌始终不进入 JavaScript。

```
浏览器 ──cookie──▶ 你的 BFF ──令牌──▶ SoulAuth
```

1. 你服务器上的 `GET /login` 生成 `state` 与 PKCE 对，与浏览器会话关联存好，
   然后重定向到 `/api/oidc/authorize`。
2. 你服务器上的 `GET /callback` 比对 `state`，换码
   （[第 4 步](/zh/integrate/authorization-code-flow)），把令牌存在**服务端**。
3. 你的服务器设自己的会话 cookie：

```js
res.cookie('session', sessionId, {
  httpOnly: true,   // JavaScript 读不到
  secure: true,     // 只走 HTTPS
  sameSite: 'lax',  // 能挺过 OIDC 回跳；'strict' 不行
  path: '/',
})
```

用 `sameSite: 'lax'`。`'strict'` 会在从身份提供方跨站回跳时丢掉 cookie，
症状是一个登录死循环：本地能跑通，生产环境失败。

::: warning BFF 不是令牌代理
不要加一个把访问令牌交给浏览器的端点，也不要把浏览器传来的任意请求带着令牌转发上游。
这两件事中的任何一件，都会把这个模式本来要消除的暴露面原样还回来。

暴露你自己的端点。让 BFF 决定每个端点被允许做什么。
:::

## 公开客户端加 PKCE

没有服务器，也就没有密钥可保管。注册时使用 `"client_type": "public"`，
令牌端点不携带 `client_secret`。

流程其余部分完全相同。这里靠 PKCE 顶着安全，而服务端对 `public` 客户端强制开启它：
注册时传 `require_pkce: false` 也不作数。

存储方式，从「相对可接受」到「最糟」：

- **只放内存。** 刷新页面就没了；用户靠身份提供方的会话重新认证，
  这个过程通常他自己都察觉不到。
- **`sessionStorage`。** 能挺过刷新，作用域限于这个标签页。页面上任何脚本都能读。
- **`localStorage`。** 什么都能挺过，包括攻击者的脚本。避免。

::: danger 在这里 XSS 等于完全失守
令牌放在浏览器里时，没有任何缓解措施能挺过脚本执行。严格的 CSP 提高了门槛，
但不消除暴露面。这是一次需要主动权衡的取舍，而不该是一个默认结果。
:::

## CORS 配置

`CORS_ALLOWED_ORIGINS` 是显式白名单，默认为空，且不接受通配符。
通配符加上凭证，意味着任何站点都能带着用户的 `Authorization` 头调用 SoulAuth。

```bash
CORS_ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com
```

BFF 根本不需要它：浏览器只和你自己的源说话。

## 登出处理

登出包含两件事，只做其中一件用户会察觉到：

```js
// 1. 结束你自己的会话
res.clearCookie('session')

// 2. 结束 SoulAuth 的会话
res.redirect(`${SOULAUTH}/api/oidc/logout` +
  `?id_token_hint=${idToken}&post_logout_redirect_uri=${encodeURIComponent(RETURN_URL)}`)
```

漏掉第二步，下一次登录会静默复用仍然有效的身份提供方会话：用户点「登出」，
再点「登录」，没有被问任何问题就回到了同一个账号，看上去就像登出没有生效。

`post_logout_redirect_uris` 必须登记在客户端上，与 `redirect_uris` 同样是精确匹配。

## 接下来

| | |
|---|---|
| 流程本身 | [授权码流程](/zh/integrate/authorization-code-flow) |
| 校验你收到的东西 | [校验令牌](/zh/integrate/verify-tokens) |
