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
  /** 自动滚动 RAF 句柄 */
  private _rafId = 0;
  /** 是否处于悬停暂停状态 */
  private _paused = false;
  /** 上一帧时间戳 */
  private _lastTime = 0;
  /** 自动滚动速度 px/s */
  private readonly SPEED = 30;
  /** 边缘回弹弹性偏移量 */
  private _bounceOffset = 0;
  /** 响应式尺寸监听器 */
  private _resizeObserver: ResizeObserver | null = null;
  /** 当前是否处于滚动激活状态 */
  private _scrollingActive = false;
  /** 绑定的事件监听器暂存，用于注销 */
  private _eventListeners: Array<{ target: EventTarget; type: string; listener: EventListenerOrEventListenerObject; options?: boolean | AddEventListenerOptions }> = [];

  connectedCallback(): void {
    this.render();
    this.setupResponsiveness();
  }

  disconnectedCallback(): void {
    this.cleanupScrolling();
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
  }

  /**
   * 生成单个实验室卡片的 HTML 字符串
   */
  private generateCardHtml(lab: LabItem): string {
    const tagsHtml = lab.tags
      .map(
        (tag) => `
        <span
          class="inline-block text-xs font-mono px-2.5 py-0.5 rounded-lg border border-primary/15 text-primary/80 bg-primary/5 transition-colors duration-300 whitespace-nowrap"
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
        class="labs-card border border-outline-variant/20 rounded-2xl p-7 bg-surface-container-lowest hover:border-primary/30 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between relative group ${lab.href ? 'cursor-pointer' : ''}"
      >
        <div>
          <!-- 头部：图标、实验室代号与名称 -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <!-- 图标容器 -->
              <div
                class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-primary/10 transition-transform duration-300 group-hover:scale-110"
              >
                <span
                  class="material-symbols-outlined text-[24px] text-primary"
                >${lab.icon}</span>
              </div>
              <div>
                <span class="font-mono text-xs tracking-tight text-on-surface-variant/60 block">${lab.code}</span>
                <span class="font-bold text-on-surface text-base leading-snug group-hover:text-primary transition-colors duration-300">${lab.name}</span>
              </div>
            </div>

            ${
              lab.href
                ? `<span class="material-symbols-outlined text-[18px] text-on-surface-variant/40 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300 shrink-0 mt-1">north_east</span>`
                : ''
            }
          </div>

          <!-- 实验室介绍 -->
          <p class="text-on-surface-variant text-sm leading-relaxed mb-4 line-clamp-4" title="${lab.description}">
            ${lab.description}
          </p>
        </div>

        <div>
          <!-- 指导教师与所属院系 -->
          <div class="flex flex-col gap-2 text-xs text-on-surface-variant/70 mb-4">
            ${
              lab.advisor
                ? `
            <div class="flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[14px]">person</span>
              <span>${lab.advisor}</span>
            </div>
            `
                : ''
            }
            ${
              lab.professors
                ? `
            <div class="flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[14px]">school</span>
              <span>教授：${Array.isArray(lab.professors) ? lab.professors.join('、') : lab.professors}</span>
            </div>
            `
                : ''
            }
            <div class="flex items-start gap-1.5">
              <span class="material-symbols-outlined text-[14px] mt-0.5">apartment</span>
              <span class="leading-relaxed">${lab.department}</span>
            </div>
          </div>

          <!-- 底部标签栏 -->
          <div class="flex items-center gap-2 pt-3 border-t border-outline-variant/10 flex-wrap">
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
        /* 卡片固定宽度与高度，防止被 flex 压缩 */
        .labs-card {
          width: 380px;
          height: 340px;
          flex-shrink: 0;
        }

        /* 滚动容器 */
        .labs-marquee-wrapper {
          overflow-x: hidden;
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%);
          mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%);
        }

        /* 悬停时仅在滚动激活时允许手动滚动，隐藏滚动条 */
        .labs-marquee-wrapper.scroll-active:hover {
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
          gap: 1.5rem;
          width: max-content;
          padding-left: 60px;
          padding-right: 60px;
          transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
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
      // 1. 先复位测量状态：重置 HTML 和样式
      this.cleanupScrolling();
      track.style.justifyContent = 'center';
      track.innerHTML = singleCardsHtml;
      wrapper.classList.remove('scroll-active');

      const wrapperWidth = wrapper.clientWidth;
      const trackWidth = track.scrollWidth;

      // 2. 检查单倍宽度是否超出了视口
      if (trackWidth > wrapperWidth) {
        // 超出视口，激活无限滚动模式
        wrapper.classList.add('scroll-active');
        track.style.justifyContent = 'flex-start';
        // 动态翻倍卡片内容以支持无缝回绕
        track.innerHTML = singleCardsHtml + singleCardsHtml;
        this.initScrolling(wrapper, track);
      } else {
        // 未超出视口，保持居中静态展示
        wrapper.scrollLeft = 0;
      }
    });

    this._resizeObserver.observe(wrapper);
  }

  /**
   * 注册事件监听的辅助方法，方便统一销毁
   */
  private addEvent(
    target: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void {
    target.addEventListener(type, listener, options);
    this._eventListeners.push({ target, type, listener, options });
  }

  /**
   * 销毁所有滚动逻辑、定时器与事件监听
   */
  private cleanupScrolling(): void {
    cancelAnimationFrame(this._rafId);
    this._rafId = 0;
    this._paused = false;
    this._lastTime = 0;
    this._bounceOffset = 0;
    this._scrollingActive = false;

    // 注销所有事件
    this._eventListeners.forEach(({ target, type, listener, options }) => {
      target.removeEventListener(type, listener, options);
    });
    this._eventListeners = [];

    const track = this.querySelector<HTMLDivElement>('#labs-track');
    if (track) {
      track.style.transform = '';
      track.style.transition = '';
    }
  }

  /**
   * 激活并启动滚动交互逻辑
   */
  private initScrolling(wrapper: HTMLDivElement, track: HTMLDivElement): void {
    this._scrollingActive = true;

    /* 悬停暂停 / 离开恢复 */
    this.addEvent(wrapper, 'mouseenter', () => {
      this._paused = true;
      track.style.transition = 'none'; // 悬停手动滚动时立刻去掉延迟以实时响应
    });

    this.addEvent(wrapper, 'mouseleave', () => {
      this._paused = false;
      this._lastTime = 0; // 重置计时，防止跳帧

      /* 离开时若有回弹偏移量，平滑过渡重置 */
      if (Math.abs(this._bounceOffset) > 0.1) {
        track.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
        track.style.transform = '';
        this._bounceOffset = 0;
        setTimeout(() => {
          if (!this._paused && this._scrollingActive) track.style.transition = 'none';
        }, 400);
      }
    });

    /* 鼠标滚轮/触控板水平滚动并提供阻尼边缘回弹 */
    this.addEvent(wrapper, 'wheel', (e: Event) => {
      if (!this._paused) return;
      const event = e as WheelEvent;
      event.preventDefault();

      const delta = event.deltaY || event.deltaX;
      const maxScroll = wrapper.scrollWidth - wrapper.clientWidth;
      const currentScroll = wrapper.scrollLeft;
      const targetScroll = currentScroll + delta;

      if (targetScroll < 0) {
        // 向左越界
        wrapper.scrollLeft = 0;
        const overflow = targetScroll;
        this._bounceOffset = Math.max(-80, overflow * 0.25);
      } else if (targetScroll > maxScroll) {
        // 向右越界
        wrapper.scrollLeft = maxScroll;
        const overflow = targetScroll - maxScroll;
        this._bounceOffset = Math.min(80, overflow * 0.25);
      } else {
        // 正常范围滚动
        this._bounceOffset = 0;
        wrapper.scrollLeft = targetScroll;
      }

      track.style.transform = `translate3d(${-this._bounceOffset}px, 0, 0)`;
    }, { passive: false });

    /* 启动 RAF 自动滚动循环 */
    const tick = (now: number) => {
      if (!this._scrollingActive) return;
      this._rafId = requestAnimationFrame(tick);

      if (this._paused) {
        this._lastTime = 0;
        
        // 悬停期间平滑衰减弹性回弹值
        if (Math.abs(this._bounceOffset) > 0.1) {
          this._bounceOffset *= 0.85;
          track.style.transform = `translate3d(${-this._bounceOffset}px, 0, 0)`;
        } else if (this._bounceOffset !== 0) {
          this._bounceOffset = 0;
          track.style.transform = '';
        }
        return;
      }

      if (!this._lastTime) {
        this._lastTime = now;
        return;
      }

      const dt = (now - this._lastTime) / 1000;
      this._lastTime = now;

      // 确保自动滚动状态下 transform 清空
      if (this._bounceOffset !== 0) {
        this._bounceOffset = 0;
        track.style.transform = '';
      }

      wrapper.scrollLeft += this.SPEED * dt;

      /* 无缝回绕：单倍卡片宽度为 halfWidth，滚过一半后静默跳回起点 */
      const halfWidth = track.scrollWidth / 2;
      if (wrapper.scrollLeft >= halfWidth) {
        wrapper.scrollLeft -= halfWidth;
      }
    };

    this._rafId = requestAnimationFrame(tick);
  }
}

customElements.define('emu-labs', EmuLabs);
