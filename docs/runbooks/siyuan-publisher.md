# 思源发布器使用手册

这份手册只讲“怎么发”，默认你已经在这个仓库里完成依赖安装。

适合的使用方式：

- 手机上先记内容，或在电脑上直接写
- 内容同步回这台 Mac
- 回到仓库执行同步命令
- 自动生成博客文章，并按需导出公众号兼容稿

## 一次性初始化

第一次在这台电脑上使用时，先执行：

```bash
pnpm publish:init
```

命令会生成两个本地配置文件：

- `tools/publisher/.env`
- `tools/publisher/publisher.config.json`

如果文件已经存在，初始化命令不会覆盖你现有的真实配置。

## 配置项说明

### `.env`

至少检查这些值：

- `SIYUAN_BASE_URL`
- `SIYUAN_TOKEN`
- `PUBLISH_REMOTE`
- `PUBLISH_BRANCH`
- `PUBLISH_DEPLOY_HOOK`

常见情况：

- 思源本机地址默认是 `http://127.0.0.1:6806`
- `SIYUAN_TOKEN` 需要在思源设置里获取
- `PUBLISH_BRANCH` 现在是可选项；默认会优先推送当前分支绑定的上游远端分支
- 如果你手动填写了 `PUBLISH_BRANCH`，它必须和当前分支或当前上游分支一致，不然发布器会拒绝推送

### `publisher.config.json`

最少要填写：

- `notebookId`
- `siyuanWorkspaceDir`

其余常用字段：

- `contentRoot`：博客文章输出目录
- `wechatExportDir`：公众号兼容稿导出目录
- `deployHookUrl`：可选，只有产生真实内容更新时才会触发

示例文件可以参考：

- [tools/publisher/.env.example](../../tools/publisher/.env.example)
- [tools/publisher/publisher.config.example.json](../../tools/publisher/publisher.config.example.json)

## 思源文档如何发布

现在默认不要求你手动补属性。

发布器会按下面的规则工作：

- 当前博客笔记本里的普通文档，默认直接进入发布候选
- 标题或路径里含有 `draft`、`草稿`、`未发布`、`未完成` 的文档，会自动跳过
- `slug`、`excerpt`、`publishedAt` 自动生成
- `category` 优先读属性，其次按标题、路径、正文里的关键词自动判断
- `wechatReady` 默认开启

只有需要覆盖默认行为时，才建议补属性：

- `blog-pub=false`：显式不发布
- `blog-cat=tech|life`：手动指定分类
- `blog-slug`：手动指定路径
- `blog-excerpt`：手动指定摘要
- `blog-date`：手动指定发布日期
- `blog-tags`：多个标签用英文逗号分隔
- `blog-top=true`：设为首页置顶
- `blog-cover`：封面图
- `blog-canonical`：原始链接
- `blog-wechat=false`：不导出公众号兼容稿

如果你已经在思源里用了 `custom-blog-*` 前缀的旧字段，发布器会继续兼容识别。

## 每次发文的顺序

### 1. 先检查环境

```bash
pnpm publish:doctor
```

这一步会确认：

- 思源工作区是否可访问
- 博客内容目录是否可写
- 当前笔记本是否能正常读取文档

### 2. 先预演

```bash
pnpm publish:dry-run
```

这一步不会真的写文件，适合先看本次会同步哪些文章、哪些字段需要修正。

### 3. 正式同步

```bash
pnpm publish:sync
```

正式同步时会做这些事：

- 从思源读取当前博客笔记本里的可发布文档
- 生成或更新 `apps/blog/src/content/posts/**/index.mdx`
- 清理已取消发布或 `slug` 变化后的旧文章
- 按配置生成公众号兼容稿
- 仅提交发布器托管的内容目录
- 真正有内容提交时才触发部署钩子

仓库自带的示例文章和你手写放进仓库的文章，如果没有 `sourceId`，发布器会把它们视为非托管内容并保留，不会自动删除。

## 自动发布

如果你希望“手机写完 -> 思源同步到这台 Mac -> 博客自己更新”，可以直接安装本机自动发布：

```bash
pnpm publish:auto-install
```

安装完成后：

- `launchd` 会监听当前思源博客笔记本的数据目录
- 每 5 分钟自动兜底检查一次
- 只有检测到笔记变化时才会真正执行同步
- 同步成功后自动提交并推送到当前安全分支目标

### 查看状态

```bash
pnpm publish:auto-status
```

你会看到：

- `plistPath`：macOS 自动任务配置文件
- `logPath`：自动发布日志文件
- `statePath`：自动发布状态文件
- `state`：最近一次成功或失败信息

### 手动补跑一次

```bash
pnpm publish:auto-once
```

这条命令适合你刚改完配置，想立刻让自动模式跑一遍的时候用。

### 卸载自动发布

```bash
pnpm publish:auto-uninstall
```

## 使用建议

- 如果文章只是草稿，直接放到带 `草稿` 或 `draft` 的标题、目录里即可，不必再专门补属性
- `blog-slug` 只有在你很在意固定 URL 时再手动填写
- 暂时不想导出公众号稿时，把 `blog-wechat` 改成 `false`
- 某篇文章取消发布时，写 `blog-pub=false` 后再同步一次即可

## 常见问题

- `pnpm publish:doctor` 不通过：先检查思源是否已启动、API token 是否正确、工作区路径是否写对
- `pnpm publish:dry-run` 报字段错误：通常是你手动填写的 `blog-cat`、`blog-date` 或 `blog-slug` 不符合格式
- 同步后没触发部署：先确认这次是否真的产生了 git 提交，再检查 `PUBLISH_DEPLOY_HOOK`
- 公众号导出稿没有更新：检查 `blog-wechat` 是否为 `true`，以及 `wechatExportDir` 是否已配置

## 相关文档

- [项目说明](../../README.md)
- [Vercel 部署说明](./vercel-setup.md)
