// 三张 Canonical Figure 的全部文案。
//
// 中英放在同一份结构里，是为了让「某个语言版本比另一个薄」在结构上不可能
// 发生 —— 这正是位图版 Figure 1 出过的问题：英文版有三条底部注释、双向箭头
// 和 On-demand Access 副标，中文版一样都没有，而没有任何东西会报错。
//
// scripts/check-figure-strings.mjs 会断言两个 locale 的键与数组长度完全一致。

export type Node = { name: string; sub?: string; note?: string }
export type Plane = { name: string; items: Node[] }
export type NoteBlock = { title: string; body: string }

export interface Fig1 {
  title: string; caption: string; zoom: string
  llm: Node; intelligence: string
  mindos: Node
  agi: Node; os: Node; apps: Node
  soulauth: Node; anyapp: Node
  bridge: Node
  pri: Node & { items: string[] }
  notes: NoteBlock[]
}

export interface Fig2 {
  title: string; caption: string; zoom: string
  human: Node; aiactor: Node
  actorIdentity: Node
  humanAccount: Node
  humanCredential: Node; aiCredential: Node
  around: Node; actorIdentity2: Node
  soulseedActor: Node; identityBinding: Node; bindingOptional: string
  core: Node & { items: Node[] }
  output: Node
  anyapp: Node; soulseedOS: Node
  neq: string[]
  notes: NoteBlock[]
}

export interface Fig3 {
  title: string; caption: string; zoom: string
  clients: Node[]
  edge: Node
  core: Node
  identityDomain: Node
  actorIdentity: Node; humanAccount: Node; identityBinding: Node; credential: Node
  authCore: Node; authSession: Node; tokenFed: Node; output: Node
  planes: Plane[]
  anyapp: Node; soulseedOS: Node
  persistence: Node
  stores: Node[]; infra: Node[]
  neq: string[]
}

export const fig1: Record<'en' | 'zh', Fig1> = {
  en: {
    title: 'Figure 1 · Soulseed — AGI infrastructure above the LLM',
    caption:
      'LLMs provide intelligence. Soulseed provides the Mind, runtime, applications and public ' +
      'infrastructure a persistent AIActor needs. SoulAuth is independent identity and ' +
      'authentication infrastructure — usable by SoulseedOS and, on its own, by any application. ' +
      'This is an architecture relationship, not a deployment topology.',
    zoom: 'Open full size',
    llm: { name: 'LLM', sub: 'General intelligence capability' },
    intelligence: 'Intelligence capability',
    mindos: { name: 'Mind OS', sub: 'AGI cognitive & governance infrastructure' },
    agi: { name: 'SoulseedAGI', sub: 'Mind Kernel', note: 'Defines AIActor and persistent Mind' },
    os: { name: 'SoulseedOS', sub: 'Runtime & Governance OS', note: 'Runs Mind safely and governably' },
    apps: { name: 'Soulseed Apps', sub: 'Application layer', note: 'Turns Mind into real applications' },
    soulauth: { name: 'SoulAuth', sub: 'Identity & Authentication infrastructure' },
    anyapp: { name: 'Any Application', sub: 'External systems' },
    bridge: { name: 'Public Bridge', sub: 'On-demand access' },
    pri: {
      name: 'Public Reality Infrastructure',
      sub: 'Builds verifiable reality across independent actors',
      items: ['Record', 'Evidence', 'Settlement', 'Anchoring'],
    },
    notes: [
      {
        title: 'LLM & Mind OS',
        body:
          'LLMs provide intelligence, but do not automatically produce identity, Mind, memory ' +
          'continuity, judgment, authority or governance. Soulseed builds the AGI infrastructure ' +
          'on top of LLMs.',
      },
      {
        title: 'The four layers of Soulseed',
        body:
          'SoulseedAGI, SoulseedOS and Soulseed Apps form the private Mind OS for persistent ' +
          'AIActors. Public Reality Infrastructure handles shared facts, evidence, settlement and ' +
          'anchoring across independent actors when needed.',
      },
      {
        title: "SoulAuth's position",
        body:
          'SoulAuth is independent identity and authentication infrastructure. It can be used by ' +
          'SoulseedOS and can also serve any application independently. Soulseed integration is ' +
          'never a precondition for adopting SoulAuth.',
      },
    ],
  },
  zh: {
    title: 'Figure 1 · Soulseed —— LLM 之上的 AGI 基础设施',
    caption:
      'LLM 提供智能，Soulseed 为持续 AIActor 建立 Mind、运行、应用与公共现实所需要的系统秩序。' +
      'SoulAuth 是独立的身份与认证基础设施 —— 既可被 SoulseedOS 使用，也可独立服务任意应用。' +
      '这张图表达的是 Architecture Relationship，不是 Deployment Topology。',
    zoom: '查看大图',
    llm: { name: 'LLM', sub: '通用智能能力' },
    intelligence: '智能能力',
    mindos: { name: 'Mind OS', sub: 'AGI 认知与治理基础设施' },
    agi: { name: 'SoulseedAGI', sub: '心智内核', note: '定义 AIActor 与持续 Mind' },
    os: { name: 'SoulseedOS', sub: '运行与治理操作系统', note: '让 Mind 持续、安全、可治理地运行' },
    apps: { name: 'Soulseed Apps', sub: '应用层', note: '把 Mind 转化为真实应用体验' },
    soulauth: { name: 'SoulAuth', sub: '身份与认证基础设施' },
    anyapp: { name: 'Any Application', sub: '任意应用 / 外部系统' },
    bridge: { name: 'Public Bridge', sub: '按需接入' },
    pri: {
      name: 'Public Reality Infrastructure',
      sub: '公共现实基础设施 —— 承载跨主体可验证的共享现实',
      items: ['Record 记录', 'Evidence 证据', 'Settlement 结算', 'Anchoring 锚定'],
    },
    notes: [
      {
        title: 'LLM 与 Mind OS',
        body:
          'LLM 提供智能，但不会自动产生 Identity、Mind、记忆连续性、Judgment、Authority 与 ' +
          'Governance。Soulseed 在 LLM 之上建立 AGI 基础设施。',
      },
      {
        title: 'Soulseed 的四层',
        body:
          'SoulseedAGI、SoulseedOS 与 Soulseed Apps 共同构成面向持续 AIActor 的私有 Mind OS。' +
          'Public Reality Infrastructure 在需要时承载跨主体的共享事实、证据、结算与锚定。',
      },
      {
        title: 'SoulAuth 的位置',
        body:
          'SoulAuth 是独立的身份与认证基础设施。它可以被 SoulseedOS 使用，也可以独立服务任意' +
          '应用。Soulseed 接入从来不是采用 SoulAuth 的前提。',
      },
    ],
  },
}

export const fig2: Record<'en' | 'zh', Fig2> = {
  en: {
    title: 'Figure 2 · An Actor-centred identity model',
    caption:
      'Human and AIActor are first-class identity subjects entering the same Actor-native ' +
      'identity core through different credentials. A Soulseed canonical Actor relates to a ' +
      'SoulAuth ActorIdentity only through an IdentityBinding — and only when that binding exists.',
    zoom: 'Open full size',
    human: { name: 'Human', sub: 'Actor Kind' },
    aiactor: { name: 'AIActor', sub: 'Actor Kind' },
    actorIdentity: {
      name: 'ActorIdentity',
      sub: 'Canonical actor identity anchor',
      note: 'Answers: who is this Actor?',
    },
    humanAccount: { name: 'HumanAccount', sub: 'Human-specific extension · optional' },
    humanCredential: { name: 'Human Credential', sub: 'Authentication capability' },
    aiCredential: { name: 'AIActor Credential', sub: 'Authentication capability' },
    around: {
      name: 'Around ActorIdentity',
      sub: 'Related objects — none of them is on the authentication path',
    },
    actorIdentity2: { name: 'ActorIdentity', sub: 'The same identity root' },
    soulseedActor: { name: 'Soulseed Canonical Actor', sub: 'Owned by SoulseedAGI' },
    identityBinding: { name: 'IdentityBinding', sub: 'Controlled cross-domain relation' },
    bindingOptional: 'Optional · a standalone AIActor needs no binding',
    core: {
      name: 'SoulAuth Core',
      sub: 'Identity & authentication',
      items: [
        { name: 'Authentication' },
        { name: 'AuthSession' },
        { name: 'Token / OIDC' },
        { name: 'Audit & Attribution' },
      ],
    },
    output: { name: 'Authenticated identity / claims', sub: 'Bounded protocol projection' },
    anyapp: { name: 'Any Application', sub: 'Standalone consumer' },
    soulseedOS: { name: 'SoulseedOS', sub: 'Runtime & governance' },
    neq: [
      'ActorIdentity ≠ HumanAccount',
      'ActorIdentity ≠ Credential',
      'ActorIdentity ≠ Client',
      'Client ≠ Actor',
    ],
    notes: [
      {
        title: 'Shared identity standing',
        body:
          'Human and AIActor share one ActorIdentity contract and first-class identity standing. ' +
          'Their credentials, authentication methods and lifecycles may differ — equal standing ' +
          'is not equal implementation.',
      },
      {
        title: 'Identity ≠ Authority',
        body:
          'SoulAuth establishes authenticated identity and projects it through session, token, ' +
          'OIDC and claims. Identity does not automatically grant application authority, Soulseed ' +
          'governance authority, or a right to act in the world.',
      },
      {
        title: 'Canonical binding in Soulseed',
        body:
          'Where Soulseed applies, an ActorIdentity may relate to a canonical Actor in SoulseedAGI ' +
          'through an IdentityBinding. A binding is a controlled relation — not an ontology merge, ' +
          'and not permission to define or modify a Mind.',
      },
    ],
  },
  zh: {
    title: 'Figure 2 · 一个以 Actor 为中心的身份模型',
    caption:
      'Human 与 AIActor 作为一等身份主体，通过不同 Credential 进入同一个 Actor-native Identity ' +
      'Core。Soulseed Canonical Actor 只能通过 IdentityBinding 与 SoulAuth ActorIdentity 建立' +
      '关系 —— 而且只在这条 Binding 确实存在时。',
    zoom: '查看大图',
    human: { name: 'Human', sub: 'Actor Kind · 人类主体' },
    aiactor: { name: 'AIActor', sub: 'Actor Kind · AI 主体' },
    actorIdentity: {
      name: 'ActorIdentity',
      sub: '主体身份 · Canonical Actor Identity Anchor',
      note: '回答：这个 Actor 是谁？',
    },
    humanAccount: { name: 'HumanAccount', sub: '人类特有的账户扩展 · 可选' },
    humanCredential: { name: 'Human Credential', sub: '人类凭证 · Authentication Capability' },
    aiCredential: { name: 'AIActor Credential', sub: 'AI 凭证 · Authentication Capability' },
    around: {
      name: '围绕 ActorIdentity 的周边对象',
      sub: '它们与身份根有关系，但都不在认证路径上',
    },
    actorIdentity2: { name: 'ActorIdentity', sub: '同一个身份根' },
    soulseedActor: { name: 'Soulseed Canonical Actor', sub: '由 SoulseedAGI 拥有' },
    identityBinding: { name: 'IdentityBinding', sub: '身份绑定 · 受控的跨域关系' },
    bindingOptional: '可选 —— Standalone AIActor 无需绑定即可成立',
    core: {
      name: 'SoulAuth Core',
      sub: '身份与认证核心',
      items: [
        { name: 'Authentication 认证' },
        { name: 'AuthSession 认证会话' },
        { name: 'Token / OIDC' },
        { name: 'Audit & Attribution 审计与归因' },
      ],
    },
    output: { name: '已认证身份 / Claims', sub: '有界的 Protocol Projection' },
    anyapp: { name: 'Any Application', sub: '任意应用 · 独立消费方' },
    soulseedOS: { name: 'SoulseedOS', sub: '运行与治理' },
    neq: [
      'ActorIdentity ≠ HumanAccount',
      'ActorIdentity ≠ Credential',
      'ActorIdentity ≠ Client',
      'Client ≠ Actor',
    ],
    notes: [
      {
        title: '共享身份法位',
        body:
          'Human 与 AIActor 共享同一套 ActorIdentity 契约与一等身份法位。它们的 Credential、' +
          'Authentication Method 与 Lifecycle 可以不同 —— 同等法位不等于同一种实现。',
      },
      {
        title: '身份不产生 Authority',
        body:
          'SoulAuth 负责建立经过认证的身份，并通过 Session、Token、OIDC 与 Claims 提供给其他' +
          '系统。身份成立不自动产生 Application Authority、Soulseed Governance Authority 或' +
          '现实世界行动权。',
      },
      {
        title: 'Soulseed 中的 Canonical Binding',
        body:
          '在 Soulseed 适用时，ActorIdentity 可以通过 IdentityBinding 与 SoulseedAGI 中的' +
          'Canonical Actor 建立关系。Binding 是一条受控关系 —— 不是 Ontology 合并，也不构成' +
          '定义或修改 Mind 的权力。',
      },
    ],
  },
}

export const fig3: Record<'en' | 'zh', Fig3> = {
  en: {
    title: 'Figure 3 · SoulAuth — Actor-native identity infrastructure',
    caption:
      'With ActorIdentity as the identity root, organising credential, authentication, ' +
      'AuthSession, OIDC, security and audit. This maps logical responsibilities — it is not a ' +
      'runtime sequence and not a deployment diagram.',
    zoom: 'Open full size',
    clients: [
      { name: 'Browser' }, { name: 'App' }, { name: 'Backend' },
      { name: 'AI Client' }, { name: 'Admin' },
    ],
    edge: { name: 'Access & Protocol Edge', sub: 'HTTP / REST · OIDC endpoints · Client APIs · Admin API' },
    core: { name: 'SoulAuth Core' },
    identityDomain: { name: 'Identity Domain' },
    actorIdentity: { name: 'ActorIdentity', sub: 'Identity root' },
    humanAccount: { name: 'HumanAccount', sub: 'Human-specific · optional' },
    identityBinding: { name: 'IdentityBinding', sub: 'External ↔ ActorIdentity' },
    credential: { name: 'Credential', sub: 'How an Actor proves itself' },
    authCore: { name: 'Authentication Core', sub: 'Verifies evidence against the declared contract' },
    authSession: { name: 'AuthSession', sub: 'Bounded authentication continuity' },
    tokenFed: { name: 'Token & Federation', sub: 'Protocol projection outward' },
    output: { name: 'Authenticated identity / claims', sub: 'Verified facts, bounded by contract' },
    planes: [
      {
        name: 'Control Plane',
        items: [
          { name: 'Identity', sub: 'lifecycle' },
          { name: 'Credential', sub: 'lifecycle' },
          { name: 'Client', sub: 'registration' },
          { name: 'Authority', sub: 'SoulAuth-local only' },
        ],
      },
      {
        name: 'Security Protection',
        items: [
          { name: 'Credential', sub: 'protection' },
          { name: 'Abuse control', sub: 'rate / lockout' },
          { name: 'Replay', sub: 'protection' },
          { name: 'Key', sub: 'lifecycle' },
        ],
      },
      {
        name: 'Audit & Attribution',
        items: [
          { name: 'Actor', sub: 'attribution' },
          { name: 'Security', sub: 'events' },
          { name: 'Tamper-evident', sub: 'not tamper-proof' },
        ],
      },
    ],
    anyapp: { name: 'Any Application', sub: 'Consumes declared contracts' },
    soulseedOS: { name: 'SoulseedOS', sub: 'Runtime & governance consumer' },
    persistence: { name: 'Persistence & Infrastructure', sub: 'Logical stores ≠ physical databases' },
    stores: [
      { name: 'Identity' }, { name: 'Credential' }, { name: 'AuthSession' },
      { name: 'OIDC' }, { name: 'Security' }, { name: 'Audit' },
    ],
    infra: [
      { name: 'Persistence adapter' }, { name: 'Key management' },
      { name: 'External IdP' }, { name: 'Delivery' },
    ],
    neq: [
      'Architecture component ≠ Deployment unit',
      'One database ≠ One domain',
      'Adapter ≠ Semantic owner',
    ],
  },
  zh: {
    title: 'Figure 3 · SoulAuth —— Actor-native 身份基础设施架构',
    caption:
      '以 ActorIdentity 为身份根，组织 Credential、Authentication、AuthSession、OIDC、Security ' +
      '与 Audit。这是一张 Logical Responsibilities 图 —— 不是 Runtime Sequence，也不是 ' +
      'Deployment Diagram。',
    zoom: '查看大图',
    clients: [
      { name: 'Browser 浏览器' }, { name: 'App 应用' }, { name: 'Backend 后端' },
      { name: 'AI Client' }, { name: 'Admin 管理员' },
    ],
    edge: { name: 'Access & Protocol Edge 接入与协议边界', sub: 'HTTP / REST · OIDC Endpoints · Client APIs · Admin API' },
    core: { name: 'SoulAuth Core 核心域' },
    identityDomain: { name: 'Identity Domain 身份域' },
    actorIdentity: { name: 'ActorIdentity', sub: '主体身份 · 身份根' },
    humanAccount: { name: 'HumanAccount', sub: '人类特有 · 可选' },
    identityBinding: { name: 'IdentityBinding', sub: '外部身份 ↔ ActorIdentity' },
    credential: { name: 'Credential', sub: '主体用于证明自己的凭证' },
    authCore: { name: 'Authentication Core 认证核心', sub: '按声明的 Contract 验证 Evidence' },
    authSession: { name: 'AuthSession 认证会话', sub: '有界的认证连续性' },
    tokenFed: { name: 'Token & Federation 令牌与联邦', sub: '向外的 Protocol Projection' },
    output: { name: '已认证身份 / Claims', sub: '经过验证、受 Contract 约束的事实' },
    planes: [
      {
        name: 'Control Plane 控制平面',
        items: [
          { name: 'Identity', sub: '生命周期' },
          { name: 'Credential', sub: '生命周期' },
          { name: 'Client', sub: '注册与配置' },
          { name: 'Authority', sub: '仅治理 SoulAuth 自身' },
        ],
      },
      {
        name: 'Security Protection 安全防护',
        items: [
          { name: 'Credential', sub: '凭证保护' },
          { name: 'Abuse control', sub: '限流 / 锁定' },
          { name: 'Replay', sub: '重放保护' },
          { name: 'Key', sub: '密钥生命周期' },
        ],
      },
      {
        name: 'Audit & Attribution 审计与归因',
        items: [
          { name: 'Actor', sub: '主体归因' },
          { name: 'Security', sub: '安全事件' },
          { name: 'Tamper-evident', sub: '可检测篡改，非不可篡改' },
        ],
      },
    ],
    anyapp: { name: 'Any Application 任意应用', sub: '通过声明的 Contract 消费' },
    soulseedOS: { name: 'SoulseedOS', sub: '运行与治理侧消费者' },
    persistence: { name: 'Persistence & Infrastructure 持久化与基础设施', sub: 'Logical Store ≠ Physical Database' },
    stores: [
      { name: 'Identity 身份' }, { name: 'Credential 凭证' }, { name: 'AuthSession 会话' },
      { name: 'OIDC' }, { name: 'Security 安全状态' }, { name: 'Audit 审计' },
    ],
    infra: [
      { name: 'Persistence Adapter' }, { name: 'Key Management' },
      { name: 'External IdP' }, { name: 'Delivery' },
    ],
    neq: [
      'Architecture Component ≠ Deployment Unit',
      'One Database ≠ One Domain',
      'Adapter ≠ Semantic Owner',
    ],
  },
}
