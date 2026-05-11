# 服务器静态部署说明

这套博客推荐的正式上线方式是：

- `master` 分支接收内容和代码更新
- GitHub Actions 在云端构建静态产物
- 只把 `apps/blog/dist` 上传到服务器
- 服务器上的 Web 服务始终指向 `/data/Vison-Blog/current`

这样做的好处是：

- 服务器不需要拉源码
- 不需要在服务器安装完整前端构建环境
- 公开仓库里不会出现主机地址、密码、私钥
- 部署失败时不会污染当前线上版本

## 目录结构

服务器目标目录固定为：

```text
/data/Vison-Blog
  releases/
    <commit-sha>/
  current -> /data/Vison-Blog/releases/<commit-sha>
```

GitHub Actions 每次部署都会把新版本传到 `releases/<sha>`，再切换 `current` 软链。

## 1. 准备服务器目录

推荐使用单独的部署用户；如果暂时只能用现有用户，也至少让它只负责这个目录。

```bash
sudo mkdir -p /data/Vison-Blog/releases
sudo chown -R <deploy-user>:<deploy-group> /data/Vison-Blog
```

如果你已经有 Web 服务用户，也可以把目录权限交给现有用户组。

## 2. 生成专用 deploy key

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

## 3. 生成 known_hosts

为了避免在 CI 里关闭主机校验，先收集服务器指纹：

```bash
ssh-keyscan -p <deploy-port> <deploy-host>
```

把输出完整保存下来，后面放进 GitHub Secret：`DEPLOY_KNOWN_HOSTS`。

## 4. 配置 GitHub Secrets

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

## 5. 让 Web 服务指向 current

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

## 6. 首次上线

完成 Secrets 配置后，有两种触发方式：

1. 推送一次 `master`
2. 在 GitHub Actions 手动运行 `deploy` 工作流

工作流会先执行：

- `pnpm test`
- `pnpm check`
- `pnpm build`
- `pnpm e2e`

全部通过后才会上传静态产物。

## 7. 回滚

如果某个版本需要回滚，不用重新构建，只要把 `current` 指回旧版本：

```bash
ln -sfn /data/Vison-Blog/releases/<old-sha> /data/Vison-Blog/.next-current
mv -Tf /data/Vison-Blog/.next-current /data/Vison-Blog/current
```

回滚完成后刷新页面即可生效。

## 8. 常见问题

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
