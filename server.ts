/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { XMLParser } from "fast-xml-parser";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Default stable feeds list
const DEFAULT_FEEDS = [
  { id: "bbc", title: "BBC News - World", url: "http://feeds.bbci.co.uk/news/world/rss.xml", category: "World" },
  { id: "un-news", title: "UN News (Global)", url: "https://news.un.org/feed/subscribe/en/news/all/rss.xml", category: "World" },
  { id: "dw-news", title: "DW News (Deutsche Welle)", url: "https://rss.dw.com/rdf/rss_en_all", category: "World" },
  { id: "google-news", title: "Google News", url: "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en", category: "General" },
  { id: "tc", title: "TechCrunch", url: "https://techcrunch.com/feed/", category: "Tech" },
  { id: "hn", title: "Hacker News", url: "https://news.ycombinator.com/rss", category: "Tech" },
  { id: "verge", title: "The Verge", url: "https://www.theverge.com/rss/index.xml", category: "Tech" },
  { id: "nasa", title: "NASA News Releases", url: "https://www.nasa.gov/news-release/feed/", category: "Science" },
  { id: "smithsonian", title: "Smithsonian Magazine", url: "https://www.smithsonianmag.com/rss/latest_articles/", category: "Culture" }
];

// Helper function to decode all HTML entities (e.g. &#x27;, &quot;, &amp;, etc.)
function decodeHtmlEntities(str: string): string {
  if (!str) return "";
  let decoded = str;
  // Loop up to 2 times to handle double-encoded entities like &amp;#x27;
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
      .replace(/&ldquo;/g, "“")
      .replace(/&mdash;/g, "—")
      .replace(/&ndash;/g, "–")
      .replace(/&hellip;/g, "…")
      .replace(/&copy;/g, "©")
      .replace(/&reg;/g, "®");
  }
  return decoded;
}

// Helper to fetch and parse an RSS feed
async function fetchAndParseFeed(feedUrl: string) {
  try {
    const response = await fetch(feedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache"
      },
      signal: AbortSignal.timeout(10000) // 10s timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP status ${response.status}`);
    }

    const xmlText = await response.text();
    
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_"
    });
    const result = parser.parse(xmlText);

    // RSS 2.0 structure: result.rss.channel.item
    // Atom structure: result.feed.entry
    let items: any[] = [];
    let feedTitle = "Unknown Feed";

    if (result.rss && result.rss.channel) {
      feedTitle = typeof result.rss.channel.title === "object"
        ? (result.rss.channel.title["#text"] || JSON.stringify(result.rss.channel.title))
        : String(result.rss.channel.title || feedTitle);

      const parsedItems = result.rss.channel.item;
      if (Array.isArray(parsedItems)) {
        items = parsedItems;
      } else if (parsedItems) {
        items = [parsedItems];
      }
    } else if (result.feed) {
      feedTitle = typeof result.feed.title === "object"
        ? (result.feed.title["#text"] || JSON.stringify(result.feed.title))
        : String(result.feed.title || feedTitle);

      const parsedEntries = result.feed.entry;
      if (Array.isArray(parsedEntries)) {
        items = parsedEntries;
      } else if (parsedEntries) {
        items = [parsedEntries];
      }
    }

    feedTitle = decodeHtmlEntities(feedTitle.trim());

    const seenItemIds = new Set<string>();

    // Standardize items
    return items.map((item, index) => {
      let linkStr = "";
      if (item.link) {
        if (typeof item.link === "string") {
          linkStr = item.link;
        } else if (typeof item.link === "object") {
          if (item.link["#text"]) {
            linkStr = item.link["#text"];
          } else if (item.link["@_href"]) {
            linkStr = item.link["@_href"];
          } else if (Array.isArray(item.link)) {
            const selfLink = item.link.find((l: any) => l["@_rel"] === "alternate" || !l["@_rel"]);
            const foundLink = selfLink ? selfLink["@_href"] : (item.link[0]?.["@_href"] || item.link[0]?.["#text"] || "");
            linkStr = typeof foundLink === "string" ? foundLink : "";
          }
        }
      }
      linkStr = String(linkStr || "").trim();

      let description = item.description || item.summary || item.content || "";
      if (typeof description === "object") {
        description = description["#text"] || JSON.stringify(description);
      }
      // Strip any HTML tags from descriptions for standard view
      const cleanDesc = decodeHtmlEntities(String(description || "").replace(/<[^>]*>/g, "").trim());

      const pubDate = String(item.pubDate || item.published || item.updated || new Date().toUTCString());

      let titleStr = "Untitled Article";
      if (item.title) {
        titleStr = typeof item.title === "object" ? (item.title["#text"] || JSON.stringify(item.title)) : String(item.title);
      }
      titleStr = decodeHtmlEntities(titleStr.trim());

      // Ensure article ID is a string primitive
      let rawId = "";
      if (item.guid) {
        rawId = typeof item.guid === "object" ? (item.guid["#text"] || JSON.stringify(item.guid)) : String(item.guid);
      } else if (item.id) {
        rawId = typeof item.id === "object" ? (item.id["#text"] || JSON.stringify(item.id)) : String(item.id);
      }
      
      const baseId = String(rawId || linkStr || `art-${index}`).trim();
      let finalId = baseId || `art-${index}`;
      if (seenItemIds.has(finalId)) {
        finalId = `${finalId}-${index}`;
      }
      seenItemIds.add(finalId);

      let authorStr = undefined;
      if (item.creator) {
        authorStr = typeof item.creator === "object" ? (item.creator["#text"] || JSON.stringify(item.creator)) : String(item.creator);
      } else if (item["dc:creator"]) {
        authorStr = typeof item["dc:creator"] === "object" ? (item["dc:creator"]["#text"] || JSON.stringify(item["dc:creator"])) : String(item["dc:creator"]);
      } else if (item.author) {
        authorStr = typeof item.author === "object" ? (item.author.name || item.author["#text"] || JSON.stringify(item.author)) : String(item.author);
      }
      if (authorStr) {
        authorStr = decodeHtmlEntities(authorStr.trim());
      }

      return {
        id: finalId,
        title: titleStr,
        link: linkStr,
        description: cleanDesc.slice(0, 300) + (cleanDesc.length > 300 ? "..." : ""),
        pubDate,
        author: authorStr,
        sourceTitle: feedTitle
      };
    });
  } catch (error: any) {
    console.error(`Error parsing feed ${feedUrl}:`, error.message);
    throw error;
  }
}

// 1. Get RSS feeds (default or custom proxy)
app.post("/api/feeds", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "Feed URL is required" });
  }

  try {
    const articles = await fetchAndParseFeed(url);
    res.json({ articles });
  } catch (error: any) {
    res.status(500).json({ error: `Failed to fetch or parse feed: ${error.message}` });
  }
});

// 2. Extract full text from any article URL (Reader View)
app.post("/api/extract", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
      },
      signal: AbortSignal.timeout(12000)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    // Custom lightweight scraper: extracts `<p>` elements
    // Let's first clean the HTML of scripts, styles, iframes, footers, etc.
    let cleanHtml = html
      .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "")
      .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, "")
      .replace(/<footer[^>]*>([\s\S]*?)<\/footer>/gi, "")
      .replace(/<nav[^>]*>([\s\S]*?)<\/nav>/gi, "")
      .replace(/<header[^>]*>([\s\S]*?)<\/header>/gi, "");

    // Regex match paragraphs
    const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let match;
    const paragraphs: string[] = [];

    while ((match = paragraphRegex.exec(cleanHtml)) !== null) {
      let pText = decodeHtmlEntities(
        match[1]
          .replace(/<[^>]*>/g, "") // Strip nested tags
          .replace(/\s+/g, " ")    // Normalize spaces
          .trim()
      );

      // Only keep paragraphs that look like actual article body content
      if (pText.length > 50 && !pText.toLowerCase().includes("cookie") && !pText.toLowerCase().includes("subscribe") && !pText.toLowerCase().includes("privacy policy") && !pText.toLowerCase().includes("follow us")) {
        paragraphs.push(pText);
      }
    }

    if (paragraphs.length === 0) {
      // Fallback: try simple body text or a backup match
      const bodyMatch = /<body[^>]*>([\s\S]*?)<\/body>/gi.exec(cleanHtml);
      if (bodyMatch) {
        const backupText = bodyMatch[1]
          .replace(/<[^>]*>/g, "\n")
          .split("\n")
          .map(s => decodeHtmlEntities(s.trim()))
          .filter(s => s.length > 60);
        paragraphs.push(...backupText.slice(0, 15));
      }
    }

    const fullText = paragraphs.slice(0, 25).join("\n\n"); // Keep it concise but complete (max 25 paragraphs)

    if (!fullText) {
      throw new Error("Could not extract main readable text from this page.");
    }

    res.json({ fullText });
  } catch (error: any) {
    res.status(500).json({ error: `Reader View parsing failed: ${error.message}` });
  }
});

// Vite Middleware & Static Handling
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
