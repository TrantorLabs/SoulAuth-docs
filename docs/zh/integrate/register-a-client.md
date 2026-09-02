# 注册客户端

每一次 OIDC 集成都从这一步开始。注册客户端需要 `soulauth:oidc_clients.write` 权限，
默认只有 `admin` 角色持有。

```bash
curl -X POST $SOULAUTH/api/oidc/clients \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "client_name": "Demo App",
    "client_type": "confidential",
    "redirect_uris": ["http://localhost:3000/callback"],
    "allowed_grant_types": ["authorization_code", "refresh_token"],
    "allowed_scopes": ["openid", "profile", "email"]
  }'
```

```json
{
  "client_id": "client_1787796518211crEBwUSf",
  "client_secret": "OJFawoLENnseRQKvyJBOjAeOtW881Tinm2div3XnMkLhpSz2sN29RSw1ebKG13OM",
  "client_name": "Demo App",
  "client_type": "confidential",
  "redirect_uris": ["http://localhost:3000/callback"],
  "post_logout_redirect_uris": [],
  "allowed_scopes": ["openid", "profile", "email"],
  "allowed_grant_types": ["authorization_code", "refresh_token"],
  "allowed_response_types": ["code"],
  "require_pkce": true,
  "access_token_lifetime": 3600,
  "refresh_token_lifetime": 86400,
  "id_token_lifetime": 300,
  "is_active": true,
  "created_at": 1787796518,
  "updated_at": 1787796518
}
```

::: danger 这是你唯一一次看到密钥
`client_secret` 以哈希存储，只在这里返回一次。之后列出客户端会返回**除密钥外**的
一切：接口手上只有哈希，没有可读的原文可还。

丢了？`POST /api/oidc/clients/{client_id}/regenerate-secret` 签发一枚新的并作废旧的。
:::

## 选 confidential 还是 public

这是唯一真正需要决定的事：

| | 什么时候用 | 后果 |
|---|---|---|
| `confidential` | 你的服务器能保管密钥——后端、BFF、服务端渲染应用 | 令牌端点要求密钥。浏览器侧应用**不能**是它，因为把密钥发给浏览器就等于公开它。 |
| `public` | 原生应用、没有后端的 SPA | 没有密钥。PKCE 是唯一阻止授权码被拦截利用的东西，所以它不是可选项。 |

`public` 客户端的 `require_pkce` 被**强制为 true**，传 `false` 服务端也不认，
因为 PKCE 是这类客户端与授权码之间唯一的绑定。`confidential` 客户端默认开启，
但**可以**关掉：client_secret 是第二重绑定，这个选择因此才存在。

只有在你说得出理由的时候才关。「反正有 secret」不算理由。

只要用了 PKCE 就只接受 `S256`，`plain` 在下发阶段即被拒绝。`plain` 挡不住被拦截的
授权码被兑换，所以不提供。

## 重定向 URI 的匹配规则

重定向 URI 按**精确匹配**处理：整串相等，不支持通配符，也不支持前缀匹配。
请把用到的每一个环境都登记进来：

```json
"redirect_uris": [
  "http://localhost:3000/callback",
  "https://app.example.com/callback"
]
```

这是客户端配置中安全相关性最强的一个字段：能修改它的人就能把一枚有效授权码重定向
给自己。因此修改客户端需要 `.write` 权限，而这条权限的授予范围很窄。

## 客户端的日常管理

```bash
# 列出（永不返回密钥）
curl $SOULAUTH/api/oidc/clients -H "Authorization: Bearer $ADMIN_TOKEN"

# 更新 —— PUT 复用创建时的请求体，client_name、client_type、redirect_uris 都是必填。
# 要发完整对象，不能只发改动的那个字段。
curl -X PUT $SOULAUTH/api/oidc/clients/$CLIENT_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H 'Content-Type: application/json' \
  -d '{"client_name":"My App","client_type":"confidential",
       "redirect_uris":["https://app.example.com/callback"]}'

# 禁用——记录保留，所以已签发给它的令牌仍然可归因
curl -X DELETE $SOULAUTH/api/oidc/clients/$CLIENT_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

完整端点清单：[OIDC 与客户端](/zh/reference/oidc-and-clients)。

## 接下来

[跑通授权码流程 →](/zh/integrate/authorization-code-flow)
