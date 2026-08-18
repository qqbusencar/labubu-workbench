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
  URL: 'https://rmldjztswbfdedwaawhq.supabase.co',  // 你的 Project URL
  ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtbGRqenRzd2JmZGVkd2Fhd2hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2OTQ5NjYsImV4cCI6MjEwMjI3MDk2Nn0.w79ZeC3JhWV4WQbKBQSwXk2AerxfzsyM5p-kd5cgnwI',  // 你的 anon public key
  // ==================================================

  ENABLED: false,        // 凭据填好后自动变为 true
  SDK_URL: 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js',
  client: null,
  user: null,
  listeners: new Set(),
  lastError: null,       // 最近一次错误（用于 UI 诊断展示）
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
    this.lastError = null;
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

    // 加载 SDK（多 CDN 兜底）
    try {
      if (!window.supabase) {
        await this._loadSdk();
      }
      if (!window.supabase) throw new Error('window.supabase 未定义');
      this.client = window.supabase.createClient(this.URL, this.ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,   // 自动从回调 URL 的 #access_token（implicit）或 ?code 建立会话
          flowType: 'implicit',       // 隐式流：会话直接随回调 URL 返回，不依赖本地 code_verifier，清缓存/iOS 更稳
        },
      });
      this.ENABLED = true;

      // 关键：先注册监听，再读会话，避免错过 SIGNED_IN 事件
      this.client.auth.onAuthStateChange((_event, session) => {
        this.user = session?.user || null;
        this._notify();
      });

      // 恢复已持久化的会话（之前登录过、未清缓存时直接复用）
      const { data: { session } } = await this.client.auth.getSession();
      this.user = session?.user || null;

      // 处理 OAuth 回调：GitHub 跳回带 ?code=... → 显式交换为会话（这是修复"登录后无状态"的核心）
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const code = urlParams.get('code') || hashParams.get('code');
      if (code) {
        try {
          const { error } = await this.client.auth.exchangeCodeForSession(window.location.href);
          if (error) {
            this.lastError = 'OAuth 交换失败：' + (error.message || error);
          } else {
            const { data: { session: s2 } } = await this.client.auth.getSession();
            this.user = s2?.user || null;
          }
        } catch (e) {
          this.lastError = 'OAuth 交换异常：' + (e.message || e);
        }
        this._cleanUrl();
      }

      // 若 URL 带 ?error（如 redirect_to 未配置 / 用户拒绝授权）→ 显式报错，不再静默
      const errCode = urlParams.get('error') || hashParams.get('error');
      if (errCode) {
        this.lastError = 'OAuth 返回错误：' + (urlParams.get('error_description') || hashParams.get('error_description') || errCode);
        this._cleanUrl();
      }

      console.info('[Supabase] 已连接:', this.URL, 'user:', this.user?.email || null);
      return true;
    } catch (e) {
      console.error('[Supabase] 初始化失败:', e);
      this.ENABLED = false;
      this.lastError = '初始化失败：' + (e.message || e);
      return false;
    }
  },

  // 多 CDN 兜底加载 SDK（jsdelivr → unpkg），任一成功即可
  async _loadSdk() {
    const urls = [
      'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js',
      'https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.min.js',
    ];
    let lastErr;
    for (const u of urls) {
      try {
        await this._injectScript(u);
        if (window.supabase) return;
      } catch (e) {
        lastErr = e;
      }
    }
    throw new Error('Supabase SDK 加载失败（CDN 不可达）：' + (lastErr?.message || ''));
  },

  _injectScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('加载失败 ' + src));
      document.head.appendChild(s);
    });
  },

  // 交换完成后清理 URL 中的 ?code / ?error 以及 #access_token，避免刷新重复触发 & 地址栏整洁
  _cleanUrl() {
    try {
      const url = new URL(window.location.href);
      ['code', 'state', 'error', 'error_description'].forEach(k => url.searchParams.delete(k));
      history.replaceState(null, '', url.pathname + url.search); // 同时丢弃 #access_token 等片段
    } catch (e) { /* noop */ }
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
