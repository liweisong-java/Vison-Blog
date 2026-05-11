# 伟松的博客

一个面向中文写作者的轻量个人博客方案：用 `SiYuan` 写作，用本地发布器同步，用 `Astro` 生成静态站点。没有数据库，没有后台，部署成本低，适合长期个人维护，也适合继续扩展到公众号内容分发。

## 核心特性

- 中文优先的排版与阅读体验
- `SiYuan` 作为唯一内容源，适合手机和桌面混合写作
- 无数据库、无业务后端、无传统 CMS
- 内置 `init / doctor / dry-run / sync` 发布链路
- 自动生成博客文章，并可按需导出公众号兼容稿
- 支持 `Vercel` 静态部署与 `Giscus` 评论

## 架构概览

```text
SiYuan 笔记
  -> tools/publisher
  -> apps/blog/src/content/posts
  -> Astro 构建
  -> Vercel 部署
```

第一版的发布模型是“手机或电脑写作 -> 思源同步到主设备 -> 本机执行发布器 -> 静态站部署”。这条链路很轻，也足够稳定。

## 目录结构

```text
.
├── apps/blog           # Astro 博客前台
├── tools/publisher     # 思源发布器
├── docs/runbooks       # 使用与部署文档
└── exports/wechat      # 公众号兼容稿导出目录
```

## 快速开始

### 环境要求

- Node.js `20`
- pnpm `10`
- 已安装并可访问 API 的思源笔记

### 安装依赖

```bash
pnpm install
```

### 本地启动博客前台

```bash
pnpm dev
```

默认会启动 `apps/blog`，用于日常前台开发与样式调整。

## 思源发布工作流

### 1. 初始化发布器

```bash
pnpm publish:init
```

这一步会生成两个本地配置文件：

- `tools/publisher/.env`
- `tools/publisher/publisher.config.json`

### 2. 填写真实配置

可以先参考：

- [tools/publisher/.env.example](tools/publisher/.env.example)
- [tools/publisher/publisher.config.example.json](tools/publisher/publisher.config.example.json)

实际使用时需要编辑初始化生成的本地文件。最少需要补齐：

- `.env` 中的 `SIYUAN_TOKEN`
- `.env` 中的 `PUBLISH_BRANCH`
- `publisher.config.json` 中的 `notebookId`
- `publisher.config.json` 中的 `siyuanWorkspaceDir`

### 3. 检查环境

```bash
pnpm publish:doctor
```

这一步会检查：

- 思源工作区是否存在
- 内容目录是否可写
- 当前配置的笔记本是否可读取

### 4. 先预演，再正式同步

```bash
pnpm publish:dry-run
pnpm publish:sync
```

`dry-run` 只做预检查，不写入文件；`sync` 会正式生成或更新文章、清理失效内容、按需导出公众号兼容稿，并只提交受发布器托管的内容路径。

## 思源文档属性约定

为了方便在手机上录入，这个项目默认使用一组较短的自定义属性：

- `blog-pub`：是否发布，填 `true`
- `blog-cat`：分类，填 `tech` 或 `life`
- `blog-slug`：文章路径标识
- `blog-excerpt`：摘要
- `blog-date`：发布日期，格式 `YYYY-MM-DD`
- `blog-tags`：标签，多个标签用英文逗号分隔
- `blog-top`：是否置顶，填 `true` 或 `false`
- `blog-cover`：封面图
- `blog-canonical`：原始来源链接
- `blog-wechat`：是否生成公众号兼容稿

如果没有填写 `blog-slug`、`blog-excerpt`、`blog-date`，发布器会生成安全默认值。

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 启动博客前台开发环境 |
| `pnpm build` | 构建博客前台与发布器 |
| `pnpm test` | 运行单元测试 |
| `pnpm check` | 运行 Astro 检查并编译发布器 |
| `pnpm e2e` | 运行前台端到端测试 |
| `pnpm publish:init` | 初始化发布器本地配置 |
| `pnpm publish:doctor` | 检查思源与发布环境 |
| `pnpm publish:dry-run` | 预演同步，不落文件 |
| `pnpm publish:sync` | 正式同步内容 |

## 部署与评论

博客前台默认按静态站部署，推荐直接接入 `Vercel`：

- Root Directory 设为 `apps/blog`
- `SITE_URL` 设为线上域名
- 如果要开启评论，补齐这些环境变量：
- `GISCUS_REPO`
- `GISCUS_REPO_ID`
- `GISCUS_CATEGORY`
- `GISCUS_CATEGORY_ID`
- `GISCUS_MAPPING`
- `GISCUS_THEME`
- 如果要在内容同步后自动触发部署，可以配置 `PUBLISH_DEPLOY_HOOK`

详细说明见：

- [思源发布器使用手册](docs/runbooks/siyuan-publisher.md)
- [Vercel 部署说明](docs/runbooks/vercel-setup.md)

## 当前状态

- 已完成轻量博客架构重构
- 已支持真实思源内容同步
- 已支持文章导出到博客与公众号兼容稿
- 暂未内置“直接发公众号”的自动集成，当前阶段提供兼容稿导出

## 说明

- 仓库内的示例文章会保留，不会因为尚未开始同步思源内容而被误删
- 当 `blog-wechat` 从 `true` 改为 `false` 时，旧的公众号导出稿会在下次同步时自动清理
- 当前仓库未附带许可证文件；如果你准备公开发布，建议按你的发布意图补充许可证
