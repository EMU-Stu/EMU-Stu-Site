/**
 * <emu-activity-heatmap> 组织贡献热力图组件 (年度弹窗版 - 像素级美化)
 * 
 * 渲染一个原生的 HTML5 <dialog> 弹窗，其中包含完整自然年（53周）的组织活跃热力图。
 * 像素级还原 GitHub 官方热力图配色（0-4级亮暗色阶）与紧凑画幅（10px 方块，2px 间距）。
 * 未来的日子显示为 0 级格但不可交互，跨年补位格透明，使格网整齐划一。
 */
import './emu-tooltip';

interface MetricData {
  additions: number;
  deletions: number;
  lines_changed: number;
  commits?: number;
}

interface RepoData {
  name: string;
  additions: number;
  deletions: number;
  metrics?: MetricData;
}

interface DayStats {
  date: string;
  total_additions: number;
  total_deletions: number;
  metrics?: MetricData;
  repos: RepoData[];
}

export class EmuActivityHeatmap extends HTMLElement {
  /** 完整的历史统计数据 */
  private _historyData: DayStats[] = [];

  /** 数据是否已加载成功 */
  private _dataLoaded: boolean = false;

  /** 记录弹窗打开前的 body 和 html overflow 状态 */
  private _prevBodyOverflow: string = '';
  private _prevHtmlOverflow: string = '';

  connectedCallback(): void {
    this.renderBaseStructure();
    this.fetchStats();
  }

  /**
   * 异步抓取历史统计数据 stats.json
   */
  private async fetchStats(): Promise<void> {
    try {
      const response = await fetch('https://cdn.jsdelivr.net/gh/EMU-Stu/EMU-Stu-Site@stats-data/stats.json', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status}`);
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Data format error: expected an array');
      }
      this._historyData = data;
      this._dataLoaded = true;
    } catch (e) {
      console.error('加载组织活跃度统计失败:', e);
    }
  }

  /**
   * 渲染弹窗的底层基础结构（默认处于关闭状态）
   * 弹窗最大宽度设为 max-w-3xl (768px)，搭配 10px 格网在大屏下可不发生滚动完整铺满
   */
  private renderBaseStructure(): void {
    this.innerHTML = `
      <dialog 
        id="heatmap-dialog" 
        class="rounded-2xl p-6 bg-surface-container-lowest text-on-surface border border-outline-variant/30 shadow-2xl max-w-3xl w-[92%] backdrop:bg-black/40 backdrop:backdrop-blur-sm focus:outline-none transition-all duration-300 opacity-0 scale-95"
      >
        <div class="flex items-center justify-between mb-5 select-none">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-[22px]">calendar_month</span>
            <h3 class="font-mono font-bold text-base text-on-surface">组织活跃热力图</h3>
          </div>
          <button 
            id="close-heatmap-dialog" 
            class="material-symbols-outlined text-on-surface-variant/70 hover:text-on-surface transition-colors cursor-pointer text-[20px]"
          >
            close
          </button>
        </div>

        <!-- 控制栏（包含统计口径与时间范围说明） -->
        <div class="flex items-center justify-between mb-5 select-none text-xs">
          <span class="text-[11px] text-on-surface-variant/60 font-medium">统计口径：开源仓库代码变更行数 (+/-)</span>
          <span id="current-year-display" class="font-mono text-on-surface-variant/60 text-[11px]">数据范围：2025-05-01 至 今日</span>
        </div>

        <!-- 滚动热力图区 (2025-05-01至今横向滚动) - 加上高雅的边框包裹与轻质底色。移除 pl padding，将其分配到 sticky Y 轴中以保证滚动时完美剪裁遮挡 -->
        <div class="relative overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-outline-variant/30 scrollbar-track-transparent mb-6 border border-outline-variant/20 dark:border-[#2f3336] rounded-xl py-4 pr-4 pl-0 bg-surface-container-low/20">
          
          <div class="flex items-start w-max">
            <!-- 1. 左侧冻结列：包含月份行留白与星期 Y 轴，通过 sticky left-0 锁定，并使用实色背景遮挡滚动进入的元素 -->
            <div class="sticky left-0 z-20 bg-surface-container-lowest dark:bg-[#1a1d20] pl-4 pr-1.5 flex flex-col flex-shrink-0 select-none">
              <!-- 顶部对齐月份轴的留白 (h-4 + mb-1 + pt-1) = 24px -->
              <div class="h-[24px]"></div>
              <!-- 星期 Y 轴标签列 -->
              <div class="flex flex-col gap-[2px] text-[9px] text-on-surface-variant/50 font-mono text-right w-8">
                <div class="h-[20px] flex items-center justify-end"></div>
                <div class="h-[20px] flex items-center justify-end">周一</div>
                <div class="h-[20px] flex items-center justify-end"></div>
                <div class="h-[20px] flex items-center justify-end">周三</div>
                <div class="h-[20px] flex items-center justify-end"></div>
                <div class="h-[20px] flex items-center justify-end">周五</div>
                <div class="h-[20px] flex items-center justify-end"></div>
              </div>
            </div>

            <!-- 2. 右侧滚动内容区：包含月份行标尺与格子网格 -->
            <div class="flex flex-col flex-shrink-0">
              <!-- 月份行标尺 -->
              <div id="dialog-heatmap-months" class="relative h-4 mb-1"></div>
              <!-- 日历格子网格 -->
              <div id="dialog-heatmap-grid" class="flex gap-[2px] pt-1"></div>
            </div>
          </div>

        </div>

        <!-- 底部数据简报 -->
        <div class="bg-surface-container-low/50 rounded-xl p-4 mb-5 text-[11px] text-on-surface-variant leading-relaxed select-none">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="flex justify-between sm:flex-col sm:justify-start gap-1 pb-2 sm:pb-0 border-b sm:border-b-0 sm:border-r border-outline-variant/10">
              <span class="text-on-surface-variant/70">累计代码变更：</span>
              <strong id="year-total-lines" class="text-primary font-mono text-sm sm:mt-1">-- 行</strong>
            </div>
            <div class="flex justify-between sm:flex-col sm:justify-start gap-1 pb-2 sm:pb-0 border-b sm:border-b-0 sm:border-r border-outline-variant/10">
              <span class="text-on-surface-variant/70">活跃开发天数：</span>
              <strong id="year-active-days" class="text-on-surface font-mono text-sm sm:mt-1">-- 天</strong>
            </div>
            <div class="flex justify-between sm:flex-col sm:justify-start gap-1">
              <span class="text-on-surface-variant/70">单日最高变更：</span>
              <strong id="year-max-lines" class="text-on-surface font-mono text-sm sm:mt-1">-- 行</strong>
            </div>
          </div>
        </div>

        <!-- 底部图例 -->
        <div class="flex justify-end items-center gap-1.5 text-[10px] text-on-surface-variant/70 font-mono select-none">
          <span>少</span>
          <div class="flex gap-[2px]">
            <div class="w-[20px] h-[20px] rounded-[2px] bg-[#ebedf0] dark:bg-[#161b22]"></div>
            <div class="w-[20px] h-[20px] rounded-[2px] bg-[#9be9a8] dark:bg-[#0e4429]"></div>
            <div class="w-[20px] h-[20px] rounded-[2px] bg-[#40c463] dark:bg-[#006d32]"></div>
            <div class="w-[20px] h-[20px] rounded-[2px] bg-[#30a14e] dark:bg-[#26a641]"></div>
            <div class="w-[20px] h-[20px] rounded-[2px] bg-[#216e39] dark:bg-[#39d353]"></div>
          </div>
          <span>多</span>
        </div>
      </dialog>
    `;

    // 绑定关闭按钮和点击 Backdrop 关闭
    const dialog = this.querySelector<HTMLDialogElement>('#heatmap-dialog');
    const closeBtn = this.querySelector('#close-heatmap-dialog');

    closeBtn?.addEventListener('click', () => this.close());
    
    dialog?.addEventListener('click', (e) => {
      if (e.target === dialog) {
        this.close();
      }
    });

    // 监听 close 事件以复原背景滚动
    dialog?.addEventListener('close', () => {
      document.body.style.overflow = this._prevBodyOverflow;
      document.documentElement.style.overflow = this._prevHtmlOverflow;
    });
  }

  /**
   * 打开弹窗并渲染热力图
   */
  public open(): void {
    const dialog = this.querySelector<HTMLDialogElement>('#heatmap-dialog');
    if (!dialog) return;

    // 记录并锁定背景滚动
    this._prevBodyOverflow = document.body.style.overflow;
    this._prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    dialog.showModal();
    
    requestAnimationFrame(() => {
      dialog.classList.remove('opacity-0', 'scale-95');
    });

    this.renderHeatmap();
    this.scrollToLatest();
  }

  /**
   * 关闭弹窗
   */
  public close(): void {
    const dialog = this.querySelector<HTMLDialogElement>('#heatmap-dialog');
    if (!dialog) return;

    dialog.classList.add('opacity-0', 'scale-95');
    
    const onTransitionEnd = () => {
      dialog.close();
      dialog.removeEventListener('transitionend', onTransitionEnd);
    };
    dialog.addEventListener('transitionend', onTransitionEnd);
  }

  /**
   * 将滚动条自动滑到最右侧（最新提交日期处）
   */
  private scrollToLatest(): void {
    setTimeout(() => {
      const scrollContainer = this.querySelector('.overflow-x-auto');
      if (scrollContainer) {
        scrollContainer.scrollLeft = scrollContainer.scrollWidth;
      }
    }, 50);
  }

  /**
   * 获取某一日期的代码变更行数
   */
  private getDayVal(dateStr: string): { val: number; additions: number; deletions: number; commits: number; commitsTracked: boolean; dateTracked: boolean; score: number } {
    const day = this._historyData.find((d) => d.date === dateStr);
    if (!day) {
      // 数据源中没有该天的记录，完全未统计
      return { val: 0, additions: 0, deletions: 0, commits: 0, commitsTracked: false, dateTracked: false, score: 0 };
    }

    const additions = day.metrics?.additions ?? day.total_additions ?? 0;
    const deletions = day.metrics?.deletions ?? day.total_deletions ?? 0;
    // 变更行数 = 增加数 + 删除数绝对值
    const val = day.metrics?.lines_changed ?? (additions + deletions);
    
    // 获取提交次数，并判断数据源中是否真实记录了 commits 字段
    // 注意：数据存在但值为 0 是有效数据（该天没有活动），不等于未统计
    let commits = 0;
    let commitsTracked = false;

    if (typeof day.metrics?.commits === 'number') {
      // metrics 层有明确的 commits 字段，即使值为 0 也算已统计
      commits = day.metrics.commits;
      commitsTracked = true;
    } else if (day.repos) {
      // 尝试从各 repo.metrics.commits 汇总，只要有一个 repo 有该字段即视为已统计
      const anyRepoTracked = day.repos.some((repo) => typeof repo.metrics?.commits === 'number');
      if (anyRepoTracked) {
        commits = day.repos.reduce((acc, repo) => acc + (repo.metrics?.commits ?? 0), 0);
        commitsTracked = true;
      }
      // 若 repos 存在但没有任何 commits 字段，保持 commitsTracked = false（该字段在此数据批次中未统计）
    }

    // 对数平滑加权得分算法（后台默默评估着色）
    const score = commits * 20 + Math.log2(val + 1) * 10;

    return { val, additions, deletions, commits, commitsTracked, dateTracked: true, score };
  }

  /**
   * 计算指定年份数据的分位数阈值
   */
  private calculateYearQuantiles(validDates: string[]): { q25: number; q50: number; q75: number } {
    const nonZeroValues: number[] = [];
    validDates.forEach((dateStr) => {
      const { score } = this.getDayVal(dateStr);
      if (score > 0) {
        nonZeroValues.push(score);
      }
    });

    if (nonZeroValues.length === 0) {
      return { q25: 1, q50: 2, q75: 3 };
    }

    nonZeroValues.sort((a, b) => a - b);
    
    const getPercentile = (p: number) => {
      const idx = Math.floor(nonZeroValues.length * p);
      return nonZeroValues[Math.min(idx, nonZeroValues.length - 1)];
    };

    return {
      q25: getPercentile(0.25),
      q50: getPercentile(0.50),
      q75: getPercentile(0.75)
    };
  }

  /**
   * 渲染年度热力图
   */
  /**
   * 渲染热力图（2025-05-01 至今的长滚动无翻页网格）
   */
  private renderHeatmap(): void {
    if (!this._dataLoaded) {
      const gridContainer = this.querySelector('#dialog-heatmap-grid');
      if (gridContainer) {
        gridContainer.innerHTML = `<span class="text-xs text-on-surface-variant/70 py-6">正在加载活跃度数据...</span>`;
      }
      return;
    }

    // 1. 获取北京时间 (UTC+8) 的今天日期
    const bjOffset = 8 * 60 * 60 * 1000;
    const now = new Date();
    const today = new Date(now.getTime() + (now.getTimezoneOffset() * 60 * 1000) + bjOffset);
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // 2. 确定时间范围的起止日期：从固定的 2025-05-01 开始，截止到今天所在的星期六
    const startDate = new Date(2025, 4, 1); // 5月1日
    const endDate = today;
    
    const startDayOfWeek = startDate.getDay(); // 0(周日) - 6(周六)
    const gridStartDate = new Date(startDate.getTime() - startDayOfWeek * 24 * 60 * 60 * 1000);
    
    const endDayOfWeek = endDate.getDay();
    const gridEndDate = new Date(endDate.getTime() + (6 - endDayOfWeek) * 24 * 60 * 60 * 1000);

    // 时区安全地生成指定日期区间内的连续天数数组，避免夏令时漂移导致的日期重复与缺失
    const dates: string[] = [];
    let current = new Date(gridStartDate);
    while (current <= gridEndDate) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      dates.push(`${y}-${m}-${d}`);
      current.setDate(current.getDate() + 1);
    }

    const totalDays = dates.length;
    const weeksCount = totalDays / 7;

    // 3. 统计 2025-05-01 至今 Rarer（处于 2025-05-01 与今天之间）的有效数据
    const startDateStr = '2025-05-01';
    const validDates = dates.filter((dateStr) => {
      return dateStr >= startDateStr && dateStr <= todayStr;
    });

    let totalYearLines = 0;
    let totalYearCommits = 0;
    let activeDays = 0;
    let maxLines = 0;
    let maxLinesDate = '';

    validDates.forEach((dateStr) => {
      const { val, commits } = this.getDayVal(dateStr);
      if (val > 0 || commits > 0) {
        totalYearLines += val;
        totalYearCommits += commits;
        activeDays++;
        if (val > maxLines) {
          maxLines = val;
          maxLinesDate = dateStr;
        }
      }
    });

    const quantiles = this.calculateYearQuantiles(validDates);

    // 4. 重组为 7 行 × weeksCount 列矩阵
    const columns: string[][] = [];
    for (let col = 0; col < weeksCount; col++) {
      const columnDates: string[] = [];
      for (let row = 0; row < 7; row++) {
        columnDates.push(dates[col * 7 + row]);
      }
      columns.push(columnDates);
    }

    // 5. 生成月份定位行 (根据方块 14px 和间距 2px 做精确水平定位)
    let monthLabelsHtml = '';
    let lastMonthColIdx = -10;
    let lastMonth = '';
    columns.forEach((colDates, colIdx) => {
      const midDay = new Date(colDates[3]);
      const monthName = `${midDay.getMonth() + 1}月`;
      
      if (monthName !== lastMonth) {
        // 限制间距在 3 列以上才渲染，避免相邻月份发生错乱重合
        if (colIdx - lastMonthColIdx >= 3 && colIdx < weeksCount - 1) {
          monthLabelsHtml += `<div class="absolute text-[10px] text-on-surface-variant/50 font-mono select-none whitespace-nowrap" style="left: calc(${colIdx} * (20px + 2px));">${monthName}</div>`;
          lastMonth = monthName;
          lastMonthColIdx = colIdx;
        }
      }
    });

    // 6. 生成日历格子网格
    let gridHtml = '';
    columns.forEach((colDates) => {
      let colCellsHtml = '';
      colDates.forEach((dateStr) => {
        const isFuture = dateStr > todayStr;
        const isBeforeStart = dateStr < '2025-05-01';
        
        if (isBeforeStart || isFuture) {
          // 超出统计时间范围的日期（前推补齐或今天以后的本周未来的剩余格子）：渲染为完全透明占位符，保证最后一列对齐且今天为最后一格
          colCellsHtml += `
            <div class="w-[20px] h-[20px] relative flex-shrink-0">
              <div class="w-[20px] h-[20px] rounded-[2px] bg-transparent pointer-events-none"></div>
            </div>
          `;
        } else {
          // 已经发生的日期，读取活跃度并分档着色
          const { val, additions, deletions, commits, commitsTracked, dateTracked, score } = this.getDayVal(dateStr);
          
          let level = 0;
          if (score > 0) {
            if (score <= quantiles.q25) level = 1;
            else if (score <= quantiles.q50) level = 2;
            else if (score <= quantiles.q75) level = 3;
            else level = 4;
          }

          // 像素级还原 GitHub 绿阶配色
          const bgClasses = [
            'bg-[#ebedf0] dark:bg-[#161b22] hover:scale-125 hover:z-10',
            'bg-[#9be9a8] dark:bg-[#0e4429] hover:scale-125 hover:z-10',
            'bg-[#40c463] dark:bg-[#006d32] hover:scale-125 hover:z-10',
            'bg-[#30a14e] dark:bg-[#26a641] hover:scale-125 hover:z-10',
            'bg-[#216e39] dark:bg-[#39d353] hover:scale-125 hover:z-10'
          ];

          const formattedVal = val.toLocaleString();
          // 提交次数：数据源中有 commits 字段则显示数值，否则为未统计（该数据批次未记录此字段）
          const commitsDisplay = commitsTracked
            ? `<strong>${commits}</strong> 次`
            : `<span style="opacity:0.45;font-style:italic;">未统计</span>`;
          // 代码变更：只要该天数据存在于数据源（dateTracked=true）就显示真实值（哪怕为0）
          // 若该天根本不在数据源中（dateTracked=false），才显示"未统计"
          const codeDisplay = dateTracked
            ? `<strong>${formattedVal}</strong> 行${val > 0 ? ` (新增 +${additions.toLocaleString()} / 删除 -${deletions.toLocaleString()})` : ''}`
            : `<span style="opacity:0.45;font-style:italic;">未统计</span>`;
          const detailText = `提交次数：${commitsDisplay}<br/>变更代码：${codeDisplay}`;


          colCellsHtml += `
            <div class="w-[20px] h-[20px] relative flex-shrink-0 flex items-center justify-center">
              <emu-tooltip style="display: flex; width: 20px; height: 20px; align-items: center; justify-content: center;">
                <div 
                  class="w-[20px] h-[20px] rounded-[2px] ${bgClasses[level]} cursor-pointer transition-all duration-200"
                  data-date="${dateStr}"
                ></div>
                <div slot="content" class="min-w-[180px] p-0.5 select-none">
                  <span class="block font-bold text-on-surface mb-1.5 font-mono text-[11px]">${dateStr}</span>
                  <span class="block text-on-surface-variant/90 text-[11px] leading-relaxed">${detailText}</span>
                </div>
              </emu-tooltip>
            </div>
          `;
        }
      });
      gridHtml += `<div class="flex flex-col gap-[2px]">${colCellsHtml}</div>`;
    });

    // 7. 更新 DOM 渲染与定位
    const monthsContainer = this.querySelector('#dialog-heatmap-months');
    if (monthsContainer) {
      monthsContainer.innerHTML = monthLabelsHtml;
    }

    const gridContainer = this.querySelector('#dialog-heatmap-grid');
    if (gridContainer) {
      gridContainer.innerHTML = gridHtml;
    }

    // 8. 更新底部简报数据
    const totalLinesEl = this.querySelector('#year-total-lines');
    if (totalLinesEl) {
      totalLinesEl.textContent = `${totalYearLines.toLocaleString()} 行`;
    }

    const totalCommitsEl = this.querySelector('#year-total-commits');
    if (totalCommitsEl) {
      totalCommitsEl.textContent = `${totalYearCommits.toLocaleString()} 次`;
    }

    const activeDaysEl = this.querySelector('#year-active-days');
    if (activeDaysEl) {
      activeDaysEl.textContent = `${activeDays} 天`;
    }

    const maxLinesEl = this.querySelector('#year-max-lines');
    if (maxLinesEl) {
      maxLinesEl.textContent = `${maxLines.toLocaleString()} 行${maxLinesDate ? ` (${maxLinesDate})` : ''}`;
    }
  }
}

customElements.define('emu-activity-heatmap', EmuActivityHeatmap);
