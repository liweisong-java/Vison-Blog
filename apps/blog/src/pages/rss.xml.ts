import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { siteConfig } from "../data/site";

export async function GET() {
  const posts = await getCollection("posts", ({ data }) => data.publish);
  return rss({
    title: siteConfig.title,
    description: siteConfig.description,
    site: siteConfig.siteUrl,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.excerpt,
      pubDate: post.data.publishedAt,
      link: `/posts/${post.data.slug}/`
    }))
  });
}
