// 状态词的**唯一**定义处。
//
// 它们不是形容词。GA-07 §12 把它们定死成一组互不蕴含的判定：
// `implemented` 不蕴含 `supported`，`supported` 不蕴含 `conformant`，
// 任何一级都不蕴含 `certified`。文档里出现「支持 X」这种话时，
// 读者必须能点开看到它到底是哪一级、由谁证明。
//
// 结构是「五级阶梯 + 两个正交标记」，一共七个：
//
//   implemented → supported → tested → conformant → certified   顺序即强度
//   planned     架构描述了、本 Release 没有         正交
//   deprecated  还在、但要移除                       正交
//
// 别再把这里说成「六个词」。页面上曾经出现过两份互相冲突的「六个」：
// 首页把 `planned` 算进去、挤掉了 `deprecated`，status/spec 两页反过来。
// 而 check-status.mjs 的中英对等检查抓不到这种**跨页面**的不一致 ——
// 两边同样写错时它是绿的。

export type StatusKind =
  | 'implemented'
  | 'supported'
  | 'tested'
  | 'conformant'
  | 'certified'
  | 'deprecated'
  | 'planned'

interface Word {
  /** 徽章上的短标签 */
  label: { en: string; zh: string }
  /** 悬停/展开时的完整判定 */
  meaning: { en: string; zh: string }
  /** 色板槽位 */
  tone: 'neutral' | 'live' | 'proven' | 'strong' | 'muted' | 'warn'
}

export const WORDS: Record<StatusKind, Word> = {
  implemented: {
    label: { en: 'implemented', zh: '已实现' },
    meaning: {
      en: 'The code path exists in this release. It does not imply that the behaviour is supported, tested, or that we take backward-compatibility responsibility for it.',
      zh: '本 Release 的代码里存在这条路径。**不**因此意味着它被支持、被测试，也不意味着我们为它承担向后兼容责任。',
    },
    tone: 'neutral',
  },
  supported: {
    label: { en: 'supported', zh: '已支持' },
    meaning: {
      en: 'This release formally carries the behavioural contract and backward-compatibility responsibility for it. It does not imply conformance to any external specification.',
      zh: '本 Release 正式承担它的行为契约与向后兼容责任。**不**因此意味着它符合任何外部规范。',
    },
    tone: 'live',
  },
  tested: {
    label: { en: 'tested', zh: '有测试' },
    meaning: {
      en: 'Automated evidence covers it. The guard is named on the badge — you can go read it.',
      zh: '有自动化证据覆盖。守卫的名字就写在徽章上，可以直接去读那条断言。',
    },
    tone: 'proven',
  },
  conformant: {
    label: { en: 'conformant', zh: '符合规范' },
    meaning: {
      en: 'Verified against an external specification. This is stronger than "tested" — the reference is the spec text, not our own expectations.',
      zh: '经过对照**外部规范**的符合性验证。它强于「有测试」——参照物是规范原文，不是我们自己的预期。',
    },
    tone: 'strong',
  },
  certified: {
    label: { en: 'certified', zh: '已认证' },
    meaning: {
      en: 'Certified through a standards organisation’s formal process. Nothing in SoulAuth carries this today, and self-declaration does not create it.',
      zh: '由标准组织的正式流程认证。SoulAuth 目前**没有任何一项**处于这一级，自我声明不构成认证。',
    },
    tone: 'strong',
  },
  deprecated: {
    label: { en: 'deprecated', zh: '已弃用' },
    meaning: {
      en: 'Still present, but scheduled for removal. Do not build new integrations on it.',
      zh: '仍然存在，但已列入移除计划。不要在它上面建新的集成。',
    },
    tone: 'warn',
  },
  planned: {
    label: { en: 'planned', zh: '规划中' },
    meaning: {
      en: 'Described by the architecture but **not present in this release**. Nothing you can call today.',
      zh: '架构描述了它，但**本 Release 里不存在**。今天没有任何东西可以调用。',
    },
    tone: 'muted',
  },
}
