/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Feed, Article, SavedArticle } from "./types";

const FEEDS_KEY = "ives_feeds";
const BOOKMARKS_KEY = "ives_bookmarks";
const HISTORY_KEY = "ives_history";
const OFFLINE_ARTICLES_KEY = "ives_offline_articles";

export const DEFAULT_FEEDS: Feed[] = [
  { id: "bbc", title: "BBC News - World", url: "https://feeds.bbci.co.uk/news/world/rss.xml", category: "World", isDefault: true, enabled: true },
  { id: "un-news", title: "UN News (Global)", url: "https://news.un.org/feed/subscribe/en/news/all/rss.xml", category: "World", isDefault: true, enabled: true },
  { id: "dw-news", title: "DW News (Deutsche Welle)", url: "https://rss.dw.com/rdf/rss_en_all", category: "World", isDefault: true, enabled: true },
  { id: "google-news", title: "Google News", url: "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en", category: "General", isDefault: true, enabled: true },
  { id: "tc", title: "TechCrunch", url: "https://techcrunch.com/feed/", category: "Tech", isDefault: true, enabled: true },
  { id: "hn", title: "Hacker News", url: "https://news.ycombinator.com/rss", category: "Tech", isDefault: true, enabled: true },
  { id: "verge", title: "The Verge", url: "https://www.theverge.com/rss/index.xml", category: "Tech", isDefault: true, enabled: true },
  { id: "nasa", title: "NASA News Releases", url: "https://www.nasa.gov/news-release/feed/", category: "Science", isDefault: true, enabled: true },
  { id: "smithsonian", title: "Smithsonian Magazine", url: "https://www.smithsonianmag.com/rss/latest_articles/", category: "Culture", isDefault: true, enabled: true }
];

// HTML Entity Decoder
export function decodeHtmlEntities(str: string): string {
  if (!str) return "";
  let decoded = str;
  for (let i = 0; i < 2; i++) {
    if (!decoded.includes("&")) break;
    decoded = decoded
      .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ")
      .replace(/&rsquo;/g, "’")
      .replace(/&lsquo;/g, "‘")
      .replace(/&rdquo;/g, "”")
      .replace(/&ldquor;/g, "“")
      .replace(/&ldquo;/g, "“")
      .replace(/&mdash;/g, "—")
      .replace(/&ndash;/g, "–")
      .replace(/&hellip;/g, "…")
      .replace(/&copy;/g, "©")
      .replace(/&reg;/g, "®");
  }
  return decoded;
}

// FEEDS
export function getSavedFeeds(): Feed[] {
  try {
    const data = localStorage.getItem(FEEDS_KEY);
    if (!data) {
      localStorage.setItem(FEEDS_KEY, JSON.stringify(DEFAULT_FEEDS));
      return DEFAULT_FEEDS;
    }
    const saved = JSON.parse(data);
    if (!Array.isArray(saved) || saved.length === 0) {
      localStorage.setItem(FEEDS_KEY, JSON.stringify(DEFAULT_FEEDS));
      return DEFAULT_FEEDS;
    }

    const seenIds = new Set<string>();
    const seenUrls = new Set<string>();
    const uniqueFeeds: Feed[] = [];

    for (const f of saved) {
      if (f && f.id && f.url && !seenIds.has(f.id) && !seenUrls.has(f.url)) {
        seenIds.add(f.id);
        seenUrls.add(f.url);
        uniqueFeeds.push(f);
      }
    }

    let changed = uniqueFeeds.length !== saved.length;
    for (const defFeed of DEFAULT_FEEDS) {
      if (!seenIds.has(defFeed.id) && !seenUrls.has(defFeed.url)) {
        seenIds.add(defFeed.id);
        seenUrls.add(defFeed.url);
        uniqueFeeds.push(defFeed);
        changed = true;
      }
    }

    if (changed) {
      localStorage.setItem(FEEDS_KEY, JSON.stringify(uniqueFeeds));
    }
    return uniqueFeeds;
  } catch {
    return DEFAULT_FEEDS;
  }
}

export function saveFeeds(feeds: Feed[]) {
  localStorage.setItem(FEEDS_KEY, JSON.stringify(feeds));
}

// BOOKMARKS
export function getBookmarks(): Article[] {
  try {
    const data = localStorage.getItem(BOOKMARKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function toggleBookmark(article: Article): Article[] {
  const bookmarks = getBookmarks();
  const index = bookmarks.findIndex((b) => b.id === article.id);
  if (index >= 0) {
    bookmarks.splice(index, 1);
  } else {
    bookmarks.push({ ...article, isBookmarked: true });
  }
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  return bookmarks;
}

// READ HISTORY
export function getReadHistory(): string[] {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function markAsRead(articleId: string): string[] {
  const history = getReadHistory();
  if (!history.includes(articleId)) {
    history.push(articleId);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }
  return history;
}

// OFFLINE ARTICLES CACHE
export function getOfflineArticles(): Record<string, SavedArticle> {
  try {
    const data = localStorage.getItem(OFFLINE_ARTICLES_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export function saveArticleForOffline(article: Article, fullText: string): SavedArticle {
  const offline = getOfflineArticles();
  const saved: SavedArticle = {
    articleId: article.id,
    article,
    fullText,
    savedAt: new Date().toISOString()
  };
  offline[article.id] = saved;
  localStorage.setItem(OFFLINE_ARTICLES_KEY, JSON.stringify(offline));
  return saved;
}

export function removeOfflineArticle(articleId: string) {
  const offline = getOfflineArticles();
  if (offline[articleId]) {
    delete offline[articleId];
    localStorage.setItem(OFFLINE_ARTICLES_KEY, JSON.stringify(offline));
  }
}

// TIME FORMATTING
export function formatPubDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  } catch {
    return dateStr;
  }
}

// SERVICE WORKER REGISTRATION
export function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[Service Worker] Registered successfully with scope:", reg.scope);
        })
        .catch((err) => {
          console.warn("[Service Worker] Registration note:", err);
        });
    });
  }
}

// FETCH ARTICLES WITH FALLBACK FOR STATIC HOSTING (E.G. GITHUB PAGES)
export async function fetchSingleFeedArticles(feedUrl: string, feedId: string): Promise<Article[]> {
  try {
    const response = await fetch("/api/feeds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: feedUrl }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.articles && Array.isArray(data.articles) && data.articles.length > 0) {
        return data.articles.map((art: any) => ({
          ...art,
          feedId,
        }));
      }
    }
  } catch (err) {
    console.warn("Backend /api/feeds unreachable, using browser proxy fallback:", err);
  }

  // Fallback for GitHub Pages static environment or backend errors
  return await fetchFeedClientFallback(feedUrl, feedId);
}

async function fetchFeedClientFallback(feedUrl: string, feedId: string): Promise<Article[]> {
  const proxyEndpoints = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`,
    `https://corsproxy.io/?${encodeURIComponent(feedUrl)}`,
    `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`
  ];

  for (const proxyUrl of proxyEndpoints) {
    try {
      if (proxyUrl.includes("rss2json.com")) {
        const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(6000) });
        if (res.ok) {
          const json = await res.json();
          if (json.status === "ok" && Array.isArray(json.items) && json.items.length > 0) {
            return json.items.map((item: any, idx: number) => ({
              id: item.guid || item.link || `${feedId}-${idx}`,
              title: decodeHtmlEntities(item.title || "Untitled"),
              link: item.link || "",
              description: decodeHtmlEntities((item.description || item.content || "").replace(/<[^>]+>/g, "")).slice(0, 280),
              pubDate: item.pubDate || new Date().toISOString(),
              sourceTitle: json.feed?.title ? decodeHtmlEntities(json.feed.title) : "News",
              author: item.author || "",
              feedId
            }));
          }
        }
        continue;
      }

      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const xmlText = await res.text();
        if (xmlText && (xmlText.includes("<rss") || xmlText.includes("<feed") || xmlText.includes("<channel"))) {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlText, "text/xml");
          const items = Array.from(xmlDoc.querySelectorAll("item, entry"));

          let sourceTitle = xmlDoc.querySelector("channel > title, feed > title")?.textContent || "News";
          sourceTitle = decodeHtmlEntities(sourceTitle).replace(/<[^>]+>/g, "").trim();

          if (items.length > 0) {
            return items.map((item, idx) => {
              const title = item.querySelector("title")?.textContent || "Untitled";
              let link = item.querySelector("link")?.textContent || "";
              if (!link) {
                const linkAttr = item.querySelector("link")?.getAttribute("href");
                if (linkAttr) link = linkAttr;
              }
              const guid = item.querySelector("guid, id")?.textContent || link || `${feedId}-${idx}`;
              const description = item.querySelector("description, summary, content")?.textContent || "";
              const pubDate = item.querySelector("pubDate, published, updated")?.textContent || new Date().toISOString();
              const author = item.querySelector("author, creator")?.textContent || "";

              return {
                id: guid.trim(),
                title: decodeHtmlEntities(title.trim()),
                link: link.trim(),
                description: decodeHtmlEntities(description.replace(/<[^>]+>/g, "").trim()).slice(0, 280),
                pubDate: pubDate.trim(),
                sourceTitle,
                author: author.trim(),
                feedId
              };
            });
          }
        }
      }
    } catch {
      // try next candidate
    }
  }

  return [];
}
