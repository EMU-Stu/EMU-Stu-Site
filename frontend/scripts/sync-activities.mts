/**
 * 飞书多维表格 → activities.json / activities.ics
 *
 * 由 GitHub Action `sync_activities.yml` 定时（cron）或手动触发运行：
 *   1. 取 tenant_access_token
 *   2. 分页拉取多维表格全部记录
 *   3. 仅保留「状态 = 已发布」的行
 *   4. 逐行映射 + 校验，非法行跳过并打日志（一条脏数据不拖垮整次发布）
 *   5. 生成 activities.json 与 activities.ics 写入输出目录
 *
 * 产物随后由工作流推送到 stats-data 分支，经 jsDelivr CDN 对外提供，
 * 前端组件运行时 fetch。数据与展示分离：内容更新不触发主站重新构建。
 *
 * 运行：npx tsx scripts/sync-activities.mts
 * 依赖环境变量：FEISHU_APP_ID / FEISHU_APP_SECRET / FEISHU_APP_TOKEN / FEISHU_TABLE_ID
 * 可选：FEISHU_BASE_URL（默认 https://open.feishu.cn，Lark 国际版用 https://open.larksuite.com）
 *       OUTPUT_DIR（默认 activities_dist）
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  CATEGORY_META,
  CATEGORY_ORDER,
  LEVEL_META,
  type Activity,
  type ActivityCategory,
  type ActivityLevel,
} from '../src/config/activity';
import { buildICS } from '../src/config/activity-ics';

/* —— 表头字段名（需与飞书多维表格列名完全一致） —— */
const FIELD = {
  title: '标题',
  category: '分类',
  level: '级别',
  date: '日期',
  start: '开始时间',
  end: '结束时间',
  location: '地点',
  organizer: '主办方',
  description: '简介',
  status: '状态',
} as const;

const PUBLISHED = '已发布';

const BASE_URL = process.env.FEISHU_BASE_URL || 'https://open.feishu.cn';
const OUTPUT_DIR = process.env.OUTPUT_DIR || 'activities_dist';

/* —— 分类 / 级别：中文标签或英文键都可识别，映射回枚举键 —— */
const CATEGORY_BY_LABEL: Record<string, ActivityCategory> = {};
for (const key of CATEGORY_ORDER) {
  CATEGORY_BY_LABEL[key] = key;
  CATEGORY_BY_LABEL[CATEGORY_META[key].label] = key;
}
const LEVEL_BY_LABEL: Record<string, ActivityLevel> = {
  campus: 'campus',
  college: 'college',
  [LEVEL_META.campus.label]: 'campus',
  [LEVEL_META.college.label]: 'college',
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`[sync] 缺少环境变量 ${name}`);
    process.exit(1);
  }
  return v;
}

/* —— 飞书字段值解析（文本字段可能是 string / number / 富文本段数组 / {text}） —— */
function cellToText(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number') return String(v);
  if (Array.isArray(v)) {
    return v
      .map((seg) => {
        if (typeof seg === 'string') return seg;
        if (seg && typeof seg === 'object') {
          const o = seg as Record<string, unknown>;
          if (typeof o.text === 'string') return o.text;
          if (typeof o.name === 'string') return o.name;
        }
        return '';
      })
      .join('')
      .trim();
  }
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (typeof o.text === 'string') return o.text.trim();
    if (typeof o.name === 'string') return o.name.trim();
  }
  return '';
}

/** 日期字段是毫秒时间戳；偏移到北京时区后读取日历日，对 UTC/北京两种存储约定都成立 */
function cellToYmd(v: unknown): string {
  let ms: number | null = null;
  if (typeof v === 'number') ms = v;
  else if (typeof v === 'string' && /^\d+$/.test(v)) ms = Number(v);
  else if (typeof v === 'string' && DATE_RE.test(v.trim())) return v.trim();
  if (ms == null || !Number.isFinite(ms)) return '';
  const d = new Date(ms + 8 * 3600 * 1000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/** 归一化 HH:mm（容忍 "7:00"），非法返回空串 */
function normTime(s: string): string {
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return '';
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (h > 23 || mi > 59) return '';
  return `${String(h).padStart(2, '0')}:${m[2]}`;
}

interface FeishuRecord {
  record_id: string;
  fields: Record<string, unknown>;
}

async function tenantToken(appId: string, appSecret: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/open-apis/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
  });
  const json = (await res.json()) as { code: number; msg: string; tenant_access_token?: string };
  if (json.code !== 0 || !json.tenant_access_token) {
    throw new Error(`获取 tenant_access_token 失败 [${json.code}]: ${json.msg}`);
  }
  return json.tenant_access_token;
}

async function listAllRecords(
  appToken: string,
  tableId: string,
  token: string,
): Promise<FeishuRecord[]> {
  const out: FeishuRecord[] = [];
  let pageToken = '';
  do {
    const url = new URL(
      `${BASE_URL}/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`,
    );
    url.searchParams.set('page_size', '500');
    if (pageToken) url.searchParams.set('page_token', pageToken);

    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const json = (await res.json()) as {
      code: number;
      msg: string;
      data?: { items?: FeishuRecord[]; has_more?: boolean; page_token?: string };
    };
    if (json.code !== 0) throw new Error(`拉取记录失败 [${json.code}]: ${json.msg}`);

    out.push(...(json.data?.items ?? []));
    pageToken = json.data?.has_more ? (json.data.page_token ?? '') : '';
  } while (pageToken);
  return out;
}

/** 映射 + 校验单条记录。非「已发布」返回 null（暂存）；已发布但非法返回 null 并告警 */
function mapRecord(rec: FeishuRecord): Activity | null {
  const f = rec.fields ?? {};
  if (cellToText(f[FIELD.status]) !== PUBLISHED) return null;

  const id = rec.record_id;
  const title = cellToText(f[FIELD.title]);
  const category = CATEGORY_BY_LABEL[cellToText(f[FIELD.category])];
  const level = LEVEL_BY_LABEL[cellToText(f[FIELD.level])];
  const date = cellToYmd(f[FIELD.date]);
  const start = normTime(cellToText(f[FIELD.start]));
  const end = normTime(cellToText(f[FIELD.end]));
  const location = cellToText(f[FIELD.location]);
  const organizer = cellToText(f[FIELD.organizer]);
  const description = cellToText(f[FIELD.description]);

  const problems: string[] = [];
  if (!title) problems.push('标题为空');
  if (!category) problems.push(`分类非法（${cellToText(f[FIELD.category]) || '空'}）`);
  if (!level) problems.push(`级别非法（${cellToText(f[FIELD.level]) || '空'}）`);
  if (!DATE_RE.test(date)) problems.push('日期为空或非法');
  if (!start) problems.push(`开始时间非法（${cellToText(f[FIELD.start]) || '空'}）`);
  if (!location) problems.push('地点为空');
  if (problems.length) {
    console.warn(`[skip] ${id} 「${title || '无标题'}」: ${problems.join('；')}`);
    return null;
  }

  const a: Activity = { id, title, category, level, date, start, location };
  if (end) a.end = end;
  if (organizer) a.organizer = organizer;
  if (description) a.description = description;
  return a;
}

async function main(): Promise<void> {
  const appId = requireEnv('FEISHU_APP_ID');
  const appSecret = requireEnv('FEISHU_APP_SECRET');
  const appToken = requireEnv('FEISHU_APP_TOKEN');
  const tableId = requireEnv('FEISHU_TABLE_ID');

  console.log('[sync] 获取 tenant_access_token …');
  const token = await tenantToken(appId, appSecret);

  console.log('[sync] 拉取多维表格记录 …');
  const records = await listAllRecords(appToken, tableId, token);
  console.log(`[sync] 共 ${records.length} 条记录`);

  const activities: Activity[] = [];
  for (const rec of records) {
    const a = mapRecord(rec);
    if (a) activities.push(a);
  }
  activities.sort((x, y) => `${x.date}${x.start}`.localeCompare(`${y.date}${y.start}`));

  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(join(OUTPUT_DIR, 'activities.json'), JSON.stringify(activities, null, 2), 'utf-8');
  writeFileSync(join(OUTPUT_DIR, 'activities.ics'), buildICS(activities), 'utf-8');

  console.log(
    `[sync] 完成 ✓ 已发布 ${activities.length} 条 → ${OUTPUT_DIR}/activities.json + activities.ics`,
  );
}

main().catch((err) => {
  console.error('[sync] 失败:', err instanceof Error ? err.message : err);
  process.exit(1);
});
