/* ============================================================
   工具函数
   ============================================================ */

const Utils = {
  // 限频节流
  debounce(fn, wait = 300) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  },

  // HTML 转义
  esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  // 数字千分位
  num(n) {
    if (n === null || n === undefined) return '0';
    return Number(n).toLocaleString('zh-CN');
  },

  // 问候语
  greeting() {
    const h = new Date().getHours();
    if (h < 6) return '夜深了，早点休息哦～';
    if (h < 9) return '早安，新的一天开始啦～';
    if (h < 12) return '上午好，专注时光～';
    if (h < 14) return '中午啦，记得午休～';
    if (h < 18) return '下午好，加油呀～';
    if (h < 22) return '晚上好，今天辛苦啦～';
    return '夜深了，别太累～';
  },

  // 日期格式化
  formatDate(d, fmt = 'YYYY-MM-DD') {
    const date = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
    const Y = date.getFullYear();
    const M = String(date.getMonth() + 1).padStart(2, '0');
    const D = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return fmt
      .replace('YYYY', Y)
      .replace('MM', M)
      .replace('DD', D)
      .replace('HH', h)
      .replace('mm', m);
  },

  formatToday() {
    const d = new Date();
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    return `${d.getMonth() + 1}月${d.getDate()}日 · 周${weekdays[d.getDay()]}`;
  },

  // 时间间隔
  fromNow(ts) {
    const diff = Date.now() - ts;
    const s = Math.floor(diff / 1000);
    if (s < 60) return '刚刚';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}分钟前`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}小时前`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}天前`;
    return this.formatDate(ts, 'YYYY-MM-DD');
  },

  // 随机 ID
  uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  },

  // Toast
  toast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const t = document.createElement('div');
    t.className = 'toast';
    if (type === 'success') t.style.background = 'rgba(165, 214, 167, 0.95)';
    if (type === 'error') t.style.background = 'rgba(244, 67, 54, 0.9)';
    if (type === 'warning') t.style.background = 'rgba(255, 167, 38, 0.92)';
    t.textContent = msg;
    container.appendChild(t);
    setTimeout(() => {
      t.style.transition = 'all 0.3s';
      t.style.opacity = '0';
      t.style.transform = 'translateY(-10px)';
      setTimeout(() => t.remove(), 300);
    }, 2400);
  },

  // 渲染 SVG Labubu
  labubuSvg(opts = {}) {
    const {
      size = 80,
      pose = 'stand',  // stand / book / meditate / cheer
      primary = '#fff8fb',
      eye = '#7c5ba6',
    } = opts;
    const id = 'eye_' + Math.random().toString(36).slice(2, 9);
    let body = '';
    if (pose === 'book') {
      body = `
        <rect x="70" y="155" width="60" height="38" rx="3" fill="#b497d6" stroke="#7c5ba6" stroke-width="1.5"/>
        <rect x="73" y="158" width="54" height="32" rx="2" fill="#fff"/>
        <line x1="100" y1="155" x2="100" y2="193" stroke="#7c5ba6" stroke-width="1"/>
      `;
    } else if (pose === 'meditate') {
      body = `
        <ellipse cx="50" cy="180" rx="20" ry="6" fill="rgba(217,194,236,0.4)"/>
        <circle cx="50" cy="180" r="5" fill="#ffc6d5" opacity="0.5"/>
      `;
    } else if (pose === 'cheer') {
      body = `
        <path d="M35 130 Q40 110 50 115" stroke="${primary}" stroke-width="8" fill="none" stroke-linecap="round"/>
        <circle cx="45" cy="100" r="3" fill="#ffc6d5"/>
      `;
    }
    return `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size * 1.1}">
      <defs>
        <radialGradient id="${id}" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#b497d6"/>
          <stop offset="100%" stop-color="${eye}"/>
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="170" rx="55" ry="40" fill="${primary}"/>
      <path d="M70 150 Q100 140 130 150 L135 200 Q100 210 65 200 Z" fill="#a8c3e0"/>
      <path d="M88 145 L88 200 M112 145 L112 200" stroke="#7da2c9" stroke-width="2" fill="none"/>
      <circle cx="95" cy="155" r="3" fill="#f7d4e3"/>
      <circle cx="105" cy="155" r="3" fill="#f7d4e3"/>
      <ellipse cx="100" cy="100" rx="60" ry="55" fill="${primary}"/>
      <ellipse cx="55" cy="55" rx="14" ry="28" fill="${primary}" transform="rotate(-20 55 55)"/>
      <ellipse cx="145" cy="55" rx="14" ry="28" fill="${primary}" transform="rotate(20 145 55)"/>
      <ellipse cx="58" cy="60" rx="7" ry="16" fill="#ffd5e4" transform="rotate(-20 58 60)"/>
      <ellipse cx="142" cy="60" rx="7" ry="16" fill="#ffd5e4" transform="rotate(20 142 60)"/>
      <g fill="#fff">
        <path d="M60 40 L65 50 L70 40 Z"/>
        <path d="M130 40 L135 50 L140 40 Z"/>
      </g>
      <ellipse cx="65" cy="115" rx="10" ry="6" fill="#ffc6d5" opacity="0.8"/>
      <ellipse cx="135" cy="115" rx="10" ry="6" fill="#ffc6d5" opacity="0.8"/>
      <ellipse cx="80" cy="100" rx="11" ry="14" fill="url(#${id})"/>
      <ellipse cx="120" cy="100" rx="11" ry="14" fill="url(#${id})"/>
      <circle cx="83" cy="95" r="3" fill="#fff"/>
      <circle cx="123" cy="95" r="3" fill="#fff"/>
      <circle cx="78" cy="105" r="1.5" fill="#fff"/>
      <circle cx="118" cy="105" r="1.5" fill="#fff"/>
      <path d="M90 130 Q100 138 110 130" stroke="#a87cae" stroke-width="2" fill="none" stroke-linecap="round"/>
      ${body}
    </svg>`;
  },

  // 进度条 SVG
  ringSvg(progress, size = 80, color = '#b497d6') {
    const r = (size - 10) / 2;
    const c = 2 * Math.PI * r;
    const offset = c * (1 - progress);
    return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#f0e6f7" stroke-width="6"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="6"
        stroke-dasharray="${c}" stroke-dashoffset="${offset}" stroke-linecap="round"
        transform="rotate(-90 ${size / 2} ${size / 2})"/>
    </svg>`;
  },

  // 简易柱状图
  barChart(data, options = {}) {
    const {
      width = 280,
      height = 120,
      color = '#b497d6',
      max = null,
    } = options;
    if (!data.length) return '<div class="empty-state">暂无数据</div>';
    const maxVal = max || Math.max(...data.map(d => d.value), 1);
    const barW = (width - 20) / data.length - 4;
    let bars = '';
    data.forEach((d, i) => {
      const h = (d.value / maxVal) * (height - 30);
      const x = 10 + i * (barW + 4);
      const y = height - 20 - h;
      bars += `<rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="3" fill="${d.color || color}" opacity="0.85">
        <animate attributeName="height" from="0" to="${h}" dur="0.6s" fill="freeze"/>
        <animate attributeName="y" from="${height - 20}" to="${y}" dur="0.6s" fill="freeze"/>
      </rect>`;
      bars += `<text x="${x + barW / 2}" y="${y - 4}" text-anchor="middle" font-size="9" fill="#7d6b8a">${d.label || ''}</text>`;
    });
    return `<svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" style="max-width:${width}px">
      ${bars}
    </svg>`;
  },

  // 简易折线图
  lineChart(data, options = {}) {
    const { width = 300, height = 120, color = '#b497d6' } = options;
    if (!data.length) return '<div class="empty-state">暂无数据</div>';
    const maxVal = Math.max(...data.map(d => d.value), 1);
    const minVal = Math.min(...data.map(d => d.value), 0);
    const range = maxVal - minVal || 1;
    const stepX = (width - 20) / (data.length - 1 || 1);
    let points = '';
    data.forEach((d, i) => {
      const x = 10 + i * stepX;
      const y = height - 20 - ((d.value - minVal) / range) * (height - 30);
      points += `${x},${y} `;
    });
    return `<svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" style="max-width:${width}px">
      <defs>
        <linearGradient id="lcFill" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <polyline points="${points}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <polygon points="${points}${data.length > 1 ? ` ${10 + (data.length - 1) * stepX},${height - 20} 10,${height - 20}` : ` 10,${height - 20}`}" fill="url(#lcFill)"/>
      ${data.map((d, i) => {
        const x = 10 + i * stepX;
        const y = height - 20 - ((d.value - minVal) / range) * (height - 30);
        return `<circle cx="${x}" cy="${y}" r="3" fill="${color}" stroke="#fff" stroke-width="1.5"/>`;
      }).join('')}
    </svg>`;
  },

  // 触发彩纸
  burst(target, emojis = ['🌸', '💖', '✨', '🎉', '🌟']) {
    const rect = target.getBoundingClientRect();
    const burst = document.createElement('div');
    burst.className = 'heart-burst';
    burst.style.left = (rect.left + rect.width / 2) + 'px';
    burst.style.top = (rect.top + rect.height / 2) + 'px';
    for (let i = 0; i < 8; i++) {
      const s = document.createElement('span');
      s.textContent = emojis[i % emojis.length];
      const angle = (Math.PI * 2 * i) / 8;
      const dist = 40 + Math.random() * 20;
      s.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
      s.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
      burst.appendChild(s);
    }
    document.body.appendChild(burst);
    setTimeout(() => burst.remove(), 1100);
  },

  // 真实拉布布图片（草帽粉衣版本）- 兼容保留，重定向到 Kitty
  labubuImg(opts = {}) {
    return this.kittyImg({ ...opts, module: opts.module || 'default' });
  },

  // 拉布布头像（圆角剪裁）- 兼容保留
  labubuAvatar(opts = {}) {
    return this.kittyAvatar(opts);
  },

  // ============================================================
  // Hello Kitty 治愈立绘 - 按模块选择最贴切的场景
  // ============================================================
  // 模块 → 场景映射
  KITTY_MODULES: {
    fitness:  { main: 'blocks',       alt: 'blocks',       backup: 'airplane' },
    wellness: { main: 'tea',          alt: 'tea',          backup: 'cloud-sleep' },
    study:    { main: 'book',         alt: 'book',         backup: 'notebook' },
    fortune:  { main: 'star-sleep',   alt: 'star-sleep',   backup: 'snowglobe-pink' },
    news:     { main: 'cart',         alt: 'cart',         backup: 'bag-pink' },
    default:  { main: 'picnic',       alt: 'picnic',       backup: 'bag-pink' },
  },

  // 通用 SVG 加载中插画（Hello Kitty 茶话会）
  kittyLoadingSvg(size = 80) {
    return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="40" fill="#ffe4f1" stroke="#ff8fbc" stroke-width="2" opacity="0.3">
        <animate attributeName="r" values="40;45;40" dur="1.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="50" cy="40" r="18" fill="#fff"/>
      <polygon points="38,28 42,18 46,28" fill="#ff8fbc"/>
      <polygon points="54,28 58,18 62,28" fill="#ff8fbc"/>
      <circle cx="44" cy="42" r="2" fill="#222"/>
      <circle cx="56" cy="42" r="2" fill="#222"/>
      <ellipse cx="50" cy="50" rx="3" ry="2" fill="#ff6fa3"/>
      <path d="M30 70 Q50 80 70 70 L70 90 L30 90 Z" fill="#ff8fbc"/>
      <circle cx="50" cy="50" r="2" fill="#fff" opacity="0.8">
        <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.2s" repeatCount="indefinite"/>
      </circle>
    </svg>`;
  },

  // 渲染 Hello Kitty 立绘（按模块或指定场景）
  kittyImg(opts = {}) {
    const {
      size = 'medium',   // tiny / small / thumb / medium / card / header / hero
      module = null,     // fitness / wellness / study / fortune / news
      scene = null,      // 显式指定场景名（如 'bike'、'tea'），优先级最高
      backup = false,    // 使用模块的备用场景
      className = '',
      alt = 'Hello Kitty 治愈立绘',
      loading = 'lazy',
    } = opts;
    let sceneName = scene;
    if (!sceneName && module && this.KITTY_MODULES[module]) {
      sceneName = backup ? this.KITTY_MODULES[module].backup : this.KITTY_MODULES[module].main;
    }
    if (!sceneName) sceneName = this.KITTY_MODULES.default.main;
    const srcMap = {
      tiny:   `assets/img/kitty/kitty-${sceneName}-tiny.png`,
      small:  `assets/img/kitty/kitty-${sceneName}-small.png`,
      thumb:  `assets/img/kitty/kitty-${sceneName}-thumb.png`,
      medium: `assets/img/kitty/kitty-${sceneName}-medium.png`,
      card:   `assets/img/kitty/kitty-${sceneName}-card.png`,
      header: `assets/img/kitty/kitty-${sceneName}-header.png`,
      hero:   `assets/img/kitty/kitty-${sceneName}-hero.webp`,
    };
    const url = srcMap[size] || srcMap.medium;
    return `<img class="kitty-img kitty-${size} ${className}" src="${url}" alt="${this.esc(alt)}" loading="${loading}" decoding="async" />`;
  },

  // Hello Kitty 头像（圆角剪裁，按模块选场景）
  kittyAvatar(opts = {}) {
    const { size = 64, ring = false, module = null, scene = null } = opts;
    return `<div class="kitty-avatar${ring ? ' ring' : ''}" style="width:${size}px;height:${size}px">
      ${this.kittyImg({ size: 'tiny', module, scene, className: 'kitty-avatar-img' })}
    </div>`;
  },

  // 根据模块名返回侧栏/底部按钮图标（小尺寸头像）
  kittyIcon(module, size = 40) {
    return this.kittyAvatar({ size, module });
  },
};

window.Utils = Utils;