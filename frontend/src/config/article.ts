/**
 * 博客文章数据模型与示例数据
 */

export interface BlogArticle {
    /** 文章唯一标识（URL slug） */
    slug: string;
    /** 文章标题 */
    title: string;
    /** 文章摘要 */
    excerpt: string;
    /** 分类 */
    category: string;
    /** 子分类 */
    subCategory: string;
    /** 作者名 */
    author: string;
    /** 作者头像首字母 */
    authorAvatar: string;
    /** 发布日期 */
    date: string;
    /** 预估阅读时间 */
    readTime: string;
    /** Markdown 正文内容 */
    content: string;
    /** 源文件路径（用于解析相对图片路径） */
    filePath: string;
}

export interface TOCItem {
    id: string;
    text: string;
    level: number;
}

/**
 * 解析 Markdown 及其 Frontmatter 的辅助函数
 */
function parseMarkdown(filePath: string, rawContent: string): BlogArticle {
  const slug = filePath.split('/').pop()?.replace('.md', '') || 'untitled';
  
  // 匹配 YAML Frontmatter (例如以 --- 开头和结尾的头部区块)
  const match = rawContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  
  const metadata: Record<string, string> = {};
  let content = rawContent;
  
  if (match) {
    const yaml = match[1];
    content = match[2];
    
    yaml.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) return;
      const colonIndex = trimmedLine.indexOf(':');
      if (colonIndex !== -1) {
        const key = trimmedLine.slice(0, colonIndex).trim();
        let value = trimmedLine.slice(colonIndex + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        metadata[key] = value;
      }
    });
  }
  
  // 查找文章中第一个出现的 # 一阶标题，支持前面可能有空白
  const titleMatch = content.match(/^\s*#\s+(.+)$/m);
  let finalTitle = metadata.title;
  
  if (titleMatch) {
    if (!finalTitle) {
      finalTitle = titleMatch[1].trim();
    }
    // 移除正文中的第一个一阶标题行
    content = content.replace(/^\s*#\s+.+$/m, '').trim();
  }
  
  if (!finalTitle) {
    finalTitle = slug;
  }

  const getExcerpt = (text: string) => {
    return text
      .slice(0, 300)
      .replace(/[#*`~_\-]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 150) + '...';
  };

  const finalExcerpt = metadata.excerpt || getExcerpt(content);
  
  return {
    slug: metadata.slug || slug,
    title: finalTitle,
    excerpt: finalExcerpt,
    category: metadata.category || '技术沉淀',
    subCategory: metadata.subCategory || 'General',
    author: metadata.author || 'Anonymous',
    authorAvatar: metadata.authorAvatar || (metadata.author ? metadata.author[0].toUpperCase() : 'A'),
    date: metadata.date || new Date().toISOString().split('T')[0],
    readTime: metadata.readTime || `${Math.max(1, Math.ceil(content.length / 500))} min`,
    content: content,
    filePath: filePath,
  };
}

// 动态载入 docs/articles 文件夹下的所有 markdown 文章
// (docs/ 由构建前的 scripts/fetch-docs.mjs 从 EMU-Stu-Blog 仓库拉取,文章统一放在子目录 articles/ 下)
const markdownModules = import.meta.glob('../../docs/articles/*.md', { query: '?raw', eager: true });

// 动态载入 docs/articles 文件夹下的所有图片资源（用于 markdown 内的图片引用解析）
const imageModules = import.meta.glob('../../docs/articles/**/*.{png,jpg,jpeg,gif,svg,webp}', { eager: true, import: 'default' }) as Record<string, string>;

/** 将 docs/ 目录下的相对图片路径解析为 Vite 处理后的资源 URL */
export function resolveDocImagePath(markdownFilePath: string, relativeImagePath: string): string {
  // 如果已经是绝对 URL，直接返回
  if (/^https?:\/\//.test(relativeImagePath)) {
    return relativeImagePath;
  }

  // 获取 markdown 文件所在目录
  const dir = markdownFilePath.substring(0, markdownFilePath.lastIndexOf('/'));
  // 解析相对路径（支持 ./xxx、../xxx、xxx）
  const parts = (dir + '/' + relativeImagePath).split('/');
  const resolved: string[] = [];
  for (const part of parts) {
    if (part === '.' || part === '') continue;
    if (part === '..') { resolved.pop(); continue; }
    resolved.push(part);
  }
  const normalizedPath = resolved.join('/');

  // 在已加载的图片模块中查找匹配路径
  for (const [globPath, url] of Object.entries(imageModules)) {
    // globPath 格式: ../../docs/subdir/image.png 或 ../../docs/image.png
    // 提取 ../../docs/ 之后的部分进行匹配
    const relFromDocs = globPath.replace(/^.*\/docs\//, '');
    if (normalizedPath.endsWith(relFromDocs) || normalizedPath === relFromDocs) {
      return url;
    }
  }

  // 兜底处理：如果因开发环境 Vite 缓存原因 glob 匹配失败，
  // 只要路径中包含 docs/，直接转换为可以直接被 Dev Server 托管的绝对根路径服务
  // 例如：docs/articles/images/foo.png -> /docs/articles/images/foo.png
  const docsIndex = normalizedPath.indexOf('docs/');
  if (docsIndex !== -1) {
    return '/' + normalizedPath.slice(docsIndex);
  }

  // 兜底处理：若上述匹配和常规兜底均未命中，将相对图片路径自动补全为以 / 开头的绝对根路径
  // 避免在子页面下（例如 /article）因相对路径解析导致浏览器去请求 /article/images/xxx.png
  // 例如：images/foo.png -> /images/foo.png，./images/foo.png -> /images/foo.png
  let fallbackPath = relativeImagePath;
  if (!fallbackPath.startsWith('/') && !/^https?:\/\//.test(fallbackPath)) {
    fallbackPath = '/' + fallbackPath.replace(/^\.\//, '');
  }

  // 未找到匹配的图片资源，返回转换后的绝对根路径
  return fallbackPath;
}
const parsedMarkdownArticles: BlogArticle[] = [];

console.log('[article.ts] Loaded markdownModules:', markdownModules);

for (const path in markdownModules) {
  try {
    const module = markdownModules[path];
    let rawContent = '';
    if (typeof module === 'string') {
      rawContent = module;
    } else if (module && typeof (module as any).default === 'string') {
      rawContent = (module as any).default;
    } else {
      console.warn(`[article.ts] Failed to load raw content for ${path}:`, module);
      continue;
    }
    
    const article = parseMarkdown(path, rawContent);
    parsedMarkdownArticles.push(article);
  } catch (err) {
    console.error(`[article.ts] Error parsing markdown article at ${path}:`, err);
  }
}

// 按日期降序排列
export const ARTICLES: BlogArticle[] = [...parsedMarkdownArticles].sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
);
