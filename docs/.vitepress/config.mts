import { defineConfig } from 'vitepress'

// 站点部署在自定义域名 https://soulauth.trantorlabs.sg/ 上，所以 base 是根路径。
//
// 曾经是 `/SoulAuth-docs/`（GitHub Pages 项目页的路径）。挂上自定义域名之后
// 站点从根路径提供，那个 base 会让每一个资源与内部链接都指向
// `/SoulAuth-docs/...` —— 页面能打开、样式全丢、点任何链接都是 404。
//
// `DOCS_BASE` 仍然保留：如果要临时部署回项目页（或部署到某个子路径），
// 设成 `/SoulAuth-docs/` 即可，不必改代码。
const base = process.env.DOCS_BASE ?? '/'

const REPO = 'https://github.com/TrantorLabs/SoulAuth'

// SoulAuth Public Documentation 由 30 篇 Canonical Documents 组成，分 8 个
// Module。侧边栏结构直接照搬这个划分 —— 站点导航不自行发明第 31 个位置，
// 也不把某一篇挪到别的 Module 下面。
const EN_SIDEBAR = [
  {
    text: 'Start',
    items: [
      { text: 'What is SoulAuth', link: '/start/what-is-soulauth' },
      { text: 'Quickstart', link: '/start/quickstart' },
      { text: 'Choose an Integration Path', link: '/start/integration-path' },
    ],
  },
  {
    text: 'Concepts',
    items: [
      { text: 'AI-native Identity', link: '/concepts/ai-native-identity' },
      { text: 'Actor Identity Model', link: '/concepts/actor-identity-model' },
      { text: 'SoulAuth Architecture', link: '/concepts/architecture' },
    ],
  },
  {
    text: 'Integrate',
    items: [
      { text: 'Register a Client', link: '/integrate/register-a-client' },
      { text: 'Authorization Code Flow', link: '/integrate/authorization-code-flow' },
      { text: 'Browser & BFF', link: '/integrate/browser-and-bff' },
      { text: 'Verify Tokens', link: '/integrate/verify-tokens' },
      { text: 'Passwords & Email', link: '/integrate/passwords-and-email' },
      { text: 'Multi-Factor Auth', link: '/integrate/mfa' },
      { text: 'Social Login', link: '/integrate/social-login' },
      { text: 'Soulseed Integration', link: '/integrate/soulseed' },
    ],
  },
  {
    text: 'Operate',
    items: [
      { text: 'Deployment', link: '/operate/deployment' },
      { text: 'Production Checklist', link: '/operate/production-checklist' },
      { text: 'Operations & Recovery', link: '/operate/operations-and-recovery' },
      { text: 'Troubleshooting', link: '/operate/troubleshooting' },
    ],
  },
  {
    text: 'Security & Trust',
    items: [
      { text: 'Security Model', link: '/security/security-model' },
      { text: 'Threat Model', link: '/security/threat-model' },
      { text: 'Authentication Protection', link: '/security/authentication-protection' },
      { text: 'Standards & Conformance', link: '/security/standards-and-conformance' },
    ],
  },
  {
    text: 'Reference',
    items: [
      { text: 'API Conventions', link: '/reference/api-conventions' },
      { text: 'Authentication & Sessions', link: '/reference/authentication-and-sessions' },
      { text: 'Actors & Profiles', link: '/reference/actors-and-profiles' },
      { text: 'OIDC & Clients', link: '/reference/oidc-and-clients' },
      { text: 'Administration', link: '/reference/administration' },
      { text: 'Audit', link: '/reference/audit' },
      { text: 'Configuration', link: '/reference/configuration' },
    ],
  },
  {
    // 规范层。
    //
    // 这里放的是**架构与本体**，不是「当前 Release 会做什么」—— 两者混在
    // 一条阅读路径上，读者读完不知道哪些今天能调。分开之后，Concepts
    // 只讲你写代码前需要知道的，深度留在这一层，随时可以往下挖。
    text: 'Specification',
    items: [
      { text: 'Overview', link: '/spec/' },
      { text: 'Identity vs Authority', link: '/spec/identity-vs-authority' },
      { text: 'Soulseed & Mind OS', link: '/spec/soulseed-and-mind-os' },
    ],
  },
]

// 中文侧边栏是同一棵树，只翻译显示文本并加 /zh 前缀。
const ZH_TEXT: Record<string, string> = {
  Specification: '规范',
  Overview: '总览',
  Start: '开始',
  Concepts: '概念',
  Integrate: '接入',
  Operate: '运行',
  'Security & Trust': '安全与信任',
  Reference: '参考',

  'What is SoulAuth': 'SoulAuth 是什么',
  Quickstart: '快速开始',
  'Choose an Integration Path': '选择接入路径',
  'AI-native Identity': 'AI 原生身份',
  'Actor Identity Model': 'Actor 身份模型',
  'Identity vs Authority': '身份与权限',
  'Soulseed & Mind OS': 'Soulseed 与 Mind OS',
  'SoulAuth Architecture': 'SoulAuth 架构',
  'Register a Client': '注册 Client',
  'Authorization Code Flow': '授权码流程',
  'Browser & BFF': '浏览器与 BFF',
  'Verify Tokens': '验证 Token',
  'Passwords & Email': '口令与邮件',
  'Multi-Factor Auth': '多因子认证',
  'Social Login': '社交登录',
  'Soulseed Integration': 'Soulseed 接入',
  Deployment: '部署',
  'Production Checklist': '生产环境检查表',
  'Operations & Recovery': '运维与恢复',
  Troubleshooting: '故障排查',
  'Security Model': '安全模型',
  'Threat Model': '威胁模型',
  'Authentication Protection': '认证防护',
  'Standards & Conformance': '标准与符合性',
  'API Conventions': 'API 约定',
  'Authentication & Sessions': '认证与会话',
  'Actors & Profiles': 'Actor 与档案',
  'OIDC & Clients': 'OIDC 与 Client',
  Administration: '管理',
  Audit: '审计',
  Configuration: '配置',
}

const ZH_SIDEBAR = EN_SIDEBAR.map((group) => ({
  text: ZH_TEXT[group.text] ?? group.text,
  items: group.items.map((item) => ({
    text: ZH_TEXT[item.text] ?? item.text,
    link: `/zh${item.link}`,
  })),
}))

const EN_NAV = [
  { text: 'Start', link: '/start/what-is-soulauth', activeMatch: '/start/' },
  { text: 'Concepts', link: '/concepts/actor-identity-model', activeMatch: '/concepts/' },
  { text: 'Integrate', link: '/integrate/register-a-client', activeMatch: '/integrate/' },
  { text: 'Operate', link: '/operate/deployment', activeMatch: '/operate/' },
  { text: 'Reference', link: '/reference/api-conventions', activeMatch: '/reference/' },
]

const ZH_NAV = [
  { text: '开始', link: '/zh/start/what-is-soulauth', activeMatch: '/zh/start/' },
  { text: '概念', link: '/zh/concepts/actor-identity-model', activeMatch: '/zh/concepts/' },
  { text: '接入', link: '/zh/integrate/register-a-client', activeMatch: '/zh/integrate/' },
  { text: '运行', link: '/zh/operate/deployment', activeMatch: '/zh/operate/' },
  { text: '参考', link: '/zh/reference/api-conventions', activeMatch: '/zh/reference/' },
]

const DESCRIPTION =
  'Actor-native identity and authentication infrastructure. Human and AIActor enter the same first-class ActorIdentity contract.'

// 站点没有落地页：根路径直接跳进文档第一页。
//
// 跳转写在这里而不是 index.md 的 frontmatter 里，因为目标 URL 必须带 base，
// 而 base 可以被 DOCS_BASE 覆盖 —— 写死在 markdown 里换个部署路径就跳错了。
const REDIRECTS: Record<string, string> = {
  'index.md': 'start/what-is-soulauth',
  'zh/index.md': 'zh/start/what-is-soulauth',
}

export default defineConfig({
  base,
  transformPageData(pageData) {
    const to = REDIRECTS[pageData.relativePath]
    if (!to) return
    const url = base + to
    pageData.frontmatter.head = [
      ...(pageData.frontmatter.head ?? []),
      ['meta', { 'http-equiv': 'refresh', content: `0; url=${url}` }],
      ['link', { rel: 'canonical', href: url }],
    ]
  },
  title: 'SoulAuth',
  description: DESCRIPTION,
  lastUpdated: true,
  cleanUrls: true,
  ignoreDeadLinks: false,

  head: [
    ['meta', { name: 'theme-color', content: '#5b7cfa' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'SoulAuth' }],
    ['meta', { property: 'og:description', content: DESCRIPTION }],
  ],

  // 英文是主版本，落在根路径上；中文在 /zh/ 下。
  locales: {
    root: { label: 'English', lang: 'en-US', link: '/' },
    zh: {
      label: '简体中文',
      lang: 'zh-CN',
      link: '/zh/',
      description:
        'Actor-native 身份与认证基础设施。Human 与 AIActor 通过同一份 first-class ActorIdentity contract 进入系统。',
      themeConfig: {
        nav: ZH_NAV,
        sidebar: { '/zh/': ZH_SIDEBAR },
        outline: { level: [2, 3], label: '本页目录' },
        docFooter: { prev: '上一页', next: '下一页' },
        lastUpdatedText: '最后更新',
        darkModeSwitchLabel: '外观',
        lightModeSwitchTitle: '切换到浅色模式',
        darkModeSwitchTitle: '切换到深色模式',
        sidebarMenuLabel: '目录',
        returnToTopLabel: '回到顶部',
        langMenuLabel: '切换语言',
        editLink: {
          pattern: 'https://github.com/TrantorLabs/SoulAuth-docs/edit/main/docs/:path',
          text: '在 GitHub 上编辑此页',
        },
        footer: {
          message: '文档以 CC BY 4.0 授权；SoulAuth 本体以 Apache-2.0 授权。',
          copyright: 'Copyright © 2026 TRANTOR LABS, Singapore',
        },
      },
    },
  },

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'SoulAuth',

    socialLinks: [{ icon: 'github', link: REPO }],

    search: {
      provider: 'local',
      options: {
        locales: {
          zh: {
            translations: {
              button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
              modal: {
                displayDetails: '显示详情',
                resetButtonTitle: '清除查询条件',
                backButtonTitle: '返回',
                noResultsText: '无法找到相关结果',
                footer: {
                  selectText: '选择',
                  selectKeyAriaLabel: '回车',
                  navigateText: '切换',
                  navigateUpKeyAriaLabel: '上箭头',
                  navigateDownKeyAriaLabel: '下箭头',
                  closeText: '关闭',
                  closeKeyAriaLabel: 'esc',
                },
              },
            },
          },
        },
      },
    },

    outline: { level: [2, 3] },
    nav: EN_NAV,
    sidebar: { '/': EN_SIDEBAR },

    editLink: {
      pattern: 'https://github.com/TrantorLabs/SoulAuth-docs/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    footer: {
      message:
        'Documentation licensed under CC BY 4.0. SoulAuth itself is licensed under Apache-2.0.',
      copyright: 'Copyright © 2026 TRANTOR LABS, Singapore',
    },
  },
})
