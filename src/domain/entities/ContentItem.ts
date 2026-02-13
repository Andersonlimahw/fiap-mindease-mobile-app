/**
 * ContentItem Entity - Domain Layer
 * Represents readable content with summary and detailed versions
 */

export interface ContentItem {
  id: string;
  title: string;
  summary: string;
  fullContent: string;
  readTimeMinutes: number;
  category?: string;
  createdAt: number;
}

export type ContentViewMode = 'summary' | 'detailed';

export type CreateContentInput = Omit<ContentItem, 'id' | 'createdAt'>;
