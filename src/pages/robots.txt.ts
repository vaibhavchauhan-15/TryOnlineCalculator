import type { APIRoute } from 'astro';

const site = 'https://tryonlinecalculator.com';

export const GET: APIRoute = () =>
  new Response(
    `User-agent: *
Allow: /

# Canonical domain — tells crawlers which host is preferred
Host: ${site}

Sitemap: ${site}/sitemap-index.xml
`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
