/* ============================================================
   Hello Kitty 工作台 — Supabase 云同步客户端
   ============================================================
   凭据配置：
   1. 打开 https://supabase.com 创建项目
   2. 进入 Project Settings → API
   3. 复制 Project URL 和 anon public key 到下方 CONFIG
   4. 进入 SQL Editor 执行 schema.sql 创建表
   5. 刷新页面，云同步自动启用
   ============================================================ */

const SupabaseCfg = {
  // ========== 在这里填入你的 Supabase 凭据 ==========
  URL: 'https://YOUR-PROJECT-REF.supabase.co',     // 改成你的 Project URL
  ANON_KEY: 'YOUR-ANON-PUBLIC-KEY',                  // 改成你的 anon public key
  // ==================================================

  ENABLED: false,        // 凭据填好后自动变为 true
  SDK_URL: 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js',
  client: null,
  user: null,
  listeners: new Set(),
  STORAGE_KEY: 'labubu_wb_supabase_cfg',   // 本地保存的凭据（弹窗里配置）

  // 从本地读取已保存的凭据，覆盖默认占位符
  _loadSavedConfig() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || 'null');
      if (saved && saved.url && saved.key) {
        this.URL = saved.url;
        this.ANON_KEY = saved.key;
      }
    } catch (e) { /* ignore */ }
  },

  // 保存凭据到本地并立即重新初始化（实现"一键启用"，无需改代码）
  async saveConfig(url, key) {
    url = (url || '').trim().replace(/\/+$/, '');
    key = (key || '').trim();
    if (!url || !key) return { error: { message: '请填写完整的 Project URL 和 anon key' } };
    if (!/^https:\/\/.+\.supabase\.co$/.test(url)) {
      return { error: { message: 'Project URL 格式应类似 https://xxxx.supabase.co' } };
    }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify({ url, key }));
    this.URL = url;
    this.ANON_KEY = key;
    const ok = await this.init();
    return ok ? { error: null } : { error: { message: '初始化失败，请检查 URL 与 anon key' } };
  },

  // 初始化（启动时调用）
  async init() {
    // 优先使用本地保存的凭据（用户在弹窗中配置过）
    this._loadSavedConfig();

    // 凭据校验
    const isValid = this.URL &&
      this.ANON_KEY &&
      !this.URL.includes('YOUR-PROJECT-REF') &&
      !this.ANON_KEY.includes('YOUR-ANON-PUBLIC-KEY');

    if (!isValid) {
      console.info('[Supabase] 凭据未配置，云同步已禁用（仅本地存储）');
      this.ENABLED = false;
      return false;
    }

    // 加载 SDK
    try {
      if (!window.supabase) {
        await this._loadSdk();
      }
      this.client = window.supabase.createClient(this.URL, this.ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true },
      });
      this.ENABLED = true;
      // 读取已登录用户
      const { data: { session } } = await this.client.auth.getSession();
      this.user = session?.user || null;
      // 监听登录态变化
      this.client.auth.onAuthStateChange((_event, session) => {
        this.user = session?.user || null;
        this._notify();
      });
      console.info('[Supabase] 已连接:', this.URL);
      return true;
    } catch (e) {
      console.error('[Supabase] 初始化失败:', e);
      this.ENABLED = false;
      return false;
    }
  },

  _loadSdk() {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = this.SDK_URL;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  },

  onAuthChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  },

  _notify() {
    this.listeners.forEach(fn => {
      try { fn(this.user); } catch (e) { console.warn(e); }
    });
  },

  // Auth: 注册
  async signUp(email, password) {
    if (!this.ENABLED) return { error: { message: '云同步未配置' } };
    const { data, error } = await this.client.auth.signUp({ email, password });
    if (error) return { error };
    this.user = data.user;
    this._notify();
    return { data, error: null };
  },

  // Auth: 登录
  async signIn(email, password) {
    if (!this.ENABLED) return { error: { message: '云同步未配置' } };
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) return { error };
    this.user = data.user;
    this._notify();
    return { data, error: null };
  },

  // Auth: 登出
  async signOut() {
    if (!this.client) return;
    await this.client.auth.signOut();
    this.user = null;
    this._notify();
  },

  // Auth: 使用 GitHub 登录（OAuth 重定向，账户即 GitHub 账号）
  async signInWithGitHub() {
    if (!this.ENABLED || !this.client) return { error: { message: '云同步未配置' } };
    const redirectTo = window.location.origin + window.location.pathname;
    const { error } = await this.client.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo },
    });
    return { error: error || null };
  },

  // 数据：读取某个 key
  async fetchKey(key) {
    if (!this.ENABLED || !this.user) return null;
    const { data, error } = await this.client
      .from('user_data')
      .select('data, updated_at')
      .eq('user_id', this.user.id)
      .eq('key', key)
      .maybeSingle();
    if (error) { console.warn('[Supabase] fetchKey', key, error); return null; }
    return data;
  },

  // 数据：写入某个 key（upsert）
  async pushKey(key, value) {
    if (!this.ENABLED || !this.user) return false;
    const { error } = await this.client
      .from('user_data')
      .upsert({
        user_id: this.user.id,
        key,
        data: value,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,key' });
    if (error) { console.warn('[Supabase] pushKey', key, error); return false; }
    return true;
  },

  // 数据：拉取该用户所有数据
  async fetchAll() {
    if (!this.ENABLED || !this.user) return {};
    const { data, error } = await this.client
      .from('user_data')
      .select('key, data, updated_at')
      .eq('user_id', this.user.id);
    if (error) { console.warn('[Supabase] fetchAll', error); return {}; }
    const result = {};
    data.forEach(row => { result[row.key] = row; });
    return result;
  },

  // 状态摘要
  status() {
    if (!this.ENABLED) return 'disabled';
    if (!this.user) return 'guest';
    return 'synced';
  },
};

window.SupabaseCfg = SupabaseCfg;
