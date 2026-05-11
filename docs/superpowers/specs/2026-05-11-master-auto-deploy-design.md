# Master 自动部署设计

## 背景

当前博客仓库已经完成以下基础能力：

- `master` 分支承载正式 Astro 博客代码
- GitHub Actions 已存在 `ci.yml`，会在 `push` 和 `pull_request` 时执行 `pnpm test / check / build / e2e`
- 博客最终产物是 `apps/blog/dist` 静态目录
- 仓库是公开仓库，不能在代码中泄露服务器地址、凭据、部署细节

用户希望新增一条正式部署链路：

- 当 `master` 分支发生变更时
- 自动构建博客
- 自动部署到服务器
- 目标目录为 `/data/Vison-Blog`

同时必须满足隐私要求：

- 仓库公开可见
- 服务器认证信息、主机信息、SSH 私钥、域名等敏感信息不能进入仓库
- 尽量减少服务器上暴露的源码和构建细节

## 目标

实现一条安全、可重复、适合公开仓库的自动部署链路：

1. `master` 上的推送触发自动部署
2. 部署前必须先通过完整校验
3. GitHub Actions 只向服务器上传静态产物，不上传源码
4. 服务器支持版本化发布与快速回滚
5. 所有敏感信息全部存放在 GitHub Secrets
6. 部署日志不打印敏感信息

## 非目标

本次不做这些事情：

- 不在仓库里保存服务器密码
- 不让服务器直接 `git pull` 公开仓库后本机构建
- 不接入 Docker、Kubernetes、CD 平台
- 不实现蓝绿流量切换
- 不自动签发 TLS 证书
- 不改造业务为 SSR 或 Node 常驻服务

## 方案对比

### 方案 A1：GitHub Actions 构建后直接覆盖 `/data/Vison-Blog`

流程：

1. Actions 拉代码
2. Actions 构建 `apps/blog/dist`
3. 通过 `rsync --delete` 直接覆盖服务器目标目录

优点：

- 最容易实现
- 服务器只需要静态文件目录

缺点：

- 部署中断时可能留下半成品
- 无法保留历史版本
- 回滚只能重新部署旧提交

### 方案 A2：GitHub Actions 构建后上传到 `releases/<sha>`，再切换 `current`

流程：

1. Actions 拉代码并构建 `apps/blog/dist`
2. 上传到服务器 `/data/Vison-Blog/releases/<commit-sha>`
3. 服务器原子更新 `/data/Vison-Blog/current` 软链
4. Web 服务始终指向 `current`

优点：

- 不暴露源码
- 支持版本化部署
- 切换更稳，部署失败不影响当前线上版本
- 回滚简单，只需把软链切回旧版本

缺点：

- 比直接覆盖多一层目录设计
- 需要补一个较小的远端脚本步骤

### 推荐方案

采用 `A2`。

理由：

- 与“公开仓库 + 服务器隐私优先”的前提最匹配
- 只上传静态产物，最小化服务器暴露面
- 对 Astro 静态站最自然
- 容易维护，后续也方便加回滚和健康检查

## 总体设计

### 触发条件

新增一个单独工作流，例如 `.github/workflows/deploy.yml`：

- 仅在 `push` 到 `master` 时触发
- 不在 `pull_request` 时触发
- 可加 `workflow_dispatch` 以便手动重发

### 部署前校验

部署 workflow 内部先执行完整校验：

- `pnpm install --frozen-lockfile`
- `pnpm exec playwright install --with-deps chromium`
- `pnpm test`
- `pnpm check`
- `pnpm build`
- `pnpm e2e`

只有全部通过，才进入部署阶段。

这样即使有人直接 push 到 `master`，部署也不会绕过质量门槛。

### 产物边界

只部署：

- `apps/blog/dist/**`

绝不部署：

- 仓库源码
- `.git`
- `tools/publisher`
- 思源本地配置
- `exports/wechat`
- GitHub workflow 文件
- 任意本地环境配置

### 服务器目录结构

服务器目标根目录：

`/data/Vison-Blog`

内部结构：

```text
/data/Vison-Blog/
  releases/
    <commit-sha>/
  current -> /data/Vison-Blog/releases/<commit-sha>
```

Web 服务应指向：

`/data/Vison-Blog/current`

这样部署新版本时，不会先破坏当前线上版本。

### 部署步骤

GitHub Actions 在部署阶段执行：

1. 准备 SSH 环境
2. 将构建后的 `apps/blog/dist/` 上传到：
   `/data/Vison-Blog/releases/${GITHUB_SHA}`
3. 远端执行软链切换：
   `ln -sfn /data/Vison-Blog/releases/${GITHUB_SHA} /data/Vison-Blog/current`
4. 可选清理较老版本

建议首次版本先不自动删除历史版本，只保留简单稳定。后续再加“只保留最近 N 个 release”。

## 隐私与安全设计

### GitHub Secrets

仓库内不保存任何真实连接信息，全部通过 Secrets 注入。

建议使用这些 Secret 名称：

- `DEPLOY_HOST`
- `DEPLOY_PORT`
- `DEPLOY_USER`
- `DEPLOY_SSH_KEY`
- `DEPLOY_KNOWN_HOSTS`

说明：

- `DEPLOY_HOST`：服务器地址
- `DEPLOY_PORT`：SSH 端口
- `DEPLOY_USER`：部署用户
- `DEPLOY_SSH_KEY`：专用部署私钥
- `DEPLOY_KNOWN_HOSTS`：`ssh-keyscan` 生成的主机指纹

### 明确不做的事

- 不把服务器密码写到 workflow
- 不把密码写到 README
- 不把主机地址硬编码进仓库文件
- 不在 Actions 日志输出私钥内容
- 不使用 `StrictHostKeyChecking=no` 作为长期方案

### 认证方式

推荐使用独立 SSH deploy key，而不是密码登录。

理由：

- GitHub Actions 对私钥注入支持更自然
- 可随时吊销
- 比 root 密码进入日志链路更安全

如果服务器当前只能密码登录，本次实现仍不应把密码落进仓库。正确做法是先在服务器上加一把专用公钥。

### 用户选择

推荐使用专门的部署用户，例如 `deploy`，并让它只拥有 `/data/Vison-Blog` 的写权限。

如果当前必须先使用 `root`，workflow 设计仍保持通用，不把 `root` 写死在仓库里，而是仍从 `DEPLOY_USER` 读取。

## Workflow 结构

建议新增 `deploy.yml`，保留现有 `ci.yml` 不动。

原因：

- `ci.yml` 保持纯验证职责
- `deploy.yml` 保持纯部署职责
- 更容易排查失败位置
- 不会把 PR 校验和线上部署耦合在一起

`deploy.yml` 的推荐结构：

1. `on.push.branches = [master]`
2. `workflow_dispatch`
3. 单个 `deploy` job
4. 步骤分为：
   - checkout
   - pnpm/node setup
   - install
   - playwright install
   - test/check/build/e2e
   - setup ssh
   - create release dir
   - rsync dist
   - switch current symlink

## 错误处理

### 构建失败

- 直接终止 workflow
- 不触碰服务器当前版本

### 上传失败

- workflow 失败
- 当前 `current` 软链保持不变

### 软链切换失败

- workflow 失败
- 新 release 目录可能已存在
- 当前线上版本仍保持旧版本

### 重复部署同一 SHA

- 允许覆盖同一 `releases/<sha>` 目录
- 或在远端先清空该 SHA 目录再上传
- 不视为错误

## 验证方案

实现后需要完成这些验证：

1. 本地检查 workflow YAML 无语法问题
2. 确认 workflow 只在 `master` push 与手动触发时部署
3. 确认 Secrets 全部通过环境注入，没有硬编码
4. 确认上传内容仅来自 `apps/blog/dist`
5. 确认远端目录结构符合 `releases/current` 设计
6. 确认软链切换后，当前目录指向最新 SHA

## 对现有仓库的影响

将新增或修改这些内容：

- 新增 `.github/workflows/deploy.yml`
- 更新部署说明文档，补充“自建服务器自动部署”章节
- 可选新增 `docs/runbooks/server-deploy.md`

不修改这些边界：

- 不改变博客构建方式
- 不改变思源发布器逻辑
- 不改变现有 `ci.yml` 校验职责

## 开放问题

当前还存在一个实现前必须确认的现实问题：

- 服务器 SSH 非交互登录尚未打通

在未打通前，可以先完成：

- workflow 设计
- Secrets 约定
- 文档

真正连服务器部署之前，需要用户在服务器上完成至少一项：

1. 配好专用 deploy key
2. 或提供一个能用于自动化的可登录 SSH 方案

## 最终决策

采用：

- GitHub Actions 构建
- 仅上传静态产物
- `releases/<sha> + current` 原子切换
- 全部连接信息保存在 GitHub Secrets
- 不在公开仓库内落任何服务器隐私
