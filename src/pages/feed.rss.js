import { getCollection } from 'astro:content';
import { SITE_CONFIG } from '../config.js';

const SITE_URL = 'https://denismoulin.com';

export async function GET() {
  const posts = await getCollection('posts');
  
  // Filter only listed posts and sort by date (newest first)
  const listedPosts = posts
    .filter(post => post.data.listed !== false)
    .sort((a, b) => new Date(b.data.date) - new Date(a.data.date));

  const rssItems = await Promise.all(
    listedPosts.map(async (post) => {
      // Get the raw content and use description/excerpt as fallback
      let htmlContent = post.body || post.data.description || post.data.excerpt || '';
      
      // Simple markdown to HTML conversion for images
      htmlContent = htmlContent.replace(
        /!\[([^\]]*)\]\(([^)]+)\)/g,
        '<img src="$2" alt="$1" />'
      );
      
      // Convert relative image URLs to absolute URLs
      const absoluteContent = htmlContent.replace(
        /src="\/images\//g,
        `src="${SITE_URL}/images/`
      ).replace(
        /!\[([^\]]*)\]\(\/images\//g,
        `![$1](${SITE_URL}/images/`
      );
      
      const postUrl = post.data.permalink 
        ? `${SITE_URL}/posts/${post.data.permalink}`
        : `${SITE_URL}/posts/${post.slug}`;
      
      return `
        <item>
          <title><![CDATA[${post.data.title}]]></title>
          <description><![CDATA[${absoluteContent}]]></description>
          <link>${postUrl}</link>
          <guid isPermaLink="true">${postUrl}</guid>
          <pubDate>${new Date(post.data.date).toUTCString()}</pubDate>
        </item>
      `;
    })
  );

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title><![CDATA[${SITE_CONFIG.siteTitle}]]></title>
    <description><![CDATA[${SITE_CONFIG.description}]]></description>
    <link>${SITE_URL}</link>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>Astro</generator>
    ${rssItems.join('')}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
}