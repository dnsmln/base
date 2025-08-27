import { z, defineCollection } from 'astro:content';

export const collections = {
  
  posts: defineCollection({
    type: "content",
    schema: z.object({
      title: z.string(),
      date: z.date(),
      excerpt: z.string().optional(),
      description: z.string().optional(),
      ogImage: z.string().optional(),
      thumbnail: z.string().optional(),
      permalink: z.string().optional(),
      listed: z.boolean().optional().default(true),
    }),
  }),
};