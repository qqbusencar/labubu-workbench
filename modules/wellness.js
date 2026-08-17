/* ============================================================
   模块二：养生打卡
   ============================================================ */

const Wellness = {
  // 无预设保健品：全部由用户手动添加

  // 反馈表情
  feedbackEmojis: ['😴 睡眠', '✨ 皮肤', '💪 体力', '🧠 心情', '🌸 气色', '💧 水分'],

  mount(container) {
    const today = DB.todayKey();
    const products = this.allProducts();
    const streak = DB.streakCount('wellness_records');
    const todayRecords = DB.filterByDate('wellness_records', today);
    const checkedToday = todayRecords.filter(r => r.checked).length;

    container.innerHTML = `
      <div class="page">
        ${Components.banner({
          module: 'wellness',
          title: '养生打卡',
          sub: '从内而外的温柔呵护',
          actions: `
            <button class="tag btn-soft" id="well-cal" title="日历">📅 日历</button>
            <button class="btn-primary" id="well-add" title="添加">＋ 添加保健品</button>
          `
        })}

        <div class="kitty-feature-card" style="margin-bottom:16px">
          <div class="kitty-portrait" style="background:linear-gradient(135deg,#ffd6e6,#ffc6d5)">${Utils.kittyImg({ size: 'small', module: 'wellness' })}</div>
          <div class="lfc-text">
            <div class="lfc-title">🌿 今日小提示</div>
            <div class="lfc-sub">${products.length ? `${products.length} 项保健品在守护你，按时打卡记得按时服用哦～` : '添加你的第一种保健品开始一天的健康管理吧～'}</div>
          </div>
        </div>

        <div class="card mb-16">
          <div class="flex-between mb-12">
            <div>
              <div class="card-title">
                <span class="card-title-ico">🌸</span>今日状态
              </div>
            </div>
            <div class="wellness-streak">
              <span>🔥</span><span>连续 ${streak} 天</span>
            </div>
          </div>
          <div class="progress-bar mb-8">
            <div class="progress-fill" style="width:${products.length ? (checkedToday / products.length * 100) : 0}%"></div>
          </div>
          <div class="text-sm text-muted text-center">
            已打卡 ${checkedToday} / ${products.length}
          </div>
        </div>

        ${products.length ? `
          <div class="wellness-batch">
            <button class="btn-ghost btn-primary text-sm" id="well-batch">一键全部打卡</button>
          </div>
        ` : ''}

        <div id="well-list">
          ${products.map((p, i) => this.renderProduct(p, today, i)).join('') || Components.empty({ icon: '🌿', title: '还没有保健品', sub: '点击右上角「＋ 添加保健品」手动添加你的健康小卫士', hero: true })}
        </div>

        <div class="card mt-16" style="position:relative">
          <div class="flex-between mb-12">
            <div class="card-title">
              <span class="card-title-ico">💖</span>今日身体反馈
            </div>
            <button class="btn-ghost btn-primary text-sm" id="well-feedback-add">+ 记录</button>
          </div>
          <div id="well-feedback-list"></div>
        </div>

        <div style="text-align:center;padding:16px;font-size:11px;color:var(--text-muted)">
          云端永久保存 · 服药请遵医嘱 🌿
        </div>
      </div>
    `;

    this.renderFeedbackList();
    this.bindEvents();
  },

  allProducts() {
    return DB.get('wellness_products', []);
  },

  renderProduct(p, today, idx) {
    const records = DB.filterByDate('wellness_records', today);
    const checked = records.find(r => r.productId === p._id && r.checked);
    return `
      <div class="wellness-product slide-up" style="animation-delay:${idx * 0.05}s">
        <div class="wellness-product-head">
          <div class="wellness-product-name">
            <span class="wellness-product-ico">${p.icon || '🌿'}</span>
            ${Utils.esc(p.name)}
          </div>
          <button class="btn-icon" data-edit="${p._id}" title="编辑">✏️</button>
        </div>
        <div class="wellness-product-meta">
          <span class="tag tag-mint">${Utils.esc(p.dosage || '按时服用')}</span>
          <span class="tag tag-blue">${Utils.esc(p.cycle || '每日')}</span>
        </div>
        ${p.note ? `<div class="wellness-product-note">${Utils.esc(p.note)}</div>` : ''}
        <div class="wellness-product-actions">
          <button class="wellness-checkin ${checked ? 'checked' : ''}" data-check="${p._id}">
            ${checked ? '✓ 今日已打卡' : '打卡'}
          </button>
          <button class="btn-icon" data-del="${p._id}" title="删除">🗑️</button>
        </div>
      </div>
    `;
  },

  renderFeedbackList() {
    const list = document.getElementById('well-feedback-list');
    if (!list) return;
    const today = DB.todayKey();
    const items = DB.filterByDate('wellness_feedback', today);
    if (!items.length) {
      list.innerHTML = '<div class="text-sm text-muted text-center" style="padding:12px">记录今天的身体感受吧～</div>';
      return;
    }
    list.innerHTML = items.map(f => `
      <div class="feedback-item">
        <div class="feedback-emoji">${f.emoji || '🌸'}</div>
        <div class="feedback-content">
          <div class="feedback-date">${f.time || ''} · ${f.tag || '记录'}</div>
          <div class="feedback-text">${Utils.esc(f.text || '')}</div>
        </div>
      </div>
    `).join('');
  },

  bindEvents() {
    const root = document.getElementById('app-main');
    const today = DB.todayKey();

    // 打卡
    root.querySelectorAll('[data-check]').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.dataset.check;
        const products = this.allProducts();
        const p = products.find(x => x._id === id);
        if (!p) return;
        const records = DB.filterByDate('wellness_records', today);
        const existing = records.find(r => r.productId === id && r.checked);

        if (existing) {
          DB.removeById('wellness_records', existing._id);
          Utils.toast('已取消打卡');
        } else {
          DB.push('wellness_records', {
            productId: id,
            productName: p.name,
            icon: p.icon,
            date: today,
            checked: true,
          });
          Utils.toast(`已打卡 ${p.name} 🌿`, 'success');
          Utils.burst(b, ['🌿', '💚', '✨', '🌟']);
        }
        this.mount(root);
      });
    });

    // 批量打卡
    document.getElementById('well-batch')?.addEventListener('click', () => {
      const products = this.allProducts();
      const records = DB.filterByDate('wellness_records', today);
      const checkedIds = new Set(records.filter(r => r.checked).map(r => r.productId));
      let count = 0;
      products.forEach(p => {
        if (!checkedIds.has(p._id)) {
          DB.push('wellness_records', {
            productId: p._id,
            productName: p.name,
            icon: p.icon,
            date: today,
            checked: true,
          });
          count++;
        }
      });
      Utils.toast(count ? `已批量打卡 ${count} 项 🌸` : '今日已全部打卡啦～', 'success');
      this.mount(root);
    });

    // 添加
    document.getElementById('well-add')?.addEventListener('click', async () => {
      const r = await Components.form({
        title: '添加保健品',
        fields: [
          { key: 'name', label: '名称', placeholder: '例如：维生素 D', required: true },
          { key: 'icon', label: '表情', value: '🌿' },
          { key: 'dosage', label: '剂量', placeholder: '例如：1片/次' },
          { key: 'cycle', label: '周期', placeholder: '例如：每日' },
          { key: 'note', label: '备注', type: 'textarea', placeholder: '服用时间、注意事项...' },
        ],
        okText: '添加',
      });
      if (r && r.name) {
        const products = DB.get('wellness_products', []);
        products.push({
          _id: Utils.uid(),
          name: r.name,
          icon: r.icon || '🌿',
          dosage: r.dosage || '',
          cycle: r.cycle || '每日',
          note: r.note || '',
        });
        DB.set('wellness_products', products);
        Utils.toast('已添加');
        this.mount(root);
      }
    });

    // 编辑
    root.querySelectorAll('[data-edit]').forEach(b => {
      b.addEventListener('click', async () => {
        const id = b.dataset.edit;
        const products = DB.get('wellness_products', []);
        const p = products.find(x => x._id === id);
        if (!p) return;
        const r = await Components.form({
          title: '编辑保健品',
          fields: [
            { key: 'name', label: '名称', value: p.name, required: true },
            { key: 'icon', label: '表情', value: p.icon },
            { key: 'dosage', label: '剂量', value: p.dosage || '' },
            { key: 'cycle', label: '周期', value: p.cycle || '每日' },
            { key: 'note', label: '备注', type: 'textarea', value: p.note || '' },
          ],
          okText: '保存',
        });
        if (r) {
          const idx = products.findIndex(x => x._id === id);
          products[idx] = { ...products[idx], ...r };
          DB.set('wellness_products', products);
          Utils.toast('已保存');
          this.mount(root);
        }
      });
    });

    // 删除
    root.querySelectorAll('[data-del]').forEach(b => {
      b.addEventListener('click', async () => {
        const id = b.dataset.del;
        const ok = await Components.confirm({
          title: '删除保健品',
          message: '确定要删除吗？打卡记录会保留。',
          okText: '删除',
          danger: true,
        });
        if (ok) {
          const products = DB.get('wellness_products', []);
          DB.set('wellness_products', products.filter(x => x._id !== id));
          Utils.toast('已删除');
          this.mount(root);
        }
      });
    });

    // 添加反馈
    document.getElementById('well-feedback-add')?.addEventListener('click', async () => {
      const r = await Components.form({
        title: '今日身体反馈',
        fields: [
          { key: 'tag', label: '类型', type: 'select', options: this.feedbackEmojis.map(e => ({ value: e, label: e })), required: true },
          { key: 'text', label: '记录内容', type: 'textarea', placeholder: '今天睡得不错，皮肤状态也好了～', required: true },
        ],
        okText: '保存',
      });
      if (r) {
        const [emoji, tag] = (r.tag || '🌸 记录').split(' ');
        DB.push('wellness_feedback', {
          date: DB.todayKey(),
          time: new Date().toTimeString().slice(0, 5),
          emoji,
          tag,
          text: r.text,
        });
        Utils.toast('已记录反馈 💖', 'success');
        this.mount(root);
      }
    });

    // 日历
    document.getElementById('well-cal')?.addEventListener('click', () => {
      this.showCalendar();
    });
  },

  showCalendar() {
    const records = DB.get('wellness_records', []);
    const checkedDays = [...new Set(records.filter(r => r.checked).map(r => r.date))];
    const today = new Date();
    let viewY = today.getFullYear();
    let viewM = today.getMonth() + 1;

    const body = document.createElement('div');

    const render = () => {
      body.innerHTML = `
        ${Components.calendar({ year: viewY, month: viewM, checkedDates: checkedDays })}
        <div style="text-align:center;font-size:12px;color:var(--text-muted);margin-top:12px">
          本月累计打卡 ${records.filter(r => r.checked && r.date.startsWith(`${viewY}-${String(viewM).padStart(2, '0')}`)).length} 次
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
      title: '养生打卡日历',
      body: '<div id="cal-body"></div>',
    });
    document.getElementById('cal-body').appendChild(body);
    render();
  },
};

window.Wellness = Wellness;