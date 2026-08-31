import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const pages = [
  { file: 'index.html', route: '/', minimumText: 900, ads: true },
  { file: 'notes.html', route: '/notes', minimumText: 1200, ads: true },
  { file: 'notes/github-actions-deploy-key.html', route: '/notes/github-actions-deploy-key', minimumText: 1800, ads: true, article: true },
  { file: 'notes/legacy-hexo-static-generation.html', route: '/notes/legacy-hexo-static-generation', minimumText: 1800, ads: true, article: true },
  { file: 'notes/x-media-parser-boundaries.html', route: '/notes/x-media-parser-boundaries', minimumText: 1800, ads: true, article: true },
  { file: 'notes/browser-screenshot-csp.html', route: '/notes/browser-screenshot-csp', minimumText: 1800, ads: true, article: true },
  { file: 'notes/thin-content-indexing.html', route: '/notes/thin-content-indexing', minimumText: 1800, ads: true, article: true },
  { file: 'notes/verifiable-ai-daily.html', route: '/notes/verifiable-ai-daily', minimumText: 1400, ads: true, article: true },
  { file: 'notes/clipboard-fallbacks.html', route: '/notes/clipboard-fallbacks', minimumText: 1400, ads: true, article: true },
  { file: 'notes/static-site-quality-checks.html', route: '/notes/static-site-quality-checks', minimumText: 1400, ads: true, article: true },
  { file: 'projects.html', route: '/projects', minimumText: 800 },
  { file: 'about.html', route: '/about', minimumText: 350 },
  { file: 'contact.html', route: '/contact', minimumText: 250 },
  { file: 'privacy.html', route: '/privacy', minimumText: 500 },
  { file: 'editorial-policy.html', route: '/editorial-policy', minimumText: 400 },
];

const failures = [];
const titles = new Map();
const canonicalUrls = new Set();
const pageByRoute = new Map(pages.map((page) => [page.route, page]));
const clarityProjectId = 'y59kdxo6uz';

function fail(file, message) {
  failures.push(`${file}: ${message}`);
}

function matchOne(html, pattern) {
  return html.match(pattern)?.[1]?.trim() ?? '';
}

function visibleText(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:[a-z]+|#\d+);/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function routeForHref(href) {
  const clean = href.split('#')[0].split('?')[0].replace(/\/$/, '') || '/';
  return clean;
}

for (const page of pages) {
  const path = resolve(root, page.file);
  if (!existsSync(path)) {
    fail(page.file, 'file is missing');
    continue;
  }

  const html = readFileSync(path, 'utf8');
  const title = matchOne(html, /<title>([^<]+)<\/title>/i);
  const description = matchOne(html, /<meta\s+name="description"\s+content="([^"]+)"/i);
  const canonical = matchOne(html, /<link\s+rel="canonical"\s+href="([^"]+)"/i);
  const expectedCanonical = `https://concitech.org${page.route}`;
  const h1Count = (html.match(/<h1(?:\s|>)/gi) ?? []).length;
  const textLength = visibleText(html).length;
  const hasAds = html.includes('ca-pub-5950061234063954');
  const clarityProjectIdCount = (html.match(new RegExp(clarityProjectId, 'g')) ?? []).length;
  const clarityLoaderCount = (html.match(/https:\/\/www\.clarity\.ms\/tag\//g) ?? []).length;

  if (!title) fail(page.file, 'title is missing');
  else if (titles.has(title)) fail(page.file, `title duplicates ${titles.get(title)}`);
  else titles.set(title, page.file);
  if (description.length < 20 || description.length > 180) fail(page.file, `description length is ${description.length}; expected 20–180 characters`);
  if (canonical !== expectedCanonical) fail(page.file, `canonical must be ${expectedCanonical}`);
  else canonicalUrls.add(canonical);
  if (h1Count !== 1) fail(page.file, `expected one H1, found ${h1Count}`);
  if (textLength < page.minimumText) fail(page.file, `visible text is ${textLength} characters; expected at least ${page.minimumText}`);
  if (hasAds !== Boolean(page.ads)) fail(page.file, page.ads ? 'AdSense loader is missing' : 'AdSense loader is not allowed on this page');
  if (clarityProjectIdCount !== 1 || clarityLoaderCount !== 1) fail(page.file, 'Clarity loader must appear exactly once with the expected project ID');

  if (/href="\/[^"]*\.html(?:[?#"])/i.test(html)) fail(page.file, 'internal links must use canonical extensionless routes');
  if (/rel="canonical"[^>]*\.html/i.test(html)) fail(page.file, 'canonical must not contain .html');

  for (const href of html.matchAll(/href="(\/[^"]*)"/gi)) {
    const route = routeForHref(href[1]);
    if (/\.(?:css|png|webp|jpg|jpeg|svg|ico|xml|txt)$/i.test(route)) continue;
    if (!pageByRoute.has(route)) fail(page.file, `internal link does not resolve to a page: ${href[1]}`);
  }

  if (page.article) {
    if (!/<time\s+datetime="\d{4}-\d{2}-\d{2}"/i.test(html)) fail(page.file, 'article is missing a machine-readable publication date');
    const jsonLd = [...html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
    const schemas = jsonLd.flatMap((match) => {
      try {
        return [JSON.parse(match[1])];
      } catch {
        fail(page.file, 'contains invalid JSON-LD');
        return [];
      }
    });
    if (!schemas.some((schema) => schema['@type'] === 'Article')) fail(page.file, 'Article JSON-LD is missing');
  }
}

const sitemap = readFileSync(resolve(root, 'sitemap.xml'), 'utf8');
const sitemapUrls = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]));
for (const canonical of canonicalUrls) if (!sitemapUrls.has(canonical)) failures.push(`sitemap.xml: missing ${canonical}`);
for (const url of sitemapUrls) if (!canonicalUrls.has(url)) failures.push(`sitemap.xml: ${url} has no matching canonical page`);
if (/\.html(?:<|$)/i.test(sitemap)) failures.push('sitemap.xml: URLs must use canonical extensionless routes');

const robots = readFileSync(resolve(root, 'robots.txt'), 'utf8');
if (!robots.includes('Sitemap: https://concitech.org/sitemap.xml')) failures.push('robots.txt: sitemap declaration is missing');

const ads = readFileSync(resolve(root, 'ads.txt'), 'utf8').trim();
if (ads !== 'google.com, pub-5950061234063954, DIRECT, f08c47fec0942fa0') failures.push('ads.txt: publisher declaration is incorrect');

if (failures.length) {
  console.error(`Site check failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Site check passed: ${pages.length} pages, ${pages.filter((page) => page.article).length} original articles, canonical links, sitemap, robots, ads.txt, and ad boundaries verified.`);
