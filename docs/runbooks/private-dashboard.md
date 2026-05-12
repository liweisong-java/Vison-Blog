# 私有统计页运维说明

这套博客现在内置了一个只给站长自己看的私有统计页，默认路径是：

```text
/secret-dashboard/
```

它展示三类数据：

- 内容统计：文章数量、分类占比、标签活跃度、总字数
- 访问统计：今日 / 近 7 天 / 近 30 天访问情况、热门页面、来源、设备
- 发布链路：最近同步时间、成功 / 失败记录、待处理数量、近 7 天同步次数

## 1. 数据来源

私有统计页不是连数据库实时查询，而是读取本地快照文件：

```text
.superpowers/private-dashboard/dashboard.json
```

这个快照由两部分拼出来：

- `pnpm private:dashboard:traffic`
  从 Umami 拉取访问统计，写入 `.superpowers/private-dashboard/umami-snapshot.json`
- `pnpm private:dashboard`
  汇总博客文章内容、Umami 快照和发布器状态，生成最终的 `dashboard.json`

发布器同步成功或失败时，还会额外写一份：

```text
.superpowers/private-dashboard/publisher-state.json
```

## 2. Umami 配置

当前方案默认使用自托管 Umami 作为访问统计来源。

GitHub Actions 或本地环境里需要配置：

- `UMAMI_BASE_URL`
- `UMAMI_API_TOKEN`
- `UMAMI_WEBSITE_ID`

推荐把它们存到 GitHub Actions Secrets：

- `UMAMI_BASE_URL`
- `UMAMI_API_TOKEN`
- `UMAMI_WEBSITE_ID`

然后由定时 workflow 自动刷新。

## 3. 本地手动刷新

如果你想先在本机试通：

```bash
pnpm private:dashboard:traffic
pnpm private:dashboard
```

执行完以后可以看到：

```text
.superpowers/private-dashboard/umami-snapshot.json
.superpowers/private-dashboard/dashboard.json
```

这些文件都在 `.gitignore` 里，不会进入公开仓库。

## 4. GitHub Actions 定时刷新

仓库里新增了：

```text
.github/workflows/private-dashboard-refresh.yml
```

它会：

1. 安装依赖
2. 拉取 Umami 数据
3. 执行 `pnpm private:dashboard`

如果你希望把生成后的私有快照同步到服务器，有两种常见方式：

- 方式 A：在部署机本地生成，不经过 GitHub 仓库
- 方式 B：让部署流程在构建阶段生成，然后只把静态产物上传到服务器

当前仓库默认采用方式 B，而且 `deploy.yml` 已经在构建前执行 `pnpm private:dashboard`。

## 5. Nginx 保护

私有统计页一定要做服务端保护。推荐直接使用：

```nginx
location ^~ /secret-dashboard/ {
  auth_basic "Private Dashboard";
  auth_basic_user_file /etc/nginx/.htpasswd-vision-blog;
  try_files $uri $uri/ /secret-dashboard/index.html;
}
```

其中核心就是：

- `auth_basic`
- `auth_basic_user_file`

也就是说，真正的安全边界在 Nginx，不在前端页面里。

## 6. 页面隐私边界

当前代码层已经做了这些事情：

- 不把 `/secret-dashboard/` 放进导航
- 不把它写进 RSS
- 不把它写进 sitemap
- 页面 head 自动加 `noindex,nofollow,noarchive`

但这些都只是“减少暴露”，真正的私有访问控制仍然要靠 `auth_basic`。

## 7. 推荐上线顺序

1. 先在本机执行 `pnpm private:dashboard`
2. 确认 `/secret-dashboard/` 页面结构正常
3. 在服务器 Nginx 上加 `auth_basic`
4. 配置 `UMAMI_BASE_URL`、`UMAMI_API_TOKEN`、`UMAMI_WEBSITE_ID`
5. 手动运行一次 `private-dashboard-refresh`
6. 再观察 deploy workflow 是否能稳定构建
