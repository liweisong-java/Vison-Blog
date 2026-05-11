# Vercel 部署说明

## 基础配置

1. 将仓库导入到 Vercel。
2. Root Directory 设置为 `apps/blog`。
3. `SITE_URL` 设置为你的正式域名。
4. 输出模式保持静态站点默认配置即可。

## 评论配置

如果要开启 `Giscus` 评论，在 Vercel 环境变量中补齐这些值：

- `GISCUS_REPO`
- `GISCUS_REPO_ID`
- `GISCUS_CATEGORY`
- `GISCUS_CATEGORY_ID`
- `GISCUS_MAPPING`
- `GISCUS_THEME`

## 自动部署

如果你希望内容同步后自动触发部署：

1. 在 Vercel 项目里创建 Deploy Hook。
2. 将生成的地址填入 `PUBLISH_DEPLOY_HOOK`，或写入 `publisher.config.json` 的 `deployHookUrl`。

## 建议

- 如果你确实要把内容同步推到非当前上游分支，再额外设置 `PUBLISH_BRANCH`
- 首次上线后先手动访问一遍文章页、归档页和关于我页面，确认 `SITE_URL` 与评论配置正常
