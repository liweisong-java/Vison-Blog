# 服务器静态部署说明

这份文档现在分两部分：

- A. 继续使用 GitHub Actions 作为正式部署入口
- B. 改成服务器主导，由服务器本地完成同步、构建和上线

如果你希望“服务器才是主导”，优先看下面的 B 方案。

## A. GitHub Actions 静态部署

这套博客兼容的云端静态部署方式是：

- `master` 分支接收内容和代码更新
- GitHub Actions 在云端构建静态产物
- 只把 `apps/blog/dist` 上传到服务器
- 服务器上的 Web 服务始终指向 `/data/Vison-Blog/current`

这样做的好处是：

- 服务器不需要拉源码
- 不需要在服务器安装完整前端构建环境
- 公开仓库里不会出现主机地址、密码、私钥
- 部署失败时不会污染当前线上版本

### 目录结构

服务器目标目录固定为：

```text
/data/Vison-Blog
  releases/
    <commit-sha>/
  current -> /data/Vison-Blog/releases/<commit-sha>
```

GitHub Actions 每次部署都会把新版本传到 `releases/<sha>`，再切换 `current` 软链。

### 1. 准备服务器目录

推荐使用单独的部署用户；如果暂时只能用现有用户，也至少让它只负责这个目录。

```bash
sudo mkdir -p /data/Vison-Blog/releases
sudo chown -R <deploy-user>:<deploy-group> /data/Vison-Blog
```

如果你已经有 Web 服务用户，也可以把目录权限交给现有用户组。

### 2. 生成专用 deploy key

在本机生成一把只给这个项目用的 SSH key：

```bash
ssh-keygen -t ed25519 -f ~/.ssh/vision-blog-deploy -C "vision-blog deploy"
```

生成后会得到：

- `~/.ssh/vision-blog-deploy`
- `~/.ssh/vision-blog-deploy.pub`

把公钥追加到服务器部署用户的 `authorized_keys`：

```bash
ssh <deploy-user>@<deploy-host> "install -m 700 -d ~/.ssh && touch ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
cat ~/.ssh/vision-blog-deploy.pub | ssh <deploy-user>@<deploy-host> "cat >> ~/.ssh/authorized_keys"
```

建议完成后单独验证一次免密登录：

```bash
ssh -i ~/.ssh/vision-blog-deploy -p <deploy-port> <deploy-user>@<deploy-host> "whoami"
```

### 3. 生成 known_hosts

为了避免在 CI 里关闭主机校验，先收集服务器指纹：

```bash
ssh-keyscan -p <deploy-port> <deploy-host>
```

把输出完整保存下来，后面放进 GitHub Secret：`DEPLOY_KNOWN_HOSTS`。

### 4. 配置 GitHub Secrets

到仓库的 `Settings -> Secrets and variables -> Actions` 中新增这些密钥：

- `SITE_URL`
- `DEPLOY_HOST`
- `DEPLOY_PORT`
- `DEPLOY_USER`
- `DEPLOY_SSH_KEY`
- `DEPLOY_KNOWN_HOSTS`

各字段含义：

- `SITE_URL`：博客正式访问地址，用于 sitemap、RSS 和 canonical
- `DEPLOY_HOST`：服务器地址或域名
- `DEPLOY_PORT`：SSH 端口
- `DEPLOY_USER`：部署用户
- `DEPLOY_SSH_KEY`：`~/.ssh/vision-blog-deploy` 私钥全文
- `DEPLOY_KNOWN_HOSTS`：`ssh-keyscan` 输出全文

注意：

- 不要把这些值写进仓库
- 不要把密码写进 workflow
- 就算暂时使用 `root`，也请通过 Secret 注入，而不是硬编码

### 5. 让 Web 服务指向 current

### Nginx

```nginx
server {
  listen 80;
  server_name example.com;

  root /data/Vison-Blog/current;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

### Caddy

```caddy
example.com {
  root * /data/Vison-Blog/current
  file_server
  try_files {path} {path}/ /index.html
}
```

如果你已经有 HTTPS、反向代理或 CDN，只需要把静态根目录换成 `current`。

### 为私有统计页加 Basic Auth

如果你启用了 `/secret-dashboard/`，建议直接在 Nginx 层保护它，而不是依赖“知道地址才看得到”：

```nginx
location ^~ /secret-dashboard/ {
  auth_basic "Private Dashboard";
  auth_basic_user_file /etc/nginx/.htpasswd-vision-blog;
  try_files $uri $uri/ /secret-dashboard/index.html;
}
```

如果你后续把私有 JSON 通过额外路径映射出来，也要一起加上：

```nginx
location ^~ /private-dashboard-data/ {
  auth_basic "Private Dashboard";
  auth_basic_user_file /etc/nginx/.htpasswd-vision-blog;
}
```

生成密码文件可以用：

```bash
sudo apt-get install apache2-utils
sudo htpasswd -c /etc/nginx/.htpasswd-vision-blog <your-user>
```

注意：

- 不要把密码写进仓库
- 不要把 `.htpasswd` 放到站点静态目录里
- 修改配置后记得 `sudo nginx -t && sudo systemctl reload nginx`

### 6. 首次上线

完成 Secrets 配置后，有两种触发方式：

1. 推送一次 `master`
2. 在 GitHub Actions 手动运行 `deploy` 工作流

工作流会先执行：

- `pnpm test`
- `pnpm check`
- `pnpm build`
- `pnpm e2e`

全部通过后才会上传静态产物。

### 7. 回滚

如果某个版本需要回滚，不用重新构建，只要把 `current` 指回旧版本：

```bash
ln -sfn /data/Vison-Blog/releases/<old-sha> /data/Vison-Blog/.next-current
mv -Tf /data/Vison-Blog/.next-current /data/Vison-Blog/current
```

回滚完成后刷新页面即可生效。

### 8. 常见问题

## B. 服务器主导部署

如果你要让服务器成为唯一主导，推荐使用下面这套结构：

```text
/data/Vison-Blog
  current -> /data/Vison-Blog/releases/<release-id>
  releases/
  repo/                # Git 工作目录
  siyuan/
    workspace/         # 思源工作区
```

### 1. 服务器准备

至少准备这些环境：

- Ubuntu 24.04+
- Docker
- Node.js 22.12+
- pnpm 10
- Git
- Nginx

### 2. 部署 SiYuan 服务端

推荐单独建目录：

```bash
mkdir -p /data/Vison-Blog/siyuan/workspace
```

官方 Docker 方案可以参考：

```bash
docker run -d \
  --name siyuan \
  -p 6806:6806 \
  -v /data/Vison-Blog/siyuan/workspace:/siyuan/workspace \
  b3log/siyuan \
  --workspace=/siyuan/workspace \
  --accessAuthCode=<你的访问码>
```

请注意：

- 这套模式更适合浏览器访问
- 不建议直接暴露到公网裸奔，最好放到 Nginx 和 HTTPS 后面
- 思源 API token 仍需在服务端界面里确认并填入 `tools/publisher/.env`

### 3. 准备仓库工作目录

```bash
mkdir -p /data/Vison-Blog/repo
cd /data/Vison-Blog/repo
git clone <your-repo-url> .
pnpm install
pnpm publish:init
```

然后补齐：

- `tools/publisher/.env`
- `tools/publisher/publisher.config.json`

推荐的服务器配置要点：

- `SIYUAN_BASE_URL=http://127.0.0.1:6806`
- `PUBLISH_PUSH=false`
- `localDeployRoot=/data/Vison-Blog`
- `siyuanWorkspaceDir=/data/Vison-Blog/siyuan/workspace`

### 4. 手动跑通一次

```bash
pnpm publish:server-run
```

这一步通过后，说明整条链路已经能独立完成：

- 拉代码
- 同步思源内容
- 构建博客
- 切换 `/data/Vison-Blog/current`

### 5. 安装 systemd 定时任务

```bash
pnpm --filter publisher dev server-install --user deploy --group deploy --interval-minutes 5
```

安装后会生成：

- `/etc/systemd/system/vision-blog-publisher.service`
- `/etc/systemd/system/vision-blog-publisher.timer`

查看状态：

```bash
systemctl status vision-blog-publisher.timer
systemctl list-timers vision-blog-publisher.timer
```

手动触发一次：

```bash
systemctl start vision-blog-publisher.service
```

### 6. Nginx 指向 current

正式站点根目录仍然保持：

```nginx
root /data/Vison-Blog/current;
```

也就是说，不管你是云端部署还是服务器主导，Nginx 这一层都不用改思路。

### 7. 关于 GitHub 的角色

服务器主导模式下，GitHub 更适合作为：

- 代码仓库
- 可公开文章备份
- CI 校验通道

不应该再把 GitHub Actions 视为唯一生产发布器，因为云端构建拿不到服务器上的私有思源工作区。

### Actions 构建成功但没有部署

优先检查：

- `DEPLOY_*` Secrets 是否都已配置
- Secret 内容是否有多余空格
- `DEPLOY_KNOWN_HOSTS` 是否和当前服务器指纹一致

当前 workflow 会在 Secrets 不完整时跳过部署步骤，并给出 warning。

### 上传失败

优先检查：

- 部署用户是否有 `/data/Vison-Blog` 写权限
- 服务器防火墙是否允许当前 SSH 端口
- 私钥是否和服务器公钥成对

### 页面 404 或资源错乱

优先检查：

- Web 服务根目录是不是 `/data/Vison-Blog/current`
- 是否误把根目录指到了 `releases` 的父目录
- `SITE_URL` 是否与正式域名一致

## 相关文档

- [项目说明](../../README.md)
- [思源发布器使用手册](./siyuan-publisher.md)
- [Vercel 可选部署说明](./vercel-setup.md)
