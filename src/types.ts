/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Feed {
  id: string;
  title: string;
  url: string;
  category: string;
  isDefault: boolean;
  enabled: boolean;
}

export interface Article {
  id: string;
  title: string;
  link: string;
  description: string;
  pubDate: string;
  author?: string;
  sourceTitle: string;
  feedId: string;
  contentSnippet?: string;
  isRead?: boolean;
  isBookmarked?: boolean;
}

export interface SavedArticle {
  articleId: string;
  article: Article;
  fullText: string;
  savedAt: string;
}
