import { defineConfig, Plugin } from 'vite';
import { resolve } from 'path';
import { existsSync, mkdirSync, cpSync, rmSync } from 'fs';

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
 * 例如 /blog → /pages/blog/index.html，/article → /pages/article/index.html
 */
function cleanUrlsPlugin(): Plugin {
  return {
    name: 'clean-urls',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = req.url || '';
        const [pathname] = url.split('?');
        const queryPart = url.includes('?') ? url.slice(url.indexOf('?')) : '';

        // 检查是否命中页面路由映射
        if (pathname && PAGE_ROUTES[pathname]) {
          req.url = `${PAGE_ROUTES[pathname]}${queryPart}`;
        }
        next();
      });
    },
    /**
     * 构建完成后，将 dist/pages/ 下的页面目录移动到 dist/ 根下
     * 例如 dist/pages/blog/ → dist/blog/，确保部署后 URL 路径正确
     */
    closeBundle() {
      const distDir = resolve(__dirname, 'dist');
      const pagesDir = resolve(distDir, 'src/pages');
      if (!existsSync(pagesDir)) return;

      // 遍历路由映射，将每个页面目录从 dist/src/pages/ 移到 dist/
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
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        blog: resolve(__dirname, 'src/pages/blog/index.html'),
        article: resolve(__dirname, 'src/pages/article/index.html'),
      },
    },
  },
});
