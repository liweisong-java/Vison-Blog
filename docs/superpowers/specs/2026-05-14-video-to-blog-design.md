# 视频转博客系统设计

## 目标

构建一个服务器主导的独立工具，输入公开视频链接，自动抓取视频信息、字幕或音频，将内容整理成适合中文博客阅读的文章，并自动接入现有 `Vison-Blog` 发布链路上线。

第一版范围明确限定为：

- 公开可访问的视频链接
- 平台优先支持 `Bilibili`、`YouTube`、`Douyin`
- 中英混合内容
- 免费优先，不依赖付费 ASR / LLM API
- 以服务器运行和发布为主

## 为什么做成独立工具

当前仓库已经有两个明确职责：

- `apps/blog`：Astro 前台渲染
- `tools/publisher`：思源内容同步发布

视频转博客不适合塞进思源发布器内部，因为它的工作重点不同：

- 需要外部链接抓取与下载
- 需要字幕 / 音频处理
- 需要本地 ASR
- 需要一套独立的任务状态和失败恢复

因此更合适的形式是：

- 在当前 monorepo 中新增 `tools/video-to-blog`
- 它是独立项目、独立命令、独立配置
- 但复用当前仓库的 git、构建、静态部署能力

这比单开新仓更快落地，也比强行耦合进 `tools/publisher` 更清晰。

## 总体架构

```text
提交公开视频链接
  -> video-to-blog 接收任务
  -> yt-dlp 抽取元数据 / 字幕 / 音频
  -> 有字幕时优先清洗字幕
  -> 无字幕时使用本地 faster-whisper 转写
  -> transcript 清洗、分段、摘要、标签提取
  -> 生成博客 MDX
  -> 写入 apps/blog/src/content/posts/<slug>/index.mdx
  -> git add / commit / push 到 master
  -> 服务器本地构建并部署当前仓库
  -> 博客上线
```

## 模块拆分

### 1. `ingest`

职责：

- 校验视频链接
- 识别平台
- 调用 `yt-dlp` 获取视频元数据
- 下载字幕、自动字幕或音频

约束：

- 第一版只处理公开链接
- 失败时要明确区分“平台不支持”“链接失效”“下载失败”“无可用音频”

### 2. `transcribe`

职责：

- 优先读取现成字幕
- 无字幕时运行本地 ASR
- 输出统一 transcript 结构

第一版方案：

- ASR 使用 `faster-whisper`
- 默认模型配置为 `large-v3`，支持通过配置降级
- 输出包含时间戳分段，便于后续整理

### 3. `compose`

职责：

- 对 transcript 做清洗和博客化重组
- 输出适合现有博客 schema 的 MDX 内容

成文原则：

- 不是逐字稿直出
- 先给导语与要点，再按主题整理正文
- 保留原视频链接、作者、平台、发布时间
- 尾部保留可折叠 transcript，方便回溯

### 4. `publish`

职责：

- 将生成文章写入博客内容目录
- 处理 slug、重复链接、重复视频、更新重跑
- git 提交并推送
- 触发本地构建发布

关键边界：

- 不能直接依赖 `pnpm publish:server-run` 去消费未提交文件
- 因为该脚本会先 `git fetch/reset` 并创建新 worktree
- 所以视频系统必须先把内容提交到仓库，再执行本地构建发布

### 5. `jobs`

职责：

- 维护任务队列
- 管理运行状态
- 记录失败原因和产物路径

第一版不引入数据库，改用文件状态存储：

- `queue.json`
- `runs/<jobId>.json`
- `artifacts/<jobId>/...`

## 与现有博客规范的对接

现有博客文章约束：

- 内容目录：`apps/blog/src/content/posts/<slug>/index.mdx`
- 基础 frontmatter：`title`、`slug`、`publishedAt`、`excerpt`、`category`、`tags`

视频文章第一版额外写入这些信息：

- `canonicalUrl`：原视频链接
- `wechatReady`：默认 `false`

为了避免被思源发布器误删，视频文章不使用现有思源链路的 `sourceId` 语义。
视频任务自身通过独立 manifest 跟踪“视频链接 -> slug”映射。

## 并发与锁

当前服务器上已经有：

- `vision-blog-publisher.timer`

它会周期性同步思源并改动同一个 git 仓库。视频系统如果同时运行，也会改仓库、提交、构建，所以必须有共享锁。

设计要求：

- 新增统一 repo 锁
- `scripts/server-publish-cycle.mjs` 与 `tools/video-to-blog` 都必须先拿锁再操作仓库
- 锁失败时等待，超过超时后报错退出

## 输出文章结构

默认生成格式：

1. 标题
2. 导语
3. 核心要点
4. 视频信息
5. 正文整理
6. 折叠 transcript
7. 来源说明

正文风格：

- 技术内容：技术笔记风格
- 经验 / 观点内容：整理笔记风格

## 配置与运行方式

新增目录：

- `tools/video-to-blog/.env`
- `tools/video-to-blog/video-to-blog.config.json`

关键配置项：

- 博客仓内容目录
- 发布分支与远端
- 构建部署根目录
- `yt-dlp` 可执行路径
- `python3` 可执行路径
- `faster-whisper` 模型名
- 临时文件目录

第一版命令：

- `pnpm video:init`
- `pnpm video:enqueue --url <video-url>`
- `pnpm video:run`
- `pnpm video:doctor`
- `pnpm video:install`
- `pnpm video:status`

## 错误处理

需要明确暴露这些失败类别：

- 不支持的平台
- 链接不可访问
- 视频元数据抽取失败
- 音频下载失败
- ASR 失败
- 文章写入冲突
- git 提交失败
- 构建失败
- 部署失败

每个任务都要记录：

- 状态
- 错误阶段
- 错误消息
- 输入 URL
- 生成 slug
- 产物路径

## 非目标

第一版不做：

- 私有 / 登录态视频
- 浏览器自动登录抓取
- 复杂 Web UI 后台
- 直接自动发布到公众号
- 通过 LLM 做深度改写
- 视频封面图自动裁切和设计

## 落地结论

第一版采用：

- `tools/video-to-blog` 独立工具
- `yt-dlp + faster-whisper + TypeScript orchestration`
- 文件状态存储替代数据库
- 共享 repo 锁避免和思源发布冲突
- 生成 MDX 后直接 git 提交，并在服务器本地构建部署

这套方案能在你当前仓库和服务器模型下最小代价落地，同时保留后续扩展到后台面板、定时抓取、公众号二次分发的空间。
