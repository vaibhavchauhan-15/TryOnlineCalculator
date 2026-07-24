import type { APIRoute } from 'astro';

const site = 'https://tryonlinecalculator.com';

export const GET: APIRoute = () =>
  new Response(
    `# tryonlinecalculator.com robots.txt
# Allow all search engine crawlers full access

User-agent: Googlebot
Allow: /
Crawl-delay: 1

User-agent: Bingbot
Allow: /
Crawl-delay: 2

User-agent: *
Allow: /
Crawl-delay: 3

# Block AI scrapers that don't contribute to search indexing
User-agent: GPTBot
Disallow: /

User-agent: ChatGPT-User
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: Google-Extended
Disallow: /

# Canonical domain — tells crawlers which host is preferred
Host: ${site}

# Sitemaps
Sitemap: ${site}/sitemap-index.xml
`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
