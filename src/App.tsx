/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Feed, Article, SavedArticle } from "./types";
import FeedList from "./components/FeedList";
import ArticleList from "./components/ArticleList";
import ArticleReader from "./components/ArticleReader";
import FeedManager from "./components/FeedManager";
import {
  getSavedFeeds,
  saveFeeds,
  getBookmarks,
  toggleBookmark as utilsToggleBookmark,
  getReadHistory,
  markAsRead as utilsMarkAsRead,
  getOfflineArticles,
  saveArticleForOffline,
  removeOfflineArticle,
  DEFAULT_FEEDS,
  registerServiceWorker,
  fetchSingleFeedArticles,
} from "./utils";
import { Menu, ChevronLeft, Rss } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ivesLogo from "./assets/logo.png";

export default function App() {
  // Persistence States
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [bookmarks, setBookmarks] = useState<Article[]>([]);
  const [readHistory, setReadHistory] = useState<string[]>([]);
  const [offlineArticles, setOfflineArticles] = useState<Record<string, SavedArticle>>({});

  // Active States
  const [activeFeed, setActiveFeed] = useState<string | "all" | "bookmarks" | "offline">("all");
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  
  // UI & Network States
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [loading, setLoading] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar drawer toggler
  const [viewMode, setViewMode] = useState<"list" | "reader">("list"); // Mobile view selector
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("ives_dark_mode");
      if (saved !== null) return JSON.parse(saved);
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      return false;
    }
  });

  // Dark mode class synchronization
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    try {
      localStorage.setItem("ives_dark_mode", JSON.stringify(isDarkMode));
    } catch {}
  }, [isDarkMode]);

  const handleToggleDarkMode = () => setIsDarkMode((prev) => !prev);

  // Initial load
  useEffect(() => {
    setFeeds(getSavedFeeds());
    setBookmarks(getBookmarks());
    setReadHistory(getReadHistory());
    setOfflineArticles(getOfflineArticles());

    // Register service worker in production
    registerServiceWorker();

    // Network status listeners
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // When offline status changes
  useEffect(() => {
    if (isOffline) {
      if (activeFeed !== "bookmarks" && activeFeed !== "offline") {
        setActiveFeed("offline");
      }
    }
  }, [isOffline]);

  // Load articles based on active feed/tab
  useEffect(() => {
    fetchArticles();
  }, [activeFeed, feeds, bookmarks, offlineArticles]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      if (activeFeed === "bookmarks") {
        setArticles(bookmarks);
      } else if (activeFeed === "offline") {
        const list = (Object.values(offlineArticles) as SavedArticle[]).map((saved) => saved.article);
        setArticles(list);
      } else if (activeFeed === "all") {
        const activeList = feeds.filter((f) => f.enabled);
        if (activeList.length === 0) {
          setArticles([]);
          setLoading(false);
          return;
        }

        const allPromises = activeList.map((feed) => fetchSingleFeedArticles(feed.url, feed.id));

        const results = await Promise.all(allPromises);
        const aggregated = results.flat();
        aggregated.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
        
        // Deduplicate articles by unique ID
        const seenIds = new Set<string>();
        const uniqueArticles = aggregated.filter((art) => {
          if (!art || !art.id || seenIds.has(art.id)) return false;
          seenIds.add(art.id);
          return true;
        });

        setArticles(uniqueArticles);
      } else {
        const targetFeed = feeds.find((f) => f.id === activeFeed);
        if (!targetFeed) {
          setArticles([]);
          setLoading(false);
          return;
        }

        const feedArticles = await fetchSingleFeedArticles(targetFeed.url, targetFeed.id);

        // Deduplicate articles
        const seenIds = new Set<string>();
        const uniqueArticles = feedArticles.filter((art: any) => {
          if (!art || !art.id || seenIds.has(art.id)) return false;
          seenIds.add(art.id);
          return true;
        });

        setArticles(uniqueArticles);
      }
    } catch (err) {
      console.error("Error fetching articles:", err);
      if (activeFeed === "all") {
        const list = (Object.values(offlineArticles) as SavedArticle[]).map((saved) => saved.article);
        setArticles(list);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectArticle = (article: Article) => {
    setSelectedArticle(article);
    setViewMode("reader");
    
    // Mark as read
    const updatedHistory = utilsMarkAsRead(article.id);
    setReadHistory(updatedHistory);
  };

  const handleToggleBookmark = (article: Article) => {
    const updated = utilsToggleBookmark(article);
    setBookmarks(updated);

    if (selectedArticle && selectedArticle.id === article.id) {
      setSelectedArticle({ ...selectedArticle, isBookmarked: !selectedArticle.isBookmarked });
    }
  };

  const handleSaveOffline = (article: Article, text: string) => {
    saveArticleForOffline(article, text);
    setOfflineArticles(getOfflineArticles());
  };

  const handleRemoveOffline = (articleId: string) => {
    removeOfflineArticle(articleId);
    setOfflineArticles(getOfflineArticles());
  };

  const handleSaveFeeds = (updatedFeeds: Feed[]) => {
    saveFeeds(updatedFeeds);
    setFeeds(updatedFeeds);
  };

  const handleResetFeeds = () => {
    if (confirm("Reset subscription list to default news channels?")) {
      saveFeeds(DEFAULT_FEEDS);
      setFeeds(DEFAULT_FEEDS);
      setActiveFeed("all");
    }
  };

  const getFeedTitle = () => {
    if (activeFeed === "all") return "Today's Headlines";
    if (activeFeed === "bookmarks") return "Saved Stories";
    if (activeFeed === "offline") return "Cached Offline";
    const found = feeds.find((f) => f.id === activeFeed);
    return found ? found.title : "Dispatches";
  };

  return (
    <div id="app-root-container" className="flex flex-col md:flex-row h-screen bg-[#F2F2F7] dark:bg-[#000000] overflow-hidden text-stone-900 dark:text-stone-100 w-full font-sans antialiased select-none">
      {/* Mobile Top Navigation Header */}
      <div id="mobile-top-bar" className="md:hidden bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl px-4 py-3 flex items-center justify-between border-b border-black/5 dark:border-white/10 shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            id="mobile-menu-btn"
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 rounded-full bg-stone-100 dark:bg-[#2C2C2E] flex items-center justify-center text-[#007AFF] cursor-pointer shadow-xs"
          >
            <Menu size={18} />
          </motion.button>
          <div className="flex items-center gap-2">
            <img
              src={ivesLogo}
              alt="IVES News Logo"
              className="w-7 h-7 rounded-lg object-cover shadow-xs border border-black/10 dark:border-white/10"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "./Ives.png";
              }}
            />
            <span className="font-sans font-bold text-base tracking-tight text-stone-900 dark:text-white">IVES News</span>
          </div>
        </div>

        {selectedArticle && viewMode === "reader" && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            id="mobile-view-toggle-btn"
            onClick={() => setViewMode("list")}
            className="flex items-center gap-1 text-xs font-semibold text-[#007AFF] bg-[#007AFF]/10 px-3 py-1.5 rounded-full cursor-pointer"
          >
            <ChevronLeft size={16} />
            <span>Stories</span>
          </motion.button>
        )}
      </div>

      {/* 1. Left Sidebar Drawer Panel (Feed list) */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            id="sidebar-overlay"
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <div
        id="sidebar-container"
        className={`fixed inset-y-0 left-0 z-50 md:relative md:z-auto transition-transform duration-300 ease-out md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <FeedList
          feeds={feeds}
          activeFeed={activeFeed}
          onSelectFeed={(id) => {
            setActiveFeed(id);
            setSidebarOpen(false);
            if (viewMode === "reader") setViewMode("list");
          }}
          onOpenFeedManager={() => {
            setManagerOpen(true);
            setSidebarOpen(false);
          }}
          isOffline={isOffline}
          offlineCount={Object.keys(offlineArticles).length}
          bookmarkCount={bookmarks.length}
          isDarkMode={isDarkMode}
          onToggleDarkMode={handleToggleDarkMode}
        />
      </div>

      {/* 2. Middle Column Panel (Article List Stream) */}
      <div
        id="list-column-wrapper"
        className={`h-full flex-col md:flex ${
          viewMode === "list" ? "flex" : "hidden md:flex"
        } flex-1 md:flex-initial`}
      >
        <ArticleList
          articles={articles}
          selectedArticleId={selectedArticle?.id}
          onSelectArticle={handleSelectArticle}
          feedTitle={getFeedTitle()}
          loading={loading}
          onRefresh={fetchArticles}
          readHistory={readHistory}
          bookmarks={bookmarks}
          offlineIds={Object.keys(offlineArticles)}
        />
      </div>

      {/* 3. Right Column Panel (Apple Reader Canvas View) */}
      <div
        id="reader-column-wrapper"
        className={`h-full ${
          viewMode === "reader" ? "flex" : "hidden md:flex"
        } flex-1 min-w-0`}
      >
        <ArticleReader
          article={selectedArticle}
          onToggleBookmark={handleToggleBookmark}
          isBookmarked={bookmarks.some((b) => b.id === selectedArticle?.id)}
          onSaveOffline={handleSaveOffline}
          onRemoveOffline={handleRemoveOffline}
          isOfflineSaved={selectedArticle ? !!offlineArticles[selectedArticle.id] : false}
          offlineText={selectedArticle ? offlineArticles[selectedArticle.id]?.fullText : ""}
          isNetworkOffline={isOffline}
          onBackToList={() => setViewMode("list")}
        />
      </div>

      {/* 4. Feed Manager Dialog Sheet Modal */}
      <FeedManager
        feeds={feeds}
        isOpen={managerOpen}
        onClose={() => setManagerOpen(false)}
        onSaveFeeds={handleSaveFeeds}
        onResetToDefaults={handleResetFeeds}
      />
    </div>
  );
}

