# 思源发布器使用手册

这份手册只讲“怎么发”，默认你已经在这个仓库里完成依赖安装。

适合的使用方式：

- 手机上先记内容，或在电脑上直接写
- 在思源文档里补齐发布属性
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
- 如果线上部署分支不是 `master`，一定要改 `PUBLISH_BRANCH`

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

## 思源文档如何标记

发布器读取思源文档上的自定义属性。默认使用这一组适合手机录入的短字段：

- `blog-pub`：`true` 才会发布
- `blog-cat`：`tech` 或 `life`
- `blog-slug`：文章路径
- `blog-excerpt`：摘要
- `blog-date`：发布日期，格式 `YYYY-MM-DD`
- `blog-tags`：多个标签用英文逗号分隔
- `blog-top`：`true` 表示首页置顶
- `blog-cover`：封面图
- `blog-canonical`：原始链接
- `blog-wechat`：是否生成公众号兼容稿

如果没有填写 `blog-slug`、`blog-excerpt`、`blog-date`，发布器会自动补默认值。

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

- 从思源读取标记为发布的文档
- 生成或更新 `apps/blog/src/content/posts/**/index.mdx`
- 清理已取消发布或 `slug` 变化后的旧文章
- 按配置生成公众号兼容稿
- 仅提交发布器托管的内容目录
- 真正有内容提交时才触发部署钩子

仓库自带的示例文章和你手写放进仓库的文章，如果没有 `sourceId`，发布器会把它们视为非托管内容并保留，不会自动删除。

## 使用建议

- `blog-cat` 先固定使用 `tech` 和 `life`
- `blog-slug` 尽量尽早定好，后续修改会触发旧文章清理
- 暂时不想导出公众号稿时，把 `blog-wechat` 改成 `false`
- 某篇文章取消发布时，移除 `blog-pub=true` 后再同步一次即可

## 常见问题

- `pnpm publish:doctor` 不通过：先检查思源是否已启动、API token 是否正确、工作区路径是否写对
- `pnpm publish:dry-run` 报字段错误：通常是 `blog-cat`、`blog-date` 或 `blog-excerpt` 不符合要求
- 同步后没触发部署：先确认这次是否真的产生了 git 提交，再检查 `PUBLISH_DEPLOY_HOOK`
- 公众号导出稿没有更新：检查 `blog-wechat` 是否为 `true`，以及 `wechatExportDir` 是否已配置

## 相关文档

- [项目说明](../../README.md)
- [Vercel 部署说明](./vercel-setup.md)
