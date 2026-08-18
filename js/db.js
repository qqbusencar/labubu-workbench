/* ============================================================
   数据持久化层 — 基于 localStorage，模拟云同步接口
   ============================================================ */

const DB = {
  PREFIX: 'labubu_wb_',

  // 数据表
  keys: {
    fitness: 'fitness_records',
    wellness: 'wellness_records',
    wellness_products: 'wellness_products',
    study_english: 'study_english_daily',
    study_books: 'study_books',
    study_checkin: 'study_checkin',
    fortune_history: 'fortune_history',
    fortune_user: 'fortune_user',
    news_favorites: 'news_favorites',
    news_watchlist: 'news_watchlist',
    settings: 'settings',
    sync_log: 'sync_log',
    password: 'app_password',
    i18n: 'language_pref',
  },

  // 读取
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(this.PREFIX + key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('DB.get failed:', key, e);
      return fallback;
    }
  },

  // 写入
  set(key, value) {
    try {
      localStorage.setItem(this.PREFIX + key, JSON.stringify(value));
      this._lastLocalWriteTime = this._lastLocalWriteTime || {};
      this._lastLocalWriteTime[key] = Date.now();
      this.logSync(key, 'write');
      this._enqueueSync(key);
      return true;
    } catch (e) {
      console.error('DB.set failed:', key, e);
      return false;
    }
  },

  // 删除
  remove(key) {
    localStorage.removeItem(this.PREFIX + key);
    this._lastLocalWriteTime = this._lastLocalWriteTime || {};
    delete this._lastLocalWriteTime[key];
    this._enqueueSync(key);
  },

  // 推送单条记录（带日期）
  push(key, record) {
    const list = this.get(key, []);
    list.push({ ...record, _id: this.uid(), _ts: Date.now() });
    this.set(key, list);
    return record;
  },

  // 更新
  update(key, id, updater) {
    const list = this.get(key, []);
    const idx = list.findIndex(x => x._id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updater(list[idx]), _ts: Date.now() };
    this.set(key, list);
    return list[idx];
  },

  // 删除
  removeById(key, id) {
    const list = this.get(key, []);
    const next = list.filter(x => x._id !== id);
    this.set(key, next);
    return next.length !== list.length;
  },

  // 生成唯一 ID
  uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  },

  // 同步日志（模拟云同步队列）
  logSync(key, op) {
    const log = this.get('sync_log', []);
    log.push({ key, op, ts: Date.now() });
    if (log.length > 200) log.splice(0, log.length - 200);
    this.set('sync_log', log);
  },

  // 今日 key（YYYY-MM-DD）
  todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  // 今天 0 点时间戳
  todayStart() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  },

  // 近 N 天日期
  lastNDays(n) {
    const days = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(this.dateKey(d));
    }
    return days;
  },

  // 单日 key
  dateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  },

  // 查询某日记录
  filterByDate(key, dateKey) {
    const list = this.get(key, []);
    return list.filter(r => r.date === dateKey);
  },

  // 查询日期范围
  filterByDateRange(key, startKey, endKey) {
    const list = this.get(key, []);
    return list.filter(r => r.date >= startKey && r.date <= endKey);
  },

  // 连续打卡天数
  streakCount(key, dateField = 'date') {
    const list = this.get(key, []);
    if (!list.length) return 0;
    const dates = [...new Set(list.map(r => r[dateField]))].sort().reverse();
    let streak = 0;
    let cursor = new Date();
    for (let i = 0; i < 365; i++) {
      const k = this.dateKey(cursor);
      if (dates.includes(k)) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else if (i === 0) {
        // 今日未打卡，从昨天算起
        cursor.setDate(cursor.getDate() - 1);
        continue;
      } else {
        break;
      }
    }
    return streak;
  },

  // 全部数据导出
  exportAll() {
    const result = {};
    for (const k of Object.values(this.keys)) {
      result[k] = this.get(k);
    }
    result._meta = {
      exportTime: new Date().toISOString(),
      version: '1.0.0',
      platform: 'Labubu 治愈工作台',
    };
    return result;
  },

  // 全部数据导入
  importAll(data) {
    if (!data || typeof data !== 'object') return false;
    let count = 0;
    for (const k of Object.values(this.keys)) {
      if (data[k] !== undefined) {
        this.set(k, data[k]);
        count++;
      }
    }
    return count;
  },

  // 清空全部
  clearAll() {
    for (const k of Object.values(this.keys)) {
      this.remove(k);
    }
  },

  // ============================================================
  // 云同步：localStorage + Supabase 双写模式
  // ============================================================
  // 策略：
  // - 本地写入立即生效（保证离线可用）
  // - 已登录 + Supabase 可用时，后台推送到云端
  // - 启动时若云端有数据且比本地新，自动拉取并合并
  // - 网络异常时静默重试，不阻塞 UI
  // ============================================================

  _syncQueue: new Map(),          // 待同步的 key 队列（防抖合并）
  _syncTimer: null,
  _syncListeners: new Set(),      // 同步状态订阅
  _syncStatus: 'idle',            // idle / syncing / success / error / offline

  get syncStatus() { return this._syncStatus; },

  onSyncChange(fn) {
    this._syncListeners.add(fn);
    return () => this._syncListeners.delete(fn);
  },

  _setSyncStatus(s) {
    this._syncStatus = s;
    this._syncListeners.forEach(fn => {
      try { fn(s); } catch (e) { /* noop */ }
    });
  },

  // 触发同步某个 key（防抖 1.5s 合并多次写入）
  _enqueueSync(key) {
    if (!SupabaseCfg.ENABLED || !SupabaseCfg.user) return;
    this._syncQueue.set(key, true);
    if (this._syncTimer) clearTimeout(this._syncTimer);
    this._syncTimer = setTimeout(() => this._flushSync(), 1500);
  },

  // 执行队列中的同步
  async _flushSync() {
    if (!SupabaseCfg.ENABLED || !SupabaseCfg.user) return;
    if (this._syncQueue.size === 0) return;
    if (!navigator.onLine) {
      this._setSyncStatus('offline');
      return;
    }
    this._setSyncStatus('syncing');
    const keys = Array.from(this._syncQueue.keys());
    this._syncQueue.clear();
    let hasError = false;
    for (const k of keys) {
      const value = this.get(k);
      const ok = await SupabaseCfg.pushKey(k, value);
      if (!ok) {
        hasError = true;
        // 失败时重新入队，并在 10 秒后自愈重试（应对网络抖动 / 登录态延迟）
        this._syncQueue.set(k, true);
      }
    }
    this._setSyncStatus(hasError ? 'error' : 'success');
    if (hasError) {
      // 自愈：10 秒后若仍在队列则重试一次（连续失败也不会卡死）
      setTimeout(() => { if (this._syncQueue.size > 0) this._flushSync(); }, 10000);
    }
    // 3 秒后回到 idle
    setTimeout(() => {
      if (this._syncStatus !== 'syncing') this._setSyncStatus('idle');
    }, 3000);
  },

  // 启动时拉取云端数据并合并到本地
  async pullFromCloud() {
    if (!SupabaseCfg.ENABLED || !SupabaseCfg.user) return 0;
    if (!navigator.onLine) return 0;
    this._setSyncStatus('syncing');
    try {
      const cloud = await SupabaseCfg.fetchAll();
      let merged = 0;
      for (const [key, row] of Object.entries(cloud)) {
        // 仅同步我们认识的 key
        if (!Object.values(this.keys).includes(key)) continue;
        const local = this.get(key, null);
        const cloudTime = new Date(row.updated_at).getTime();
        const localTime = local ? (this._lastLocalWriteTime[key] || 0) : 0;
        // 简单的 last-write-wins：云端更新则覆盖本地
        if (!local || cloudTime >= localTime) {
          this.set(key, row.data);
          merged++;
        }
      }
      this._setSyncStatus('success');
      setTimeout(() => this._setSyncStatus('idle'), 2000);
      return merged;
    } catch (e) {
      console.warn('[DB] pullFromCloud failed:', e);
      this._setSyncStatus('error');
      return 0;
    }
  },

  // 全量推送到云端（首次登录或手动同步）
  async pushAllToCloud() {
    if (!SupabaseCfg.ENABLED || !SupabaseCfg.user) return 0;
    if (!navigator.onLine) {
      Utils.toast('当前离线，无法同步', 'warning');
      return 0;
    }
    this._setSyncStatus('syncing');
    let count = 0;
    for (const k of Object.values(this.keys)) {
      const v = this.get(k);
      if (v === null || v === undefined) continue;
      const ok = await SupabaseCfg.pushKey(k, v);
      if (ok) count++;
    }
    this._setSyncStatus('success');
    setTimeout(() => this._setSyncStatus('idle'), 2000);
    return count;
  },

  // 监听网络状态
  _initNetworkWatcher() {
    window.addEventListener('online', () => {
      if (this._syncQueue.size > 0) this._flushSync();
      else this._setSyncStatus('idle');
    });
    window.addEventListener('offline', () => {
      this._setSyncStatus('offline');
    });
  },
};

// 暴露到全局
window.DB = DB;