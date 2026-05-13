# 视频转博客使用手册

这套工具面向服务器主导模式：你提交一个公开视频链接，系统自动抓字幕或音频，整理成一篇博客文章，提交到仓库并在服务器本地构建上线。

## 适用范围

- 公开视频链接
- 当前优先支持 `Bilibili`、`YouTube`、`Douyin`
- 以中文或中英混合内容为主
- 免费优先，本地 `faster-whisper` 识别

## 目录与配置

初始化：

```bash
pnpm video:init
```

会生成：

- `tools/video-to-blog/.env`
- `tools/video-to-blog/video-to-blog.config.json`

## 运行前准备

服务器上需要具备：

- `Node.js 22.12+`
- `pnpm 10`
- `python3`
- `yt-dlp`
- `faster-whisper`

Python 依赖建议：

```bash
pip3 install faster-whisper
```

如果服务器没有 `yt-dlp`，可以安装：

```bash
pip3 install yt-dlp
```

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

执行队列：

```bash
pnpm video:run
```

## 运行流程

`video:run` 会做这些事：

1. 读取队列里的待处理链接
2. 用 `yt-dlp` 抽取视频元数据
3. 优先下载字幕
4. 没有可用字幕时下载音频并走 `faster-whisper`
5. 生成 `apps/blog/src/content/posts/<slug>/index.mdx`
6. git 提交并推送到 `master`
7. 服务器本地执行博客构建并切换 `/data/Vison-Blog/current`

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
- 不做深度 AI 改写，当前是“结构化博客整理”
- 当前默认不自动导出公众号稿
