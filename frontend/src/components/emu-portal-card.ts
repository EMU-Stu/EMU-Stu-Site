/**
 * <emu-portal-card> 快捷入口卡片组件
 *
 * 属性：
 *  - icon: Material Symbols 图标名
 *  - title: 卡片标题
 *  - href: 链接地址
 */
export class EmuPortalCard extends HTMLElement {
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
      ? 'group flex flex-col items-center justify-center text-center gap-4 h-full bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-8 shadow-sm relative overflow-hidden cursor-not-allowed select-none opacity-60'
      : 'group flex flex-col items-center justify-center text-center gap-4 h-full bg-surface-container-lowest border border-outline-variant rounded-xl p-8 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300 relative overflow-hidden';

    const hoverOverlay = soon
      ? ''
      : `<div class="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>`;

    const iconContainerClass = soon
      ? 'w-16 h-16 rounded-full bg-secondary-container/60 text-secondary/70 flex items-center justify-center relative z-10'
      : 'w-16 h-16 rounded-full bg-secondary-container text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary group-hover:scale-110 transition-all duration-300 relative z-10';

    const titleClass = soon
      ? 'font-headline-md text-headline-md text-on-surface/70 relative z-10'
      : 'font-headline-md text-headline-md text-on-surface relative z-10 group-hover:text-primary transition-colors duration-300';

    const descClass = soon
      ? 'text-xs md:text-sm text-on-surface-variant/60 relative z-10 line-clamp-2 max-w-[240px] leading-relaxed'
      : 'text-xs md:text-sm text-on-surface-variant/80 relative z-10 line-clamp-2 max-w-[240px] leading-relaxed';

    const badgeHtml = soon
      ? `
        <div class="absolute top-3 right-3 bg-secondary-container text-on-secondary-container text-[10px] font-semibold px-2 py-0.5 rounded-full select-none border border-outline-variant/40 z-20">
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
          <span class="material-symbols-outlined text-3xl">${icon}</span>
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

customElements.define('emu-portal-card', EmuPortalCard);
