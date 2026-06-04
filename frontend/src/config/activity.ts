/**
 * 校园活动配置
 *
 * 定义活动数据模型、分类/级别元数据，以及一批演示用活动数据。
 * 分类颜色全部使用 Tailwind 调色板的字面量类名，确保被 content 扫描器收录（不可拼接）。
 */

/** 活动分类 */
export type ActivityCategory =
  | 'sports' // 体育
  | 'arts' // 文艺
  | 'recruitment' // 招聘
  | 'academic' // 学术
  | 'volunteer' // 公益
  | 'club' // 社团
  | 'exam'; // 考试

/** 活动级别 */
export type ActivityLevel = 'campus' | 'college'; // 校园级 / 学院级

/** 单个活动条目 */
export interface Activity {
  id: string;
  title: string;
  category: ActivityCategory;
  level: ActivityLevel;
  /** 日期 YYYY-MM-DD */
  date: string;
  /** 开始时间 HH:mm */
  start: string;
  /** 结束时间 HH:mm（可选） */
  end?: string;
  location: string;
  organizer?: string;
  description?: string;
}

/** 分类视觉元数据 */
export interface CategoryMeta {
  key: ActivityCategory;
  label: string;
  /** 圆点 / 实色块背景 */
  dot: string;
  /** 文字色 */
  text: string;
  /** 软背景（chip / 时间轴卡片） */
  chipBg: string;
  /** 软边框 */
  chipBorder: string;
}

/**
 * 七大分类配色：每个分类一个独立色相，兼顾浅色/深色模式。
 * 顺序即图例展示顺序。
 */
export const CATEGORY_META: Record<ActivityCategory, CategoryMeta> = {
  sports: {
    key: 'sports',
    label: '体育',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-300',
    chipBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    chipBorder: 'border-emerald-200/80 dark:border-emerald-500/25',
  },
  arts: {
    key: 'arts',
    label: '文艺',
    dot: 'bg-fuchsia-500',
    text: 'text-fuchsia-700 dark:text-fuchsia-300',
    chipBg: 'bg-fuchsia-50 dark:bg-fuchsia-500/10',
    chipBorder: 'border-fuchsia-200/80 dark:border-fuchsia-500/25',
  },
  recruitment: {
    key: 'recruitment',
    label: '招聘',
    dot: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
    chipBg: 'bg-amber-50 dark:bg-amber-500/10',
    chipBorder: 'border-amber-200/80 dark:border-amber-500/25',
  },
  academic: {
    key: 'academic',
    label: '学术',
    dot: 'bg-blue-500',
    text: 'text-blue-700 dark:text-blue-300',
    chipBg: 'bg-blue-50 dark:bg-blue-500/10',
    chipBorder: 'border-blue-200/80 dark:border-blue-500/25',
  },
  volunteer: {
    key: 'volunteer',
    label: '公益',
    dot: 'bg-teal-500',
    text: 'text-teal-700 dark:text-teal-300',
    chipBg: 'bg-teal-50 dark:bg-teal-500/10',
    chipBorder: 'border-teal-200/80 dark:border-teal-500/25',
  },
  club: {
    key: 'club',
    label: '社团',
    dot: 'bg-violet-500',
    text: 'text-violet-700 dark:text-violet-300',
    chipBg: 'bg-violet-50 dark:bg-violet-500/10',
    chipBorder: 'border-violet-200/80 dark:border-violet-500/25',
  },
  exam: {
    key: 'exam',
    label: '考试',
    dot: 'bg-rose-500',
    text: 'text-rose-700 dark:text-rose-300',
    chipBg: 'bg-rose-50 dark:bg-rose-500/10',
    chipBorder: 'border-rose-200/80 dark:border-rose-500/25',
  },
};

/** 图例展示顺序 */
export const CATEGORY_ORDER: ActivityCategory[] = [
  'sports',
  'arts',
  'recruitment',
  'academic',
  'volunteer',
  'club',
  'exam',
];

/** 级别视觉元数据 */
export interface LevelMeta {
  key: ActivityLevel;
  label: string;
  /** 徽标类名 */
  badge: string;
}

export const LEVEL_META: Record<ActivityLevel, LevelMeta> = {
  campus: {
    key: 'campus',
    label: '校园级',
    badge:
      'bg-primary/10 text-primary dark:bg-primary-fixed-dim/15 dark:text-primary-fixed-dim border border-primary/15 dark:border-primary-fixed-dim/20',
  },
  college: {
    key: 'college',
    label: '学院级',
    badge:
      'bg-secondary/10 text-secondary dark:bg-secondary-fixed-dim/15 dark:text-secondary-fixed-dim border border-secondary/15 dark:border-secondary-fixed-dim/20',
  },
};

/**
 * 学院名单（学院级筛选用）。
 * 选中某学院后，仅展示「学院级活动」中 organizer 含该学院名的活动。
 * 名单为固定配置，与运行时活动数据相互独立。
 */
export const COLLEGES: string[] = [
  '应急技术与管理学院',
  '安全工程学院',
  '环境与灾害治理学院',
  '计算机科学与工程学院',
  '文法学院',
  '理学院',
  '矿山安全学院',
  '防灾减灾工程学院',
  '应急装备学院',
  '经济管理学院',
  '马克思主义学院',
  '体育学院（应急避险与逃生训练中心）',
  '地球科学与工程学院',
  '化工安全学院',
  '信息与控制工程学院',
  '地震工程与建筑安全学院',
  '外国语学院',
];

/**
 * 社团名单（社团筛选用）。
 * 选中某社团后，仅展示「社团类活动（category=club）」中 organizer 含该社团名的活动。
 * 名单为固定配置，与运行时活动数据相互独立；与学院筛选互斥（同时只生效一个）。
 */
export const CLUBS: string[] = [
  '次元动漫社',
  '弦音吉他社',
  '光影摄影社',
  '雄辩社',
  '聚点街舞社',
  '智造机器人社',
];

export const ACTIVITIES: Activity[] = [
  { id: 'cet4-2026', title: '英语四级笔试（CET-4）', category: 'exam', level: 'campus', date: '2026-06-13', start: '09:00', end: '11:20', location: '一教各考场', organizer: '教务处', description: '四级笔试，含听力、阅读、翻译与写作，请提前30分钟入场。' },
  { id: 'cet6-2026', title: '英语六级笔试（CET-6）', category: 'exam', level: 'campus', date: '2026-06-13', start: '15:00', end: '17:25', location: '一教各考场', organizer: '教务处', description: '六级笔试，含听力、阅读、翻译与写作，请提前30分钟入场。' },
];
