const header = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");
const navLinks = Array.from(document.querySelectorAll(".site-nav a"));
const filters = Array.from(document.querySelectorAll(".filter[data-filter]"));
const cards = Array.from(document.querySelectorAll(".note-card[data-tags]"));
const searchInput = document.querySelector("#note-search");
const noteGrid = document.querySelector("#note-grid");
const articles = window.HXC_ARTICLES || [];

let activeFilter = "all";

function closeNav() {
  if (!header || !navToggle) return;
  header.classList.remove("is-open");
  navToggle.setAttribute("aria-expanded", "false");
}

function toggleNav() {
  if (!header || !navToggle) return;
  const isOpen = header.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
}

function normalize(value) {
  return value.trim().toLowerCase();
}

function ensureEmptyState() {
  if (!noteGrid) return null;
  let empty = noteGrid.querySelector(".empty-state");

  if (!empty) {
    empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "没有找到匹配的文章，换个关键词试试。";
    noteGrid.append(empty);
  }

  return empty;
}

function applyNoteFilters() {
  const query = normalize(searchInput?.value || "");
  const empty = ensureEmptyState();
  let visibleCount = 0;

  cards.forEach((card) => {
    const tags = normalize(card.dataset.tags || "");
    const text = normalize(card.textContent || "");
    const matchesFilter = activeFilter === "all" || tags.includes(activeFilter);
    const matchesSearch = !query || text.includes(query) || tags.includes(query);
    const isVisible = matchesFilter && matchesSearch;

    card.classList.toggle("is-hidden", !isVisible);
    if (isVisible) visibleCount += 1;
  });

  if (empty) {
    empty.hidden = visibleCount > 0;
  }
}

function setActiveNavLink() {
  const sections = navLinks
    .map((link) => {
      const id = link.getAttribute("href");
      return id?.startsWith("#") ? document.querySelector(id) : null;
    })
    .filter(Boolean);

  const current = sections
    .map((section) => ({
      id: `#${section.id}`,
      top: Math.abs(section.getBoundingClientRect().top - 120),
      passed: section.getBoundingClientRect().top <= 140,
    }))
    .filter((item) => item.passed)
    .sort((a, b) => a.top - b.top)[0];

  navLinks.forEach((link) => {
    link.classList.toggle("is-active", link.getAttribute("href") === current?.id);
  });
}

function getArticleUrl(slug) {
  const prefix = window.location.pathname.includes("/articles/") ? "" : "articles/";
  return `${prefix}${encodeURIComponent(slug)}.html`;
}

function enhanceNoteCards() {
  cards.forEach((card) => {
    const slug = card.dataset.slug;
    if (!slug) return;

    const article = articles.find((item) => item.slug === slug);
    const existingLink = card.querySelector(".read-link");
    if (article && !card.querySelector(".note-meta")) {
      const meta = document.createElement("small");
      meta.className = "note-meta";
      meta.textContent = `${article.minutes} 分钟阅读`;
      if (existingLink) {
        card.insertBefore(meta, existingLink);
      } else {
        card.append(meta);
      }
    }

    if (existingLink) return;

    const link = document.createElement("a");
    link.className = "read-link";
    link.href = getArticleUrl(slug);
    link.textContent = "阅读全文";
    link.setAttribute("aria-label", `阅读文章：${card.querySelector("h3")?.textContent || ""}`);

    card.append(link);
  });
}

navToggle?.addEventListener("click", toggleNav);

nav?.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    closeNav();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeNav();
  }
});

filters.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter || "all";
    filters.forEach((item) => {
      item.classList.toggle("is-active", item === button);
    });
    applyNoteFilters();
  });
});

searchInput?.addEventListener("input", applyNoteFilters);
searchInput?.addEventListener("search", applyNoteFilters);
searchInput?.addEventListener("change", applyNoteFilters);
window.addEventListener("scroll", setActiveNavLink, { passive: true });
window.addEventListener("resize", closeNav);

enhanceNoteCards();
applyNoteFilters();
setActiveNavLink();
