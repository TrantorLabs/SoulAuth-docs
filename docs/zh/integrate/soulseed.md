# Soulseed 集成

本页为可选内容。SoulAuth 默认独立运行，多数部署不需要阅读它。

## 这项集成的内容

在 Soulseed 部署里，canonical actor 由 **SoulseedAGI** 定义，不在这里。
SoulAuth 认证那个主体，并持有一个指向它的引用——`actor_identity.canonical_actor_ref`。

```
SoulseedAGI        SoulAuth          SoulseedOS
定义主体            认证主体           运营与治理
```

这个方向很要紧，而且不可逆转：持有一个引用，不赋予 SoulAuth 任何定义、修改或推理
Mind、SubjectIntent、Memory 的能力。它只认证主体，不决定谁是谁。

## 跨越边界的内容

只有一项认证事实：*这个请求来自那个主体，在这一时刻，以这种方式得到证明。*

不跨过去的：

- **权限。** 认证成功不授予任何 Soulseed 治理地位。
  [身份与权限的边界](/zh/spec/identity-vs-authority)
- **定义。** `canonical_actor_ref` 是个指针。SoulAuth 从不写另一端。
- **档案数据。** Soulseed 知道的关于某个主体的事，是 Soulseed 的。

## `canonical_actor_ref` 是受控声明

它**默认不暴露**给第三方 OIDC 客户端。一个指向另一套系统身份域的引用属于受控
Integration Claim，不是公开档案字段——默认发布它等于把部署拓扑泄露给每个依赖方。

## 独立运行不是降级方案

一个没有 Soulseed 绑定的主体，是完整、有效的 SoulAuth 主体。独立模式是默认，
不是回落：`identity_source` 为 `local`，`canonical_actor_ref` 为空。

本站其余内容都不假定 Soulseed 存在。如果不运行它，读到这里即可。

## 接下来

| | |
|---|---|
| 完整的归属边界 | [Soulseed 与 Mind OS](/zh/spec/soulseed-and-mind-os) |
| 身份对象 | [Actor 身份模型](/zh/concepts/actor-identity-model) |
