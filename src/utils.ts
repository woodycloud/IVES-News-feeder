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
  { id: "bbc", title: "BBC News - World", url: "http://feeds.bbci.co.uk/news/world/rss.xml", category: "World", isDefault: true, enabled: true },
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
    
    // Auto-merge new default feeds so existing users get them instantly without wiping custom configurations
    const savedUrls = new Set(saved.map((f: Feed) => f.url));
    const merged = [...saved];
    let changed = false;
    for (const defFeed of DEFAULT_FEEDS) {
      if (!savedUrls.has(defFeed.url)) {
        merged.push(defFeed);
        changed = true;
      }
    }
    if (changed) {
      localStorage.setItem(FEEDS_KEY, JSON.stringify(merged));
    }
    return merged;
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
  if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[Service Worker] Registered successfully with scope:", reg.scope);
        })
        .catch((err) => {
          console.error("[Service Worker] Registration failed:", err);
        });
    });
  }
}
