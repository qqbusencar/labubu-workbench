/* ============================================================
   模块一：健身打卡
   ============================================================ */

const Fitness = {
  state: {
    view: 'today', // today / week / month / calendar
  },

  // 无预设类别：全部由用户手动添加

  // 模拟 iOS 健身数据
  iosHealthData() {
    // 通过快捷指令 Webhook 同步 → 当前为本地模拟
    const seed = DB.todayKey();
    const stored = DB.get('ios_health_' + seed);
    if (stored) return stored;
    // 基于日期生成稳定但有变化的模拟数据
    const d = new Date();
    const baseSteps = 5000 + (d.getDate() * 137) % 4000;
    const data = {
      steps: baseSteps,
      calories: Math.floor(baseSteps * 0.045),
      duration: Math.floor(baseSteps / 110),
      distance: +(baseSteps / 1400).toFixed(2),
      source: 'iOS 健身 (模拟)',
      syncedAt: new Date().toISOString(),
    };
    DB.set('ios_health_' + seed, data);
    return data;
  },

  // 注入页面
  mount(container) {
    const today = DB.todayKey();
    const records = DB.filterByDate('fitness_records', today);
    const checkedToday = new Set(records.filter(r => r.checked).map(r => r.itemId));
    const ios = this.iosHealthData();
    const streak = DB.streakCount('fitness_records');

    // 计算今日数据
    const todayMinutes = records.filter(r => r.minutes).reduce((s, r) => s + (r.minutes || 0), 0);
    const todayCal = records.filter(r => r.calories).reduce((s, r) => s + (r.calories || 0), 0) + ios.calories;

    container.innerHTML = `
      <div class="page">
        ${Components.banner({
          module: 'fitness',
          title: '健身打卡',
          sub: '今天也要好好宠爱身体呀~',
          actions: `
            <button class="tag btn-soft" id="fit-cal" title="日历">📅 日历</button>
            <button class="tag btn-soft" id="fit-sync" title="同步 iOS">📲 同步</button>
            <button class="btn-primary" id="fit-add" title="添加项目">＋ 添加</button>
          `
        })}

        <div class="kitty-feature-card" style="margin-bottom:16px">
          <div class="kitty-portrait" style="background:linear-gradient(135deg,#c8e6c9,#b8d8e8)">${Utils.kittyImg({ size: 'small', scene: 'scooter' })}</div>
          <div class="lfc-text">
            <div class="lfc-title">🏃‍♀️ 一起动起来吧</div>
            <div class="lfc-sub">${streak >= 7 ? `已坚持 ${streak} 天，太棒啦！` : streak > 0 ? `已连续 ${streak} 天，继续加油哦` : '今天就开始你的第一个运动项目吧～'}</div>
          </div>
        </div>

        <div class="fitness-overview">
          <div class="fitness-stat float-anim" style="animation-delay:0s">
            <div class="stat-ico">👟</div>
            <div class="stat-value">${Utils.num(ios.steps)}</div>
            <div class="stat-label">步数</div>
          </div>
          <div class="fitness-stat float-anim" style="animation-delay:0.1s">
            <div class="stat-ico">🔥</div>
            <div class="stat-value">${Utils.num(todayCal)}</div>
            <div class="stat-label">千卡</div>
          </div>
          <div class="fitness-stat float-anim" style="animation-delay:0.2s">
            <div class="stat-ico">⏱️</div>
            <div class="stat-value">${todayMinutes + ios.duration}</div>
            <div class="stat-label">分钟</div>
          </div>
          <div class="fitness-stat float-anim" style="animation-delay:0.3s">
            <div class="stat-ico">🌟</div>
            <div class="stat-value">${streak}</div>
            <div class="stat-label">连续天</div>
          </div>
        </div>

        <div class="card mb-16" style="position:relative;overflow:visible">
          <div class="flex-between mb-12">
            <div class="card-title">
              <span class="card-title-ico">📊</span>运动趋势
            </div>
            <div class="flex gap-6">
              <button class="tag ${this.state.view === 'today' ? 'tag-pink' : ''}" data-fv="today">今日</button>
              <button class="tag ${this.state.view === 'week' ? 'tag-pink' : ''}" data-fv="week">本周</button>
            </div>
          </div>
          <div id="fit-chart" class="fitness-chart"></div>
        </div>

        <div class="card mb-16" style="position:relative;overflow:visible">
          <div class="flex-between mb-12">
            <div class="card-title">
              <span class="card-title-ico">🌸</span>今日打卡
            </div>
            <div class="text-sm text-muted" id="fit-progress-text">${checkedToday.size} / ${this.allItems().length}</div>
          </div>
          <div id="fit-today-list"></div>
        </div>

        <div class="card" style="position:relative;overflow:visible">
          <div class="card-title">
            <span class="card-title-ico">📈</span>统计概览
          </div>
          <div class="card-grid-3">
            <div class="card-soft text-center">
              <div class="text-2xl font-bold" style="color:var(--primary-deep)">${this.weekCount()}</div>
              <div class="text-sm text-muted">本周打卡</div>
            </div>
            <div class="card-soft text-center">
              <div class="text-2xl font-bold" style="color:var(--primary-deep)">${this.monthCount()}</div>
              <div class="text-sm text-muted">本月打卡</div>
            </div>
            <div class="card-soft text-center">
              <div class="text-2xl font-bold" style="color:var(--primary-deep)">${this.totalCount()}</div>
              <div class="text-sm text-muted">累计打卡</div>
          </div>
          </div>
        </div>

        <div style="text-align:center;padding:16px;font-size:11px;color:var(--text-muted)">
          数据来源：iOS 健身 + 手动记录 · 已云端同步 🌸
        </div>
      </div>
    `;

    this.renderTodayList();
    this.renderChart();
    this.bindEvents();
  },

  allItems() {
    return DB.get('fitness_custom_items', []);
  },

  renderTodayList() {
    const today = DB.todayKey();
    const records = DB.filterByDate('fitness_records', today);
    const checkedMap = {};
    records.forEach(r => { if (r.checked) checkedMap[r.itemId] = r; });

    const list = document.getElementById('fit-today-list');
    if (!list) return;

    const items = this.allItems();
    if (!items.length) {
      list.innerHTML = Components.empty({ icon: '🌸', title: '还没有运动项目', sub: '点击右上角「＋添加」手动添加你的运动类别吧～', hero: true });
      return;
    }

    list.innerHTML = items.map((item, i) => {
      const r = checkedMap[item._id];
      const isCheck = !!r;
      const icoClass = this.iconClass(item.icon);
      return `
        <div class="fitness-item slide-up" style="animation-delay:${i * 0.04}s" data-id="${item._id}">
          <div class="fitness-item-info">
            <div class="fitness-item-ico ${icoClass}">${item.icon || '🌸'}</div>
            <div>
              <div class="fitness-item-name">${Utils.esc(item.name)}</div>
              <div class="fitness-item-meta">${item.goal ? `目标 ${item.goal}${item.unit || '分钟'}` : '随时开始'}</div>
            </div>
          </div>
          <button class="btn-icon" data-del="${item._id}" title="删除">🗑️</button>
          <button class="checkin-btn ${isCheck ? 'btn-pink btn-primary' : 'btn-ghost btn-primary'}" data-check="${item._id}" style="min-width:72px;padding:6px 14px;font-size:12px">
            ${isCheck ? '✓ 已打卡' : '打卡'}
          </button>
        </div>
      `;
    }).join('');
  },

  iconClass(icon) {
    if (!icon) return 'fitness-ico-default';
    if (icon.includes('瑜伽')) return 'fitness-ico-yoga';
    if (icon.includes('跑') || icon.includes('走') || icon.includes('步')) return 'fitness-ico-run';
    if (icon.includes('舞') || icon.includes('跳')) return 'fitness-ico-dance';
    if (icon.includes('力') || icon.includes('拳')) return 'fitness-ico-strength';
    return 'fitness-ico-default';
  },

  renderChart() {
    const el = document.getElementById('fit-chart');
    if (!el) return;
    if (this.state.view === 'today') {
      // 今日累计分钟数 / 卡路里
      const today = DB.todayKey();
      const records = DB.filterByDate('fitness_records', today);
      const items = records.length ? records : [{ minutes: 0, calories: 0 }];
      el.innerHTML = Utils.barChart(
        items.map((r, i) => ({
          value: r.minutes || 0,
          label: (r.itemName || '项目').slice(0, 3),
          color: ['#b497d6', '#ffc6d5', '#b8d8e8', '#c8e6c9', '#ffd8b5'][i % 5],
        })),
        { width: 320, height: 120 }
      );
    } else {
      // 本周每天
      const days = DB.lastNDays(7);
      const data = days.map(d => {
        const recs = DB.filterByDate('fitness_records', d);
        const total = recs.reduce((s, r) => s + (r.minutes || 0), 0);
        return { value: total, label: d.slice(-2) + '日' };
      });
      el.innerHTML = Utils.barChart(data, { width: 320, height: 120 });
    }
  },

  bindEvents() {
    const root = document.getElementById('app-main');

    // 视图切换
    root.querySelectorAll('[data-fv]').forEach(b => {
      b.addEventListener('click', () => {
        this.state.view = b.dataset.fv;
        this.mount(root);
      });
    });

    // 打卡
    root.querySelectorAll('[data-check]').forEach(b => {
      b.addEventListener('click', async () => {
        const id = b.dataset.check;
        const item = this.allItems().find(x => x._id === id);
        if (!item) return;
        const today = DB.todayKey();
        const records = DB.filterByDate('fitness_records', today);
        const exists = records.find(r => r.itemId === id && r.checked);

        if (exists) {
          // 取消
          DB.removeById('fitness_records', exists._id);
          Utils.toast('已取消打卡');
        } else {
          // 输入时长 / 卡路里
          const r = await Components.form({
            title: `打卡 · ${item.name}`,
            fields: [
              { key: 'minutes', label: '运动时长（分钟）', type: 'number', placeholder: '30', value: item.goal || 30, required: true },
              { key: 'calories', label: '消耗卡路里（千卡）', type: 'number', placeholder: '120', value: 120 },
            ],
            okText: '完成打卡 ✓',
          });
          if (r) {
            DB.push('fitness_records', {
              itemId: id,
              itemName: item.name,
              icon: item.icon,
              minutes: parseInt(r.minutes) || 0,
              calories: parseInt(r.calories) || 0,
              date: today,
              checked: true,
            });
            Utils.toast('打卡成功 🌸', 'success');
            Utils.burst(b, ['🌸', '💖', '✨', '🌟']);
            this.mount(root);
          }
        }
      });
    });

    // 删除自定义
    root.querySelectorAll('[data-del]').forEach(b => {
      b.addEventListener('click', async () => {
        const id = b.dataset.del;
        const ok = await Components.confirm({
          title: '删除运动项目',
          message: '删除后将无法恢复，确定要删除吗？',
          okText: '删除',
          danger: true,
        });
        if (ok) {
          const items = DB.get('fitness_custom_items', []);
          DB.set('fitness_custom_items', items.filter(x => x._id !== id));
          Utils.toast('已删除');
          this.mount(root);
        }
      });
    });

    // 添加自定义
    document.getElementById('fit-add')?.addEventListener('click', async () => {
      const r = await Components.form({
        title: '添加自定义运动项目',
        fields: [
          { key: 'name', label: '项目名称', placeholder: '例如：普拉提', required: true },
          { key: 'icon', label: '表情图标', placeholder: '🧘‍♀️', value: '🌸' },
          { key: 'goal', label: '目标时长（分钟）', type: 'number', placeholder: '30', value: 30 },
        ],
        okText: '添加',
      });
      if (r && r.name) {
        const items = DB.get('fitness_custom_items', []);
        items.push({
          _id: Utils.uid(),
          name: r.name,
          icon: r.icon || '🌸',
          goal: parseInt(r.goal) || 30,
          type: 'custom',
        });
        DB.set('fitness_custom_items', items);
        Utils.toast('已添加新项目');
        this.mount(root);
      }
    });

    // 日历视图
    document.getElementById('fit-cal')?.addEventListener('click', () => {
      this.showCalendar();
    });

    // iOS 同步
    document.getElementById('fit-sync')?.addEventListener('click', () => {
      const seed = DB.todayKey();
      DB.remove('ios_health_' + seed);
      Utils.toast('正在重新同步 iOS 健身数据...');
      setTimeout(() => {
        this.mount(root);
        Utils.toast('同步完成 ✓', 'success');
      }, 800);
    });
  },

  showCalendar() {
    const records = DB.get('fitness_records', []);
    const checkedDays = [...new Set(records.filter(r => r.checked).map(r => r.date))];
    const today = new Date();
    let viewY = today.getFullYear();
    let viewM = today.getMonth() + 1;
    let viewRecords = [...records];

    const render = () => {
      body.innerHTML = `
        ${Components.calendar({ year: viewY, month: viewM, checkedDates: checkedDays })}
        <div style="margin-top:12px;text-align:center;font-size:12px;color:var(--text-muted)">
          过去 30 天打卡 ${checkedDays.length} 天
        </div>
        <div style="margin-top:12px;max-height:240px;overflow-y:auto">
          ${viewRecords.filter(r => r.date.startsWith(`${viewY}-${String(viewM).padStart(2, '0')}`)).map(r => `
            <div class="fitness-item" style="margin-bottom:6px">
              <div class="fitness-item-info">
                <div class="fitness-item-ico fitness-ico-default">${r.icon || '🌸'}</div>
                <div>
                  <div class="fitness-item-name">${Utils.esc(r.itemName)}</div>
                  <div class="fitness-item-meta">${r.date} · ${r.minutes || 0} 分钟</div>
                </div>
              </div>
            </div>
          `).join('') || '<div class="empty-state"><span class="empty-ico">🌸</span><div class="empty-title">本月还没有记录</div></div>'}
        </div>
      `;
      body.querySelectorAll('[data-nav]').forEach(b => {
        b.addEventListener('click', () => {
          if (b.dataset.nav === 'prev') viewM--;
          else viewM++;
          if (viewM < 1) { viewM = 12; viewY--; }
          if (viewM > 12) { viewM = 1; viewY++; }
          render();
        });
      });
    };

    const m = Components.modal({
      title: '打卡日历',
      body: '<div id="cal-body"></div>',
    });
    const body = document.getElementById('cal-body');
    render();
  },

  weekCount() {
    const days = DB.lastNDays(7);
    const records = DB.get('fitness_records', []);
    return records.filter(r => days.includes(r.date) && r.checked).length;
  },

  monthCount() {
    const today = new Date();
    const monthPrefix = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    return DB.get('fitness_records', []).filter(r => r.date.startsWith(monthPrefix) && r.checked).length;
  },

  totalCount() {
    return DB.get('fitness_records', []).filter(r => r.checked).length;
  },
};

window.Fitness = Fitness;