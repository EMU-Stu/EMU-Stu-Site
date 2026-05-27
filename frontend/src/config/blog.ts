/**
 * 博客配置数据源
 */
import { ARTICLES } from './article';

export interface BlogPost {
  category: string;
  subCategory: string;
  href: string;
  title: string;
  excerpt: string;
  authorAvatar: string;
  author: string;
  date: string;
  readTime: string;
}

/**
 * 博客文章列表
 * 动态推导自 ARTICLES 数据源
 */
export const BLOG_POSTS: BlogPost[] = ARTICLES.map(article => ({
  category: article.category,
  subCategory: article.subCategory,
  href: `/article?slug=${article.slug}`,
  title: article.title,
  excerpt: article.excerpt,
  authorAvatar: article.authorAvatar,
  author: article.author,
  date: article.date,
  readTime: article.readTime
}));

