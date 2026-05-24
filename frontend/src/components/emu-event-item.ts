/**
 * <emu-event-item> 活动条目组件
 *
 * 属性：
 *  - time: 活动时间
 *  - title: 活动标题
 *  - location: 活动地点
 *  - variant: 'primary' | 'secondary'（时间线圆点颜色）
 */
export class EmuEventItem extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['time', 'title', 'location', 'variant'];
  }

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(): void {
    if (this.isConnected) {
      this.render();
    }
  }

  private render(): void {
    const time = this.getAttribute('time') || '';
    const title = this.getAttribute('title') || '';
    const location = this.getAttribute('location') || '';
    const variant = this.getAttribute('variant') || 'secondary';

    // 根据 variant 选择圆点和时间文字颜色
    const dotColorClass = variant === 'primary' ? 'before:bg-primary' : 'before:bg-secondary';
    const timeColorClass = variant === 'primary' ? 'text-primary' : 'text-secondary';

    this.innerHTML = `
      <li
        class="relative pl-6 before:content-[''] before:absolute before:left-0 before:top-2 before:w-3 before:h-3 ${dotColorClass} before:rounded-full"
      >
        <div class="text-sm ${timeColorClass} font-bold mb-1">${time}</div>
        <h4 class="font-headline-md text-base text-on-surface mb-1">${title}</h4>
        <p class="text-xs text-on-surface-variant flex items-center gap-1">
          <span class="material-symbols-outlined text-[14px]">location_on</span>${location}
        </p>
      </li>
    `;
  }
}

customElements.define('emu-event-item', EmuEventItem);
