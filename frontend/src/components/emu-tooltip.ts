/**
 * <emu-tooltip> 通用气泡提示组件
 * 
 * 属性：
 * - text: 简短的提示文本（可选，若不需要复杂的富文本，可以直接设置此属性）
 * 
 * 插槽：
 * - 默认插槽：放置触发提示的元素（如图标、文字等）
 * - content: 放置气泡中的复杂 HTML 内容（可选，当不设置 text 属性时生效）
 */
export class EmuTooltip extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  private render() {
    // 1. 获取内容元素（带有 slot="content" 的子元素）
    const contentEl = this.querySelector('[slot="content"]');
    
    // 2. 获取其他所有触发元素（子节点）
    const triggerNodes = Array.from(this.childNodes).filter(node => node !== contentEl);
    
    // 清空当前内容以便重新拼装
    this.innerHTML = '';
    
    // 设置宿主元素的显示类型为行内块，如果外部未定义则设置默认值
    if (!this.style.display) {
      this.style.display = 'inline-block';
    }
    if (!this.style.verticalAlign) {
      this.style.verticalAlign = 'middle';
    }
    
    // 3. 创建内部结构包裹器，增加 relative 定位与 group 触发器
    const wrapper = document.createElement('div');
    wrapper.className = 'relative inline-flex items-center group/tooltip';
    
    // 4. 将触发元素追加到包裹器
    triggerNodes.forEach(node => wrapper.appendChild(node));
    
    // 5. 创建气泡本体并增加最大宽度限制，防止在窄屏下溢出
    const balloon = document.createElement('div');
    balloon.className = 'absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-white dark:bg-[#1e2124] text-on-surface border border-outline-variant/30 dark:border-[#2f3336] rounded-xl shadow-lg opacity-0 pointer-events-none group-hover/tooltip:opacity-100 group-hover/tooltip:pointer-events-auto transition-all duration-200 group-hover/tooltip:delay-0 z-50 min-w-[260px] max-w-[calc(100vw-24px)] text-left text-xs whitespace-normal font-sans normal-case after:content-[\'\'] after:absolute after:top-full after:left-0 after:w-full after:h-2';
    
    // 向下的三角形指示物
    const arrow = document.createElement('div');
    arrow.className = 'absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white dark:border-t-[#1e2124] transition-transform duration-200';
    balloon.appendChild(arrow);
    
    // 6. 追加内容
    if (contentEl) {
      contentEl.removeAttribute('slot');
      balloon.appendChild(contentEl);
    } else {
      const textAttr = this.getAttribute('text') || '';
      const textSpan = document.createElement('span');
      textSpan.textContent = textAttr;
      balloon.appendChild(textSpan);
    }
    
    wrapper.appendChild(balloon);
    this.appendChild(wrapper);

    // 7. 边界避让动态计算逻辑
    const adjustPosition = () => {
      // 重置偏移以获取原始的渲染边界
      balloon.style.transform = '';
      arrow.style.transform = '';

      const rect = balloon.getBoundingClientRect();
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

      let offsetX = 0;
      if (rect.right > viewportWidth) {
        offsetX = viewportWidth - rect.right - 12; // 距离右边缘保留 12px 间距
      } else if (rect.left < 0) {
        offsetX = -rect.left + 12; // 距离左边缘保留 12px 间距
      }

      if (offsetX !== 0) {
        balloon.style.transform = `translateX(calc(-50% + ${offsetX}px))`;
        
        // 限制箭头的偏移，使其留在气泡内部（保留 16px 圆角边缘）
        const maxArrowOffset = Math.max(0, (rect.width / 2) - 16);
        const arrowOffset = Math.max(-maxArrowOffset, Math.min(maxArrowOffset, -offsetX));
        arrow.style.transform = `translateX(calc(-50% + ${arrowOffset}px))`;
      }
    };

    const resetPosition = () => {
      balloon.style.transform = '';
      arrow.style.transform = '';
    };

    wrapper.addEventListener('mouseenter', adjustPosition);
    wrapper.addEventListener('touchstart', adjustPosition, { passive: true });
    wrapper.addEventListener('mouseleave', resetPosition);
  }
}

customElements.define('emu-tooltip', EmuTooltip);
