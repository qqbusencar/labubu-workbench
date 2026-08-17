/* ============================================================
   Labubu 治愈工作台 — 主应用控制器
   ============================================================ */

const App = {
  currentPage: 'fitness',

  init() {
    this.setupTheme();
    this.setupPassword();
    this.setupNav();
    this.setupHeader();
    this.setupMore();
    this.setupShortcuts();

    // 默认页面
    this.go(this.currentPage);

    // 暴露给开发使用
    window.Labubu = {
      DB,
      Utils,
      Components,
      Fitness,
      Wellness,
      Study,
      Fortune,
      News,
      App,
    };
  },

  // 主题切换
  setupTheme() {
    const apply = (theme) => {
      document.body.dataset.theme = theme;
      DB.set('settings', { ...(DB.get('settings', {})), theme });
      document.querySelectorAll('[id$="-theme-toggle"]').forEach(b => {
        b.textContent = theme === 'dark' ? '☀️' : '🌗';
      });
    };

    const settings = DB.get('settings', {});
    apply(settings.theme || 'light');

    document.getElementById('mobile-theme-toggle')?.addEventListener('click', () => {
      apply(document.body.dataset.theme === 'dark' ? 'light' : 'dark');
    });
    document.getElementById('pc-theme-toggle')?.addEventListener('click', () => {
      apply(document.body.dataset.theme === 'dark' ? 'light' : 'dark');
    });
  },

  // 密码锁
  setupPassword() {
    const lockScreen = document.getElementById('lock-screen');
    const settings = DB.get('settings', {});
    const stored = DB.get('password');

    if (!stored) {
      // 首次访问 → 直接进入（无密码状态）
      lockScreen.classList.add('hidden');
      return;
    }

    lockScreen.classList.remove('hidden');

    const tryUnlock = () => {
      const v = document.getElementById('lock-password').value;
      if (v === stored) {
        lockScreen.classList.add('hidden');
        Utils.toast('欢迎回来～ 💖', 'success');
      } else {
        document.getElementById('lock-error').classList.remove('hidden');
        const input = document.getElementById('lock-password');
        input.value = '';
        input.focus();
        setTimeout(() => document.getElementById('lock-error').classList.add('hidden'), 2000);
      }
    };

    document.getElementById('lock-unlock').addEventListener('click', tryUnlock);
    document.getElementById('lock-password').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') tryUnlock();
    });
    document.getElementById('lock-skip')?.addEventListener('click', () => {
      lockScreen.classList.add('hidden');
    });
  },

  // 路由
  setupNav() {
    document.querySelectorAll('[data-page]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        this.go(el.dataset.page);
        // 关闭移动端菜单
        document.getElementById('mobile-more-menu')?.classList.add('hidden');
      });
    });
  },

  // 顶部栏
  setupHeader() {
    const greet = document.getElementById('mobile-greet');
    const date = document.getElementById('mobile-date');
    if (greet) greet.textContent = Utils.greeting();
    if (date) date.textContent = Utils.formatToday();

    // 导出按钮
    document.getElementById('pc-export')?.addEventListener('click', () => this.exportData());
    document.getElementById('mobile-more-menu')?.querySelector('[data-action="export"]')?.addEventListener('click', () => {
      document.getElementById('mobile-more-menu').classList.add('hidden');
      this.exportData();
    });

    // 密码锁按钮
    document.getElementById('pc-lock')?.addEventListener('click', () => this.setupPasswordDialog());
    document.getElementById('mobile-more-menu')?.querySelector('[data-action="lock"]')?.addEventListener('click', () => {
      document.getElementById('mobile-more-menu').classList.add('hidden');
      this.setupPasswordDialog();
    });
  },

  // 更多菜单
  setupMore() {
    const menu = document.getElementById('mobile-more-menu');
    document.getElementById('mobile-more')?.addEventListener('click', () => {
      menu.classList.toggle('hidden');
    });

    // 主题切换
    menu?.querySelector('[data-action="theme"]')?.addEventListener('click', () => {
      menu.classList.add('hidden');
      const cur = document.body.dataset.theme;
      document.body.dataset.theme = cur === 'dark' ? 'light' : 'dark';
      DB.set('settings', { ...(DB.get('settings', {})), theme: document.body.dataset.theme });
      document.querySelectorAll('[id$="-theme-toggle"]').forEach(b => {
        b.textContent = document.body.dataset.theme === 'dark' ? '☀️' : '🌗';
      });
    });

    // 关于
    menu?.querySelector('[data-action="about"]')?.addEventListener('click', () => {
      menu.classList.add('hidden');
      Components.modal({
        title: '关于 Labubu 治愈工作台',
        body: `
          <div class="text-center mb-16">
            ${Utils.labubuSvg({ size: 100 })}
          </div>
          <p style="line-height:1.7;color:var(--text-secondary);font-size:14px">
            这是为热爱生活的你打造的<strong style="color:var(--primary-deep)">全能自律工作台</strong>。
            集健身打卡、养生打卡、学习收获、每日运势、信息资讯于一体，
            拥有 Labubu 治愈梦幻风的视觉体验，所有数据云端同步。
          </p>
          <div class="mt-12 text-sm text-muted">
            <div>版本：V1.0.0 · 全程 WorkBuddy 设计 + 开发</div>
            <div class="mt-4">每日内容：沪教牛津版 · 数据来源：模拟</div>
          </div>
        `,
      });
    });

    // 点击外部关闭
    document.addEventListener('click', (e) => {
      if (!menu?.contains(e.target) && !document.getElementById('mobile-more')?.contains(e.target)) {
        menu?.classList.add('hidden');
      }
    });
  },

  // 快捷键
  setupShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Esc 关闭 modal
      if (e.key === 'Escape') {
        document.querySelector('.modal-backdrop')?.remove();
      }
      // 数字键切换 tab
      if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.target.matches('input, textarea, select')) {
        const map = { '1': 'fitness', '2': 'wellness', '3': 'study', '4': 'fortune', '5': 'news' };
        if (map[e.key]) this.go(map[e.key]);
      }
    });
  },

  // 切换页面
  go(page) {
    this.currentPage = page;
    document.querySelectorAll('[data-page]').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });
    const main = document.getElementById('app-main');
    main.scrollTop = 0;
    switch (page) {
      case 'fitness': Fitness.mount(main); break;
      case 'wellness': Wellness.mount(main); break;
      case 'study': Study.mount(main); break;
      case 'fortune': Fortune.mount(main); break;
      case 'news': News.mount(main); break;
    }
    // 更新 hash
    if (history.pushState) history.replaceState(null, '', '#' + page);
  },

  // 导出数据
  exportData() {
    const data = DB.exportAll();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `labubu-backup-${DB.todayKey()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    Utils.toast('已导出全部数据 🌸', 'success');
  },

  // 导入数据
  importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          const count = DB.importAll(data);
          Utils.toast(`已导入 ${count} 项数据 💖`, 'success');
          this.go(this.currentPage);
        } catch (err) {
          Utils.toast('文件格式错误', 'error');
        }
      };
      reader.readAsText(file);
    });
    input.click();
  },

  // 密码设置
  setupPasswordDialog() {
    const stored = DB.get('password');
    const isSet = !!stored;
    Components.modal({
      title: isSet ? '修改密码锁' : '设置密码锁',
      body: `
        <p class="mb-12 text-sm text-secondary">
          ${isSet ? '请先输入旧密码' : '设置一个 4-12 位密码，下次进入时需要解锁'}
        </p>
        ${isSet ? `
          <label class="text-sm text-secondary mb-4" style="display:block">旧密码</label>
          <input id="old-pwd" type="password" class="input mb-12" placeholder="旧密码" />
        ` : ''}
        <label class="text-sm text-secondary mb-4" style="display:block">新密码</label>
        <input id="new-pwd" type="password" class="input mb-12" placeholder="4-12 位" />
        <label class="text-sm text-secondary mb-4" style="display:block">确认密码</label>
        <input id="new-pwd2" type="password" class="input" placeholder="再次输入" />
      `,
      footer: `
        ${isSet ? `<button class="btn-link" data-act="clear">清除密码</button>` : ''}
        <button class="btn-ghost btn-primary" data-act="cancel">取消</button>
        <button class="btn-primary" data-act="ok">保存</button>
      `,
    });
    const m = document.querySelector('.modal-backdrop');
    m.querySelector('[data-act="cancel"]').addEventListener('click', () => m.remove());
    m.querySelector('[data-act="clear"]')?.addEventListener('click', () => {
      const v = m.querySelector('#old-pwd').value;
      if (v === stored) {
        DB.remove('password');
        Utils.toast('密码已清除');
        m.remove();
      } else {
        Utils.toast('旧密码错误', 'error');
      }
    });
    m.querySelector('[data-act="ok"]').addEventListener('click', () => {
      const old = m.querySelector('#old-pwd')?.value;
      const v1 = m.querySelector('#new-pwd').value;
      const v2 = m.querySelector('#new-pwd2').value;
      if (isSet && old !== stored) return Utils.toast('旧密码错误', 'error');
      if (v1.length < 4 || v1.length > 12) return Utils.toast('密码长度需 4-12 位', 'warning');
      if (v1 !== v2) return Utils.toast('两次密码不一致', 'warning');
      DB.set('password', v1);
      Utils.toast('密码已保存，下次进入需要解锁', 'success');
      m.remove();
    });
  },
};

// 启动
document.addEventListener('DOMContentLoaded', () => App.init());