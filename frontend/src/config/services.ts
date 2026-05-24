/**
 * 快捷服务配置
 */

/** 快捷服务入口配置 */
export const PORTAL_ITEMS = [
  { icon: 'restaurant', title: '校园食堂', description: '今日吃什么？查看各大食堂菜谱与就餐反馈', href: '#', soon: false },
  { icon: 'diversity_3', title: '校园社团', description: '了解校园缤纷社团，发现你的兴趣所在', href: '#', soon: false },
  { icon: 'map', title: '校园地图', description: '手绘与数字校园地图，快速定位教学楼与宿舍', href: '#' },
  { icon: 'download', title: '资料下载', description: '校园常用表格、课件、软件及办公模版快速下载', href: '#' },
] as const;

/** 请求与反馈服务飞书问卷链接配置 */
export const FEEDBACK_LINKS = {
  /** 新功能请求问卷链接 */
  newFeatureRequest: 'https://acnpe6t9x5o7.feishu.cn/share/base/form/shrcn3EmVQLykJnNfFimFwNGRsg',
  /** 功能反馈问卷链接 */
  featureFeedback: 'https://acnpe6t9x5o7.feishu.cn/share/base/form/shrcn5HRkWpziz9ddvthLFAqbQE',
} as const;

