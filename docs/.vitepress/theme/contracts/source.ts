// 契约快照的来源标记。
//
// 每个从契约渲染出来的页面都要显示它 —— 一份看起来很精确、实际已经过时的
// 端点表，比没有表更糟：读者会照着它调。把来源 commit 摆在页面上，
// 「这份数据有多新」就成了读者自己能判断的事。

import SOURCE from '../../data/contracts/SOURCE.json'

export interface ContractSource {
  repo: string
  commit: string
  short: string
  branch: string
  committedAt: string
  dirty: boolean
}

export const source = SOURCE as ContractSource

export const REPO_URL = 'https://github.com/TrantorLabs/SoulAuth'

export function commitUrl(): string {
  return `${REPO_URL}/commit/${source.commit}`
}
