# 视频转博客使用手册

这套工具面向服务器主导模式：你提交一个公开视频链接，系统自动抓字幕或音频，整理成一篇博客文章，提交到仓库并在服务器本地构建上线。

## 适用范围

- 公开视频链接
- 当前优先支持 `Bilibili`、`YouTube`、`Douyin`
- 以中文或中英混合内容为主
- 效果优先，优先使用更高质量的转写链路

## 目录与配置

初始化：

```bash
pnpm video:init
```

会生成：

- `tools/video-to-blog/.env`
- `tools/video-to-blog/video-to-blog.config.json`

建议把 `.env` 里的这些值一起补上：

- `VIDEO_TO_BLOG_BRANCH`
- `VIDEO_TO_BLOG_REMOTE`
- `VIDEO_TO_BLOG_GIT_AUTHOR_NAME`
- `VIDEO_TO_BLOG_GIT_AUTHOR_EMAIL`
- `OPENAI_API_KEY`（如果要启用高质量转写主链）

`video-to-blog.config.json` 还支持按平台补充 `yt-dlp` 参数，例如：

```json
{
  "ytDlpArgs": ["--socket-timeout", "30"],
  "ytDlpArgsByPlatform": {
    "youtube": ["--extractor-args", "youtube:player_client=web"],
    "bilibili": ["--impersonate", "Chrome-136:Windows-10"],
    "douyin": []
  }
}
```

如果你要启用“效果优先”的高质量转写，建议同时补上：

```json
{
  "transcriptionEngine": "openai",
  "openAiTranscriptionModel": "gpt-4o-transcribe",
  "premiumTranscriptionFallback": "local"
}
```

说明：

- `transcriptionEngine: "openai"` 表示音频转写优先走高质量主链
- `premiumTranscriptionFallback: "local"` 表示高质量链路失败时，自动回退到本地 `faster-whisper`
- 如果你想强制只走高质量链路，可以把 `premiumTranscriptionFallback` 改成 `"none"`

## 运行前准备

服务器上需要具备：

- `Node.js 22.12+`
- `pnpm 10`
- `python3`
- `yt-dlp`
- `faster-whisper`
- 如果需要 `--impersonate`，建议安装兼容版 `curl-cffi`
- 如果启用高质量主链，还需要可用的 `OPENAI_API_KEY`

Python 依赖建议：

```bash
pip3 install faster-whisper
```

如果服务器没有 `yt-dlp`，可以安装：

```bash
pip3 install yt-dlp
```

如果要启用 `yt-dlp` 的浏览器伪装能力，推荐补充：

```bash
pip3 install "yt-dlp[default,curl-cffi]"
pip3 install "curl-cffi>=0.14,<0.15" --force-reinstall
```

说明：

- 当前 `yt-dlp 2026.03.17` 与 `curl-cffi 0.15.x` 不兼容
- 实测 `curl-cffi 0.14.x` 可正常启用 `--impersonate`
- 可以用 `yt-dlp --list-impersonate-targets` 验证是否生效

## 检查环境

```bash
pnpm video:doctor
```

它会检查：

- 博客内容目录是否存在
- `yt-dlp` 是否可调用
- `python3` 是否能导入 `faster_whisper`

## 提交一个视频任务

```bash
pnpm video:enqueue --url "https://www.youtube.com/watch?v=..."
```

查看状态：

```bash
pnpm video:status
```

启动页面直连服务：

```bash
pnpm video:serve
```

开发时，博客页面会通过同源路径 `/video-api` 自动代理到这个服务，所以你只需要同时开着：

```bash
pnpm dev
pnpm video:serve
```

执行队列：

```bash
pnpm video:run
```

## 运行流程

`video:run` 会做这些事：

1. 读取队列里的待处理链接
2. 用 `yt-dlp` 抽取视频元数据
3. 优先下载字幕
4. 没有可用字幕时下载音频，并优先走高质量转写
5. 高质量转写失败时，再回退到本地 `faster-whisper`
6. 生成 `apps/blog/src/content/posts/<slug>/index.mdx`
7. git 提交并推送到 `master`
8. 服务器本地执行博客构建并切换 `/data/Vison-Blog/current`

## 与思源发布器的关系

它和 `tools/publisher` 是并列工具，但都会改同一个博客仓库。

为了避免冲突，仓库里已经引入统一 repo 锁：

- `publish:server-run` 会先拿锁
- `video:run` 也会先拿锁

所以两条链路不会同时改同一个 git 工作树。

## systemd 定时执行

安装 systemd 定时任务：

```bash
pnpm video:install -- --user root --group root --interval-minutes 5
```

安装后会生成：

- `/etc/systemd/system/vision-video-to-blog.service`
- `/etc/systemd/system/vision-video-to-blog.timer`
- `/etc/systemd/system/vision-video-to-blog-api.service`

如果你要让 `/desk/video/` 页面在服务器上直接可用，记得再把同源接口反向代理到 API 服务：

```nginx
location ^~ /video-api/ {
  proxy_pass http://127.0.0.1:4319/;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

常用排查命令：

```bash
systemctl status vision-video-to-blog.timer --no-pager
systemctl status vision-video-to-blog.service --no-pager
systemctl list-timers vision-video-to-blog.timer --no-pager
journalctl -u vision-video-to-blog.service -n 100 --no-pager
```

## 当前已知边界

- 第一版只支持公开视频
- 不支持会员、登录态、私有链接
- 抖音这类平台仍可能受源站风控影响，拿不到媒体时建议改走手动文本模式
- 当前默认不自动导出公众号稿
