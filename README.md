# Hello Kitty 治愈风个人全能工作台

> 女生专属、Hello Kitty 治愈梦幻风的全能自律工作台 PWA
> 全程 WorkBuddy 设计 + 开发

## ✨ 功能模块

- 🧘‍♀️ **健身打卡** — 运动 / 时长 / 卡路里追踪
- 🌿 **养生打卡** — 保健品 / 作息 / 体感记录
- 📚 **学习收获** — 沪教牛津版每日英语（10 单词 + 5 听力 + 5 口语）
- 🌙 **每日运势** — 紫微 + 星座 + 抽签 + 心情
- 📰 **信息资讯** — 简报 / 关注 / 收藏

## 🎀 视觉系统

- 5 模块 × 5 场景 = **24 个 Hello Kitty 贴纸场景**（野餐/骑车/读书/星空/购物…）
- 按模块自动选择最贴切的场景
- 马卡龙粉色系 + 紫藤花梦幻背景
- 完整 PWA 体验（可安装到 iOS / Android 主屏）

## ☁️ 云同步（可选）

通过 [Supabase](https://supabase.com) 实现 localStorage + 云端双写：

- 本地写入立即生效（离线可用）
- 联网时后台自动同步到云端
- 切换设备自动恢复
- **配置方式**：编辑 `js/supabase.js` 填入 `URL` 和 `ANON_KEY`，在 Supabase SQL Editor 中执行 `schema.sql` 建表

## 📁 项目结构

```
labubu-workbench/
├── index.html            # 主页面（含 PWA meta）
├── manifest.json         # PWA 应用清单
├── sw.js                 # Service Worker（离线缓存）
├── schema.sql            # Supabase 数据库初始化脚本
├── CNAME                 # Surge 部署域名
├── css/                  # 3 个样式文件（main / modules / animations）
├── js/                   # 核心脚本
│   ├── db.js             # localStorage + Supabase 双写数据层
│   ├── supabase.js       # Supabase 客户端封装
│   ├── utils.js          # 工具函数 + Kitty 图片组件
│   ├── components.js     # 通用 UI 组件
│   ├── app.js            # 主应用控制器 + 云同步入口
│   └── sw-register.js    # Service Worker 注册
├── modules/              # 5 大功能模块
│   ├── fitness.js
│   ├── wellness.js
│   ├── study.js
│   ├── fortune.js
│   └── news.js
├── assets/img/kitty/     # 14 个 Kitty 场景 × 7 个尺寸 = 122 张 PNG/WebP
├── generate_icons.py     # PWA 图标生成脚本
└── generate_kitty_sizes.py  # Kitty 图片裁切脚本
```

## 🚀 部署

- **Surge**：https://kitty-wb.surge.sh （主部署，HTTPS + PWA）
- **GitHub**：https://github.com/qqbusencar/labubu-workbench （源码仓库）

## 📱 iOS 添加到主屏幕

1. 用 **Safari** 打开 https://kitty-wb.surge.sh
2. 等页面加载完毕，点击底部 **分享按钮**（方框 + 向上箭头）
3. 向上滑动找到 **「添加到主屏幕」**
4. 可修改名称（默认「Hello Kitty 工作台」），点 **添加**
5. 桌面出现 Kitty 图标，点击 **全屏独立运行**（无浏览器地址栏）

> **离线使用**：首次加载后，Service Worker 会缓存所有资源，断网也能正常打开。数据通过 localStorage 保存在本地。
