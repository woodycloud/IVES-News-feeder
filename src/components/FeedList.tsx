/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Feed } from "../types";
import { Newspaper, Bookmark, Download, Settings, Plus, Rss, ChevronRight, Globe, Cpu, Atom, Sparkles, SlidersHorizontal, Moon, Sun } from "lucide-react";
import { motion } from "motion/react";
import ivesLogo from "../assets/logo.png";

interface FeedListProps {
  feeds: Feed[];
  activeFeed: string | "all" | "bookmarks" | "offline";
  onSelectFeed: (id: string | "all" | "bookmarks" | "offline") => void;
  onOpenFeedManager: () => void;
  isOffline: boolean;
  offlineCount: number;
  bookmarkCount: number;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export default function FeedList({
  feeds,
  activeFeed,
  onSelectFeed,
  onOpenFeedManager,
  isOffline,
  offlineCount,
  bookmarkCount,
  isDarkMode,
  onToggleDarkMode
}: FeedListProps) {
  const categories = Array.from(new Set(feeds.filter(f => f.enabled).map(f => f.category)));

  const getCategoryIcon = (category: string) => {
    const c = category.toLowerCase();
    if (c.includes("world") || c.includes("news")) return <Globe size={15} className="text-[#007AFF]" />;
    if (c.includes("tech") || c.includes("general")) return <Cpu size={15} className="text-[#34C759]" />;
    if (c.includes("science")) return <Atom size={15} className="text-[#FF9F0A]" />;
    return <Sparkles size={15} className="text-[#AF52DE]" />;
  };

  return (
    <div id="feed-sidebar" className="w-full md:w-72 bg-[#F2F2F7] dark:bg-[#000000] text-stone-900 dark:text-stone-100 p-4 md:p-5 flex flex-col h-full border-r border-black/5 dark:border-white/10 shrink-0 select-none overflow-y-auto">
      {/* iOS App Navigation Header */}
      <div className="flex items-center justify-between mb-6 pt-2 px-1">
        <div className="flex items-center gap-3">
          <img
            src={ivesLogo}
            alt="IVES News Logo"
            className="w-10 h-10 rounded-xl object-cover shadow-sm border border-black/10 dark:border-white/10"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "./Ives.png";
            }}
          />
          <div>
            <h1 className="font-sans font-bold text-lg tracking-tight text-stone-900 dark:text-white leading-none">IVES News</h1>
            <span className="text-[11px] font-medium text-stone-400 dark:text-stone-500 mt-1 block">RSS Reader</span>
          </div>
        </div>

        {/* Network & Dark Mode Toggles */}
        <div className="flex items-center gap-2">
          {onToggleDarkMode && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onToggleDarkMode}
              className="w-8 h-8 rounded-full bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/10 flex items-center justify-center text-stone-600 dark:text-stone-300 shadow-xs cursor-pointer"
              title="Toggle Appearance"
            >
              {isDarkMode ? <Sun size={15} className="text-[#FF9F0A]" /> : <Moon size={15} />}
            </motion.button>
          )}

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/10 text-[10px] font-semibold tracking-tight shadow-xs">
            {isOffline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-[#FF9F0A] animate-pulse"></span>
                <span className="text-[#FF9F0A]">Offline</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-[#34C759]"></span>
                <span className="text-[#34C759]">Online</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Sections - iOS Inset Grouped List Style */}
      <div className="space-y-6 flex-1 pr-0.5">
        {/* Section 1: Library */}
        <div>
          <span className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider block px-3 mb-2">
            LIBRARY
          </span>
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-1.5 shadow-xs border border-black/5 dark:border-white/5 space-y-0.5">
            <motion.button
              whileTap={{ scale: 0.98 }}
              id="library-all-btn"
              onClick={() => onSelectFeed("all")}
              disabled={isOffline}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all text-left cursor-pointer ${
                activeFeed === "all"
                  ? "bg-[#007AFF] text-white font-semibold shadow-xs"
                  : isOffline
                  ? "text-stone-300 dark:text-stone-600 cursor-not-allowed"
                  : "text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#2C2C2E]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${activeFeed === "all" ? "bg-white/20 text-white" : "bg-[#007AFF]/10 text-[#007AFF]"}`}>
                  <Newspaper size={16} />
                </div>
                <span>Today's Feed</span>
              </div>
              <ChevronRight size={14} className={activeFeed === "all" ? "text-white/70" : "text-stone-400 dark:text-stone-600"} />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.98 }}
              id="library-bookmarks-btn"
              onClick={() => onSelectFeed("bookmarks")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all text-left cursor-pointer ${
                activeFeed === "bookmarks"
                  ? "bg-[#007AFF] text-white font-semibold shadow-xs"
                  : "text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#2C2C2E]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${activeFeed === "bookmarks" ? "bg-white/20 text-white" : "bg-[#FF9F0A]/10 text-[#FF9F0A]"}`}>
                  <Bookmark size={16} />
                </div>
                <span>Saved Stories</span>
              </div>
              <div className="flex items-center gap-1.5">
                {bookmarkCount > 0 && (
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${activeFeed === "bookmarks" ? "bg-white/20 text-white" : "bg-[#FF9F0A]/15 text-[#FF9F0A]"}`}>
                    {bookmarkCount}
                  </span>
                )}
                <ChevronRight size={14} className={activeFeed === "bookmarks" ? "text-white/70" : "text-stone-400 dark:text-stone-600"} />
              </div>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.98 }}
              id="library-offline-btn"
              onClick={() => onSelectFeed("offline")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all text-left cursor-pointer ${
                activeFeed === "offline"
                  ? "bg-[#007AFF] text-white font-semibold shadow-xs"
                  : "text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#2C2C2E]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${activeFeed === "offline" ? "bg-white/20 text-white" : "bg-[#34C759]/10 text-[#34C759]"}`}>
                  <Download size={16} />
                </div>
                <span>Offline Cache</span>
              </div>
              <div className="flex items-center gap-1.5">
                {offlineCount > 0 && (
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${activeFeed === "offline" ? "bg-white/20 text-white" : "bg-[#34C759]/15 text-[#34C759]"}`}>
                    {offlineCount}
                  </span>
                )}
                <ChevronRight size={14} className={activeFeed === "offline" ? "text-white/70" : "text-stone-400 dark:text-stone-600"} />
              </div>
            </motion.button>
          </div>
        </div>

        {/* Section 2: RSS Channels */}
        {!isOffline && (
          <div>
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                CHANNELS
              </span>
              <motion.button
                whileTap={{ scale: 0.9 }}
                id="manage-feeds-btn"
                onClick={onOpenFeedManager}
                className="text-[#007AFF] dark:text-[#0A84FF] text-xs font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Edit</span>
              </motion.button>
            </div>

            <div className="space-y-3">
              {categories.map((cat) => (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center gap-1.5 px-3 py-1">
                    {getCategoryIcon(cat)}
                    <span className="text-[12px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">{cat}</span>
                  </div>
                  <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-1.5 shadow-xs border border-black/5 dark:border-white/5 space-y-0.5">
                    {feeds
                      .filter((f) => f.enabled && f.category === cat)
                      .map((feed, idx) => (
                        <motion.button
                          key={`${feed.id}-${idx}`}
                          whileTap={{ scale: 0.98 }}
                          id={`channel-feed-${feed.id}`}
                          onClick={() => onSelectFeed(feed.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition-all text-left cursor-pointer truncate ${
                            activeFeed === feed.id
                              ? "bg-[#007AFF] text-white font-semibold shadow-xs"
                              : "text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#2C2C2E]"
                          }`}
                        >
                          <span className="truncate pr-2">{feed.title}</span>
                          <ChevronRight size={13} className={activeFeed === feed.id ? "text-white/70 shrink-0" : "text-stone-300 dark:text-stone-600 shrink-0"} />
                        </motion.button>
                      ))}
                  </div>
                </div>
              ))}

              {feeds.filter(f => f.enabled).length === 0 && (
                <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-4 text-center">
                  <p className="text-xs text-stone-400 dark:text-stone-500 italic">No news channels enabled</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="pt-4 mt-auto space-y-2">
        <motion.button
          whileTap={{ scale: 0.97 }}
          id="add-custom-feed-shortcut"
          onClick={onOpenFeedManager}
          className="w-full flex items-center justify-center gap-2 py-3 bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-2xl text-xs font-semibold transition-all shadow-md shadow-[#007AFF]/20 cursor-pointer"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Add Channel</span>
        </motion.button>

        <div className="flex items-center justify-between text-[11px] font-medium text-stone-400 dark:text-stone-500 px-2 pt-1">
          <span>iOS HIG Edition</span>
          <span>Offline Ready</span>
        </div>
      </div>
    </div>
  );
}

