/**
 * 博客配置数据源
 */

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
 * 初始为空（由“技术博客界面设计”清空示例数据）
 */
export const BLOG_POSTS: BlogPost[] = [];
