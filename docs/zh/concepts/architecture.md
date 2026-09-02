# 架构

一个 Rust 二进制加一个数据库。源码按职责分成 `src/routes/`、`src/models/`、
`src/services/` 三层，其中五条不变式由测试守着，列在下面。

## 整体形状

<Figure3 locale="zh" />

这张图画的是**逻辑职责**，既不是调用时序，也不是部署图。图中的一切目前都运行在
同一个进程内。

## 代码守住的边界

下面每一条都写出了守住它的那个测试，点开可以看到断言本身。

| 边界 | 守卫 |
|---|---|
| 任何明文 bearer 凭证都不落库。会话、访问令牌、刷新令牌、授权码、口令重置与邮箱验证令牌，全部以 SHA-256 指纹持久化 | <Status kind="tested" guard="conformance::b4b" /> |
| 全 API 只有一种错误形状：稳定机器码加人话，绝不出现空体的裸状态码 | <Status kind="tested" guard="conformance::j6" /> |
| AI 主体路径完全不碰人类账户结构 | <Status kind="tested" guard="conformance::a6" /> |
| 已发布契约里的每个端点、配置项、权限名都在运行代码中存在；反过来，运行代码里也没有契约遗漏的 | <Status kind="tested" guard="conformance::j4" /> |
| 服务无法修改自己的表结构 | schema 导入是运维步骤 |

最后一条没有对应测试，因为没有可断言的对象：SoulAuth 根本不发出 DDL。两个 SQL
文件由部署者导入，服务运行时用的那个数据库账号不需要改表结构的权限。

## 持久化

SurrealDB，一对 namespace 与 database，一同配置。图中的逻辑存储（身份、凭证、
会话、审计）是职责划分，并非各自独立的数据库。

::: warning namespace/database 这一对是个真实的失败模式
把 schema 导进与进程连接时不同的一对，服务照常启动、`/health` 照常返回 `ok`，
直到第一次写入才失败。
:::

## 接下来

| | |
|---|---|
| 那些对象 | [Actor 身份模型](/zh/concepts/actor-identity-model) |
| 怎么部署 | [部署](/zh/operate/deployment) |
| 这些边界为何存在 | [规范](/zh/spec/) |
