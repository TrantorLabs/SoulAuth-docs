# 运维与恢复

本页涵盖日常运维工作：密钥轮换、数据备份，以及事故发生后的处理。

## 备份策略

需要备份的只有一样：SurrealDB 数据目录。身份、凭证、会话、客户端、审计行都在其中。

```bash
systemctl stop soulauth
tar czf soulauth-$(date +%F).tar.gz /var/lib/surrealdb/
systemctl start soulauth
```

另有两样东西保存**在数据库之外**，但在恢复时同样必需：

- `JWT_SECRET`
- OIDC 签名密钥（`OIDC_RSA_PRIVATE_KEY_PATH`）与 `MFA_SECRET_ENCRYPTION_KEY`

没有它们就恢复数据库，结果是所有会话失效、所有已签发的 ID Token 验不过，
而且**所有已存的 TOTP 密钥无法解密**。请把它们保存在专门存放秘密的位置，并且实际验证一次能否取回。

## 密钥轮换

### `JWT_SECRET`

轮换它会让所有会话失效，所有人被登出。这是预期代价，不是故障。

::: danger 先轮换 MFA 密钥，否则别动
如果 `MFA_SECRET_ENCRYPTION_KEY` 从未被显式设置，MFA 密钥是**从 `JWT_SECRET` 派生**
的。此时轮换 `JWT_SECRET` 会把每个 MFA 用户永久锁死：他们存着的 TOTP 密钥再也
解不开，除了让他们重新绑定之外没有任何恢复手段。

在你动 `JWT_SECRET` 之前，先设一个专用的 `MFA_SECRET_ENCRYPTION_KEY`。
非环回的 `APP_URL` 已经把它列为必填，就是为了防这一步。
:::

### OIDC 签名密钥

**同一时刻只有一把。** SoulAuth 只加载一把签名密钥，JWKS 也只发布这一把 ——
没有 key ring，所以做不到「让新旧密钥并存」。

因此轮换会**立刻**让所有用旧 `kid` 签发的 ID Token 失效，而且重新拉取 JWKS 也救不了
手上还拿着旧令牌的客户端：旧密钥已经不在那份文档里了。请挑一个「短时间内 ID Token
校验失败可以接受」的窗口轮换，或者安排客户端重新认证。

### 客户端密钥

```bash
curl -X POST $SOULAUTH/api/oidc/clients/$CLIENT_ID/regenerate-secret \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

新密钥只返回一次。旧密钥立即停止工作，因此需要在同一个维护窗口内把新密钥部署到客户端。

## 处理被锁定的账号

```bash
# 谁被锁了
curl $SOULAUTH/api/security/lockout -H "Authorization: Bearer $ADMIN_TOKEN"

# 解锁（幂等——没被锁时返回 false）
curl -X POST $SOULAUTH/api/security/unlock \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H 'Content-Type: application/json' \
  -d '{"identifier":"user@example.com","lockout_type":"User"}'
```

两个维度都能解锁：`User` 与 `Ip`。上锁与解锁都会写审计；只记上锁会留下一串永远
没有下文的事件。

需要 `soulauth:security.write`。

## 停用主体

```bash
curl -X PUT $SOULAUTH/api/users/$USER_ID/status \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H 'Content-Type: application/json' \
  -d '{"account_status":"Suspended"}'
```

停用挡住的是**未来**的认证。其它副本上已有的会话最多还能用
`AUTH_SESSION_CACHE_TTL_SECONDS`。如果这件事要紧，重启那些副本。

历史不会被改写：过去的认证、审计行与归因都保留下来。被停用的主体的含义是
「不能再认证」，而不是「从未存在过」。

## 怀疑凭证泄露时

**某个用户的口令。** 停用、强制重置、恢复。改密时他的会话会失效。

**某个客户端密钥。** 重新生成即可。已有的访问令牌在过期前仍然有效，
这个窗口是 `access_token_lifetime`，默认 3600 秒。

**某个 AI 主体的密钥。** 吊销那一枚凭证即可。主体保留身份，以及其它仍然有效的密钥；
允许多枚密钥并存的全部理由就在这里。

```bash
curl -X DELETE $SOULAUTH/api/actors/$ACTOR_ID/credentials/$CREDENTIAL_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**`JWT_SECRET`。** 先读上面那条轮换警告，再轮换。所有人被登出。

**数据库。** 会话、访问令牌、刷新令牌、授权码、重置与验证令牌全部以 SHA-256 指纹
存储，所以读一次数据库拿不到任何可用凭证。
<Status kind="tested" guard="conformance::b4b" /> 口令用 Argon2。TOTP 密钥是加密的，
而所用的那把密钥若从未显式设置，则来自 `JWT_SECRET` 派生。

## 自动清理

后台任务每小时执行一次，清理过期会话、过期重置令牌、过期 OIDC 制品、陈旧的限流行
与锁定记录。无需额外调度。

审计行**不在**清理范围内。如需保留期限策略，由部署方自行制定。

## 监控要点

```bash
curl $SOULAUTH/health                     # 公开
curl $SOULAUTH/api/audit/system-health \
  -H "Authorization: Bearer $ADMIN_TOKEN"  # 需要 soulauth:security.read
```

值得告警的：`login_failed` 速率、`account_locked` 速率、管理端点上的
`permission_denied`，以及进程日志里任何 `panicked`。

## 接下来

| | |
|---|---|
| 诊断具体故障 | [排查](/zh/operate/troubleshooting) |
| 审计日志能证明什么、不能证明什么 | [审计](/zh/reference/audit) |
