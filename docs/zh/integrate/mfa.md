# 多因子认证

TOTP，就是六位数字那种，外加一组备用码。注册要两次调用，登录之后也变成两次。

## 注册是两次调用，不是一次

`POST /api/auth/mfa/setup` 返回共享密钥和一组备用码。它**不会**打开 MFA：

```bash
curl -X POST "$APP/api/auth/mfa/setup" -H "Authorization: Bearer $TOKEN"
# → { "secret": "...", "backup_codes": ["...", ...] }
```

此时 `GET /api/auth/mfa/status` 仍然报 `enabled: false`。用户把密钥录进
认证器之后，得先证明它真能用：

```bash
curl -X POST "$APP/api/auth/mfa/enable" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"totp_code":"123456"}'
```

验证码不对返回 `400`，MFA 保持关闭。分两步是为了让录错的认证器在 `enable` 这一步
就失败 —— 那时账号还能靠密码单独进得去，用户不会被锁在门外。

**备用码只在 `setup` 时显示一次，之后再也取不回来。** 界面要在那一刻让用户存下来。

## 登录变成两次调用

MFA 打开之后，`POST /api/auth/login` 不再返回会话：

```json
{ "mfa_required": true, "temp_token": "..." }
```

这个响应里**没有 `token` 字段**。无条件去读 `token` 的客户端会拿到空值而且不报错。
把 `temp_token` 带到第二次调用：

```bash
curl -X POST "$APP/api/auth/mfa/login-verify" \
  -H 'Content-Type: application/json' \
  -d '{"temp_token":"'"$TEMP"'","totp_code":"123456"}'
```

这次返回真正的会话令牌。验证码不对返回 `401`，用过的码同样返回 `401`。

## 验证码不会回头

成功用过的码不能重放，**更早窗口**的码同样不行。服务端记着上一次通过的步数作为
水位线，所以截获一个码的人最多只剩它那 30 秒窗口的余量，而不是算法本身允许的
前后各一个窗口。

实际影响：用户输错、等了一会、又把**同一个**码敲了一遍，会被拒。
界面该提示他等下一个。

## 备用码

`login-verify` 接受用 `backup_code` 顶替 `totp_code`：

```bash
curl -X POST "$APP/api/auth/mfa/login-verify" \
  -H 'Content-Type: application/json' \
  -d '{"temp_token":"'"$TEMP"'","backup_code":"..."}'
```

每张只能用一次。没有重新生成备用码的端点：用光的人只能关掉 MFA 再重新注册一次，
而关掉需要一个有效验证码。也就是说，认证器和备用码同时丢失的用户，必须找管理员。
开这个功能之前先想好这条路怎么走。

## 关掉它

`POST /api/auth/mfa/disable` 要的是一个当前有效的 TOTP 码，光有会话不行。
所以拿到一枚被盗会话令牌的人，没法把第二重因子直接摘掉。

## 运维上的一条硬要求

TOTP 密钥在库里是加密存放的，加密密钥取自 `MFA_SECRET_ENCRYPTION_KEY`。
不配置的话，它从 `JWT_SECRET` 派生，服务启动时会告警 —— 而那样一来，
轮换 `JWT_SECRET` 会让所有已存密钥无法解密，全部已注册用户同时被挡在门外。
在任何人注册之前就把它显式配好。告警由 `src/utils/crypto.rs` 打出；
这一条没有自动化测试断言，所以本段不挂徽章。

| | |
|---|---|
| 端点表 | [认证与会话](/zh/reference/authentication-and-sessions) |
| 用户被锁在外面时 | [运维与恢复](/zh/operate/operations-and-recovery) |
| 口令与邮件流程 | [口令与邮件](/zh/integrate/passwords-and-email) |
