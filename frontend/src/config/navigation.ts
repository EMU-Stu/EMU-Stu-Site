/**
 * 导航与链接配置
 */

/** 导航链接配置 */
export const NAV_LINKS = [
  { label: '首页', href: '#', active: true },
  { label: '技术博客', href: '/blog', active: false },
] as const;

/** 本站实现的博客文章链接 */
export const WEBSITE_BLOG_URL = 'https://github.com/EMU-Stu/EMU-Stu-Site';

/** 页脚链接配置 */
export const FOOTER_LINKS = {
  related: [
    { label: '学校官网', href: 'https://www.ncist.edu.cn/' },
    { label: '教务系统', href: 'https://jwc.ncist.edu.cn/' },
    { label: '图书馆', href: 'https://lib.ncist.edu.cn/' },
  ],
  bottom: [
    { label: '想知道此网站是如何实现的？点击查看文章', href: WEBSITE_BLOG_URL, underline: true },
  ] as readonly { readonly label: string; readonly href: string; readonly underline?: boolean }[],
} as const;
