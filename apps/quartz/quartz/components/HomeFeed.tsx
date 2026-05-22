import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { Date, getDate } from "./Date"
import { resolveRelative } from "../util/path"
import style from "./styles/homeFeed.scss"

function isRenderablePost(slug: string | undefined) {
  if (!slug) {
    return false
  }
  if (slug === "index" || slug.startsWith("tags/")) {
    return false
  }
  return true
}

const HomeFeed: QuartzComponent = ({ cfg, fileData, allFiles }: QuartzComponentProps) => {
  if (fileData.slug !== "index") {
    return null
  }

  const posts = allFiles
    .filter((page) => isRenderablePost(page.slug))
    .sort((a, b) => {
      const left = getDate(cfg, a)?.getTime() ?? 0
      const right = getDate(cfg, b)?.getTime() ?? 0
      return right - left
    })

  if (posts.length === 0) {
    return null
  }

  return (
    <section class="home-shell">
      <header class="home-shell__intro">
        <p class="home-shell__eyebrow">最近更新</p>
      </header>
      <section class="home-feed">
        <ol class="home-feed-list">
          {posts.map((post) => {
            const title = post.frontmatter?.title ?? post.slug ?? "未命名文章"
            return (
              <li class="home-feed-item">
                <a href={resolveRelative(fileData.slug!, post.slug!)} class="home-feed-link internal">
                  <span class="home-feed-main">
                    <span class="home-feed-title">{title}</span>
                  </span>
                  {post.dates && (
                    <span class="home-feed-date">
                      <Date date={getDate(cfg, post)!} locale={cfg.locale} />
                    </span>
                  )}
                </a>
              </li>
            )
          })}
        </ol>
      </section>
    </section>
  )
}

HomeFeed.css = style

export default (() => HomeFeed) satisfies QuartzComponentConstructor
