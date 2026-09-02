# 部署

这一页是部署的完整说明。其中的**核心步骤**在代码仓里另有一份可执行副本：
`DEPLOYMENT.md`（中文版 `DEPLOYMENT.zh-CN.md`）的「部署步骤」由
`tests/deployment_walkthrough.sh` 逐条执行，CI 每次推送都跑一遍，
从空库一直到一个可用的管理员。
<Status kind="tested" guard="deployment_walkthrough.sh" />

那份副本只有步骤本身；Docker Compose、systemd、反向代理、版本升级这些在下面。

## 部署的构成

一个 Rust 二进制，加一个 SurrealDB 实例。不需要额外的运行时、应用服务器或 sidecar。

但这个二进制**不是**静态链接的：它按 GNU target 构建，动态链接 glibc 与 OpenSSL
（`oauth2` 与 `lettre` 都启用了 native-tls）。把它拷到另一个发行版，或者塞进
`FROM scratch` 镜像，都会因为缺库而无法启动。官方容器把它跑在
`debian:bookworm-slim` 上，并装了 `ca-certificates` 与 `libssl3`——照这个形状复现。

## 1 · 数据库

```bash
surreal start --bind 0.0.0.0:8000 --user root --pass root \
  surrealkv:///var/lib/surrealdb/soulauth.db
```

生产环境请给 SoulAuth 一个限定账号而不是 `root`，并在前面放 TLS，
见[生产清单](/zh/operate/production-checklist)。

**版本。** SurrealDB 3.x。测试套件在 3.0.0 与 3.2.4 上各跑过一遍，CI 钉的是 3.2.4；
2.x 不受支持，下面几条命令的参数在那上面并不存在。两个 3.x 版本之间有一处差别：
`surreal import` 遇到没有 `OPTION IMPORT;` 的文件时，3.0 照常导入，3.2 会拒掉每一条
`DEFINE`，最后一张表都不留。`schema.sql` 里带着这一行，因此两版都能用 —— 你要是改
这个文件，把它留着。

## 2 · Schema

SoulAuth 不发出任何 DDL，因此无法创建或修改自己的表。这条边界是结构性的，
而不是某个可以切换的开关。下面两个文件需要由部署者导入一次：

```bash
DB="--endpoint http://127.0.0.1:8000 --user root --pass root \
    --namespace auth --database main"

surreal import $DB schema.sql
surreal import $DB initial_data.sql
```

::: danger namespace 与 database 必须与进程一致
这里的 `auth` / `main` 必须等于下面的 `DATABASE_NAMESPACE` / `DATABASE_NAME`。
弄错了，进程会拒绝启动，并把它实际连上的那一对打出来。

参数是 `--endpoint`。`--conn` 是 3.x 之前的写法，报错信息毫无帮助。
:::

`initial_data.sql` 写入系统角色与权限。跳过这一步将无法引导出管理员。

## 3 · 配置

```bash
DATABASE_URL=127.0.0.1:8000
DATABASE_NAMESPACE=auth
DATABASE_NAME=main
DATABASE_USER=root
DATABASE_PASS=root

JWT_SECRET=<openssl rand -hex 32>
APP_URL=http://localhost:8080
BIND_ADDR=127.0.0.1:8080
SMTP_HOST=127.0.0.1
SMTP_FROM=noreply@example.com
```

全部配置项：[配置参考](/zh/reference/configuration)。

## 4 · 运行

```bash
./soulauth
curl http://localhost:8080/health
# {"status":"ok","uptime_seconds":3}
```

## 5 · 第一个管理员

启动日志里打印一枚一次性引导令牌：

```
WARN No administrator found. Bootstrap token for this process: 7f3a…
```

```bash
curl -X POST http://localhost:8080/api/bootstrap/admin \
  -H 'Content-Type: application/json' \
  -d '{"token":"7f3a…","email":"admin@example.com","username":"admin","password":"CorrectHorse42!"}'
```

一旦存在管理员，这道门永久关闭。**不要通过写数据库来创建第一个管理员**：
那种做法早于引导端点存在，公开文档已明确禁止。

## Docker Compose

`docker-compose.yml` 一条命令做完第 1–4 步。

<Status kind="tested" guard="ci.yml::docker" /> CI 每次推送都会执行它，一直跑到拿出
一个可用的管理员，然后把两个 SQL 文件在这个已经有数据的库上重导一遍、再登录一次：
这一步验证的是重复导入确实是空操作。

它是给本地用的：口令是开发默认值，SurrealDB 也没有 TLS。生产走上面那些步骤，
外加[生产清单](/zh/operate/production-checklist)。

## systemd

```ini
[Unit]
Description=SoulAuth
After=network.target

[Service]
Type=simple
User=soulauth
EnvironmentFile=/etc/soulauth/env
ExecStart=/usr/local/bin/soulauth
Restart=on-failure
RestartSec=5

NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/soulauth

[Install]
WantedBy=multi-user.target
```

`/etc/soulauth/env` 保持 `0600`：里面有 `JWT_SECRET`。

## 反向代理配置

```nginx
location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

**只有在** SoulAuth 无法绕过代理被访问时，才设 `TRUST_PROXY_HEADERS=true`。
否则客户端伪造 `X-Forwarded-For` 就能绕开 IP 限流。

## 版本升级

1. 读发布说明里的 schema 变更。
2. 备份 SurrealDB 数据目录。
3. 把 `schema.sql` 与 `initial_data.sql` 整份重导一遍。不必去分辨哪几条是新增的：
   每条 `DEFINE` 都带 `IF NOT EXISTS`、种子数据全是 `UPSERT`，已经存在的东西重导
   就是空操作。跳过这一步正是「升级里新增了一张表」会出问题的地方，用到那张表的
   端点会在运行时报错，而不是在启动时。
4. 换二进制并重启。

滚动重启没有问题，前提是每个副本共享同一个 `JWT_SECRET` 与 OIDC 签名密钥。
二者必须一致，否则一个副本签发的令牌在另一个副本的 JWKS 上无法通过校验。

## 自行核验

```bash
./tests/deployment_walkthrough.sh
```

零失败说明这条路径从空库到一个可用的管理员是通的。

## 接下来

| | |
|---|---|
| 加固它 | [生产清单](/zh/operate/production-checklist) |
| 备份、轮换、事故 | [运维与恢复](/zh/operate/operations-and-recovery) |
