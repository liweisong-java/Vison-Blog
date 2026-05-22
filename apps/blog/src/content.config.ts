import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { postSchema } from "./lib/content";

export const collections = {
  posts: defineCollection({
    loader: glob({ base: "./src/content/posts", pattern: "**/index.{md,mdx}" }),
    schema: postSchema
  })
};
