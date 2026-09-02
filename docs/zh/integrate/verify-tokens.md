# 校验令牌

资源服务器收到一枚令牌之后，应当校验什么，又能够校验什么？

## 先分清收到的是哪一种令牌

SoulAuth 签发两样东西，它们都以 `Authorization: Bearer` 到达，而校验方式完全不同：

| | 长什么样 | 怎么校验 |
|---|---|---|
| **ID Token** | JWT，三段点分 | 对着 JWKS 在本地验 RS256 签名 |
| **OIDC 访问令牌** | 不透明随机串 | 调 `/api/oidc/userinfo` |
| **会话令牌** | JWT（内部格式） | 不由调用方校验。它属于 SoulAuth 自身，不在 OIDC 契约内 |

不要试图解码访问令牌。它不是 JWT，里面什么也没有。

## 校验 ID Token

拉取一次签名密钥并缓存：

```bash
curl $SOULAUTH/api/oidc/jwks
```

```json
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "alg": "RS256",
      "kid": "NQ4bDUKBAh7-vNWDafyrzg",
      "n": "17tOyWFGO6oyeTjofeGwLvIhpQj0RYf6IJ3hTA2i…",
      "e": "AQAB"
    }
  ]
}
```

按令牌头中的 `kid` 匹配。遇到未知 `kid` 时重新拉取：密钥轮换本该这样处理，
而不是按定时器刷新。

### Node.js

```js
import { createRemoteJWKSet, jwtVerify } from 'jose'

const JWKS = createRemoteJWKSet(new URL(`${SOULAUTH}/api/oidc/jwks`))

const { payload } = await jwtVerify(idToken, JWKS, {
  issuer: SOULAUTH,          // 必须与发现文档的 issuer 逐字符一致
  audience: CLIENT_ID,
  algorithms: ['RS256'],     // 钉死它——绝不接受令牌自称的算法
})
```

### Python

```python
from jwt import PyJWKClient
import jwt

jwks = PyJWKClient(f"{SOULAUTH}/api/oidc/jwks")
key = jwks.get_signing_key_from_jwt(id_token).key

payload = jwt.decode(
    id_token, key,
    algorithms=["RS256"],       # 你自己控制的列表，不是从令牌里读的
    audience=CLIENT_ID,
    issuer=SOULAUTH,
)
```

### 每个库都必须校验的项目

各家库默认校验的内容不一致。确认下面这些都做了：

- **签名**，用 JWKS 里的密钥。
- **`alg` 由你的代码钉成 `RS256`**。接受令牌自己声明的算法，就是 `alg: none` 那一类漏洞。
- **`iss`** 与你配置的 issuer 完全相等。
- **`aud`** 包含你的 `client_id`。为另一个客户端签发的令牌，签名有效但令牌不对。
- **`exp` / `iat`**，允许很小的时钟偏移，量级是秒而不是分钟。
- **`nonce`** 与你送出去的那个一致（如果你送了）。

## 校验访问令牌

访问令牌是不透明的，本地无从校验：

```bash
curl $SOULAUTH/api/oidc/userinfo -H "Authorization: Bearer $ACCESS_TOKEN"
```

```json
{
  "sub": "cc661281-9821-485d-a1f7-0c314e37d7f4",
  "email": "a@e.com",
  "email_verified": true,
  "preferred_username": "admin",
  "updated_at": 1787796557
}
```

`401` 表示令牌无效、过期或已吊销。字段按授予的 scope 裁剪，所以 `null` 的意思是
「不在 scope 内」，不是「没设置」。

每次调用都是一趟网络往返。按令牌缓存结果，缓存时长即是你愿意承担错误的时长，
这个窗口就是你的吊销延迟。

## 正确地识别用户

把记录键在 **`(iss, sub)`** 上，绝不能只用 `sub`。一个 `sub` 只有相对于它的 issuer
才有意义；跨 provider 比较裸 `sub` 就是一次跨 provider 账号接管。

也绝不要键在邮箱上。邮箱会易主。

::: warning `sub` 到底有多稳定
它带的是遗留 user 行的键，所以是在那一行的生命周期内稳定，
而不是永久不可重新分配。[完整 caveat](/zh/security/standards-and-conformance)。
:::

## 关于吊销

系统没有提供吊销端点，也没有推送通知。可选的做法有三种：

- 把访问令牌有效期保持得短（默认 3600 秒）然后刷新。
- 当某个动作重要到值得一趟往返时，调 `/userinfo`。
- 接受这个窗口，并在你自己的文档里写明它有多长。

## 接下来

| | |
|---|---|
| 先把令牌拿到手 | [授权码流程](/zh/integrate/authorization-code-flow) |
| 哪些 RFC 适用 | [规范与符合性](/zh/security/standards-and-conformance) |
