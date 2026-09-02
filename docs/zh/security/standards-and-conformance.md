# 规范与符合性

哪些外部规范适用、适用到什么程度，以及哪些**不**适用。

## 五个标志位

每份规范带五个**互相独立**的判定。**任何一个都不蕴含另一个：**

<Status kind="implemented" glossary /> 代码里有这条路径 ·
<Status kind="supported" glossary /> 我们承担它的契约 ·
<Status kind="tested" glossary /> 有自动化证据 ·
<Status kind="conformant" glossary /> 对照规范原文验过 ·
<Status kind="certified" glossary /> 标准组织说了算

一份规范完全可以是 `implemented: true, supported: true, conformant: false`
——本表里绝大多数条目就在这个位置。用五个标志位而不是一个词，就是为了能把这种状态
如实写出来。

## 注册表

<StandardsTable />

## 三条值得背下来的区分

这是最常被默认成立、而在这里都不成立的三条：

**内部吊销语义 ≠ 支持 RFC 7009。** SoulAuth 确实会吊销令牌——改密时、
停用账号时、检测到刷新令牌复用时。但**没有 `/revoke` 端点**。
行为存在，标准化的 wire 协议不存在。

**内部令牌查询 ≠ RFC 7662 introspection。** 访问令牌是库里的一行，服务端当然能查它。
那是实现细节，不是一个 introspection 端点。请对着 JWKS 在本地校验 ID Token。

**签发访问令牌 ≠ 符合 RFC 9068。** SoulAuth 签发访问令牌。它不声称这些令牌遵循
RFC 9068 规定的那套 JWT profile。

## 接下来

| | |
|---|---|
| 正确地校验令牌 | [校验令牌](/zh/integrate/verify-tokens) |
| 这些选择背后的安全模型 | [安全模型](/zh/security/security-model) |
