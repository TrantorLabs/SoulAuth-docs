# SoulAuth 是什么

**面向 Human 与 AIActor 的 Actor-native 身份基础设施。**

SoulAuth 是由**新加坡 TRANTOR LABS** 构建的开源身份与认证基础设施。它使用 Rust 实现，
支持自托管与 OpenID Connect，可独立服务 Web、Backend、API 与 AI / Agent 系统，
也可以原生接入 SoulseedOS。

传统身份系统通常默认身份主体是 Human User，Bot、Service Account 或 Agent 只是附着在
人类账户或应用之下的特殊对象。随着 AI 从一次性调用逐渐走向能够持续理解、判断、
调用工具并参与现实行动的 Actor，一个更基础的问题开始出现：

> **谁正在被认证？**

SoulAuth 从这个问题出发，把 **Actor Identity** 放在身份模型的中心。Human 与 AIActor
都可以成为一等身份主体；它们可以拥有不同的 Credential、Authentication Method 与
Lifecycle，但进入同一套 Actor-native Identity Contract。

## 一个以 Actor 为中心的身份模型

<Figure2 locale="zh" />

Human 与 AIActor 的「一等身份法位」并不意味着二者拥有相同的 Credential、能力、
生命周期、权限或法律地位，而是意味着它们都可以独立成为可识别、可认证、
可建立 AuthSession、可通过 Token 表达并可被 Audit 归因的身份主体。

**Actor Identity 是身份根，Credential 是证明主体的方式。** Human 可以使用 Password、
MFA 或外部身份，AIActor 可以使用适合机器主体的 Key-based Credential；
不同认证路径最终进入同一个 Authentication Core，并输出标准化的
Authenticated Identity / Claims。

SoulAuth 负责证明一个 Actor 是谁，但不会因为认证成功就自动赋予它行动权力。
在 Soulseed 环境中，AIActor 的本体由 SoulseedAGI 定义，SoulAuth 通过受控的
Canonical Actor Binding 对这个主体进行数字身份认证，而不定义、修改或拥有它的 Mind。

## 为什么是 Actor-native Identity

今天的大语言模型已经提供越来越强的生成、理解、推理和工具使用能力。我们更愿意把
LLM 理解为智能时代类似 CPU 的通用计算能力：它提供智能，却不会自动形成一个长期
智能系统所需要的身份、连续性、责任和治理秩序。

当 AI 从一次调用逐渐成为持续存在的 Actor，系统就必须能够稳定回答：是谁在理解，
是谁在判断，是谁在行动，结果最终归属于谁。

这也是 SoulAuth 采用 **Actor First** 的原因。在 Memory、Knowledge、Judgment、Action
与 Accountability 之前，首先建立稳定的「谁」。

SoulAuth 因而不把传统 `User` 继续当作所有身份对象的根，也不是简单给 User 表增加一个
`type = ai` 字段。几个基本边界长期成立：

```text
Actor Identity ≠ Account
Actor Identity ≠ Credential
Actor Identity ≠ Client

Authentication ≠ Authority
```

Human Account、Identity Binding、Credential 与 Client 都有自己的职责，
但它们都不能替代 Actor Identity。

更完整的本体分别在 [AI 原生身份](/zh/concepts/ai-native-identity)、
[Actor 身份模型](/zh/concepts/actor-identity-model)与
[身份与权限的边界](/zh/spec/identity-vs-authority)中展开。

## Soulseed：LLM 之上的 AGI 基础设施

SoulAuth 可以独立运行，但它不是一个孤立的思想项目。它也是新加坡 TRANTOR LABS 对
AGI 基础设施问题的一部分回答。

我们的基本判断是：如果 LLM 提供智能能力，那么真正面向长期 AIActor 的系统仍然需要在
其上建立 Mind、持续运行、治理、应用，以及进入公共现实所需要的系统秩序。

<Figure1 locale="zh" />

这套基础设施可以从四个责任层理解。

**SoulseedAGI｜心智内核**定义 AIActor 与持续 Mind。

**SoulseedOS｜运行与治理操作系统**让 Mind 持续、安全、可治理地运行。

**Soulseed Apps｜应用层**把 Mind 与操作系统能力转化为真实应用。

**Public Reality Infrastructure｜公共现实基础设施**承接跨主体可验证的公共事实与信任。

SoulAuth 位于这套体系的身份基础设施位置，但不是 SoulseedAGI 的组成部分，
也不是 SoulseedOS 的内部模块。它保持独立边界，可以被 SoulseedOS 组合使用，
也可以完全独立服务其他系统。

> **SoulseedAGI 定义主体与 Mind，SoulAuth 认证主体，SoulseedOS 运行并治理主体。**

完整关系在 [Soulseed 与 Mind OS](/zh/spec/soulseed-and-mind-os) 中展开。

## SoulAuth 负责什么，也不负责什么

SoulAuth 的边界终止于**可信身份事实**。

| 能力 | 核心职责 |
|---|---|
| **Actor Identity** | 确定谁是当前可认证的数字主体 |
| **Credential** | 管理 Actor 用什么证明自己 |
| **Authentication** | 判断当前身份凭证是否成立 |
| **AuthSession** | 维持已经成立的认证状态 |
| **Token & Federation** | 通过 Token、OIDC 与 SSO 表达身份事实 |
| **Control Plane** | 管理 Identity、Credential、Client 与 Auth-local RBAC |
| **Security Protection** | 保护 Credential、Authentication、Session、Token 与 Key 生命周期 |
| **Audit & Attribution** | 记录谁通过什么过程成为当前身份 |

SoulAuth 不定义 Mind，也不替代更高层治理系统。Authentication 成功不会自动产生
Mandate、业务 Permission、Governance Decision、Lease 或现实执行权。

最简洁的边界是：

> **Identity 回答「是谁」，Authority 回答「为什么这个 Actor 此时此地有权行动」。**

SoulAuth 的 Auth-local RBAC 可以治理 SoulAuth 自身，但不能被当作整个 Soulseed 或
其它业务系统的最终 Authority Engine。

## SoulAuth 架构

<Figure3 locale="zh" />

SoulAuth 以 **Actor Identity** 为身份根，将 Human Account、Identity Binding 与
Credential 分离。Credential 进入 Authentication Core 建立可信身份事实，
**AuthSession** 保持认证连续性，随后通过 **Token & Federation** 以 Token、OIDC、
SSO 与 Claims 的形式交给外部 Consumer。

**Control Plane、Security Protection 与 Audit & Attribution** 横向覆盖整个身份
生命周期；底层 **Persistence & Infrastructure** 则提供数据、Key、External IdP 与
Adapter 等运行边界。

SoulAuth 默认可以继续保持较小的运行面，例如 Rust Service 与 SurrealDB，
但物理部署简单并不意味着内部领域可以混写：

> **One Database ≠ One Domain.**

Identity、Credential、AuthSession、OIDC、Security 与 Audit 即使由同一数据库承载，
也仍然拥有不同的逻辑 Source、生命周期和责任边界。

完整架构在 [SoulAuth 架构](/zh/concepts/architecture) 中展开。

## 两种使用方式

### Standalone

SoulAuth 可以作为独立 Identity Provider 服务传统 Web、Backend、API 与
AI / Agent 系统，通过 Authentication、AuthSession、OIDC、Token 与 Claims
提供完整身份能力。

```text
SoulAuth
   ↓
Any Application
```

### Soulseed

在 Soulseed 中，SoulAuth 通过稳定 Adapter 向 SoulseedOS 提供经过认证的 Actor
身份事实。对于 SoulseedAGI 已经定义的 Canonical AIActor，SoulAuth 可以维护受控
身份绑定，但不会读取、修改或拥有其 Mind。

```text
SoulseedAGI
Canonical AIActor
      │
Canonical Actor Binding
      ▼
   SoulAuth
      │
Authenticated Identity
      ▼
  SoulseedOS
```

两种方式使用同一个 SoulAuth Core。Soulseed 是原生集成方向，但不是使用 SoulAuth
的前提。

## 为什么使用 Rust

SoulAuth 使用 Rust，因为身份基础设施需要明确的数据所有权、强类型边界、内存安全和
可预测的系统行为。

我们希望 Identity、Credential、AuthSession 与其它安全边界不仅存在于架构文档中，
也能够尽可能成为代码本身不容易违反的约束。

## Security & Trust

Security 与 Audit 不是 SoulAuth 部署完成以后再增加的外围能力，
而是身份基础设施本身的一部分。

SoulAuth 将 Credential、Authentication、AuthSession、Token、Key、External IdP 与
Audit 都视为明确的安全边界，并围绕 MFA、Lockout、Replay Protection、
Token Reuse Detection、Key Lifecycle 与 Tamper-evident Audit 建立持续保护。

更完整的安全模型分别由以下文档定义：

**[安全模型](/zh/security/security-model)** 定义 Assets、Trust Boundaries 与安全假设。

**[威胁模型](/zh/security/threat-model)** 定义 Credential theft、Token theft、Replay、
Malicious Client、Compromised Database 等主要威胁。

**[认证防护](/zh/security/authentication-protection)** 定义 MFA、Lockout、
Rate Limiting、Replay Protection 与 Key Lifecycle。

**[标准与一致性](/zh/security/standards-and-conformance)** 定义协议一致性与
Actor-native Architecture Conformance。

安全问题的报告流程统一由 `SECURITY.md` 定义。

## 开始使用

第一次接触 SoulAuth，可以按照下面的顺序进入：

**本页** 先判断 SoulAuth 是否适合你的系统。

**[快速上手](/zh/start/quickstart)** 启动本地实例并完成第一次 Authentication。

**[接入路径](/zh/start/integration-path)** 在 Web Application、Backend / API、
OIDC Client、AI / Agent System 与 SoulseedOS 中选择正确接入路径。

完成 Integration 后，在进入生产环境前执行
[生产清单](/zh/operate/production-checklist)。

## 关于 SoulAuth

SoulAuth 的目标不是把身份能力锁在某个应用、模型或生态中，而是提供一个**可独立部署、
基于开放标准、通过稳定 Contract 与其它系统组合的身份基础设施**。

它可以进入 Soulseed，也可以独立存在；可以服务传统应用，也可以服务 AI-native 系统；
可以作为标准 OIDC Provider 使用，也可以成为更大 Actor-based Architecture 的身份层。
Consumer 不需要读取 SoulAuth 私有数据库，也不应该依赖其内部实现才能正确使用它。

SoulAuth 由 **TRANTOR LABS｜Singapore** 构建。

TRANTOR LABS 关注的不是单一 AI 产品，而是 AGI 时代更基础的问题：当智能逐渐成为
普遍能力以后，主体、判断、身份、责任、治理与公共现实应该怎样被组织成真正可以运行的
基础设施。

> **哲学定义问题，工程验证答案。**
