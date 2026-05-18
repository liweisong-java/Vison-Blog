# GitHub Actions 清理说明

这个仓库内置了一个专门用来清理旧 `workflow runs` 的工具：

```text
.github/workflows/actions-cleanup.yml
```

它的目标很简单：

- 定时删除过旧的 GitHub Actions 运行记录
- 保留每个 workflow 最近一批记录，避免把最近排错线索删掉
- 减少 Actions 页面噪音，控制运行历史体积

## 默认策略

当前默认规则是：

- 每周日 `04:25 UTC` 自动运行一次
- 只处理 `completed` 状态的 workflow runs
- 只清理 `21` 天之前的旧记录
- 每个 workflow 至少保留最近 `20` 条记录

也就是说，它不会去碰：

- 正在运行的任务
- 最近几周的新记录
- 每个 workflow 最近一小段可回溯历史

## 手动执行

如果你想先预演一次：

1. 打开仓库 `Actions`
2. 进入 `actions-cleanup`
3. 点击 `Run workflow`
4. 按需填写参数

可选参数：

- `older_than_days`：只清理多少天之前的旧记录
- `keep_latest`：每个 workflow 至少保留多少条最近记录
- `dry_run`：是否只预演、不真实删除

推荐第一次先这样试：

- `older_than_days = 21`
- `keep_latest = 20`
- `dry_run = true`

## 权限

这个 workflow 只需要两类权限：

- `actions: write`
- `contents: read`

核心原因是它要调用 GitHub Actions 官方接口去删除旧的 workflow run 记录。

## 适合你的使用方式

如果你只是个人博客仓库，建议先用下面这套：

- 自动定时清理保持开启
- 手动运行时默认先 `dry_run`
- 不要把 `older_than_days` 设得太小
- 不要把 `keep_latest` 设成 `0`

比较稳妥的范围通常是：

- `older_than_days`: `14` 到 `30`
- `keep_latest`: `10` 到 `30`

## 和仓库保留策略的关系

GitHub 本身也支持配置日志和 artifact 的保留时间，但那更偏平台级保留策略。

这个仓库里的 `actions-cleanup` 更像是一个“主动打扫历史记录”的补充工具，适合：

- workflow 比较多
- 触发比较频繁
- 你想自己控制页面整洁度

## 建议

如果以后你发现 Actions 还是太吵，优先顺序建议是：

1. 先减少不必要的 workflow 触发
2. 再给关键 workflow 增加 `concurrency`
3. 最后再靠 `actions-cleanup` 做定期打扫

清理工具是兜底，不应该替代 workflow 设计本身。
