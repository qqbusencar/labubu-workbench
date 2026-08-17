/* ============================================================
   模块五：信息资讯（金融 + 热点）
   ============================================================ */

const News = {
  state: {
    tab: 'morning', // morning / review / hot / watchlist
    activeCat: 'all',
  },

  // 模拟大盘数据
  marketData: () => {
    const today = DB.todayKey();
    const cache = DB.get('market_' + today);
    if (cache) return cache;
    const seed = today.split('-').reduce((s, p) => s + parseInt(p), 0);
    const rng = mulberry32(seed);

    const base = {
      sh: { name: '上证指数', code: '000001', price: 3200 + rng() * 100 },
      sz: { name: '深证成指', code: '399001', price: 10500 + rng() * 200 },
      cyb: { name: '创业板指', code: '399006', price: 2150 + rng() * 80 },
      kc50: { name: '科创50', code: '000688', price: 920 + rng() * 40 },
    };
    Object.values(base).forEach(m => {
      m.change = +(rng() * 3 - 1.5).toFixed(2);
      m.changePct = +(m.change / m.price * 100).toFixed(2);
    });
    DB.set('market_' + today, base);
    return base;
  },

  // 资讯库
  morningBrief: [
    { id: 'm1', title: '三大指数集体高开 沪指开盘涨 0.45%', source: '财经早报', summary: '今日 A 股三大指数集体高开，沪指开盘报 3215.32 点，上涨 0.45%；深成指涨 0.62%；创业板指涨 0.78%。', category: 'market' },
    { id: 'm2', title: '央行开展 1500 亿元 MLF 操作 中标利率持平', source: '财经早报', summary: '中国人民银行今日开展 1500 亿元中期借贷便利（MLF）操作，中标利率 2.50%，与此前持平。', category: 'policy' },
    { id: 'm3', title: '新能源汽车板块持续走强 政策利好不断', source: '财经早报', summary: '受新能源汽车下乡政策利好推动，相关板块今日有望持续走强，建议关注产业链龙头。', category: 'sector' },
    { id: 'm4', title: '美联储官员释放鸽派信号 全球资产价格反弹', source: '全球财经', summary: '美联储多位官员近期释放鸽派信号，市场预期加息周期接近尾声，全球资产价格迎来反弹。', category: 'global' },
    { id: 'm5', title: 'AI 算力需求持续增长 国产芯片迎来机遇', source: '科技前沿', summary: '随着大模型应用爆发，AI 算力需求持续增长，国产 AI 芯片厂商迎来历史性发展机遇。', category: 'tech' },
    { id: 'm6', title: '消费板块白马股业绩超预期', source: '公司动态', summary: '多家消费类白马股发布半年报，业绩超预期，部分公司净利润同比增长超 30%。', category: 'company' },
  ],

  marketReview: [
    { id: 'r1', title: '今日复盘：沪指收涨 0.85% 成交破万亿', source: '盘后总结', summary: '今日三大指数集体收涨，沪指收报 3225.31 点，上涨 0.85%，市场成交额突破 1.2 万亿元。', category: 'market' },
    { id: 'r2', title: '北向资金净流入 86.5 亿元', source: '盘后总结', summary: '今日北向资金净流入 86.5 亿元，连续 5 日净流入，外资对 A 股后市持乐观态度。', category: 'capital' },
    { id: 'r3', title: '行业涨跌幅榜：AI、新能源领涨', source: '盘后总结', summary: '今日行业涨幅榜：人工智能 +3.2%、新能源 +2.8%、半导体 +2.1%。跌幅榜：地产 -0.8%、银行 -0.4%。', category: 'sector' },
    { id: 'r4', title: '龙虎榜：机构席位净买入 12 只个股', source: '盘后总结', summary: '今日龙虎榜显示机构席位净买入 12 只个股，主要集中在 AI、新能源和医药生物板块。', category: 'capital' },
    { id: 'r5', title: '明日策略：关注政策受益板块', source: '明日展望', summary: '明日建议关注政策受益板块：消费、新能源、半导体等。控制仓位，注意风险。', category: 'strategy' },
  ],

  hotNews: [
    { id: 'h1', title: '国产大模型新一轮升级 多家厂商发布新版本', source: '科技热点', summary: '本周多家国产 AI 厂商发布大模型新版本，参数规模与多模态能力均有显著提升。', category: 'tech' },
    { id: 'h2', title: '新能源汽车销量持续增长 渗透率创新高', source: '行业观察', summary: '最新数据显示，新能源汽车 7 月销量同比增长 35%，渗透率突破 51% 创历史新高。', category: 'auto' },
    { id: 'h3', title: '暑期旅游市场火爆 多个热门目的地一票难求', source: '消费资讯', summary: '暑期旅游旺季，多个热门旅游目的地出现一票难求、酒店价格大幅上涨的情况。', category: 'life' },
    { id: 'h4', title: '健康消费成新趋势 相关产品销量激增', source: '消费资讯', summary: '年轻人健康消费意识提升，保健品、有机食品、运动装备等产品销量近期激增。', category: 'life' },
    { id: 'h5', title: '多地发布房地产新政 市场反应平稳', source: '财经资讯', summary: '本周多地发布房地产支持政策，从供需两端发力维稳，市场整体反应平稳。', category: 'realestate' },
    { id: 'h6', title: '储能行业迎来政策利好', source: '行业观察', summary: '国家发改委发布储能行业新政，明确储能在新型电力系统中的关键地位，行业迎来政策利好。', category: 'energy' },
    { id: 'h7', title: '数字人民币应用场景持续扩展', source: '金融科技', summary: '数字人民币试点城市进一步扩展，应用场景从零售支付延伸至跨境支付和供应链金融。', category: 'fintech' },
    { id: 'h8', title: '宠物经济崛起 市场规模突破 3000 亿', source: '消费资讯', summary: '宠物经济市场快速崛起，相关产业链市场规模已突破 3000 亿元，年复合增长率超过 20%。', category: 'life' },
  ],

  defaultWatchlist: [
    { code: '600519', name: '贵州茅台', price: 1680.50, change: -12.30, changePct: -0.73 },
    { code: '000858', name: '五粮液', price: 145.20, change: 2.10, changePct: 1.47 },
    { code: '300750', name: '宁德时代', price: 215.80, change: 4.20, changePct: 1.99 },
    { code: '002594', name: '比亚迪', price: 245.60, change: 3.80, changePct: 1.57 },
  ],

  mount(container) {
    const market = this.marketData();
    const watchlist = DB.get('news_watchlist', this.defaultWatchlist);
    if (!DB.get('news_watchlist_init')) {
      DB.set('news_watchlist', this.defaultWatchlist);
      DB.set('news_watchlist_init', true);
    }
    const tabMap = { morning: '每日早报', review: '市场复盘', hot: '7×24 热点', watchlist: '自选股' };
    const tabCounts = {
      morning: this.morningBrief.length,
      review: this.marketReview.length,
      hot: this.hotNews.length,
      watchlist: watchlist.length,
    };
    const tabLabel = tabMap[this.state.tab] || '每日早报';
    const newsCount = tabCounts[this.state.tab] || 0;

    container.innerHTML = `
      <div class="page">
        ${Components.banner({
          module: 'news',
          title: '信息资讯',
          sub: '实时市场 · 全网热点',
          actions: `
            <span class="tag btn-soft" style="margin-left:0">⏰ ${tabLabel}</span>
            <button class="btn-primary" id="news-refresh">🔄 刷新数据</button>
          `
        })}

        <div class="labubu-feature-card" style="margin-bottom:16px">
          <div class="labubu-portrait" style="background:linear-gradient(135deg,#cfe8ea,#d9c2ec)">${Utils.labubuImg({ size: 'small' })}</div>
          <div class="lfc-text">
            <div class="lfc-title">📰 ${tabLabel} · ${newsCount} 条要点</div>
            <div class="lfc-sub">所有资讯仅供信息展示，不构成任何投资建议，决策请独立思考～</div>
          </div>
        </div>

        <div class="market-strip">
          ${Object.values(market).map(m => `
            <div class="market-cell">
              <div class="market-name">${Utils.esc(m.name)}</div>
              <div class="market-price">${m.price.toFixed(2)}</div>
              <div class="market-chg ${m.changePct >= 0 ? 'up' : 'down'}">
                ${m.changePct >= 0 ? '+' : ''}${m.changePct.toFixed(2)}%
              </div>
            </div>
          `).join('')}
        </div>

        <div class="news-tabs">
          <div class="news-tab ${this.state.tab === 'morning' ? 'active' : ''}" data-ntab="morning">每日早报</div>
          <div class="news-tab ${this.state.tab === 'review' ? 'active' : ''}" data-ntab="review">市场复盘</div>
          <div class="news-tab ${this.state.tab === 'hot' ? 'active' : ''}" data-ntab="hot">7×24 热点</div>
          <div class="news-tab ${this.state.tab === 'watchlist' ? 'active' : ''}" data-ntab="watchlist">自选股</div>
        </div>

        <div id="news-content"></div>

        <div class="compliance-tip">
          ⚠️ 本站仅提供资讯查看，不构成任何投资建议<br>
          投资有风险，决策需谨慎
        </div>
      </div>
    `;

    if (this.state.tab === 'morning') this.renderMorning();
    else if (this.state.tab === 'review') this.renderReview();
    else if (this.state.tab === 'hot') this.renderHot();
    else this.renderWatchlist();

    this.bindEvents();
  },

  renderMorning() {
    const el = document.getElementById('news-content');
    el.innerHTML = `
      <div class="news-list">
        ${this.morningBrief.map(n => this.renderNewsItem(n)).join('')}
      </div>
    `;
  },

  renderReview() {
    const el = document.getElementById('news-content');
    el.innerHTML = `
      <div class="news-list">
        ${this.marketReview.map(n => this.renderNewsItem(n)).join('')}
      </div>
    `;
  },

  renderHot() {
    const el = document.getElementById('news-content');
    const cats = ['all', 'tech', 'life', 'auto', 'energy'];
    el.innerHTML = `
      <div class="news-tabs mb-12">
        ${cats.map(c => `
          <div class="news-tab ${this.state.activeCat === c ? 'active' : ''}" data-cat="${c}">
            ${c === 'all' ? '全部' : ({tech: '科技', life: '生活', auto: '汽车', energy: '能源'})[c] || c}
          </div>
        `).join('')}
      </div>
      <div class="news-list" id="hot-list">
        ${this.filterHot().map(n => this.renderNewsItem(n)).join('')}
      </div>
    `;
    el.querySelectorAll('[data-cat]').forEach(b => {
      b.addEventListener('click', () => {
        this.state.activeCat = b.dataset.cat;
        this.renderHot();
      });
    });
  },

  filterHot() {
    if (this.state.activeCat === 'all') return this.hotNews;
    return this.hotNews.filter(n => n.category === this.state.activeCat);
  },

  renderNewsItem(n) {
    const favs = DB.get('news_favorites', []);
    const isFav = favs.some(x => x.id === n.id);
    return `
      <div class="news-item" data-news="${n.id}">
        <div class="news-head">
          <span class="news-source">${Utils.esc(n.source)}</span>
          <span class="news-time">${Utils.fromNow(Date.now() - Math.floor(Math.random() * 3 * 60 * 60 * 1000))}</span>
        </div>
        <div class="news-title">${Utils.esc(n.title)}</div>
        <div class="news-summary">${Utils.esc(n.summary)}</div>
        <div class="news-actions">
          <button class="news-action ${isFav ? 'active' : ''}" data-fav="${n.id}">
            ${isFav ? '★ 已收藏' : '☆ 收藏'}
          </button>
          <button class="news-action" data-share="${n.id}">↗ 分享</button>
        </div>
      </div>
    `;
  },

  renderWatchlist() {
    const el = document.getElementById('news-content');
    const list = DB.get('news_watchlist', this.defaultWatchlist);
    el.innerHTML = `
      <div class="watchlist">
        <div class="flex-between mb-12">
          <div class="card-title" style="margin:0">
            <span class="card-title-ico">⭐</span>我的自选股
          </div>
          <button class="btn-ghost btn-primary text-sm" id="add-stock">+ 添加</button>
        </div>
        ${list.length ? list.map((s, i) => `
          <div class="watchlist-item slide-up" style="animation-delay:${i * 0.05}s">
            <div class="watchlist-info">
              <span class="watchlist-name">${Utils.esc(s.name)}</span>
              <span class="watchlist-code">${Utils.esc(s.code)}</span>
            </div>
            <div class="watchlist-price">
              <div style="font-size:14px;font-weight:600;color:var(--text-primary)">${s.price.toFixed(2)}</div>
              <div class="${s.changePct >= 0 ? 'up' : 'down'}" style="font-size:11px;font-weight:500">
                ${s.changePct >= 0 ? '+' : ''}${s.changePct.toFixed(2)}%
              </div>
            </div>
            <button class="watchlist-remove" data-rm="${s.code}">×</button>
          </div>
        `).join('') : Components.empty({ icon: '⭐', title: '还没有自选股', sub: '添加你关注的股票，实时查看行情', hero: true })}
      </div>

      <div class="card mt-16">
        <div class="card-title">
          <span class="card-title-ico">📈</span>指数行情
        </div>
        <div class="market-strip">
          ${Object.values(this.marketData()).map(m => `
            <div class="market-cell">
              <div class="market-name">${Utils.esc(m.name)}</div>
              <div class="market-price">${m.price.toFixed(2)}</div>
              <div class="market-chg ${m.changePct >= 0 ? 'up' : 'down'}">
                ${m.changePct >= 0 ? '+' : ''}${m.changePct.toFixed(2)}%
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.getElementById('add-stock')?.addEventListener('click', async () => {
      const r = await Components.form({
        title: '添加自选股',
        fields: [
          { key: 'code', label: '股票代码', placeholder: '600519', required: true },
          { key: 'name', label: '股票名称', placeholder: '贵州茅台', required: true },
          { key: 'price', label: '当前价', type: 'number', placeholder: '100.00', value: '100.00' },
          { key: 'changePct', label: '涨跌幅 %', type: 'number', placeholder: '1.5', value: '0' },
        ],
        okText: '添加',
      });
      if (r && r.code) {
        const list = DB.get('news_watchlist', []);
        list.push({
          code: r.code,
          name: r.name,
          price: parseFloat(r.price) || 0,
          changePct: parseFloat(r.changePct) || 0,
          change: (parseFloat(r.price) || 0) * (parseFloat(r.changePct) || 0) / 100,
        });
        DB.set('news_watchlist', list);
        Utils.toast('已添加自选股');
        this.mount(document.getElementById('app-main'));
      }
    });

    el.querySelectorAll('[data-rm]').forEach(b => {
      b.addEventListener('click', () => {
        const code = b.dataset.rm;
        const list = DB.get('news_watchlist', []);
        DB.set('news_watchlist', list.filter(s => s.code !== code));
        Utils.toast('已移除');
        this.mount(document.getElementById('app-main'));
      });
    });
  },

  bindEvents() {
    document.querySelectorAll('[data-ntab]').forEach(b => {
      b.addEventListener('click', () => {
        this.state.tab = b.dataset.ntab;
        this.mount(document.getElementById('app-main'));
      });
    });

    document.getElementById('news-refresh')?.addEventListener('click', () => {
      Utils.toast('正在刷新数据...');
      // 清掉大盘缓存让数据"实时"更新
      DB.remove('market_' + DB.todayKey());
      setTimeout(() => this.mount(document.getElementById('app-main')), 600);
    });

    // 收藏
    document.querySelectorAll('[data-fav]').forEach(b => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = b.dataset.fav;
        const allNews = [...this.morningBrief, ...this.marketReview, ...this.hotNews];
        const news = allNews.find(n => n.id === id);
        if (!news) return;
        const favs = DB.get('news_favorites', []);
        const exists = favs.findIndex(x => x.id === id);
        if (exists >= 0) {
          favs.splice(exists, 1);
          Utils.toast('已取消收藏');
        } else {
          favs.push({ ...news, favAt: Date.now() });
          Utils.toast('已收藏 ⭐', 'success');
        }
        DB.set('news_favorites', favs);
        this.mount(document.getElementById('app-main'));
      });
    });

    // 分享
    document.querySelectorAll('[data-share]').forEach(b => {
      b.addEventListener('click', () => {
        if (navigator.share) {
          navigator.share({ title: 'Labubu 工作台', text: '分享一条资讯' }).catch(() => {});
        } else {
          Utils.toast('已复制链接（演示）');
        }
      });
    });
  },
};

window.News = News;