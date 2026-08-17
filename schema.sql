-- ============================================================
-- Hello Kitty 治愈工作台 — Supabase 数据库 Schema
-- ============================================================
-- 在 Supabase 项目 → SQL Editor 中执行此脚本
-- 它会创建 user_data 表 + 启用行级安全策略 + 设置自动更新时间
-- ============================================================

-- 1. 创建 user_data 表
CREATE TABLE IF NOT EXISTS user_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 每个用户每个 key 唯一
  UNIQUE (user_id, key)
);

-- 2. 索引
CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON user_data (user_id);
CREATE INDEX IF NOT EXISTS idx_user_data_updated_at ON user_data (updated_at DESC);

-- 3. 启用 RLS（行级安全）—— 每个用户只能读写自己的数据
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- 4. RLS 策略：用户可以查看自己的数据
DROP POLICY IF EXISTS "Users can view own data" ON user_data;
CREATE POLICY "Users can view own data"
  ON user_data
  FOR SELECT
  USING (auth.uid() = user_id);

-- 5. RLS 策略：用户可以插入自己的数据
DROP POLICY IF EXISTS "Users can insert own data" ON user_data;
CREATE POLICY "Users can insert own data"
  ON user_data
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 6. RLS 策略：用户可以更新自己的数据
DROP POLICY IF EXISTS "Users can update own data" ON user_data;
CREATE POLICY "Users can update own data"
  ON user_data
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7. RLS 策略：用户可以删除自己的数据
DROP POLICY IF EXISTS "Users can delete own data" ON user_data;
CREATE POLICY "Users can delete own data"
  ON user_data
  FOR DELETE
  USING (auth.uid() = user_id);

-- 8. 触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON user_data;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON user_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. 完成提示
SELECT '✅ Hello Kitty 工作台数据库已就绪！' AS message;
