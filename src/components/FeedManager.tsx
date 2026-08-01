/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Feed } from "../types";
import { X, Plus, Trash2, RotateCcw, AlertTriangle, Rss } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface FeedManagerProps {
  feeds: Feed[];
  isOpen: boolean;
  onClose: () => void;
  onSaveFeeds: (feeds: Feed[]) => void;
  onResetToDefaults: () => void;
}

export default function FeedManager({
  feeds,
  isOpen,
  onClose,
  onSaveFeeds,
  onResetToDefaults,
}: FeedManagerProps) {
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newCategory, setNewCategory] = useState("General");
  const [customCategory, setCustomCategory] = useState("");
  const [error, setError] = useState("");

  const categoriesList = ["World", "Tech", "Business", "General", "Science", "Custom"];

  const handleToggleFeed = (feedId: string) => {
    const updated = feeds.map((f) => (f.id === feedId ? { ...f, enabled: !f.enabled } : f));
    onSaveFeeds(updated);
  };

  const handleDeleteFeed = (feedId: string) => {
    const updated = feeds.filter((f) => f.id !== feedId);
    onSaveFeeds(updated);
  };

  const handleAddFeed = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newTitle.trim() || !newUrl.trim()) {
      setError("Please enter a title and RSS stream URL.");
      return;
    }

    // Basic URL validation
    try {
      new URL(newUrl);
    } catch {
      setError("Invalid URL format. Please include http:// or https://");
      return;
    }

    const finalCategory = newCategory === "Custom" ? customCategory.trim() || "General" : newCategory;

    const newFeed: Feed = {
      id: `custom-${Date.now()}`,
      title: newTitle.trim(),
      url: newUrl.trim(),
      category: finalCategory,
      isDefault: false,
      enabled: true,
    };

    onSaveFeeds([...feeds, newFeed]);
    
    // Reset fields
    setNewTitle("");
    setNewUrl("");
    setNewCategory("General");
    setCustomCategory("");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div id="feed-manager-overlay" className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-4 z-50 select-none">
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          id="feed-manager-modal"
          className="bg-[#F2F2F7] dark:bg-[#1C1C1E] rounded-t-[32px] md:rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-black/10 dark:border-white/10 overflow-hidden"
        >
          {/* iOS Sheet Top Drag Grab Bar */}
          <div className="pt-3 pb-1 flex justify-center">
            <div className="w-10 h-1 bg-stone-300 dark:bg-stone-600 rounded-full"></div>
          </div>

          {/* Header */}
          <div className="px-5 py-3 border-b border-black/5 dark:border-white/10 flex items-center justify-between bg-white/70 dark:bg-[#2C2C2E]/70 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF]">
                <Rss size={16} />
              </div>
              <div>
                <h3 className="text-base font-bold font-sans text-stone-900 dark:text-white leading-none">News Subscriptions</h3>
                <span className="text-[11px] font-medium text-stone-400 dark:text-stone-500 mt-0.5 block">Configure RSS Channels</span>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              id="close-manager-btn"
              onClick={onClose}
              aria-label="Close channels manager"
              className="w-8 h-8 rounded-full bg-stone-200 dark:bg-[#3A3A3C] flex items-center justify-center text-stone-500 dark:text-stone-300 cursor-pointer"
            >
              <X size={16} />
            </motion.button>
          </div>

          {/* Sheet Body Content */}
          <div className="p-5 overflow-y-auto space-y-6 flex-1">
            {/* Add Custom Feed Form (iOS Inset Grouped Box) */}
            <form onSubmit={handleAddFeed} className="p-4 bg-white dark:bg-[#2C2C2E] rounded-2xl border border-black/5 dark:border-white/5 shadow-xs space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#007AFF] flex items-center gap-1.5">
                <Plus size={15} />
                <span>Add Custom Feed</span>
              </h4>

              {error && (
                <div className="p-3 bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-xl text-xs font-semibold text-[#FF3B30] flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-stone-400">Channel Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Wired UK"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#E5E5EA]/60 dark:bg-[#1C1C1E] text-xs font-semibold text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-stone-400">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#E5E5EA]/60 dark:bg-[#1C1C1E] text-xs font-semibold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF] cursor-pointer"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {newCategory === "Custom" && (
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-stone-400">Custom Category Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Design"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#E5E5EA]/60 dark:bg-[#1C1C1E] text-xs font-semibold text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-stone-400">RSS Feed URL</label>
                <input
                  type="text"
                  placeholder="https://example.com/feed.xml"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#E5E5EA]/60 dark:bg-[#1C1C1E] text-xs font-semibold text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                />
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                id="add-custom-feed-submit"
                type="submit"
                className="w-full py-2.5 bg-[#007AFF] hover:bg-[#0062CC] text-white font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-[#007AFF]/20"
              >
                Add Subscription
              </motion.button>
            </form>

            {/* Current Subscriptions List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Subscribed Channels</span>
                <button
                  id="reset-feeds-btn"
                  type="button"
                  onClick={onResetToDefaults}
                  className="text-xs font-semibold text-[#007AFF] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw size={12} />
                  <span>Reset Defaults</span>
                </button>
              </div>

              <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1">
                {feeds.map((feed, idx) => (
                  <div
                    key={`${feed.id}-${idx}`}
                    className="flex items-center justify-between p-3 bg-white dark:bg-[#2C2C2E] rounded-2xl border border-black/5 dark:border-white/5 shadow-xs gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-stone-900 dark:text-white truncate">{feed.title}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 bg-[#007AFF]/10 text-[#007AFF] rounded-full">
                          {feed.category}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-stone-400 dark:text-stone-500 truncate leading-none">{feed.url}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* iOS Toggle Switch */}
                      <button
                        id={`feed-toggle-${feed.id}`}
                        type="button"
                        onClick={() => handleToggleFeed(feed.id)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                          feed.enabled ? "bg-[#34C759]" : "bg-stone-300 dark:bg-[#3A3A3C]"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                            feed.enabled ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>

                      {/* Delete button for custom feeds */}
                      {!feed.isDefault && (
                        <button
                          id={`feed-delete-${feed.id}`}
                          type="button"
                          onClick={() => handleDeleteFeed(feed.id)}
                          className="text-stone-400 hover:text-[#FF3B30] transition-colors p-1.5 rounded-lg"
                          title="Delete Feed"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

