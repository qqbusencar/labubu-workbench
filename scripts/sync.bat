@echo off
REM ============================================================
REM 一键同步到 GitHub（Windows 双击或用 cmd 运行）
REM 用法：  scripts\sync.bat "这次改了什么"
REM 不写说明：scripts\sync.bat
REM ============================================================
set "MSG=%~1"
if "%MSG%"=="" set "MSG=更新: 自动同步 %date% %time%"

git add -A
git commit -m "%MSG%"
git push origin main
echo 🚀 已推送到 GitHub，GitHub Actions 会自动部署到 Surge。
pause
