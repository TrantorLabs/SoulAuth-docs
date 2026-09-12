# Actor 身份模型

一个主体拆成五个对象存放。下面按对象来：每个存哪些字段，跟身份根是什么关系。

## 身份锚点

`ActorIdentity` 只回答一个问题：**这是谁，且持久不变**。除此之外它什么都不回答。

| 字段 | 含义 |
|---|---|
| `subject_key` | 稳定的 subject 值。生成的，绝不从邮箱或用户名派生。 |
| `actor_kind` | `human` 或 `ai_actor` |
| `identity_source` | `local`、`external`、`soulseed`。标明这个身份的来源 |
| `canonical_actor_ref` | 仅 Soulseed 部署：指向别处定义的 actor 的引用 |
| `status` | `active` 能认证；`suspended` 暂时不能，可以改回来；`retired` 永久不能，且 `subject_key` 不再分配给别人 |

表里有两个设计决定值得说清楚。

**`subject_key` 由系统生成，不从别处派生。** 假如它是从邮箱地址算出来的，
那么用户改一次地址就只有两种结果。要么 subject 跟着变：改动之前写下的每一条审计行
都指向一个再也解析不出东西的标识符，而所有把用户键在 `sub` 上的下游应用，
看到的是一个陌生人。要么它不变，那这个值从来就不是「派生」，
只是一个名字起得有误导性的存储字段。

**只有 `active` 状态能够认证**，并且无法识别的状态值一律按 suspended 处理，
而不是按 active 处理。状态列中的一个拼写错误应当挡住认证，而不是悄悄放行。

::: tip Resource ID ≠ subject
`ActorIdentity` 既有 record ID，**也有** `subject_key`。它们是两个命名空间。
实现上可以取同一个值，那是一种选择，不是等价关系，任何 API 契约都不该假定它。
:::

## 围绕身份根的对象

<Figure2 locale="zh" />

下面四个对象都挂在 `actor_identity` 上，而且都是可选的。

**没有与 `HumanAccount` 对应的 `AIActor` 对象。** 一个 AI 主体就是一条
`actor_kind = ai_actor` 的 `actor_identity`，名下没有 `human_account` 行 ——
库里也确实只有 `actor_identity`、`human_account`、`ai_actor_credential`、
`ai_actor_challenge` 四张表，没有第五张。人类那一侧多出一行来放邮箱和用户名，
非人那一侧不需要，所以不建。

### HumanAccount：人如何管理自己的登录

`email`、`username`、`username_normalized`、`email_verified`。

修改邮箱改的是这一行，主体本身不变。有了这层拆分，AI 主体才可以完全不具备
上述任何字段而存在，参见 [AI 原生身份](/zh/concepts/ai-native-identity)。

### Credential：此刻能用什么证明这个主体

凭证是自己的对象，挂在身份根上，不挂在账户行上。口令住在 `credential` 里，
带 `status`、`rotated_at`、`revoked_at`；轮换是更新那一行并记下时刻，于是
「当前的口令是哪一把」只有一个答案。AI 主体的密钥住在 `ai_actor_credential`，
存 `public_key`、`algorithm`、`label`、`status`、`last_used_at`：一个身份挂多把，
各自独立吊销。SoulAuth 在那里只存公钥，所以这张表就算被读走，也冒充不了谁。

**身份比它持有的任何一份凭证活得久。** 轮换密钥、丢失密钥、吊销密钥、吊销口令，
都不产生新的主体，所以旧凭证时期写下的审计行，解析出来仍然是同一个。吊销是改状态
而不是删除，因为「吊销过」与「从未设过」是两个不同的事实，而一个被清空的字段分不出
它们。<Status kind="tested" guard="conformance::b2" />

### IdentityBinding：外部哪个主体与它是同一个

`provider`、`provider_subject`、`binding_type`、`verification_state`、`revoked_at`。

绑定解析的是**对应关系**：「GitHub 用户 `4001` 就是这个主体」。它既不是凭证，
也不是一次认证。

::: details 为什么只按外部 subject 匹配是个真漏洞
`(provider, provider_subject)` 必须成对匹配。只按 subject 匹配的话，数字 id 为
`4001` 的 GitHub 账号会与 `sub` 为字符串 `"4001"` 的 Google 账号解析到同一个主体。
这是一次跨 provider 的账号接管，不需要任何利用代码，只需要标识符恰好撞上。
:::

### Client：是哪个应用在发起请求

已注册的 OIDC 客户端。客户端是协议里的一方，永远不是这次认证的主体。

## 身份的连续性

下面这些都不改变主体：改邮箱、改用户名、轮换密钥、开了 MFA 又关掉、
从不同客户端登录。

`status` 改成 `retired` 是唯一不可逆的一步。`suspended` 只是暂时不能认证，改回
`active` 就恢复；`retired` 之后这个主体永远不能再认证，而且它的 `subject_key`
不会被交给任何别的主体。

所以 `retired` 不删记录：那一行留在库里，`actor_subject_idx` 这个唯一索引就继续
占着那个 `subject_key`。删了的话，同一个值以后可能被分配给另一个人，而历史审计行
里的 subject 就会在不同时间指向不同的人。

::: tip AIActor 的生命周期有对外端点
`PUT /api/actors/{actor_id}/status` 收 `active` / `suspended` / `retired`：前者可逆，
`retired` 不可回头，而且两者都会立刻结束该主体的全部会话。
<Status kind="tested" guard="conformance::j22" />

Human 那一侧仍然经由账号状态同步，映射保守，原因如下。
:::

::: warning Human 侧没有直接把身份根设成 `retired` 的端点
`PUT /api/users/{user_id}/status` 收的是账号状态
（`Active` / `Inactive` / `Suspended` / `Deleted`），它会同步身份根，但映射是
`Active → active`、**其余一律 `suspended`**。

这是刻意保守：V1 的 `Deleted` 与身份根的 `retired` 语义不同 —— 后者还附带
「`subject_key` 永不复用」这条约束，过渡期不做这个等价。也就是说 `retired` 目前
只能由内部代码写入，照文档做不到。
:::

::: tip `sub` 对什么稳定
OIDC 的 `sub` 就是身份根的 `subject_key`：生成一次，不从任何账户属性派生。改邮箱、
改用户名、轮换凭证、增删 MFA、经由不同 Client 进入，都不改变它，而且同一个主体经
两个 Client 拿到的是同一个值。<Status kind="tested" guard="conformance::c1" />

退役的 subject 不得复用，所以你记下来的那个 `sub`，在你的记录还有意义的期间里
一直指向同一个主体。
:::

## Standalone 与 Soulseed

Standalone 是默认：SoulAuth 就是整个身份域，`identity_source` 为 `local`，
`canonical_actor_ref` 为空。

在 Soulseed 部署里，canonical actor 由 SoulseedAGI 定义，`canonical_actor_ref` 持有
指向它的引用。SoulAuth 认证那个主体，但既不能定义它，也不能修改它。这个引用属于
受控 Integration Claim，默认不暴露给第三方 OIDC 客户端。
[Soulseed 与 Mind OS →](/zh/spec/soulseed-and-mind-os)

## 接下来

| | |
|---|---|
| Agent 那条路径的全貌 | [AI 原生身份](/zh/concepts/ai-native-identity) |
| 认证成功**不**授予什么 | [身份与权限的边界](/zh/spec/identity-vs-authority) |
| 这些对象究竟为何存在 | [规范](/zh/spec/) |
