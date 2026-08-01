/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Article } from "../types";
import { Search, SlidersHorizontal, BookOpenCheck, Bookmark, Download, RefreshCw, X, CheckCircle2 } from "lucide-react";
import { formatPubDate, decodeHtmlEntities } from "../utils";
import { motion, AnimatePresence } from "motion/react";

interface ArticleListProps {
  articles: Article[];
  selectedArticleId?: string;
  onSelectArticle: (article: Article) => void;
  feedTitle: string;
  loading: boolean;
  onRefresh: () => void;
  readHistory: string[];
  bookmarks: Article[];
  offlineIds: string[];
}

export default function ArticleList({
  articles,
  selectedArticleId,
  onSelectArticle,
  feedTitle,
  loading,
  onRefresh,
  readHistory,
  bookmarks,
  offlineIds,
}: ArticleListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterUnread, setFilterUnread] = useState(false);

  // Filter articles based on query and unread preference
  const filteredArticles = articles.filter((article) => {
    const titleStr = typeof article.title === "string" ? article.title : (article.title ? String(article.title) : "");
    const descStr = typeof article.description === "string" ? article.description : (article.description ? String(article.description) : "");
    const sourceStr = typeof article.sourceTitle === "string" ? article.sourceTitle : (article.sourceTitle ? String(article.sourceTitle) : "");

    const matchesSearch =
      titleStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      descStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sourceStr.toLowerCase().includes(searchQuery.toLowerCase());

    const isRead = readHistory.includes(article.id);
    const matchesUnread = !filterUnread || !isRead;

    return matchesSearch && matchesUnread;
  });

  // Source-specific badge color generator with Apple HIG System palette
  const getSourceBadgeClass = (source: string) => {
    const s = String(source || "").toLowerCase();
    if (s.includes("bbc")) return "text-[#FF3B30] bg-[#FF3B30]/10 dark:bg-[#FF3B30]/20";
    if (s.includes("techcrunch") || s.includes("tc")) return "text-[#34C759] bg-[#34C759]/10 dark:bg-[#34C759]/20";
    if (s.includes("hacker") || s.includes("hn")) return "text-[#FF9F0A] bg-[#FF9F0A]/10 dark:bg-[#FF9F0A]/20";
    if (s.includes("verge") || s.includes("google")) return "text-[#007AFF] bg-[#007AFF]/10 dark:bg-[#007AFF]/20";
    return "text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800";
  };

  return (
    <section id="article-list-panel" aria-label="Articles Feed" className="w-full md:w-80 lg:w-96 border-r border-black/5 dark:border-white/10 h-full flex flex-col bg-[#F2F2F7] dark:bg-[#000000] shrink-0 select-none">
      {/* iOS Large Header & Action Bar */}
      <header className="p-4 md:p-5 pb-3 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border-b border-black/5 dark:border-white/10 flex flex-col gap-3 shrink-0 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#007AFF] uppercase block">
              {filteredArticles.length} {filteredArticles.length === 1 ? "ARTICLE" : "ARTICLES"}
            </span>
            <h2 className="text-xl md:text-2xl font-bold font-sans text-stone-900 dark:text-white tracking-tight leading-tight">
              {feedTitle}
            </h2>
          </div>

          <motion.button
            whileTap={{ scale: 0.9, rotate: 180 }}
            id="refresh-feed-btn"
            onClick={onRefresh}
            disabled={loading}
            aria-label="Refresh feed"
            className={`w-9 h-9 rounded-full bg-stone-100 dark:bg-[#2C2C2E] flex items-center justify-center text-[#007AFF] dark:text-[#0A84FF] transition-all cursor-pointer shadow-xs ${
              loading ? "animate-spin" : ""
            }`}
            title="Refresh articles"
          >
            <RefreshCw size={15} />
          </motion.button>
        </div>

        {/* iOS Segmented Control */}
        <div role="tablist" aria-label="Article Filter Options" className="bg-[#E5E5EA] dark:bg-[#2C2C2E] p-1 rounded-xl flex items-center gap-1 text-xs font-semibold relative">
          <button
            role="tab"
            aria-selected={!filterUnread}
            onClick={() => setFilterUnread(false)}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
              !filterUnread
                ? "bg-white dark:bg-[#3A3A3C] text-stone-900 dark:text-white shadow-xs"
                : "text-stone-500 dark:text-stone-400 hover:text-stone-800"
            }`}
          >
            All Stories
          </button>
          <button
            role="tab"
            aria-selected={filterUnread}
            onClick={() => setFilterUnread(true)}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
              filterUnread
                ? "bg-white dark:bg-[#3A3A3C] text-[#007AFF] dark:text-[#0A84FF] shadow-xs"
                : "text-stone-500 dark:text-stone-400 hover:text-stone-800"
            }`}
          >
            Unread
          </button>
        </div>

        {/* iOS Search Capsule Input */}
        <div className="relative flex items-center bg-[#E5E5EA]/70 dark:bg-[#2C2C2E]/80 rounded-xl px-3 py-2">
          <Search size={15} className="text-stone-400 dark:text-stone-500 shrink-0" />
          <input
            id="article-search-input"
            type="text"
            aria-label="Search stories"
            placeholder="Search stories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-2 bg-transparent text-xs font-sans text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              aria-label="Clear search query"
              className="p-1 rounded-full bg-stone-300 dark:bg-stone-600 text-stone-600 dark:text-stone-200 cursor-pointer shrink-0"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </header>

      {/* Article Cards Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {loading ? (
          /* iOS Skeleton Shimmer Cards */
          <div className="space-y-3 p-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-black/5 dark:border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-16 h-3 shimmer rounded-md"></div>
                  <div className="w-12 h-3 shimmer rounded-md"></div>
                </div>
                <div className="w-full h-4 shimmer rounded-md"></div>
                <div className="w-3/4 h-4 shimmer rounded-md"></div>
                <div className="w-full h-3 shimmer rounded-md"></div>
              </div>
            ))}
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center justify-center h-full gap-3">
            <div className="w-12 h-12 rounded-full bg-stone-200 dark:bg-[#1C1C1E] flex items-center justify-center text-stone-400 dark:text-stone-500">
              <Search size={22} />
            </div>
            <p className="text-sm font-semibold text-stone-600 dark:text-stone-300">No Stories Found</p>
            {filterUnread && (
              <button
                onClick={() => setFilterUnread(false)}
                className="text-xs font-semibold text-[#007AFF] hover:underline cursor-pointer"
              >
                View All Stories
              </button>
            )}
          </div>
        ) : (
          filteredArticles.map((article) => {
            const isSelected = selectedArticleId === article.id;
            const isRead = readHistory.includes(article.id);
            const isBookmarked = bookmarks.some((b) => b.id === article.id);
            const isOffline = offlineIds.includes(article.id);

            return (
              <motion.div
                key={article.id}
                whileTap={{ scale: 0.98 }}
                id={`article-item-${article.id}`}
                onClick={() => onSelectArticle(article)}
                className={`p-4 rounded-2xl cursor-pointer transition-all select-none relative border ${
                  isSelected
                    ? "bg-white dark:bg-[#2C2C2E] border-[#007AFF] shadow-md shadow-[#007AFF]/10 ring-2 ring-[#007AFF]/20"
                    : "bg-white dark:bg-[#1C1C1E] hover:bg-stone-50 dark:hover:bg-[#262628] border-black/5 dark:border-white/5 shadow-xs"
                }`}
              >
                {/* Unread Indicator Dot */}
                {!isRead && (
                  <div className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-[#007AFF] shadow-xs shadow-[#007AFF]/50"></div>
                )}

                {/* Source & Pub Date */}
                <div className="flex items-center justify-between gap-2 mb-2 pr-4">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${getSourceBadgeClass(article.sourceTitle)}`}>
                      {article.sourceTitle}
                    </span>
                    <span className="text-[11px] font-medium text-stone-400 dark:text-stone-500">
                      {formatPubDate(article.pubDate)}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h3
                  className={`text-[15px] font-sans font-semibold leading-snug tracking-tight mb-2 ${
                    isRead ? "text-stone-500 dark:text-stone-400 font-normal" : "text-stone-900 dark:text-white"
                  }`}
                >
                  {decodeHtmlEntities(article.title)}
                </h3>

                {/* Description Preview */}
                {article.description && (
                  <p className="text-xs font-sans text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed mb-3">
                    {decodeHtmlEntities(article.description)}
                  </p>
                )}

                {/* Action / State Badges */}
                <div className="flex items-center gap-2 pt-1 border-t border-stone-100 dark:border-white/5">
                  {isBookmarked && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-[#FF9F0A] bg-[#FF9F0A]/10 px-2 py-0.5 rounded-full">
                      <Bookmark size={10} className="fill-current" />
                      Saved
                    </span>
                  )}
                  {isOffline && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-[#34C759] bg-[#34C759]/10 px-2 py-0.5 rounded-full">
                      <Download size={10} />
                      Cached
                    </span>
                  )}
                  {isRead && (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-stone-400 dark:text-stone-500 ml-auto">
                      <CheckCircle2 size={11} className="text-[#34C759]" />
                      Read
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </section>
  );
}

