/**
 * <emu-labs> 实验室介绍展示组件
 *
 * 渲染"实验室介绍"区域，展示各实验室信息。
 * 
 * 滚动判定与交互逻辑：
 *   - 条件滚动：如果卡片加起来的宽度不超过界面宽度，卡片在容器内居中排列展示，且不进行任何自动或手动滚动。
 *   - 触发滚动：若卡片总宽度超出界面宽度，则动态将卡片渲染翻倍，并开启自动滚动与边缘阻尼回弹效果。
 *   - 响应式处理：使用 ResizeObserver 动态监听容器大小变化，自动在“静态居中”与“无限滚动”状态间无缝切换。
 */
import { LAB_ITEMS, LabItem } from '@/config/labs';

export class EmuLabs extends HTMLElement {
  /** 响应式尺寸监听器 */
  private _resizeObserver: ResizeObserver | null = null;

  connectedCallback(): void {
    this.render();
    this.setupResponsiveness();
  }

  disconnectedCallback(): void {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
  }

  private generateCardHtml(lab: LabItem): string {
    const tagsHtml = lab.tags
      .map(
        (tag) => `
        <span
          class="inline-block text-[10px] md:text-xs font-mono px-2 py-0.5 rounded-lg border border-primary/15 text-primary/80 bg-primary/5 transition-colors duration-300 whitespace-nowrap"
        >${tag}</span>
      `
      )
      .join('');

    /* 如果有外部链接，使用 <a> 包裹；否则使用 <div> */
    const Wrapper = lab.href ? 'a' : 'div';
    const linkAttrs = lab.href
      ? `href="${lab.href}" target="_blank"`
      : '';

    return `
      <${Wrapper}
        ${linkAttrs}
        class="labs-card border border-outline-variant/20 rounded-2xl p-5 md:p-7 bg-surface-container-lowest hover:border-primary/30 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between relative group ${lab.href ? 'cursor-pointer' : ''}"
      >
        <div>
          <!-- 头部：图标、实验室代号与名称 -->
          <div class="flex items-start justify-between mb-2.5 md:mb-4">
            <div class="flex items-center gap-3">
              <!-- 图标容器 -->
              <div
                class="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center shrink-0 bg-primary/10 transition-transform duration-300 group-hover:scale-110"
              >
                <span
                  class="material-symbols-outlined text-[20px] md:text-[24px] text-primary"
                >${lab.icon}</span>
              </div>
              <div class="min-w-0">
                <span class="font-mono text-[10px] md:text-xs tracking-tight text-on-surface-variant/60 block truncate">${lab.code}</span>
                <h3 class="font-bold text-on-surface text-sm md:text-base leading-snug group-hover:text-primary transition-colors duration-300 line-clamp-2" title="${lab.name}">${lab.name}</h3>
              </div>
            </div>

            ${
              lab.href
                ? `<span class="material-symbols-outlined text-[16px] md:text-[18px] text-on-surface-variant/40 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300 shrink-0 mt-1">north_east</span>`
                : ''
            }
          </div>

          <!-- 实验室介绍 -->
          <p class="text-on-surface-variant text-xs md:text-sm leading-relaxed mb-2.5 md:mb-4 line-clamp-2 md:line-clamp-4" title="${lab.description}">
            ${lab.description}
          </p>
        </div>

        <div>
          <!-- 指导教师与所属院系 -->
          <div class="flex flex-col gap-1.5 md:gap-2 text-[11px] md:text-xs text-on-surface-variant/70 mb-2.5 md:mb-4">
            ${
              lab.advisor
                ? `
            <div class="flex items-center gap-1.5">
               <span class="material-symbols-outlined text-[12px] md:text-[14px]">person</span>
              <span class="truncate">${lab.advisor}</span>
            </div>
            `
                : ''
            }
            ${
              lab.professors
                ? `
            <div class="flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[12px] md:text-[14px]">school</span>
              <span class="truncate">教授：${Array.isArray(lab.professors) ? lab.professors.join('、') : lab.professors}</span>
            </div>
            `
                : ''
            }
            <div class="flex items-start gap-1.5">
              <span class="material-symbols-outlined text-[12px] md:text-[14px] mt-0.5">apartment</span>
              <span class="leading-relaxed line-clamp-1">${lab.department}</span>
            </div>
          </div>

          <!-- 底部标签栏 -->
          <div class="flex items-center gap-1.5 pt-2.5 border-t border-outline-variant/10 flex-wrap">
            ${tagsHtml}
          </div>
        </div>
      </${Wrapper}>
    `;
  }

  /**
   * 渲染组件的主体 HTML（默认只渲染单倍卡片列表）
   */
  private render(): void {
    const cardsHtml = LAB_ITEMS.map((lab) => this.generateCardHtml(lab)).join('');

    this.innerHTML = `
      <style>
        /* 卡片固定宽度，高度自适应，由 flexbox 自动拉伸等高 */
        .labs-card {
          width: 280px;
          height: auto;
          flex-shrink: 0;
        }
        @media (min-width: 768px) {
          .labs-card {
            width: 380px;
            height: 340px;
          }
        }

        /* 滚动容器 */
        .labs-marquee-wrapper {
          overflow-x: hidden;
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%);
          mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%);
          -webkit-overflow-scrolling: touch;
        }

        /* 滚动激活时允许手动滚动，隐藏滚动条 */
        .labs-marquee-wrapper.scroll-active {
          overflow-x: auto;
        }
        .labs-marquee-wrapper::-webkit-scrollbar {
          display: none;
        }
        .labs-marquee-wrapper {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .labs-marquee-track {
          display: flex;
          gap: 1rem;
          width: 100%;
          justify-content: center;
          padding-left: 16px;
          padding-right: 16px;
        }
        @media (min-width: 768px) {
          .labs-marquee-track {
            gap: 1.5rem;
            padding-left: 60px;
            padding-right: 60px;
          }
        }

        /* 滚动激活时的状态 */
        .labs-marquee-wrapper.scroll-active .labs-marquee-track {
          width: max-content;
          justify-content: flex-start;
        }
      </style>

      <section class="py-20 relative" id="labs-container">
        <!-- 头部标题栏（仍在 max-w 容器内，对齐其他模块） -->
        <div class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop mb-12">
          <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span class="text-xs md:text-sm font-bold tracking-wider text-primary/70 dark:text-primary-fixed-dim/70 uppercase mb-2 block font-mono">
                Research Labs
              </span>
              <h2 class="font-headline-lg text-3xl md:text-5xl font-extrabold text-on-surface tracking-tight leading-none mb-2">
                实验室介绍
              </h2>
            </div>

            <!-- 右侧说明 -->
            <div class="flex flex-col items-start md:items-end">
              <p class="text-xs md:text-sm text-on-surface-variant/80 leading-relaxed text-left md:text-right max-w-md">
                深耕应急管理领域，组织成员参与多个<strong class="text-on-surface font-bold">校级重点实验室</strong>的科研项目
              </p>
            </div>
          </div>
        </div>

        <!-- 全宽区域 -->
        <div class="labs-marquee-wrapper" id="labs-marquee">
          <div class="labs-marquee-track" id="labs-track">
            ${cardsHtml}
          </div>
        </div>
      </section>
    `;
  }

  /**
   * 初始化 ResizeObserver，智能判定与处理状态切换
   */
  private setupResponsiveness(): void {
    const wrapper = this.querySelector<HTMLDivElement>('#labs-marquee');
    const track = this.querySelector<HTMLDivElement>('#labs-track');
    if (!wrapper || !track) return;

    // 单倍卡片 HTML 原始串
    const singleCardsHtml = LAB_ITEMS.map((lab) => this.generateCardHtml(lab)).join('');

    this._resizeObserver = new ResizeObserver(() => {
      // 1. 先复位测量状态，重置为 max-content 以便准确测量宽度
      wrapper.classList.remove('scroll-active');
      track.style.width = 'max-content';
      track.style.justifyContent = 'flex-start';
      track.innerHTML = singleCardsHtml;

      const wrapperWidth = wrapper.clientWidth;
      const trackWidth = track.scrollWidth;

      // 2. 检查单倍宽度是否超出了视口
      if (trackWidth > wrapperWidth) {
        // 超出视口，激活手动滚动模式，移除内联样式由 CSS 类接管
        wrapper.classList.add('scroll-active');
        track.style.width = '';
        track.style.justifyContent = '';
      } else {
        // 未超出视口，保持居中静态展示，移除内联样式由 CSS 类接管（默认宽度 100% 且 justify-content: center）
        wrapper.scrollLeft = 0;
        track.style.width = '';
        track.style.justifyContent = '';
      }
    });

    this._resizeObserver.observe(wrapper);
  }
}

customElements.define('emu-labs', EmuLabs);
