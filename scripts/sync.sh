#!/usr/bin/env bash
# ============================================================
# 一键同步到 GitHub（代码自动备份 + 触发自动部署）
# 用法（在 Git Bash 里运行）：
#   bash scripts/sync.sh "这次改了什么"
# 不写说明也行，会自动用时间当说明：
#   bash scripts/sync.sh
# ============================================================
set -e

MESSAGE="${1:-更新: 自动同步 $(date '+%Y-%m-%d %H:%M')}"

git add -A

# 没有改动就直接退出
if git diff --cached --quiet; then
  echo "✅ 没有改动需要提交，已是最新。"
  exit 0
fi

git commit -m "$MESSAGE"
git push origin main
echo "🚀 已推送到 GitHub，GitHub Actions 会自动部署到 Surge。"
