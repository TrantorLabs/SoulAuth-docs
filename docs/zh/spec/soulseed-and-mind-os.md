# Soulseed 与 Mind OS

可选内容。SoulAuth 默认独立运行，多数部署永远不需要这一页。

它存在的目的只有一个：说清**哪个事实归谁所有**。SoulAuth 存的是指向 canonical actor
的一个引用，从不反向写入；如果它能改那个定义，两个系统就不再可分离，
哪一个都没法脱离另一个部署。

## 三个系统与三个事实源

| 系统 | 拥有 | 不拥有 |
|---|---|---|
| **SoulseedAGI** | 主体**是什么**：canonical actor、它的 Mind 与意图 | 该主体如何证明自己 |
| **SoulAuth** | 身份与认证：`ActorIdentity`、凭证、会话 | 主体是什么、能做什么 |
| **SoulseedOS** | 运营与治理：什么在运行、依何种策略 | 谁是谁 |

箭头只朝一个方向。SoulAuth 认证的是由 SoulseedAGI 定义的主体，从不反向写入。

<Figure1 locale="zh" />

## 什么东西跨过边界

只有一样：一个认证事实。

> *这个请求就是那个主体，在这个时刻，以这种方式被证明。*

除此之外没有别的。具体而言：

- **权能不跨过。** 认证成功不授予任何 Soulseed 治理地位，
  见[身份与权限的边界](/zh/spec/identity-vs-authority)。
- **定义不跨过。** `actor_identity.canonical_actor_ref` 是一个指针。SoulAuth 读它，
  另一侧拥有它。
- **档案数据不跨过。** Soulseed 关于某个主体所知道的事，留在 Soulseed。

## 引用不构成所有权

`canonical_actor_ref` 记录的是：本地的 `ActorIdentity` 对应于别处定义的某个主体。
持有这个引用，不给 SoulAuth 任何创建、修改或推理 Mind、意图、记忆的能力。

这条区分会在一个具体场合被挑战：有人提议让 SoulAuth「顺便也存一点」Soulseed 的
状态，理由是反正它就在手边。一旦存了，两边就没法各自部署了。

::: warning 它是受控声明
`canonical_actor_ref` **默认不暴露**给第三方 OIDC 客户端。一个指向另一套系统身份域的
指针属于集成状态，不是公开档案字段。默认发布它，每一个接入的客户端都会知道这个
部署背后还挂着哪套系统。
:::

## 独立运行是默认，不是回落

一个没有 Soulseed 绑定的主体，是完整、有效的 SoulAuth 主体。独立模式下
`identity_source` 为 `local`，`canonical_actor_ref` 为空，认证行为没有任何差别。

这是一条设计约束，而不是偶然：如果 SoulAuth 离开 Soulseed 就跑不起来，
那么 Soulseed 就成了认证信任基础的一部分，每一个 SoulAuth 部署都要连带继承
它的可用性与威胁模型。

本站其余内容都不假定 Soulseed 存在。如果你不运行它，读到这里可以停了。

## 协作只通过契约进行

两侧确有交互的地方，走的是已发布的契约：OIDC 表面、机器可读的注册表，
而不是共享的表或共享的内部类型。

适配器可以把一条绑定**投影**成消费方需要的形状，但不能**创建**绑定：
只有 SoulAuth 写 `identity_binding`，而且只在外部主体确实通过验证之后才写。

## 架构关系不等于 Release 能力

本页描述的是几个系统之间的关系，不说明当前 Release
实现了这层关系中的哪些部分。

## 接下来

| | |
|---|---|
| 把认证事实交给 Soulseed | [Soulseed 集成](/zh/integrate/soulseed) |
| 身份对象 | [Actor 身份模型](/zh/concepts/actor-identity-model) |
| 认证不授予什么 | [身份与权限的边界](/zh/spec/identity-vs-authority) |
