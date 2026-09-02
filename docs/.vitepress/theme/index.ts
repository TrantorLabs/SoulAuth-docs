import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import Figure1 from './figures/Figure1.vue'
import Figure2 from './figures/Figure2.vue'
import Figure3 from './figures/Figure3.vue'
import Status from './status/Status.vue'
import ApiTable from './contracts/ApiTable.vue'
import ConfigTable from './contracts/ConfigTable.vue'
import ErrorTable from './contracts/ErrorTable.vue'
import PermissionTable from './contracts/PermissionTable.vue'
import StandardsTable from './contracts/StandardsTable.vue'
import SchemaBlock from './contracts/SchemaBlock.vue'
import './custom.css'
import './figures/diagram.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // 三张 Canonical Figure。只有这三张 —— 语料《Final Refinement
    // Constitution》§18 把公共核心图锁死为 WHERE / WHO / HOW 三张，
    // 其余图必须是局部解释图，不得冒充 Canonical Architecture Figure。
    app.component('Figure1', Figure1)
    app.component('Figure2', Figure2)
    app.component('Figure3', Figure3)

    // 状态徽章与一致性读数。
    //
    // 这两个组件把项目的诚实纪律做成**看得见的东西**：六个状态词本来只是
    // GA-07 §12 的一段定义，挂成徽章之后，读者点一下就知道「支持」这句话
    // 到底是哪一级、由哪条断言守着。未成立的部分连同原因一起摆出来，
    // 比只展示绿色更能回答「你凭什么这么说」。
    app.component('Status', Status)

    // Reference 区的四张表从 `docs/.vitepress/data/contracts/*.json` 渲染 ——
    // 那是 SoulAuth 仓库 `contracts/*.yaml` 的派生快照，来源 commit 记在
    // SOURCE.json 里并显示在每个页面上。
    //
    // 手写这些表是行不通的：端点、配置项、权限名一共几百条，人写必然漂移，
    // 而漂移的表看起来和准确的表一模一样。契约与运行代码的一致性由
    // SoulAuth 仓库的 conformance j1–j10 双向断言。
    app.component('ApiTable', ApiTable)
    app.component('ConfigTable', ConfigTable)
    app.component('PermissionTable', PermissionTable)
    app.component('StandardsTable', StandardsTable)
    // SchemaBlock 递归渲染嵌套类型，必须注册全局名才能自引用。
    app.component('SchemaBlock', SchemaBlock)

    // 错误码同理。这一条曾经是「完整枚举在 contracts/openapi.yaml 里」一句话
    // 打发掉的 —— 而那是全站唯一明确要求调用方 branch on it 的数据，
    // 却是唯一没有渲染出来的一份。
    app.component('ErrorTable', ErrorTable)
  },
} satisfies Theme
