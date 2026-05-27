/**
 * 应用入口
 * 导入全局样式并注册所有 Web Components
 */

// 全局样式
import './styles/global.css';

// Web Components（导入即自动注册）
import './components/emu-header';
import './components/emu-float';
import './components/emu-tooltip';
import './components/emu-hero';
import './components/emu-services';
import './components/emu-projects';
import './components/emu-labs';
import './components/emu-blog';
import './components/emu-article';
import './components/emu-footer';
import './components/emu-easter-egg';

// 开发环境提示
if (import.meta.env.DEV) {
    console.log('[EMU-Stu] 所有 Web Components 已注册');
}
