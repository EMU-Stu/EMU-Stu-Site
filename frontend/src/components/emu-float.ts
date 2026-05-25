/**
 * <emu-float> 通用浮窗组件
 * 
 * 属性：
 * - max-width: 浮窗的最大宽度（默认 max-w-2xl，例如 max-w-3xl, max-w-4xl 等）
 * - subtitle: 浮窗的小标题（可选，如 Feedback & Request）
 * - title: 浮窗的大标题（必选）
 * 
 * 方法：
 * - showModal(): 打开浮窗（自动阻断背景滚动）
 * - close(): 关闭浮窗（自动恢复背景滚动）
 */
export class EmuFloat extends HTMLElement {
  private _dialog: HTMLDialogElement | null = null;
  private _titleElement: HTMLElement | null = null;

  static get observedAttributes() {
    return ['max-width', 'subtitle', 'title'];
  }

  attributeChangedCallback(_name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;
    this.update();
  }

  connectedCallback() {
    this.render();
  }

  // 方便外部动态读写大标题（例如校历组件需要根据学年更新标题）
  get titleText(): string {
    return this.getAttribute('title') || '';
  }

  set titleText(val: string) {
    this.setAttribute('title', val);
  }

  showModal() {
    if (this._dialog) {
      this._dialog.showModal();
      document.body.style.overflow = 'hidden';
    }
  }

  close() {
    if (this._dialog) {
      this._dialog.close();
    }
  }

  private update() {
    const titleAttr = this.getAttribute('title') || '';
    const subtitleAttr = this.getAttribute('subtitle') || '';
    const maxWidthAttr = this.getAttribute('max-width') || 'max-w-2xl';

    if (this._titleElement) {
      this._titleElement.textContent = titleAttr;
    }
    
    const subLabel = this.querySelector('.dialog-subtitle');
    if (subLabel) {
      subLabel.textContent = subtitleAttr;
      if (subtitleAttr) {
        subLabel.removeAttribute('style');
      } else {
        subLabel.setAttribute('style', 'display: none;');
      }
    }

    if (this._dialog) {
      this._dialog.className = `bg-[#f5f6f8] dark:bg-[#151718] text-on-surface p-0 shadow-2xl ${maxWidthAttr} w-[90%] md:w-full rounded-2xl border border-outline/10 dark:border-outline-variant/10 focus:outline-none overflow-hidden`;
    }
  }

  private render() {
    if (this._dialog) return;

    const titleAttr = this.getAttribute('title') || '';
    const subtitleAttr = this.getAttribute('subtitle') || '';
    const maxWidthAttr = this.getAttribute('max-width') || 'max-w-2xl';

    // 暂存用户在 HTML 中编写的子元素内容
    const originalChildren = Array.from(this.childNodes);
    this.innerHTML = '';

    // 创建底层的 <dialog> 元素
    const dialog = document.createElement('dialog');
    dialog.className = `bg-[#f5f6f8] dark:bg-[#151718] text-on-surface p-0 shadow-2xl ${maxWidthAttr} w-[90%] md:w-full rounded-2xl border border-outline/10 dark:border-outline-variant/10 focus:outline-none overflow-hidden`;
    this._dialog = dialog;

    const wrapper = document.createElement('div');
    wrapper.className = 'relative p-6 md:p-8 flex flex-col items-center';

    // 1. 右上角通用关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.className = 'absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full bg-surface-container-highest/50 hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-all duration-200 focus:outline-none z-10 cursor-pointer';
    closeBtn.setAttribute('aria-label', '关闭浮窗');
    closeBtn.innerHTML = '<span class="material-symbols-outlined text-[20px]">close</span>';
    closeBtn.addEventListener('click', () => this.close());
    wrapper.appendChild(closeBtn);

    // 2. 浮窗标题与小标题
    const header = document.createElement('div');
    header.className = 'text-center mb-8';

    const subLabel = document.createElement('span');
    subLabel.className = 'dialog-subtitle text-xs font-bold tracking-wider text-primary/70 dark:text-primary-fixed-dim/70 uppercase mb-1 block font-mono';
    subLabel.textContent = subtitleAttr;
    if (!subtitleAttr) {
      subLabel.style.display = 'none';
    }
    header.appendChild(subLabel);

    const titleLabel = document.createElement('h3');
    titleLabel.className = 'text-2xl font-extrabold text-on-surface tracking-tight';
    titleLabel.textContent = titleAttr;
    this._titleElement = titleLabel;
    header.appendChild(titleLabel);

    wrapper.appendChild(header);

    // 3. 浮窗内容容器（插入用户编写的内容）
    const content = document.createElement('div');
    content.className = 'w-full flex flex-col items-center';
    originalChildren.forEach(child => content.appendChild(child));
    wrapper.appendChild(content);

    // 4. 页脚团队标识
    const footer = document.createElement('div');
    footer.className = 'text-center w-full mt-6 pt-4 border-t border-outline-variant/10';
    footer.innerHTML = '<p class="text-[10px] text-on-surface-variant/60 font-mono">Powered by EMU-Stu 开源技术组织</p>';
    wrapper.appendChild(footer);

    dialog.appendChild(wrapper);
    this.appendChild(dialog);

    // 监听 close 事件以复原背景滚动并分发事件
    dialog.addEventListener('close', () => {
      document.body.style.overflow = '';
      this.dispatchEvent(new CustomEvent('close'));
    });

    // 点击浮窗遮罩（外部）自动关闭浮窗
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        this.close();
      }
    });
  }
}

customElements.define('emu-float', EmuFloat);
