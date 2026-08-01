/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Article } from "../types";
import {
  Bookmark,
  BookmarkCheck,
  Download,
  ExternalLink,
  BookOpen,
  Copy,
  Check,
  AlertCircle,
  Type,
  ChevronLeft,
  X,
  Share2,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { decodeHtmlEntities } from "../utils";

interface ArticleReaderProps {
  article: Article | null;
  onToggleBookmark: (article: Article) => void;
  isBookmarked: boolean;
  onSaveOffline: (article: Article, text: string) => void;
  onRemoveOffline: (id: string) => void;
  isOfflineSaved: boolean;
  offlineText?: string;
  isNetworkOffline: boolean;
  onBackToList?: () => void;
}

type ReaderFont = "sf" | "newyork" | "mono";
type ReaderTheme = "light" | "sepia" | "dark";

export default function ArticleReader({
  article,
  onToggleBookmark,
  isBookmarked,
  onSaveOffline,
  onRemoveOffline,
  isOfflineSaved,
  offlineText,
  isNetworkOffline,
  onBackToList,
}: ArticleReaderProps) {
  const [fullText, setFullText] = useState("");
  const [fetchingText, setFetchingText] = useState(false);
  const [textError, setTextError] = useState("");
  const [copied, setCopied] = useState(false);

  // Reader Appearance Preferences
  const [showAppearanceMenu, setShowAppearanceMenu] = useState(false);
  const [fontSize, setFontSize] = useState<number>(18); // default 18px
  const [fontFamily, setFontFamily] = useState<ReaderFont>("newyork");
  const [readerTheme, setReaderTheme] = useState<ReaderTheme>("light");

  // Reset states when article changes
  useEffect(() => {
    if (!article) return;

    setCopied(false);

    // If we have it saved offline, load that text
    if (isOfflineSaved && offlineText) {
      setFullText(offlineText);
      setFetchingText(false);
      setTextError("");
    } else {
      setFullText("");
      setTextError("");
      if (!isNetworkOffline) {
        autoExtractText(article);
      } else {
        setTextError("Offline mode: Full text not saved.");
      }
    }
  }, [article, isOfflineSaved, offlineText, isNetworkOffline]);

  const getFriendlyErrorMessage = (rawError: string) => {
    if (rawError.includes("HTTP 403") || rawError.includes("HTTP 401")) {
      return "This publisher restricts web crawlers or requires a direct subscription.";
    }
    if (rawError.includes("HTTP 404")) {
      return "The article source page was not found or has been moved.";
    }
    if (rawError.includes("timeout") || rawError.includes("aborted")) {
      return "The connection timed out while reading the source.";
    }
    return rawError || "Source article text could not be extracted.";
  };

  const autoExtractText = async (target: Article) => {
    setFetchingText(true);
    setTextError("");
    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target.link }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Server extraction failed.");
      }

      const data = await response.json();
      if (data.fullText) {
        setFullText(data.fullText);
      } else {
        setTextError("No text paragraphs could be extracted.");
      }
    } catch (err: any) {
      setTextError(getFriendlyErrorMessage(err.message || ""));
    } finally {
      setFetchingText(false);
    }
  };

  const handleCopyText = () => {
    if (!article) return;
    const text = `${article.title}\n\n${fullText || article.description}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Compute font family class
  const getFontFamilyClass = () => {
    if (fontFamily === "sf") return "font-sans";
    if (fontFamily === "mono") return "font-mono";
    return "font-serif";
  };

  // Compute theme background class
  const getThemeClass = () => {
    if (readerTheme === "sepia") return "bg-[#F8F1E5] text-[#433422]";
    if (readerTheme === "dark") return "bg-[#1C1C1E] text-stone-100";
    return "bg-white dark:bg-[#121212] text-stone-900 dark:text-stone-100";
  };

  if (!article) {
    return (
      <div id="reader-empty" className="flex-1 flex flex-col items-center justify-center bg-[#F2F2F7] dark:bg-[#000000] p-8 h-full text-center select-none">
        <div className="w-16 h-16 rounded-3xl bg-white dark:bg-[#1C1C1E] shadow-sm border border-black/5 dark:border-white/10 flex items-center justify-center mb-4 text-[#007AFF]">
          <BookOpen size={28} />
        </div>
        <h3 className="text-stone-900 dark:text-white font-sans font-bold text-lg mb-1">IVES Reader Mode</h3>
        <p className="text-xs text-stone-400 dark:text-stone-500 font-sans max-w-xs leading-relaxed">
          Select any story from your feeds to read in distraction-free layout.
        </p>
      </div>
    );
  }

  return (
    <div id="article-reader-panel" className={`flex-1 h-full overflow-y-auto flex flex-col transition-colors duration-200 ${getThemeClass()}`}>
      {/* iOS Safari Style Top Action Bar */}
      <div className="sticky top-0 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border-b border-black/5 dark:border-white/10 px-4 md:px-6 py-3 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2">
          {onBackToList && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onBackToList}
              className="md:hidden flex items-center gap-1 text-[#007AFF] font-semibold text-sm cursor-pointer pr-2"
            >
              <ChevronLeft size={20} />
              <span>Stories</span>
            </motion.button>
          )}

          {/* AA Reader Appearance Button */}
          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setShowAppearanceMenu(!showAppearanceMenu)}
              className="w-9 h-9 rounded-full bg-stone-100 dark:bg-[#2C2C2E] flex items-center justify-center text-stone-700 dark:text-stone-200 font-semibold cursor-pointer shadow-xs hover:bg-stone-200 dark:hover:bg-[#3A3A3C] transition-all"
              title="Reader Options (AA)"
            >
              <Type size={16} />
            </motion.button>

            {/* iOS Appearance Popover Sheet */}
            <AnimatePresence>
              {showAppearanceMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-12 left-0 w-72 bg-white/95 dark:bg-[#2C2C2E]/95 backdrop-blur-2xl rounded-2xl p-4 shadow-xl border border-black/10 dark:border-white/10 z-50 text-stone-900 dark:text-white space-y-4"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10">
                    <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Reader Display</span>
                    <button
                      onClick={() => setShowAppearanceMenu(false)}
                      className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Text Size Controls */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-stone-400 uppercase">Text Size</span>
                    <div className="flex items-center justify-between bg-stone-100 dark:bg-[#1C1C1E] p-1.5 rounded-xl gap-2">
                      <button
                        onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                        className="w-9 h-8 bg-white dark:bg-[#3A3A3C] rounded-lg font-bold text-xs shadow-xs cursor-pointer"
                      >
                        A-
                      </button>
                      <span className="text-xs font-mono font-semibold">{fontSize}px</span>
                      <button
                        onClick={() => setFontSize(Math.min(26, fontSize + 2))}
                        className="w-9 h-8 bg-white dark:bg-[#3A3A3C] rounded-lg font-bold text-base shadow-xs cursor-pointer"
                      >
                        A+
                      </button>
                    </div>
                  </div>

                  {/* Font Family Switcher */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-stone-400 uppercase">Font</span>
                    <div className="grid grid-cols-3 gap-1 bg-stone-100 dark:bg-[#1C1C1E] p-1 rounded-xl">
                      <button
                        onClick={() => setFontFamily("sf")}
                        className={`py-1.5 rounded-lg text-xs font-sans font-semibold cursor-pointer ${
                          fontFamily === "sf" ? "bg-white dark:bg-[#3A3A3C] shadow-xs text-[#007AFF]" : "text-stone-500"
                        }`}
                      >
                        SF Pro
                      </button>
                      <button
                        onClick={() => setFontFamily("newyork")}
                        className={`py-1.5 rounded-lg text-xs font-serif font-semibold cursor-pointer ${
                          fontFamily === "newyork" ? "bg-white dark:bg-[#3A3A3C] shadow-xs text-[#007AFF]" : "text-stone-500"
                        }`}
                      >
                        New York
                      </button>
                      <button
                        onClick={() => setFontFamily("mono")}
                        className={`py-1.5 rounded-lg text-xs font-mono font-semibold cursor-pointer ${
                          fontFamily === "mono" ? "bg-white dark:bg-[#3A3A3C] shadow-xs text-[#007AFF]" : "text-stone-500"
                        }`}
                      >
                        Mono
                      </button>
                    </div>
                  </div>

                  {/* Reader Theme Modes */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-stone-400 uppercase">Theme</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => setReaderTheme("light")}
                        className={`py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                          readerTheme === "light" ? "border-[#007AFF] ring-2 ring-[#007AFF]/20 bg-white text-black" : "bg-white text-black border-stone-200"
                        }`}
                      >
                        Light
                      </button>
                      <button
                        onClick={() => setReaderTheme("sepia")}
                        className={`py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                          readerTheme === "sepia" ? "border-[#007AFF] ring-2 ring-[#007AFF]/20 bg-[#F8F1E5] text-[#433422]" : "bg-[#F8F1E5] text-[#433422] border-stone-300"
                        }`}
                      >
                        Sepia
                      </button>
                      <button
                        onClick={() => setReaderTheme("dark")}
                        className={`py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                          readerTheme === "dark" ? "border-[#007AFF] ring-2 ring-[#007AFF]/20 bg-[#1C1C1E] text-white" : "bg-[#1C1C1E] text-white border-stone-700"
                        }`}
                      >
                        Dark
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            whileTap={{ scale: 0.9 }}
            id="reader-bookmark-btn"
            onClick={() => onToggleBookmark(article)}
            aria-label={isBookmarked ? "Remove Bookmark" : "Save Bookmark"}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs ${
              isBookmarked ? "bg-[#FF9F0A]/20 text-[#FF9F0A]" : "bg-stone-100 dark:bg-[#2C2C2E] text-stone-500 dark:text-stone-300"
            }`}
            title={isBookmarked ? "Remove Bookmark" : "Save Bookmark"}
          >
            {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            id="reader-offline-btn"
            onClick={() => {
              if (isOfflineSaved) {
                onRemoveOffline(article.id);
              } else {
                onSaveOffline(article, fullText || article.description);
              }
            }}
            aria-label={isOfflineSaved ? "Cached Offline" : "Cache for offline reading"}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs ${
              isOfflineSaved ? "bg-[#34C759]/20 text-[#34C759]" : "bg-stone-100 dark:bg-[#2C2C2E] text-stone-500 dark:text-stone-300"
            }`}
            title={isOfflineSaved ? "Cached Offline" : "Cache for offline reading"}
          >
            <Download size={16} />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            id="reader-copy-btn"
            onClick={handleCopyText}
            aria-label="Copy article text"
            className="w-9 h-9 rounded-full bg-stone-100 dark:bg-[#2C2C2E] flex items-center justify-center text-stone-500 dark:text-stone-300 transition-all cursor-pointer shadow-xs"
            title="Copy article text"
          >
            {copied ? <Check size={16} className="text-[#34C759]" /> : <Copy size={16} />}
          </motion.button>
        </div>

        {/* Source Link Action Button */}
        <a
          id="reader-external-link"
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-semibold text-[#007AFF] hover:bg-[#007AFF]/10 px-3 py-1.5 rounded-full transition-all cursor-pointer"
        >
          <span>Source</span>
          <ExternalLink size={13} />
        </a>
      </div>

      {/* Main Container: Full Reading View */}
      <div className="p-6 md:p-12 max-w-2xl mx-auto w-full flex-1 flex flex-col">
        {/* Source Badge & Pub Date */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold text-[#007AFF] uppercase tracking-wider bg-[#007AFF]/10 px-2.5 py-1 rounded-full">
            {decodeHtmlEntities(article.sourceTitle)}
          </span>
          <span className="text-xs text-stone-400 font-medium">
            {new Date(article.pubDate).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
          </span>
        </div>

        {/* Title */}
        <h1 className={`${getFontFamilyClass()} font-bold text-2xl md:text-3xl leading-snug tracking-tight mb-6`}>
          {decodeHtmlEntities(article.title)}
        </h1>

        {article.author && (
          <p className="text-xs font-medium text-stone-400 mb-8 pb-4 border-b border-black/5 dark:border-white/10">
            By <span className="text-stone-700 dark:text-stone-300">{decodeHtmlEntities(article.author)}</span>
          </p>
        )}

        {/* Article Text Content */}
        <article
          className={`${getFontFamilyClass()} space-y-6 leading-relaxed`}
          style={{ fontSize: `${fontSize}px` }}
        >
          {fetchingText ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-[#007AFF]/30 border-t-[#007AFF] rounded-full animate-spin"></div>
              <p className="text-xs font-semibold text-stone-400">Loading Reader Content...</p>
            </div>
          ) : textError ? (
            <div className="p-6 rounded-2xl bg-stone-100 dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 space-y-3">
              <p className="font-semibold text-xs text-stone-700 dark:text-stone-300 flex items-center gap-2">
                <AlertCircle size={16} className="text-[#FF9F0A]" />
                <span>{textError}</span>
              </p>
              <div className="p-4 bg-white dark:bg-[#2C2C2E] rounded-xl italic text-stone-600 dark:text-stone-300 text-sm leading-relaxed shadow-xs">
                {decodeHtmlEntities(article.description)}
              </div>
            </div>
          ) : fullText ? (
            fullText.split("\n\n").map((para, idx) => (
              <p key={idx} className="leading-relaxed md:leading-loose">
                {decodeHtmlEntities(para)}
              </p>
            ))
          ) : (
            <p className="italic text-stone-500 leading-relaxed">{decodeHtmlEntities(article.description)}</p>
          )}
        </article>

        {/* Bottom Source Action Button */}
        <div className="mt-12 pt-8 border-t border-black/5 dark:border-white/10 flex justify-center">
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 bg-[#007AFF] hover:bg-[#0062CC] text-white font-semibold text-sm rounded-2xl shadow-md shadow-[#007AFF]/20 transition-all cursor-pointer"
          >
            <span>Read Original Story on Website</span>
            <ExternalLink size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}

