/* ============================================================
   通用 UI 组件 — Modal / Empty / Labubu 等
   ============================================================ */

const Components = {
  // Modal
  modal({ title, body, footer, onClose }) {
    const root = document.getElementById('modal-root');
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">${Utils.esc(title)}</div>
          <button class="modal-close">×</button>
        </div>
        <div class="modal-body">${body}</div>
        ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
      </div>
    `;
    const close = () => {
      wrap.style.animation = 'backdrop-fade 0.2s ease reverse';
      setTimeout(() => wrap.remove(), 180);
      if (onClose) onClose();
    };
    wrap.querySelector('.modal-close').addEventListener('click', close);
    wrap.addEventListener('click', (e) => {
      if (e.target === wrap) close();
    });
    root.appendChild(wrap);
    return { wrap, close };
  },

  // 确认弹窗
  confirm({ title = '确认操作', message, okText = '确定', cancelText = '取消', onOk, onCancel, danger }) {
    return new Promise((resolve) => {
      const m = this.modal({
        title,
        body: `<p style="margin:8px 0 4px;color:var(--text-primary);font-size:14px;line-height:1.6">${Utils.esc(message)}</p>`,
        footer: `
          <button class="btn-ghost btn-primary" data-act="cancel">${Utils.esc(cancelText)}</button>
          <button class="btn-primary ${danger ? 'btn-pink' : ''}" data-act="ok">${Utils.esc(okText)}</button>
        `,
      });
      m.wrap.querySelector('[data-act="ok"]').addEventListener('click', () => {
        if (onOk) onOk();
        m.close();
        resolve(true);
      });
      m.wrap.querySelector('[data-act="cancel"]').addEventListener('click', () => {
        if (onCancel) onCancel();
        m.close();
        resolve(false);
      });
    });
  },

  // 提示输入弹窗
  prompt({ title = '请输入', placeholder = '', defaultValue = '', okText = '确定', cancelText = '取消', type = 'text' }) {
    return new Promise((resolve) => {
      const inputId = 'prompt_' + Utils.uid();
      const m = this.modal({
        title,
        body: `<input id="${inputId}" type="${type}" class="input" placeholder="${Utils.esc(placeholder)}" value="${Utils.esc(defaultValue)}" />`,
        footer: `
          <button class="btn-ghost btn-primary" data-act="cancel">${Utils.esc(cancelText)}</button>
          <button class="btn-primary" data-act="ok">${Utils.esc(okText)}</button>
        `,
      });
      const input = m.wrap.querySelector('#' + inputId);
      setTimeout(() => input.focus(), 100);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          m.wrap.querySelector('[data-act="ok"]').click();
        }
      });
      m.wrap.querySelector('[data-act="ok"]').addEventListener('click', () => {
        const v = input.value.trim();
        m.close();
        resolve(v);
      });
      m.wrap.querySelector('[data-act="cancel"]').addEventListener('click', () => {
        m.close();
        resolve(null);
      });
    });
  },

  // 多字段表单弹窗
  form({ title, fields, okText = '保存', cancelText = '取消' }) {
    return new Promise((resolve) => {
      const fieldHtml = fields.map((f) => {
        if (f.type === 'select') {
          return `<div class="mb-12">
            <label style="display:block;font-size:12px;color:var(--text-secondary);margin-bottom:4px">${Utils.esc(f.label)}</label>
            <select class="select" data-key="${Utils.esc(f.key)}" ${f.required ? 'required' : ''}>
              ${f.options.map(o => `<option value="${Utils.esc(o.value)}">${Utils.esc(o.label)}</option>`).join('')}
            </select>
          </div>`;
        } else if (f.type === 'textarea') {
          return `<div class="mb-12">
            <label style="display:block;font-size:12px;color:var(--text-secondary);margin-bottom:4px">${Utils.esc(f.label)}</label>
            <textarea class="textarea" data-key="${Utils.esc(f.key)}" placeholder="${Utils.esc(f.placeholder || '')}">${Utils.esc(f.value || '')}</textarea>
          </div>`;
        } else if (f.type === 'date') {
          return `<div class="mb-12">
            <label style="display:block;font-size:12px;color:var(--text-secondary);margin-bottom:4px">${Utils.esc(f.label)}</label>
            <input type="date" class="input" data-key="${Utils.esc(f.key)}" value="${Utils.esc(f.value || '')}" />
          </div>`;
        } else if (f.type === 'number') {
          return `<div class="mb-12">
            <label style="display:block;font-size:12px;color:var(--text-secondary);margin-bottom:4px">${Utils.esc(f.label)}</label>
            <input type="number" class="input" data-key="${Utils.esc(f.key)}" placeholder="${Utils.esc(f.placeholder || '')}" value="${Utils.esc(f.value || '')}" />
          </div>`;
        } else {
          return `<div class="mb-12">
            <label style="display:block;font-size:12px;color:var(--text-secondary);margin-bottom:4px">${Utils.esc(f.label)}</label>
            <input type="${f.type || 'text'}" class="input" data-key="${Utils.esc(f.key)}" placeholder="${Utils.esc(f.placeholder || '')}" value="${Utils.esc(f.value || '')}" />
          </div>`;
        }
      }).join('');
      const m = this.modal({
        title,
        body: fieldHtml,
        footer: `
          <button class="btn-ghost btn-primary" data-act="cancel">${Utils.esc(cancelText)}</button>
          <button class="btn-primary" data-act="ok">${Utils.esc(okText)}</button>
        `,
      });
      const firstInput = m.wrap.querySelector('input, textarea, select');
      setTimeout(() => firstInput && firstInput.focus(), 100);
      m.wrap.querySelector('[data-act="ok"]').addEventListener('click', () => {
        const result = {};
        let valid = true;
        m.wrap.querySelectorAll('[data-key]').forEach((el) => {
          const k = el.dataset.key;
          const field = fields.find(x => x.key === k);
          if (field && field.required && !el.value.trim()) {
            valid = false;
            el.style.borderColor = '#f44';
          }
          result[k] = el.value.trim();
        });
        if (!valid) {
          Utils.toast('请填写完整哦～', 'warning');
          return;
        }
        m.close();
        resolve(result);
      });
      m.wrap.querySelector('[data-act="cancel"]').addEventListener('click', () => {
        m.close();
        resolve(null);
      });
    });
  },

  // 空状态
  empty({ icon = '🌸', title = '还没有内容哦～', sub = '添加一条记录开始记录吧', hero = false, module = 'default' }) {
    if (hero) {
      return `
        <div class="empty-kitty-hero">
          <div class="kitty-portrait">${Utils.kittyImg({ size: 'small', module, backup: true })}</div>
          <span class="empty-ico" style="font-size:26px;margin-top:14px">${icon}</span>
          <div class="empty-title">${Utils.esc(title)}</div>
          <div class="empty-sub">${Utils.esc(sub)}</div>
        </div>
      `;
    }
    return `
      <div class="empty-state">
        <div class="empty-kitty float-anim">${Utils.kittyImg({ size: 'small', module, backup: true })}</div>
        <span class="empty-ico">${icon}</span>
        <div class="empty-title">${Utils.esc(title)}</div>
        <div class="empty-sub">${Utils.esc(sub)}</div>
      </div>
    `;
  },

  // 模块页头大图横幅（替代传统的 page-header）
  banner({ module = 'fitness', title = '', sub = '', actions = '' }) {
    const iconMap = {
      fitness: { ico: '🧘‍♀️', label: '健身打卡' },
      wellness: { ico: '🌿', label: '养生打卡' },
      study: { ico: '📚', label: '学习收获' },
      fortune: { ico: '🌙', label: '每日运势' },
      news: { ico: '📰', label: '信息资讯' },
      bookkeeping: { ico: '💰', label: '每日记账' },
    };
    const meta = iconMap[module] || {};
    return `
      <div class="module-banner banner-${module}">
        <div class="module-banner-text">
          <div class="page-title">${meta.ico || ''} ${Utils.esc(title || meta.label || '')}</div>
          <div class="page-sub">${Utils.esc(sub)}</div>
          ${actions ? `<div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">${actions}</div>` : ''}
        </div>
        <div class="module-banner-art">${Utils.kittyImg({ size: 'small', module })}</div>
      </div>
    `;
  },

  // 特性卡片（横排 + 立绘 + 文案）
  featureCard({ title = '', sub = '', icon = '🌸', actions = '', module = 'default' }) {
    return `
      <div class="kitty-feature-card">
        <div class="kitty-portrait">${Utils.kittyImg({ size: 'small', module })}</div>
        <div class="lfc-text">
          <div class="lfc-title">${icon} ${Utils.esc(title)}</div>
          <div class="lfc-sub">${Utils.esc(sub)}</div>
          ${actions ? `<div style="margin-top:8px">${actions}</div>` : ''}
        </div>
      </div>
    `;
  },

  // 漂浮小立绘（嵌进卡片角落）
  floatingKitty(module = 'default') {
    return `<div class="floating-kitty">${Utils.kittyImg({ size: 'tiny', module })}</div>`;
  },

  // 加载中
  loading({ text = 'Hello Kitty 正在努力加载...' } = {}) {
    return `<div class="flex flex-center gap-8" style="padding:32px">
      <div class="loading"></div>
      <span style="font-size:13px;color:var(--text-muted)">${Utils.esc(text)}</span>
    </div>`;
  },

  // 日历组件
  calendar({ year, month, checkedDates = [], onPick, onMonthChange }) {
    const today = new Date();
    const y = year || today.getFullYear();
    const m = month || today.getMonth() + 1;
    const firstDay = new Date(y, m - 1, 1);
    const lastDay = new Date(y, m, 0);
    const startWeek = firstDay.getDay();
    const totalDays = lastDay.getDate();
    const todayKey = Utils.formatDate(today);

    let cells = '';
    // 上月占位
    const prevLast = new Date(y, m - 1, 0).getDate();
    for (let i = startWeek - 1; i >= 0; i--) {
      cells += `<div class="cal-day muted">${prevLast - i}</div>`;
    }
    // 当月
    for (let d = 1; d <= totalDays; d++) {
      const dk = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = dk === todayKey;
      const checked = checkedDates.includes(dk);
      cells += `<div class="cal-day ${isToday ? 'today' : ''} ${checked ? 'checked' : ''}" data-date="${dk}">${d}</div>`;
    }
    // 下月占位
    const remaining = (7 - ((startWeek + totalDays) % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      cells += `<div class="cal-day muted">${d}</div>`;
    }

    return `
      <div class="calendar">
        <div class="cal-header">
          <button class="cal-nav" data-nav="prev">‹</button>
          <div class="cal-title">${y}年${m}月</div>
          <button class="cal-nav" data-nav="next">›</button>
        </div>
        <div class="cal-weekdays">
          ${['日', '一', '二', '三', '四', '五', '六'].map(w => `<div class="cal-weekday">${w}</div>`).join('')}
        </div>
        <div class="cal-days">${cells}</div>
      </div>
    `;
  },
};

window.Components = Components;