# chongk-plugin-market

DSH 内置**插件市场**：侧栏一个入口，中栏一个全宽的插件浏览器。卡片展示每个 DSH 插件的
来源仓库、版本、许可、能否安装与静态能力扫描结果，点一下复制 `dsh plugin add` 命令。

形态参照 DSH 生态里已有的技能中心类插件（侧栏 `sidebar.panellist` + 中栏 `main` 两个座位，
共用一个 panel id），视觉参照 [chongk.com](https://chongk.com/)（虫库 Skill）的目录站设计语言。

## 组成

```
package.json          插件清单：dsh.bundle.patch + dsh.client + ./client 导出
cordis.patch.yml      bundle 补丁：插入一行 plugin-market
lib/index.js          宿主半区：/api/plugin-market/* 四个路由
lib/client.js         浏览器半区：侧栏入口 + 中栏页面
lib/panel.css         样式源文件（可编辑）
lib/panel-css.js      生成物：把 panel.css 内联成字符串（勿手改）
data/catalog.json     随包发布的目录数据
locale/{zh,en}.json   显示文案
icon.svg              面板图标
tests/host.test.mjs   宿主半区测试（17 项）
tests/client.test.mjs 浏览器半区测试（7 项）
```

## 宿主半区路由

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/plugin-market/list` | 目录分页，支持 `q` / `category` / `only` / `limit` / `offset` |
| GET | `/api/plugin-market/item?id=` | 单个插件，含完整能力清单（`id` 可用 slug 或包名） |
| GET | `/api/plugin-market/meta` | 总数、分类计数、数据生成时间 |
| GET | `/api/plugin-market/catalog` | 原始目录数据 |

`only` 取值：`installable`（声明可安装）、`client`（含界面）、`clean`（低敏感能力）。

路由注册在 `ctx.effect` 里，卸载插件即释放全部路由；重复注册会抛错而不是静默覆盖。

## 配置

| 字段 | 默认 | 含义 |
|---|---|---|
| `catalog` | 空 | 换成 http(s) 地址则从远端拉目录，留空用包内 `data/catalog.json` |
| `pageSize` | 60 | 单次 `list` 最多返回多少条（调用方传更大的 `limit` 也会被压到这个上限） |

## 安装

在 DSH 的「添加插件」里，或终端里：

```bash
# 本地目录（开发用，只在你自己机器上有效）
dsh plugin --profile <profile> add link:<本目录绝对路径>

# 从 npm 装（发布后，任何人可用）
dsh plugin --profile <profile> add <包名>
```

> 那个输入框只要**规格本身**，不要把整条命令粘进去 —— `dsh plugin --profile x add link:…`
> 整句会被判成 `not a package name the registry accepts`。路径必须是绝对路径。

或作为 profile bundle 手动插入（把 `package.json` 的 `dsh.profile.bundles` 加上本包名）。

## 验证

```bash
# 宿主半区：对着真实 @deepseek-ai/cordis + schemastery 跑
node --import <repo>/plugin-demo/dev/register.mjs tests/host.test.mjs

# 浏览器半区：不需要浏览器，用假 window/React/slots 驱动真实文件
node tests/client.test.mjs

# 改了样式之后重新内联（CSS 进 client.js，不再有 panel-css.js）
python <repo>/dsh-directory/build_panel_css.py
```

两套测试都不需要活的 harness，因此在任何有 Node 的地方都能跑。

## 安全边界

- 只读公开元数据：npm registry 的 manifest 字段，以及包内 tarball 的静态文本
- **从不** import / require / spawn 任何第三方包代码
- 面板只展示信息与复制命令，**不代为安装**——安装仍走 DSH 自己的 `dsh plugin` / `plugin_manager`

## 在真实 harness 里验证过

2026-10-16 用一次性 `DSH_HOME`（独立 profile、独立端口，不影响正在使用的 harness）实测：

| 检查 | 结果 |
|---|---|
| 宿主半区 | 激活无报错，四个路由全部 200 |
| `GET /api/plugin-market/meta` | 200，`total=2624` |
| `GET /api/plugin-market/list?limit=2` | 200，返回目录 JSON |
| 浏览器半区 | 侧栏出现「插件市场」入口，点开后市场页渲染完整（六个统计数字、搜索框、筛选芯片、卡片网格） |

要让它加载，有两处**必须**的写法（都是实测踩出来的，不是风格偏好）：

1. **依赖要按 DSH 的约定声明。** `dsh/index.js` 里 `import Schema from '@deepseek-ai/schemastery'`
   要求它出现在 `dependencies`（真实依赖，包管理器装进来）；`@deepseek-ai/cordis`、`react`
   和各个 `dsh-client-*` 出现在 `peerDependencies`（由宿主提供）。
   曾经 `dependencies` 是空的，宿主直接报 `failed to import: Cannot find package
   '@deepseek-ai/schemastery'`。
2. **浏览器半区不能有相对 require。** DSH 的客户端模块加载器只解析平台内置词（`react`）和
   已注册的模块工厂，`require('./panel-css.js')` 会被拒绝：
   `import failed: client-modules: ... missed the module table`。
   所以样式由 `build_panel_css.py` 内联进 `lib/client.js`。这也正是所有能正常加载的客户端插件
   都是自包含单文件 bundle 的原因。

## 已知局限

- 目录数据是**构建期快照**（`data/catalog.json`，2624 条，约 3.6 MB），不是实时查询；
  刷新需重跑采集与 `export_panel_data.py`
- 未做真实安装验证，卡片上的「可安装」是**声明**（包里有 `dsh.bundle`），不是实测结果
- 能力扫描只覆盖包内源码，跳过 `node_modules`
- 宿主半区与浏览器半区的自动化测试用的是假 DOM / 真实 cordis，**不是**真实浏览器；
  真实 GUI 是人工跑过一次（见上表）
