/**
 * 公共类型定义
 */

/** 导航链接类型 */
export interface NavLink {
  label: string;
  href: string;
  active?: boolean;
}

/** 快捷入口类型 */
export interface PortalItem {
  icon: string;
  title: string;
  href: string;
}

/** 新闻条目类型 */
export interface NewsItem {
  month: string;
  day: string;
  title: string;
  summary: string;
  href: string;
  variant: 'primary' | 'secondary';
}

/** 活动条目类型 */
export interface EventItem {
  time: string;
  title: string;
  location: string;
  variant: 'primary' | 'secondary';
}

/** 页脚链接类型 */
export interface FooterLink {
  label: string;
  href: string;
}
