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
      
      // Convert markdown to HTML
      // 1. Convert images
      htmlContent = htmlContent.replace(
        /!\[([^\]]*)\]\(([^)]+)\)/g,
        '<img src="$2" alt="$1" />'
      );
      
      // 2. Convert links
      htmlContent = htmlContent.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2">$1</a>'
      );
      
      // 3. Convert bold text
      htmlContent = htmlContent.replace(
        /\*\*([^*]+)\*\*/g,
        '<strong>$1</strong>'
      );
      
      // 4. Convert italic text
      htmlContent = htmlContent.replace(
        /\*([^*]+)\*/g,
        '<em>$1</em>'
      );
      
      // 5. Convert headings (must be before paragraph conversion)
      htmlContent = htmlContent.replace(
        /^###\s+(.+)$/gm,
        '<h3>$1</h3>'
      );
      htmlContent = htmlContent.replace(
        /^##\s+(.+)$/gm,
        '<h2>$1</h2>'
      );
      htmlContent = htmlContent.replace(
        /^#\s+(.+)$/gm,
        '<h1>$1</h1>'
      );
      
      // 6. Fix video tags for RSS compatibility (remove attributes that don't work in RSS)
      htmlContent = htmlContent.replace(
        /<video[^>]*\s+src="([^"]+)"[^>]*>[\s\S]*?<\/video>/gi,
        '<p><strong>[Video]</strong><br><a href="$1">View video: $1</a></p>'
      );
      
      // 8. Convert paragraphs (double line breaks)
      htmlContent = htmlContent.replace(/\n\n+/g, '</p><p>');
      
      // 9. Wrap in paragraph tags if there's content
      if (htmlContent.trim()) {
        htmlContent = '<p>' + htmlContent + '</p>';
      }
      
      // 10. Convert single line breaks to <br> within paragraphs
      htmlContent = htmlContent.replace(/\n/g, '<br>');
      
      // Convert relative URLs to absolute URLs
      const absoluteContent = htmlContent.replace(
        /src="\/images\//g,
        `src="${SITE_URL}/images/`
      ).replace(
        /href="\/posts\//g,
        `href="${SITE_URL}/posts/`
      ).replace(
        /href="\/images\//g,
        `href="${SITE_URL}/images/`
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