import { defineConfig, Plugin } from 'vite';
import { resolve } from 'path';
import { existsSync, mkdirSync, cpSync, rmSync, readFileSync } from 'fs';

/**
 * 页面路由映射：URL 路径 → pages/ 目录下的 HTML 文件
 * 新增页面时只需在此处添加一条映射即可
 */
const PAGE_ROUTES: Record<string, string> = {
  '/blog': '/src/pages/blog/index.html',
  '/article': '/src/pages/article/index.html',
};

/**
 * Vite 插件：将干净的 URL 重写到 pages/ 目录下对应的 index.html
 * 并在本地开发和生产构建时，自动将对 /images/* 的请求代理/复制到从 Blog 仓库拉取下来的 docs 资源中。
 */
function cleanUrlsPlugin(): Plugin {
  return {
    name: 'clean-urls',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = req.url || '';
        const [pathname] = url.split('?');
        const queryPart = url.includes('?') ? url.slice(url.indexOf('?')) : '';

        // 开发环境兜底：拦截 /images/* 请求，映射到拉取下来的 docs/articles/images/ 物理目录
        if (pathname && pathname.startsWith('/images/')) {
          const filename = pathname.slice('/images/'.length);
          const targetPath = resolve(__dirname, 'docs/articles/images', filename);
          if (existsSync(targetPath)) {
            const ext = filename.split('.').pop()?.toLowerCase();
            const mimeTypes: Record<string, string> = {
              png: 'image/png',
              jpg: 'image/jpeg',
              jpeg: 'image/jpeg',
              gif: 'image/gif',
              svg: 'image/svg+xml',
              webp: 'image/webp',
            };
            const contentType = ext ? mimeTypes[ext] : 'application/octet-stream';
            _res.setHeader('Content-Type', contentType);
            _res.writeHead(200);
            _res.end(readFileSync(targetPath));
            return;
          }
        }

        // 检查是否命中页面路由映射
        if (pathname && PAGE_ROUTES[pathname]) {
          req.url = `${PAGE_ROUTES[pathname]}${queryPart}`;
        }
        next();
      });
    },
    /**
     * 构建完成后，执行清理和跨目录资源拷贝
     */
    closeBundle() {
      const distDir = resolve(__dirname, 'dist');
      const pagesDir = resolve(distDir, 'src/pages');
      
      // 1. 拷贝 docs 博客里的图片到 dist/images，支持线上直接通过 /images/... 路由访问
      const docsImagesSrc = resolve(__dirname, 'docs/articles/images');
      const distImagesDest = resolve(distDir, 'images');
      if (existsSync(docsImagesSrc)) {
        mkdirSync(distImagesDest, { recursive: true });
        cpSync(docsImagesSrc, distImagesDest, { recursive: true });
      }

      if (!existsSync(pagesDir)) return;

      // 2. 遍历路由映射，将每个页面目录从 dist/src/pages/ 移到 dist/
      for (const urlPath of Object.keys(PAGE_ROUTES)) {
        const pageName = urlPath.slice(1); // 去掉开头的 /
        const src = resolve(pagesDir, pageName);
        const dest = resolve(distDir, pageName);
        if (existsSync(src)) {
          // 确保目标目录存在
          mkdirSync(dest, { recursive: true });
          cpSync(src, dest, { recursive: true });
        }
      }
      // 清理 dist/src/ 目录
      const distSrcDir = resolve(distDir, 'src');
      rmSync(distSrcDir, { recursive: true, force: true });
    },
  };
}


export default defineConfig({
  plugins: [cleanUrlsPlugin()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        blog: resolve(__dirname, 'src/pages/blog/index.html'),
        article: resolve(__dirname, 'src/pages/article/index.html'),
      },
    },
  },
});
