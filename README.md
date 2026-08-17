# Labubu 治愈风个人全能工作台

> 女生专属、Labubu 治愈梦幻风的全能自律工作台 PWA

## 在线访问

- **Surge 部署**：https://labubu-wb.surge.sh

## 功能模块

| 模块 | 说明 |
|------|------|
| 健身打卡 | 自定义运动类别，手动添加，每日打卡记录 |
| 养生打卡 | 自定义保健品，手动添加，每日服用记录 |
| 学习收获 | 小学三年级起点，每日 10 词 + 5 听力 + 5 口语，答错 2 次进复习库 |
| 每日运势 | 治愈系每日运势抽签 |
| 信息咨询 | 每日早报 + 资讯浏览 |

## 技术栈

- **PWA**：manifest.json + Service Worker（离线缓存）
- **双端自适应**：PC 侧栏导航 (≥900px) / 移动底部标签栏 (<900px)
- **数据持久化**：localStorage（预留 Supabase 接口）
- **Web Speech API**：英语听力 TTS 朗读
- **纯原生**：HTML + CSS + JavaScript，无框架依赖

## 项目结构

```
labubu-workbench/
├── index.html              # 主壳页面
├── manifest.json           # PWA 清单
├── sw.js                   # Service Worker
├── CNAME                   # Surge 域名配置
├── css/
│   ├── main.css            # 全局样式 + 主题
│   ├── modules.css         # 模块样式
│   └── animations.css      # 动画
├── js/
│   ├── app.js              # 主应用入口
│   ├── utils.js            # 工具函数 + Labubu 图片组件
│   ├── components.js       # UI 组件库
│   ├── db.js               # localStorage 数据层
│   └── sw-register.js      # SW 注册
├── modules/
│   ├── fitness.js          # 健身打卡
│   ├── wellness.js         # 养生打卡
│   ├── study.js            # 学习收获
│   ├── fortune.js          # 每日运势
│   └── news.js             # 信息咨询
├── assets/img/             # Labubu 图片素材 (PNG/SVG/WebP)
└── generate_labubu_sizes.py  # 图片尺寸生成脚本
```

## 本地运行

```bash
# 任意静态服务器即可
python -m http.server 8765
# 或
npx serve .
```

## iOS 安装到主屏幕

1. 用 Safari 打开 https://labubu-wb.surge.sh
2. 点击分享按钮 → 「添加到主屏幕」
3. 全屏独立运行，支持离线使用
