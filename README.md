# 伟松的博客

一个面向中文写作者的轻量个人博客方案：用 `SiYuan` 写作，用发布器同步内容，用 `Astro` 生成静态站点。项目支持两种运行方式，但默认推荐“服务器主导”模式：思源、发布器和静态站都在你自己的服务器上完成，GitHub 只负责保存代码和可公开内容。没有数据库，没有传统后台，部署成本低，适合长期个人维护，也适合继续扩展到公众号内容分发。

## 核心特性

- 中文优先的排版与阅读体验
- `SiYuan` 作为唯一内容源，适合手机和桌面混合写作
- 无数据库、无业务后端、无传统 CMS
- 内置 `init / doctor / dry-run / sync` 发布链路
- 自动生成博客文章，并可按需导出公众号兼容稿
- 支持本机自动监听思源变化并定时同步发布
- 支持服务器主导的定时巡检、本地构建和原子切换发布目录
- 支持 `master` 分支自动构建并部署到自托管静态服务器
- 支持受保护的 `secret-dashboard` 私有统计页
- 支持 `Giscus` 评论，`Vercel` 可作为可选部署方案

## 架构概览

推荐的服务器主导链路：

```text
浏览器访问服务器上的 SiYuan
  -> tools/publisher 同步思源内容
  -> apps/blog/src/content/posts
  -> 服务器本机构建 Astro
  -> /data/Vison-Blog/current 原子切换上线
  -> 可选推送 GitHub 做代码与内容备份
```

兼容保留的本机链路：

```text
手机或电脑写作
  -> 思源同步到本机
  -> 本机发布器同步内容
  -> GitHub Actions 构建并上传服务器
```

如果你希望服务器才是唯一主导，请优先使用第一种模式。

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

- Node.js `22.12+`
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

## 推荐部署模型

### 服务器主导

这是当前最推荐的正式模型：

- 服务器上运行 SiYuan Docker
- 服务器本机保存思源工作区
- 服务器定时执行 `pnpm publish:server-run`
- 服务器本机构建并切换 `/data/Vison-Blog/current`
- GitHub 只保存代码和公开内容，不再担任唯一生产发布入口

这条链路的好处是：

- 你的 Mac 不再是单点
- 服务器同时持有“代码 + 内容 + 构建产物”
- 线上内容更新不依赖 GitHub Actions 取到服务器之外的数据

需要注意：

- SiYuan 官方 Docker 服务端模式以浏览器访问为主，不是给桌面/手机 App 直连用的
- 如果你坚持使用本机思源 App 作为唯一编辑入口，更适合继续用下面的“本机主导”模式

### 本机主导

如果你还没迁到服务器写作，依然可以继续使用：

- 本机思源写作
- 本机发布器同步到 Git
- GitHub Actions 自动部署到服务器

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
- `publisher.config.json` 中的 `notebookId`
- `publisher.config.json` 中的 `siyuanWorkspaceDir`

`PUBLISH_BRANCH` 现在是可选项。默认会优先推送当前分支绑定的上游远端分支；只有你明确想改到别的发布分支时才需要填写，而且会做安全校验，防止误推。

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

### 5. 安装本机自动发布

如果你希望写完思源笔记后，由本机自动检查并发布：

```bash
pnpm publish:auto-install
```

安装后会发生这些事：

- 监听思源当前博客笔记本的数据目录变化
- 每 1 分钟做一次兜底检查，尽量把同步延迟压低
- 只有检测到笔记本内容变化时才会触发真正同步
- 同步成功后自动提交并推送到配置好的 Git 分支

常用自动发布命令：

```bash
pnpm publish:auto-status
pnpm publish:auto-once
pnpm publish:auto-uninstall
```

- `publish:auto-status`：查看当前自动发布状态、状态文件和日志路径
- `publish:auto-once`：手动触发一次“自动模式”巡检
- `publish:auto-uninstall`：卸载本机自动发布任务

### 6. 服务器主导发布

如果你已经把思源部署到服务器，并希望服务器自己拉代码、同步内容、构建和上线：

```bash
pnpm publish:server-run
```

这条命令会按顺序执行：

- `git fetch/pull master`
- 安装或校验依赖
- 刷新私有统计页数据
- 运行发布器同步思源内容
- 构建 Astro 站点
- 把 `apps/blog/dist` 发布到 `/data/Vison-Blog/current`

推荐再配合 `systemd timer` 做每 1 分钟一次的自动巡检。

### 7. 自动上线闭环

本机主导时，推荐把正式内容同步到 `master`，这样整条链路会变成：

```text
手机或电脑写作
  -> 思源同步回本机
  -> publish:auto-install 自动巡检
  -> 发布器提交并推送 master
  -> GitHub Actions 自动构建
  -> 静态产物上传到服务器
```

如果你已经配置好服务器部署 Secrets，那么只要思源内容被发布器推到 `master`，博客就会自动上线。

## 思源发文规则

现在默认是“少填甚至不填属性也能发”：

- 放在当前博客笔记本里的普通文档，默认都会参与发布
- 标题或路径里包含 `draft`、`草稿`、`未发布`、`未完成` 的文档会自动跳过
- `slug`、`excerpt`、`publishedAt` 会自动生成
- `category` 优先读属性，其次按标题、路径、正文关键词自动判断；判断不出时默认归到 `生活`
- `wechatReady` 默认开启，也就是会同时导出一份公众号兼容稿

只有在你想手动覆盖默认行为时，才需要补这些可选属性：

- `blog-pub`：填 `false` 可阻止该文发布
- `blog-cat`：手动指定 `tech` 或 `life`
- `blog-slug`：手动指定文章路径
- `blog-excerpt`：手动指定摘要
- `blog-date`：手动指定发布日期，格式 `YYYY-MM-DD`
- `blog-tags`：多个标签用英文逗号分隔
- `blog-top`：填 `true` 可置顶
- `blog-cover`：封面图
- `blog-canonical`：原始来源链接
- `blog-wechat`：填 `false` 可关闭公众号兼容稿导出

如果你思源里之前已经用了 `custom-blog-*` 这一套命名，发布器也会继续识别，不需要回头批量改属性名。

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
| `pnpm publish:auto-install` | 安装本机自动发布任务 |
| `pnpm publish:auto-status` | 查看自动发布状态 |
| `pnpm publish:auto-once` | 手动执行一次自动巡检 |
| `pnpm publish:auto-uninstall` | 卸载本机自动发布任务 |
| `pnpm publish:server-run` | 服务器主导模式下执行一次完整巡检、构建与上线 |

## 部署、自动上线与评论

默认推荐部署到你自己的静态服务器。

如果你采用服务器主导模式：

- 服务器本机会执行 `pnpm publish:server-run`
- 正式生产内容由服务器上的思源工作区决定
- GitHub Actions 更适合作为代码校验和静态备用部署通道

如果你采用本机主导模式：

- GitHub Actions 在 `master` 更新后自动构建并上传 `apps/blog/dist`
- 服务器上的 Web 服务根目录指向 `/data/Vison-Blog/current`
- 服务器只接收静态产物，不拉源码，不在服务器构建
- 仓库 Actions Secrets 里需要补 `SITE_URL` 与 `DEPLOY_*` 一组部署密钥

如果要开启评论，补齐这些环境变量：
- `GISCUS_REPO`
- `GISCUS_REPO_ID`
- `GISCUS_CATEGORY`
- `GISCUS_CATEGORY_ID`
- `GISCUS_MAPPING`
- `GISCUS_THEME`
- 如果你还想兼容 `Vercel`、Netlify 之类的平台，再额外配置 `PUBLISH_DEPLOY_HOOK`

详细说明见：

- [思源发布器使用手册](docs/runbooks/siyuan-publisher.md)
- [服务器静态部署说明](docs/runbooks/server-deploy.md)
- [私有统计页运维说明](docs/runbooks/private-dashboard.md)
- [Vercel 可选部署说明](docs/runbooks/vercel-setup.md)

## 私有统计页

仓库现在额外提供一个只给你自己看的私有统计页：

- 页面路径默认是 `/secret-dashboard/`
- 页面内容不会出现在导航、RSS 或 sitemap 里
- 页面会优先读取本地 `.superpowers/private-dashboard/dashboard.json`
- 建议通过 `Nginx Basic Auth` 保护整个私有路径和对应 JSON 目录

常用命令：

```bash
pnpm private:dashboard
pnpm private:dashboard:traffic
```

- `private:dashboard`：汇总文章内容统计、发布器状态和访问快照，生成私有 dashboard 数据
- `private:dashboard:traffic`：从 Umami 拉取访问统计快照

推荐做法是：

1. 在服务器上用 Basic Auth 保护 `/secret-dashboard/`
2. 在 GitHub Secrets 中配置 `UMAMI_BASE_URL`、`UMAMI_API_TOKEN`、`UMAMI_WEBSITE_ID`
3. 通过 `private-dashboard-refresh` workflow 定时刷新流量快照
4. 让 `deploy` workflow 在构建前执行 `pnpm private:dashboard`

## 当前状态

- 已完成轻量博客架构重构
- 已支持真实思源内容同步
- 已支持文章导出到博客与公众号兼容稿
- 已支持本机自动监听思源并定时同步发布
- 已支持服务器主导的定时巡检、本机构建与本地静态部署
- 已支持零手填优先的自动发文规则
- 已支持 `master` 分支自动构建并部署到自托管静态服务器
- 已支持私有统计页与本地 dashboard 快照生成
- 暂未内置“直接发公众号”的自动集成，当前阶段提供兼容稿导出

## 说明

- 服务器主导模式下，GitHub Actions 不能再作为唯一生产内容来源，因为云端构建拿不到服务器上的私有思源工作区
- SiYuan 官方 Docker 服务端模式更适合浏览器访问；如果你要完全服务器主导，建议接受“在浏览器里打开思源”这件事
- 当 `blog-wechat` 从 `true` 改为 `false` 时，旧的公众号导出稿会在下次同步时自动清理
- 当前仓库未附带许可证文件；如果你准备公开发布，建议按你的发布意图补充许可证
