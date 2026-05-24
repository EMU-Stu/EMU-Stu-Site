/**
 * <emu-services> 校园服务组件
 *
 * 渲染"校园服务"区域，包含 <emu-service-card> 子组件
 */
import { PORTAL_ITEMS, FEEDBACK_LINKS } from '@/config/services';

// 导入二维码图片资源
import qrcodeFeedback from '../../assets/survey-qrcode-feature-feedbck.png';
import qrcodeRequest from '../../assets/survey-qrcode-new-feature-request.png';

export class EmuServices extends HTMLElement {
    connectedCallback(): void {
        this.render();
        this.initFeedbackDialog();
    }

    private render(): void {
        const cardsHtml = PORTAL_ITEMS.map(
            (item) => `
      <emu-service-card
        icon="${item.icon}"
        title="${item.title}"
        description="${item.description}"
        href="${item.href}"
        soon="${'soon' in item && item.soon ? 'true' : 'false'}"
      ></emu-service-card>
    `
        ).join('');

        this.innerHTML = `
      <section class="py-20 px-margin-mobile md:px-margin-desktop relative" id="portals-container">
        <!-- 装饰性光晕背景（浅） -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>

        <div class="max-w-container-max mx-auto relative z-10">
          <!-- 头部标题栏（对齐开源项目模块） -->
          <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span class="text-xs md:text-sm font-bold tracking-wider text-primary/70 dark:text-primary-fixed-dim/70 uppercase mb-2 block font-mono">
                Campus Service
              </span>
              <h2 class="font-headline-lg text-3xl md:text-5xl font-extrabold text-on-surface tracking-tight leading-none mb-2 select-all">
                校园服务
              </h2>
            </div>
            
            <!-- 统计信息与外链操作 -->
            <div class="flex flex-col items-start md:items-end gap-3">
              <p class="text-xs md:text-sm text-on-surface-variant/80 leading-relaxed text-left md:text-right max-w-md">
                想要更多校园服务？请点击：
              </p>

              <a
                href="javascript:void(0)"
                id="feedback-trigger"
                class="inline-flex items-center gap-1 text-sm font-semibold text-primary dark:text-primary-fixed hover:underline group/link cursor-pointer"
              >
                请求/反馈服务
                <span class="material-symbols-outlined text-[16px] group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform">
                  north_east
                </span>
              </a>
            </div>
          </div>

          <!-- 卡片网格（移动端展示为 2 列） -->
          <div class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            ${cardsHtml}
          </div>
        </div>
      </section>

      <!-- 反馈与需求弹窗 -->
      <dialog
        id="feedback-dialog"
        class="bg-[#f5f6f8] dark:bg-[#151718] text-on-surface p-0 shadow-2xl max-w-3xl w-[90%] md:w-full rounded-2xl border border-outline/10 dark:border-outline-variant/10 focus:outline-none overflow-hidden"
      >
        <div class="relative p-6 md:p-8">
          <!-- 关闭按钮 -->
          <button
            id="dialog-close-btn"
            class="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full bg-surface-container-highest/50 hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-all duration-200 focus:outline-none"
            aria-label="关闭弹窗"
          >
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>

          <!-- 弹窗标题 -->
          <div class="text-center mb-8">
            <span class="text-xs font-bold tracking-wider text-primary/70 dark:text-primary-fixed-dim/70 uppercase mb-1 block font-mono">
              Feedback & Request
            </span>
            <h3 class="text-2xl font-extrabold text-on-surface tracking-tight">请求与反馈服务</h3>
          </div>

          <!-- 二维码网格布局 -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 justify-items-center">
            <!-- 新功能请求 -->
            <a
              href="${FEEDBACK_LINKS.newFeatureRequest}"
              target="_blank"
              class="flex flex-col items-center group cursor-pointer w-full max-w-[280px] md:max-w-[320px] transition-transform duration-300"
            >
              <div class="overflow-hidden rounded-2xl shadow-md border border-outline-variant/10 group-hover:shadow-lg group-hover:border-primary/20 transition-all duration-300 bg-white">
                <img
                  src="${qrcodeRequest}"
                  alt="新功能请求"
                  class="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>
              <p class="text-xs text-on-surface-variant/80 mt-3 flex items-center gap-1 text-center group-hover:text-primary transition-colors">
                <span class="material-symbols-outlined text-[14px]">open_in_new</span>
                点击或扫码提交新服务请求
              </p>
            </a>

            <!-- 功能反馈 -->
            <a
              href="${FEEDBACK_LINKS.featureFeedback}"
              target="_blank"
              class="flex flex-col items-center group cursor-pointer w-full max-w-[280px] md:max-w-[320px] transition-transform duration-300"
            >
              <div class="overflow-hidden rounded-2xl shadow-md border border-outline-variant/10 group-hover:shadow-lg group-hover:border-primary/20 transition-all duration-300 bg-white">
                <img
                  src="${qrcodeFeedback}"
                  alt="功能反馈"
                  class="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>
              <p class="text-xs text-on-surface-variant/80 mt-3 flex items-center gap-1 text-center group-hover:text-primary transition-colors">
                <span class="material-symbols-outlined text-[14px]">open_in_new</span>
                点击或扫码提交功能反馈
              </p>
            </a>
          </div>

          <!-- 页脚提示 -->
          <div class="text-center mt-8 pt-4 border-t border-outline-variant/10">
            <p class="text-[10px] text-on-surface-variant/60 font-mono">Powered by EMU-Stu 开源技术组织</p>
          </div>
        </div>
      </dialog>
    `;
    }

    private initFeedbackDialog(): void {
        const trigger = this.querySelector('#feedback-trigger');
        const dialog = this.querySelector('#feedback-dialog') as HTMLDialogElement | null;
        const closeBtn = this.querySelector('#dialog-close-btn');

        if (!trigger || !dialog) return;

        // 打开弹窗
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            dialog.showModal();
            // 阻断背景滚动
            document.body.style.overflow = 'hidden';
        });

        // 关闭弹窗的辅助函数
        const closeDialog = () => {
            dialog.close();
        };

        if (closeBtn) {
            closeBtn.addEventListener('click', closeDialog);
        }

        // 监听 dialog 的 close 事件（包括按 ESC 关闭的情况），恢复背景滚动
        dialog.addEventListener('close', () => {
            document.body.style.overflow = '';
        });

        // 点击 backdrop（弹窗外部）关闭弹窗
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                closeDialog();
            }
        });
    }
}

customElements.define('emu-services', EmuServices);

/**
 * <emu-service-card> 校园服务卡片组件
 *
 * 属性：
 *  - icon: Material Symbols 图标名
 *  - title: 卡片标题
 *  - href: 链接地址
 */
export class EmuServiceCard extends HTMLElement {
  /** 监听的属性列表 */
  static get observedAttributes(): string[] {
    return ['icon', 'title', 'description', 'href', 'soon'];
  }

  private handleClick = (e: MouseEvent): void => {
    if (this.getAttribute('soon') === 'true') {
      e.preventDefault();
    }
  };

  connectedCallback(): void {
    this.style.display = 'block';
    this.render();
    this.addEventListener('click', this.handleClick);
  }

  disconnectedCallback(): void {
    this.removeEventListener('click', this.handleClick);
  }

  attributeChangedCallback(): void {
    if (this.isConnected) {
      this.render();
    }
  }

  private render(): void {
    const icon = this.getAttribute('icon') || 'help';
    const title = this.getAttribute('title') || '';
    const description = this.getAttribute('description') || '';
    const href = this.getAttribute('href') || '#';
    const soon = this.getAttribute('soon') === 'true';

    // 静态简易禁用样式
    const cardClass = soon
      ? 'group flex flex-col items-center justify-center text-center gap-2 md:gap-4 h-full bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-4 md:p-8 shadow-sm relative overflow-hidden cursor-not-allowed select-none opacity-60'
      : 'group flex flex-col items-center justify-center text-center gap-2 md:gap-4 h-full bg-surface-container-lowest border border-outline-variant rounded-xl p-4 md:p-8 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300 relative overflow-hidden';

    const hoverOverlay = soon
      ? ''
      : `<div class="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>`;

    const iconContainerClass = soon
      ? 'w-12 h-12 md:w-16 md:h-16 rounded-full bg-secondary-container/60 text-secondary/70 flex items-center justify-center relative z-10'
      : 'w-12 h-12 md:w-16 md:h-16 rounded-full bg-secondary-container text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary group-hover:scale-110 transition-all duration-300 relative z-10';

    const titleClass = soon
      ? 'font-headline-md text-base md:text-headline-md text-on-surface/70 relative z-10'
      : 'font-headline-md text-base md:text-headline-md text-on-surface relative z-10 group-hover:text-primary transition-colors duration-300';

    const descClass = soon
      ? 'text-xs md:text-sm text-on-surface-variant/60 relative z-10 line-clamp-2 max-w-[240px] leading-relaxed'
      : 'text-xs md:text-sm text-on-surface-variant/80 relative z-10 line-clamp-2 max-w-[240px] leading-relaxed';

    const badgeHtml = soon
      ? `
        <div class="absolute top-1.5 right-1.5 md:top-3 md:right-3 bg-secondary-container text-on-secondary-container text-[8px] md:text-[10px] font-semibold px-1.5 py-0.5 md:px-2 md:py-0.5 rounded-full select-none border border-outline-variant/40 z-20">
          即将推出
        </div>
      `
      : '';

    this.innerHTML = `
      <a
        class="${cardClass}"
        href="${soon ? 'javascript:void(0)' : href}"
      >
        <!-- 悬浮渐变遮罩 -->
        ${hoverOverlay}

        <!-- 静态即将推出 Badge -->
        ${badgeHtml}

        <!-- 图标容器 -->
        <div class="${iconContainerClass}">
          <span class="material-symbols-outlined text-xl md:text-3xl">${icon}</span>
        </div>

        <!-- 标题 -->
        <h3 class="${titleClass}">${title}</h3>

        <!-- 一句话介绍 -->
        ${description ? `
          <p class="${descClass}">
            ${description}
          </p>
        ` : ''}
      </a>
    `;
  }
}

customElements.define('emu-service-card', EmuServiceCard);
