# 三张 Canonical Figure 的位图修订规格

给设计师的改图说明。六个文件 = 三张图 × 中英各一版。

**权威来源**（有冲突时按此顺序）：

1. `docs/.vitepress/theme/figures/strings.ts` —— 站点现在渲染的组件版文案，中英同源。
   下文每处「应为」都是从它逐字抄来的，可以直接复制。
2. `03-终检文档/83-GA-03｜Terminology Global Audit`（SEMANTIC FROZEN）—— 术语拼写。
3. `21-01｜README｜Chinese Canonical Master v2.1 FINAL—FROZEN` —— 定位与措辞。

改动分两类，下文逐条标注：

- **【错】** 图上画的与代码 / 正典不符，必须改。
- **【缺】** 中英两版不对等，或组件版有而位图没有，补齐即可。

---

## 通用：三张图六个文件都要改

### 通-1【错】对象名必须连写

GA-03 是冻结的术语权威，里面一律是连写。图上全部写成了分写。

| 图上现在 | 应为 |
|---|---|
| `Actor Identity` | `ActorIdentity` |
| `Human Account` | `HumanAccount` |
| `Identity Binding` | `IdentityBinding` |
| `AI Credential` | `AIActor Credential` |

中文副标不受影响（`主体身份`、`人类账户`、`身份绑定` 照旧），只改英文对象名。

理由：这四个是**契约与数据库里的对象名**，不是描述性短语。写成分写会让读者以为是两个词组成的概念，而它们在 `schema.sql`、`contracts/openapi.yaml` 与所有代码里都是单一标识符。

### 通-2【缺】标题要带图号

现在三张图的标题都没有 `Figure N ·` 前缀，但正文里是按图号引用的。

| 文件 | 标题应为 |
|---|---|
| figure-1 en | `Figure 1 · Soulseed — AGI infrastructure above the LLM` |
| figure-1 zh | `Figure 1 · Soulseed —— LLM 之上的 AGI 基础设施` |
| figure-2 en | `Figure 2 · An Actor-centred identity model` |
| figure-2 zh | `Figure 2 · 一个以 Actor 为中心的身份模型` |
| figure-3 en | `Figure 3 · SoulAuth — Actor-native identity infrastructure` |
| figure-3 zh | `Figure 3 · SoulAuth —— Actor-native 身份基础设施架构` |

注意英文用 em dash（—），中文用双破折号（——）。

---

## Figure 2 · 一个以 Actor 为中心的身份模型

**这张图问题最多，两版都要动结构。**

### 2-1【错】`IdentityBinding` 必须是一个对象框，不能是一条线的标签

**现状**：从 `SoulseedAGI / Canonical AIActor` 有一条虚线直连 `Actor Identity`，线上标着
`Canonical Actor Binding`（中文版还多一行 `规范主体绑定`）。

**问题**：标签名对，缺的是那个 canonical 对象本身。语料 06 §4 与 08 §6 要求的关系是三段式：

```
Soulseed Canonical Actor  ↔  IdentityBinding  ↔  SoulAuth ActorIdentity
```

`IdentityBinding` 是 SoulAuth 数据库里一张真实的表（`schema.sql` 里的 `identity_binding`），
是**跨域关系必须经过的那个受控对象**。画成一条线，等于说两个系统直接相连 ——
而整份文档反复强调的正是「引用不构成所有权、只能通过受控绑定发生关系」。

**改法**：在图的下部另起一组，横排三个虚线框，中间用虚线连接：

```
┌──────────────┐      ┌──────────────────┐      ┌───────────────────────────┐
│ ActorIdentity │ ---- │ IdentityBinding  │ ---- │ Soulseed Canonical Actor  │
│ 同一个身份根   │      │ 受控的跨域关系     │      │ 由 SoulseedAGI 拥有         │
└──────────────┘      └──────────────────┘      └───────────────────────────┘
```

三个框都用虚线边框（表示这一组是可选的、不在认证主路径上）。

**框内文案**：

| 位置 | EN | ZH |
|---|---|---|
| 左 | `ActorIdentity` / `The same identity root` | `ActorIdentity` / `同一个身份根` |
| 中 | `IdentityBinding` / `Controlled cross-domain relation` | `IdentityBinding` / `身份绑定 · 受控的跨域关系` |
| 右 | `Soulseed Canonical Actor` / `Owned by SoulseedAGI` | `Soulseed Canonical Actor` / `由 SoulseedAGI 拥有` |

**这一组下方加一行小字**：

- EN：`Optional · a standalone AIActor needs no binding`
- ZH：`可选 —— Standalone AIActor 无需绑定即可成立`

### 2-2【错】`HumanAccount` 完全没有画

**现状**：图上只有 `Human Credential` 与 `AI Credential` 两个凭证框，没有 `HumanAccount`。

**问题**：`HumanAccount` 是身份模型里的一等对象（`schema.sql` 有 `human_account` 表），
而且四条不变式里第一条就是 `ActorIdentity ≠ HumanAccount`。图上没有它，那条不变式无从对照。

**改法**：把它放进 2-1 新增的那一组里，作为该组的第一行（在三段式关系上方）：

| EN | ZH |
|---|---|
| `HumanAccount` / `Human-specific extension · optional` | `HumanAccount` / `人类特有的账户扩展 · 可选` |

**这一组要有组标题**（说明为什么它们不在主链上）：

- EN：`Around ActorIdentity` / 副标 `Related objects — none of them is on the authentication path`
- ZH：`围绕 ActorIdentity 的周边对象` / 副标 `它们与身份根有关系，但都不在认证路径上`

这条副标是关键：`HumanAccount` 与 `IdentityBinding` 都**不喂给 Authentication Core**，
只有 `Credential` 在认证路径上。现在图上把它们混在一起画会误导。

### 2-3【缺】四条不变式要画进图里，不能只留在旁注

**现状**：一条都没有。

**改法**：在主链下方、旁注上方，横排四段等宽代码样式的短句：

```
ActorIdentity ≠ HumanAccount     ActorIdentity ≠ Credential
ActorIdentity ≠ Client           Client ≠ Actor
```

中英两版**完全相同**，不翻译（它们是不变式，不是句子）。

### 2-4【错】图注（caption）漏掉了绑定条件

**现状 EN**：`Humans and AIActors are first-class identity subjects within the same
Actor-native Identity Core through different Credentials.`

**应为 EN**：

> Human and AIActor are first-class identity subjects entering the same Actor-native
> identity core through different credentials. A Soulseed canonical Actor relates to a
> SoulAuth ActorIdentity only through an IdentityBinding — and only when that binding
> exists.

**应为 ZH**：

> Human 与 AIActor 作为一等身份主体，通过不同 Credential 进入同一个 Actor-native
> Identity Core。Soulseed Canonical Actor 只能通过 IdentityBinding 与 SoulAuth
> ActorIdentity 建立关系 —— 而且只在这条 Binding 确实存在时。

后半句是这张图的核心断言，现在两版都没有。

### 2-5【缺】旁注第一条的中文版说法与英文版不一致

**中文现在**：`Human 与 AIActor 共享同一套 Actor Identity 契约和一等身份法位，不要求使用相同凭证。`

**应为**：`Human 与 AIActor 共享同一套 ActorIdentity 契约与一等身份法位。它们的 Credential、
Authentication Method 与 Lifecycle 可以不同 —— 同等法位不等于同一种实现。`

英文对应：`Human and AIActor share one ActorIdentity contract and first-class identity
standing. Their credentials, authentication methods and lifecycles may differ — equal
standing is not equal implementation.`

差别不只是措辞：英文点明了「Credential、方法、生命周期」三样都可以不同，中文只说了凭证。

### 2-6 中英版面高度不同（en 439px / zh 621px）

改完之后两版内容完全对等，**版面高度应当一致**。现在的差异是内容差异造成的，不是设计选择。

---

## Figure 1 · Soulseed —— LLM 之上的 AGI 基础设施

**英文版基本正确，中文版实质更薄。以英文版为准补齐中文版。**

### 1-1【缺】中文版没有底部三条编号注释

英文版底部有三段带编号的说明，中文版整块缺失。补上（文案照抄）：

**1｜LLM 与 Mind OS**
> LLM 提供智能，但不会自动产生 Identity、Mind、记忆连续性、Judgment、Authority 与
> Governance。Soulseed 在 LLM 之上建立 AGI 基础设施。

**2｜Soulseed 的四层**
> SoulseedAGI、SoulseedOS 与 Soulseed Apps 共同构成面向持续 AIActor 的私有 Mind OS。
> Public Reality Infrastructure 在需要时承载跨主体的共享事实、证据、结算与锚定。

**3｜SoulAuth 的位置**
> SoulAuth 是独立的身份与认证基础设施。它可以被 SoulseedOS 使用，也可以独立服务任意
> 应用。Soulseed 接入从来不是采用 SoulAuth 的前提。

第三条尤其不能省 —— 「独立是默认，不是回落」是这个项目反复声明的立场。

### 1-2【缺】中文版 LLM → Mind OS 的箭头没有标注

英文版箭头旁标着 `Intelligence Capability`，中文版是一条光秃秃的箭头。

**补**：`智能能力`

### 1-3【缺】中文版 `Public Bridge` 没有副标

英文版是两行：`Public Bridge` + `On-demand Access`。中文版只有一行 `Public Bridge`。

**补副标**：`按需接入`

### 1-4【错】中文版 `Public Bridge` 的起点画错了

**现状**：中文版那条虚线从 `SoulseedOS` 框的右下角出发。
**英文版**：从 `Mind OS` 整个容器的底部出发。

**应以英文版为准**。语义不同：`Public Bridge` 是**整个 Mind OS**（AGI + OS + Apps 三层合起来）
按需接入公共现实基础设施的通道，不是 SoulseedOS 一个模块的对外接口。

### 1-5【错】中文版的箭头方向被简化了

**英文版**：
- `SoulseedAGI ↔ SoulseedOS ↔ Soulseed Apps` 是**双向**箭头
- `SoulseedOS ↔ SoulAuth ↔ Any Application` 是**双向**箭头

**中文版**：三层之间是单向下行箭头；`SoulseedOS —— SoulAuth —— 任意应用` 是两端带圆点的无头连线。

**应以英文版为准**。双向表达的是「互相调用 / 互为消费方」，单向下行会读成「上层生成下层」，
那是错的 —— SoulseedOS 消费 SoulAuth 的认证事实，SoulAuth 也需要 OS 侧的绑定关系。

### 1-6【缺】中文版 `任意应用` 的副标是废话

**现状**：主标 `任意应用`，副标 `Any Application` —— 副标只是主标的英文。
**英文版**：主标 `Any Application`，副标 `External Systems`（有信息量）。

**应为**：主标 `Any Application`，副标 `任意应用 / 外部系统`。

### 1-7【缺】两版图注都缺最后一句

**应为 EN**：`… SoulAuth is independent identity and authentication infrastructure — usable
by SoulseedOS and, on its own, by any application. **This is an architecture relationship,
not a deployment topology.**`

**应为 ZH**：`…… SoulAuth 是独立的身份与认证基础设施 —— 既可被 SoulseedOS 使用，也可独立
服务任意应用。**这张图表达的是 Architecture Relationship，不是 Deployment Topology。**`

加粗那句现在两版都没有，而它防的是一类具体误读：把这张图当成部署拓扑，以为四层必须一起部署。

---

## Figure 3 · SoulAuth —— Actor-native 身份基础设施架构

**中英两版结构一致，问题主要是术语与几处已经过期的表述。**

### 3-1【错】`Key Manager / 密钥管理器` 这个框名不准确

**现状**：底部「基础设施与外部依赖」一栏里有一个框叫 `Key Manager` / `密钥管理器`。

**问题**：SoulAuth 没有「密钥管理器」这个组件。四把密钥（`JWT_SECRET`、OIDC 签名私钥、
`MFA_SECRET_ENCRYPTION_KEY`、`AUDIT_INTEGRITY_KEY`）都是进程环境变量或文件，
没有任何 KMS / HSM 接入。画一个叫「管理器」的框，读者会以为有一个组件在管密钥轮换。

**应为**：`Key Management` / `密钥管理` —— 描述的是一项**职责**，不是一个组件。
（其余三个框 `Persistence Adapter`、`External IdP`、`Delivery` 也都是职责名，保持一致。）

### 3-2【缺】`Tamper-evident Audit` 要补上限定词

**现状**：审计栏第三个框写 `Tamper-evident Audit` / `篡改可测审计`。

**这一条现在是对的**（代码已实现哈希链 + 签名 checkpoint），但**缺一个关键限定**：
它是 tamper-**evident**（可检测），不是 tamper-**proof**（不可篡改）。
拥有数据库写权限的人仍然可以改，只是改不掉之后会被检出来。

**应为**：
- EN：主标 `Tamper-evident`，副标 `not tamper-proof`
- ZH：主标 `Tamper-evident`，副标 `可检测篡改，非不可篡改`

### 3-3【缺】三条不变式没有画进图里

组件版在图底部有三条，位图一条都没有。**补在「持久化与基础设施」那一栏下方**，
中英两版**完全相同**（EN 版首字母大写风格，ZH 版沿用 Title Case，见 strings.ts）：

```
Architecture Component ≠ Deployment Unit
One Database ≠ One Domain
Adapter ≠ Semantic Owner
```

第二条尤其重要：图上「逻辑存储」画了六个框（Identity / Credential / AuthSession / OIDC /
Security / Audit），而实际只有一个 SurrealDB。没有这条不变式，读者会以为要建六个库。

### 3-4【缺】图注缺后半句

**现状 EN**：`With Actor Identity as the identity root, organizing Credential, Authentication,
AuthSession, OIDC, Security, and Audit.`

**应为 EN**：`With ActorIdentity as the identity root, organising credential, authentication,
AuthSession, OIDC, security and audit. **This maps logical responsibilities — it is not a
runtime sequence and not a deployment diagram.**`

**应为 ZH**：`以 ActorIdentity 为身份根，组织 Credential、Authentication、AuthSession、OIDC、
Security 与 Audit。**这是一张 Logical Responsibilities 图 —— 不是 Runtime Sequence，
也不是 Deployment Diagram。**`

加粗那句防的误读是：把从上到下的排列当成请求的执行顺序。

### 3-5 已经修过、不要退回

中文版 Figure 3 里 `Credential | 凭证` 那个框，早先曾误写成 `Credentiat`，已在位图上直接修过。
重绘时注意不要从旧稿退回。

---

## 交付检查清单

改完后逐项核对：

- [ ] 六个文件里没有任何 `Actor Identity` / `Human Account` / `Identity Binding` 分写形式
- [ ] 三张图标题都带 `Figure N ·` 前缀
- [ ] Figure 2 里 `IdentityBinding` 是一个框，不是线上的文字
- [ ] Figure 2 里有 `HumanAccount` 框，且与 `IdentityBinding` 同属「周边对象」组
- [ ] Figure 2 的四条不变式在图里
- [ ] Figure 2 中英两版高度一致
- [ ] Figure 1 中文版有三条底部注释、箭头标注、`按需接入` 副标
- [ ] Figure 1 中文版的双向箭头与 `Public Bridge` 起点与英文版一致
- [ ] Figure 3 的 `Key Management` 不叫「管理器」
- [ ] Figure 3 的 `Tamper-evident` 带 `not tamper-proof` 限定
- [ ] Figure 3 的三条不变式在图里
- [ ] 三张图的 caption 都有那句「这不是部署图 / 不是执行顺序」

---

## 一件要先决定的事

站点现在**渲染的是 Vue 组件版**，不是这些位图（见本目录 `README.md`）。组件版已经把上面
每一条都实现了，中英从同一份 `strings.ts` 生成，`npm run check:figures` 会逐层比对两个
locale 的结构 ——「某个语言版本更薄」在结构上不可能再发生。

所以位图改完之后有两种用法，需要你定：

1. **只作对外素材**（README、幻灯片、白皮书），站点继续用组件版。
   这样位图与组件版会各自演进，将来仍会漂 —— 除非每次改文案都记得同步改图。
2. **换回位图**，删掉组件版。那就失去了 `check:figures` 的结构比对，
   「中文版更薄」这类问题会重新变成靠人眼发现。

我的建议是 **1**，并且在本目录 `README.md` 里写明位图的用途与「以 `strings.ts` 为准」这条规则，
让下一个改图的人知道该照哪份文案。
