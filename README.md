# 伟松的博客

一个面向中文写作者的轻量个人博客方案：用 `SiYuan` 写作，用发布器整理内容，用 `Astro` 生成当前稳定站点，同时把内容同步到 `Quartz 4` 可直接消费的统一 Markdown 中间层。

它不是传统 CMS，也不是需要数据库的博客后台，而是一套偏“个人基础设施”的写作与发布方案：

- 写作入口统一在 `SiYuan`
- 博客内容由发布器同步生成
- 公开站点保持纯静态，方便部署和长期维护
- 私有入口、统计页、自动发布链路都围绕个人使用场景来设计

当前仓库支持两种运行方式，但默认推荐“服务器主导”模式：思源、发布器和静态站都在你自己的服务器上完成，GitHub 只负责保存代码和可公开内容。

## 适合谁

如果你符合下面这些情况，这个项目会比较适合你：

- 你主要用中文写作，希望排版、阅读和发布链路都围绕中文内容优化
- 你已经在用 `SiYuan`，不想再额外维护一套 CMS 后台
- 你希望博客尽量轻，最好没有数据库、没有复杂后端
- 你希望内容可以在博客发布的同时，顺手导出一份公众号兼容稿
- 你希望未来把“博客、私人入口、统计页、自动部署”都整合成自己的长期写作基础设施

## 核心特性

- 中文优先的排版与阅读体验
- `SiYuan` 作为唯一内容源，适合手机和桌面混合写作
- 无数据库、无业务后端、无传统 CMS
- 公开博客、文章页、归档、标签页与关于我页面已经整理为统一内容流
- 支持隐藏的 `/desk/` 个人中控台与 `/secret-dashboard/` 私有统计页
- 内置 `init / doctor / dry-run / sync` 发布链路
- 自动生成博客文章，并可按需导出公众号兼容稿
- 支持本机自动监听思源变化并定时同步发布
- 支持服务器主导的定时巡检、本地构建和原子切换发布目录
- 支持 `master` 分支自动构建并部署到自托管静态服务器
- 支持 `private-dashboard-refresh` 与 `actions-cleanup` 自动化工作流
- 支持 `Giscus` 评论，`Vercel` 可作为可选部署方案

## 两种运行方式

### 1. 服务器主导，推荐正式使用

这是当前最推荐的模式：

```text
浏览器访问服务器上的 SiYuan
  -> tools/publisher 同步思源内容
  -> content/vault/posts
  -> 服务器本机构建 Astro
  -> /data/Vison-Blog/current 原子切换上线
  -> 可选推送 GitHub 做代码与内容备份
```

适合你想把“内容源、构建、上线”都收回到自己服务器上的场景。

### 2. 本机主导，兼容保留

如果你暂时还主要在自己的 Mac 上写作，也可以继续用下面这条链路：

```text
手机或电脑写作
  -> 思源同步到本机
  -> 本机发布器同步内容
  -> GitHub Actions 构建并上传服务器
```

如果你希望服务器才是唯一主导，请优先使用第一种模式；如果你还没迁移完成，本仓库也不会强迫你一次切完。

## 目录结构

```text
.
├── apps/blog                 # 现有 Astro 博客前台、/desk、/secret-dashboard
├── apps/quartz               # 迁移中的 Quartz 4 前台骨架
├── content/vault             # 统一 Markdown 内容中间层（迁移预备）
│   ├── posts                 # 发布器托管的文章内容
│   └── assets                # 发布器托管的文章资源
├── tools/publisher           # 思源发布器、自动发布与服务器安装命令
├── scripts                   # 服务器发布循环、私有 dashboard 生成、Umami 拉取
├── .github/workflows         # ci / deploy / private-dashboard-refresh / actions-cleanup
├── docs/runbooks             # 使用与部署文档
└── exports/wechat            # 公众号兼容稿导出目录
```

## 快速开始

### 5 分钟体验

如果你只是先把项目跑起来，最短路径是：

```bash
pnpm install
pnpm dev
```

然后打开本地博客前台，先看页面和样式是否符合你的预期。

如果你准备接思源发布链路，再继续执行：

```bash
pnpm publish:init
pnpm publish:doctor
pnpm publish:dry-run
```

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

如果你要单独调试发布器，也可以直接运行：

```bash
pnpm dev:publisher
```

如果你准备开始验证新的公开前台骨架，也可以运行：

```bash
pnpm dev:quartz
```

## 仓库里有什么页面

当前仓库已经内置这几类页面：

- `/`：公开首页
- `/posts/:slug/`：文章详情页
- `/archive/`：归档页
- `/tags/` 与 `/tags/:tag/`：标签页
- `/about/`：关于我
- `/desk/`：隐藏的个人中控台，不出现在导航和 sitemap 中
- `/secret-dashboard/`：隐藏的私有统计页，默认不进导航、RSS 和 sitemap，建议用 `Nginx Basic Auth` 保护

对于第一次接触这个仓库的人，可以简单理解成：

- 公开部分：博客首页、文章页、归档、标签、关于我
- 私人部分：`/desk/` 个人中控台、`/secret-dashboard/` 站点统计
- 内容来源：`SiYuan`
- 内容落地：`content/vault/posts`（标准 `.md`）
- 兼容镜像：`apps/blog/src/content/posts`（Astro 继续读取的 `.md/.mdx`）

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
- `publisher.config.json` 中的 `source.type`
- `publisher.config.json` 中的 `source.notebookId`
- `publisher.config.json` 中的 `source.workspaceDir`

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
- 不再要求分类属性，所有内容会直接进入统一内容流
- `wechatReady` 默认开启，也就是会同时导出一份公众号兼容稿

只有在你想手动覆盖默认行为时，才需要补这些可选属性：

- `blog-pub`：填 `false` 可阻止该文发布
- `blog-slug`：手动指定文章路径
- `blog-excerpt`：手动指定摘要
- `blog-date`：手动指定发布日期，格式 `YYYY-MM-DD`
- `blog-tags`：多个标签用英文逗号分隔
- `blog-top`：填 `true` 可置顶
- `blog-cover`：封面图
- `blog-canonical`：原始来源链接
- `blog-wechat`：填 `false` 可关闭公众号兼容稿导出

如果你思源里之前已经用了 `custom-blog-*` 这一套命名，发布器也会继续识别，不需要回头批量改属性名。
如果你之前还保留了 `blog-cat` 或 `custom-blog-cat`，发布器依然兼容；只是新内容已经不再需要它。

## 常用命令

| 命令                               | 说明                      |
|----------------------------------|-------------------------|
| `pnpm dev`                       | 启动博客前台开发环境              |
| `pnpm dev:blog`                  | 单独启动博客前台                |
| `pnpm dev:publisher`             | 单独启动发布器开发命令入口           |
| `pnpm build`                     | 构建博客前台与发布器              |
| `pnpm test`                      | 运行单元测试                  |
| `pnpm check`                     | 运行 Astro 检查并编译发布器       |
| `pnpm e2e`                       | 运行前台端到端测试               |
| `pnpm publish:init`              | 初始化发布器本地配置              |
| `pnpm publish:doctor`            | 检查思源与发布环境               |
| `pnpm publish:dry-run`           | 预演同步，不落文件               |
| `pnpm publish:sync`              | 正式同步内容                  |
| `pnpm publish:auto-install`      | 安装本机自动发布任务              |
| `pnpm publish:auto-status`       | 查看自动发布状态                |
| `pnpm publish:auto-once`         | 手动执行一次自动巡检              |
| `pnpm publish:auto-uninstall`    | 卸载本机自动发布任务              |
| `pnpm publish:server-run`        | 服务器主导模式下执行一次完整巡检、构建与上线  |
| `pnpm private:dashboard`         | 生成私有统计页需要的 dashboard 快照 |
| `pnpm private:dashboard:traffic` | 从 Umami 拉取访问统计快照        |

## GitHub Actions

仓库当前内置了 4 条主要工作流：

- `ci.yml`：在 `master`、`main` 推送和 `pull_request` 时执行 `pnpm test / check / build / e2e`
- `deploy.yml`：在 `master` 推送或手动触发时执行构建校验，并在部署密钥齐全时把 `apps/blog/dist` 上传到服务器
- `private-dashboard-refresh.yml`：按小时刷新一次 Umami 访问快照，并重新生成私有 dashboard 数据
- `actions-cleanup.yml`：定时清理过旧的 GitHub Actions 运行记录

如果你采用“本机主导”部署，`deploy.yml` 是正式上线的主通道。
如果你采用“服务器主导”部署，`deploy.yml` 更适合作为代码校验与静态备用通道，而不是唯一生产发布源。

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

`deploy.yml` 在真正执行上传前，还会先运行：

- `pnpm private:dashboard`
- `pnpm test`
- `pnpm check`
- `pnpm build`
- `pnpm e2e`

也就是说，部署工作流默认带完整校验，不是“只推静态文件”。

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
- [GitHub Actions 清理说明](docs/runbooks/actions-cleanup.md)
- [Vercel 可选部署说明](docs/runbooks/vercel-setup.md)

## 个人中控台

仓库当前额外提供了一个隐藏的个人入口页：

- 页面路径：`/desk/`
- 页面定位：移动端优先的私人启动页
- 默认入口：博客首页、私有统计页、关于我
- 页面 head 已设置 `noindex,nofollow,noarchive`
- 页面不会出现在公开导航与 sitemap 中

这页更像“个人工作台”，而不是传统博客后台。
如果你准备把它真正暴露到公网，建议和 `/secret-dashboard/` 一样交给 Nginx 做额外路径保护。

## 私有统计页

仓库现在额外提供一个只给你自己看的私有统计页：

- 页面路径默认是 `/secret-dashboard/`
- 可从 `/desk/` 个人中控台进入
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

## GitHub Actions 清理

如果你觉得仓库里的 workflow 运行记录太多、太频繁，现在内置了一个专门的清理工具：

- workflow 文件：`.github/workflows/actions-cleanup.yml`
- 支持每周自动清理一次
- 支持手动执行时先 `dry_run` 预演
- 默认只清理 `21` 天前、且每个 workflow 超过最近 `20` 条之外的已完成记录

详细规则见：

- [GitHub Actions 清理说明](docs/runbooks/actions-cleanup.md)

## 当前状态

- 已完成轻量博客架构重构
- 已支持真实思源内容同步
- 已支持文章导出到博客与公众号兼容稿
- 已支持统一内容流与中文优先的阅读页排版
- 已支持本机自动监听思源并定时同步发布
- 已支持服务器主导的定时巡检、本机构建与本地静态部署
- 已支持零手填优先的自动发文规则
- 已支持 `master` 分支自动构建并部署到自托管静态服务器
- 已支持 `/desk/` 个人中控台
- 已支持私有统计页与本地 dashboard 快照生成
- 已支持定时刷新私有统计与自动清理 GitHub Actions 历史记录
- 暂未内置“直接发公众号”的自动集成，当前阶段提供兼容稿导出

## 说明

- 服务器主导模式下，GitHub Actions 不能再作为唯一生产内容来源，因为云端构建拿不到服务器上的私有思源工作区
- SiYuan 官方 Docker 服务端模式更适合浏览器访问；如果你要完全服务器主导，建议接受“在浏览器里打开思源”这件事
- `SITE_URL` 应该始终指向你的公开博客地址，而不是 `/desk/` 或 `/secret-dashboard/` 这类私有入口
- `.superpowers/private-dashboard/*.json`、`tools/publisher/.env`、`tools/publisher/publisher.config.json`
  都属于本地或服务器运行态文件，不应该作为公开仓库内容依赖
- 当 `blog-wechat` 从 `true` 改为 `false` 时，旧的公众号导出稿会在下次同步时自动清理
- 当前仓库未附带许可证文件；如果你准备公开发布，建议按你的发布意图补充许可证
