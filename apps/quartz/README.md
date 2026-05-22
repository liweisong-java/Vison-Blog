# Quartz 前台

这个目录承接 `Quartz 4` 公开博客前台。

当前阶段它的职责是：

- 作为未来公开博客的迁移前台
- 直接读取仓库根目录下的 `content/vault/posts`
- 与现有 `apps/blog` 并行存在，先做联调与迁移验证

常用命令：

```bash
pnpm dev:quartz
pnpm build:quartz
```

说明：

- 现阶段 `Quartz` 还没有接管正式线上入口
- 统一内容中间层是 `content/vault`
- 后续会继续做中文首页、文章页和归档页主题定制
