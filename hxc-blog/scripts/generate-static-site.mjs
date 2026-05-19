import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const baseUrl = "https://my.hxcbox.cn";
const today = "2026-05-18";

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function slugId(text, index) {
  return `section-${index + 1}-${text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

function articleUrl(article) {
  return `/articles/${article.slug}.html`;
}

function fullUrl(url) {
  return `${baseUrl}${url}`;
}

async function loadArticles() {
  const source = await fs.readFile(path.join(root, "assets/articles.js"), "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: "articles.js" });
  return sandbox.window.HXC_ARTICLES;
}

function header(relativePrefix = "../") {
  return `
    <header class="site-header" id="top">
      <a class="brand" href="${relativePrefix}index.html" aria-label="回到首页">
        <span class="brand-mark">HX</span>
        <span class="brand-copy">
          <strong>HXC Knowledge Lab</strong>
          <em>工程交付 / 知识复利 / 系统化表达</em>
        </span>
      </a>

      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">
        <span></span><span></span><span></span>
      </button>

      <nav class="site-nav" id="site-nav" aria-label="主导航">
        <a href="${relativePrefix}index.html#map">知识地图</a>
        <a href="${relativePrefix}index.html#topics">主题</a>
        <a href="${relativePrefix}index.html#notes">文章</a>
        <a href="${relativePrefix}index.html#systems">方法</a>
        <a href="${relativePrefix}index.html#about">关于</a>
        <a href="https://my.hxcbox.cn/resume">简历</a>
      </nav>
    </header>`;
}

function footer() {
  return `
    <footer class="site-footer">
      <span>HXC Knowledge Lab</span>
      <a href="#top">回到顶部</a>
    </footer>`;
}

function articleJsonLd(article, url) {
  return JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      description: article.description,
      datePublished: article.date,
      dateModified: today,
      inLanguage: "zh-CN",
      mainEntityOfPage: url,
      author: {
        "@type": "Person",
        name: "HXC",
      },
      publisher: {
        "@type": "Organization",
        name: "HXC Knowledge Lab",
      },
      keywords: article.tags.join(", "),
    },
    null,
    2
  );
}

function renderArticle(article, articles) {
  const url = fullUrl(articleUrl(article));
  const toc = article.sections
    .map((section, index) => `<a href="#${slugId(section.heading, index)}">${escapeHtml(section.heading)}</a>`)
    .join("");
  const content = article.sections
    .map((section, index) => {
      const id = slugId(section.heading, index);
      return `
          <section id="${id}" class="article-section">
            <h2>${escapeHtml(section.heading)}</h2>
            ${section.body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("\n            ")}
            <ul>
              ${section.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("\n              ")}
            </ul>
          </section>`;
    })
    .join("\n");
  const related = articles
    .filter((item) => item.slug !== article.slug && item.tags.some((tag) => article.tags.includes(tag)))
    .slice(0, 3)
    .map(
      (item) => `
          <a class="related-card" href="${item.slug}.html">
            <span>${escapeHtml(item.category)}</span>
            <strong>${escapeHtml(item.title)}</strong>
            <em>${item.minutes} 分钟阅读</em>
          </a>`
    )
    .join("");

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(article.title)} | HXC Knowledge Lab</title>
    <meta name="description" content="${escapeHtml(article.description)}" />
    <meta name="theme-color" content="#f6f0df" />
    <meta name="robots" content="index,follow,max-image-preview:large" />
    <link rel="canonical" href="${url}" />
    <meta property="og:site_name" content="HXC Knowledge Lab" />
    <meta property="og:title" content="${escapeHtml(article.title)} | HXC Knowledge Lab" />
    <meta property="og:description" content="${escapeHtml(article.description)}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${url}" />
    <meta property="article:published_time" content="${article.date}" />
    <meta property="article:modified_time" content="${today}" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${escapeHtml(article.title)} | HXC Knowledge Lab" />
    <meta name="twitter:description" content="${escapeHtml(article.description)}" />
    <link rel="icon" href="../assets/favicon.svg" type="image/svg+xml" />
    <link rel="stylesheet" href="../assets/styles.css" />
    <script type="application/ld+json">${articleJsonLd(article, url)}</script>
  </head>
  <body>
${header("../")}

    <main class="article-shell">
      <article class="article-page">
        <a class="back-link" href="../index.html#notes">返回文章列表</a>
        <p class="eyebrow article-category">${escapeHtml(article.category)}</p>
        <h1>${escapeHtml(article.title)}</h1>
        <p class="article-description">${escapeHtml(article.description)}</p>
        <div class="article-meta">
          <span>${article.date}</span>
          <span>${article.minutes} 分钟阅读</span>
        </div>
        <div class="article-tags">
          ${article.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("\n          ")}
        </div>
        ${
          article.sourceNote
            ? `<div class="source-note"><strong>知识库依据</strong><p>${escapeHtml(article.sourceNote)}</p></div>`
            : ""
        }
        <div class="article-layout">
          <aside class="article-toc" aria-label="文章目录">
            <strong>目录</strong>
            <nav>${toc}</nav>
          </aside>
          <div class="article-content">${content}</div>
        </div>
      </article>

      <section class="related-panel">
        <div>
          <p class="eyebrow">Related</p>
          <h2>继续阅读</h2>
        </div>
        <div class="related-grid">${related}</div>
      </section>
    </main>

${footer()}

    <script src="../assets/app.js" defer></script>
  </body>
</html>`;
}

function sitemap(articles) {
  const urls = [
    { loc: `${baseUrl}/`, priority: "1.0" },
    ...articles.map((article) => ({ loc: fullUrl(articleUrl(article)), priority: "0.8" })),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (item) => `  <url>
    <loc>${item.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${item.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;
}

function robots() {
  return `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`;
}

async function main() {
  const articles = await loadArticles();
  const outDir = path.join(root, "articles");
  await fs.mkdir(outDir, { recursive: true });

  await Promise.all(
    articles.map((article) => fs.writeFile(path.join(outDir, `${article.slug}.html`), renderArticle(article, articles)))
  );

  await fs.writeFile(path.join(root, "sitemap.xml"), sitemap(articles));
  await fs.writeFile(path.join(root, "robots.txt"), robots());
  console.log(`Generated ${articles.length} article pages, sitemap.xml, robots.txt`);
}

main();
