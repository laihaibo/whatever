# 赚钱心得 · 嘴比饺子馅儿碎

> 把 B 站 UP 主「[嘴比饺子馅儿碎](https://space.bilibili.com/287487019)」的 23 条摆摊卖菜视频，拆解成一份可交互的「农村 MBA」销售课。

[![Deploy to GitHub Pages](https://github.com/laihaibo/whatever/actions/workflows/deploy.yml/badge.svg)](https://github.com/laihaibo/whatever/actions/workflows/deploy.yml)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![Node](https://img.shields.io/badge/Node-22-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)

**在线访问：https://laihaibo.github.io/whatever/**

## 这是什么

这位 UP 主把「返乡摆摊卖菜」拍成了一部连续剧式的销售课：集市成交术一～十、议价篇、砍价篇。本项目把全部视频的标题、简介与**完整语音转写文案**（共 9418 字）逐条精读后，提炼成结构化的赚钱心得，并做成一个 Apple Liquid Glass 风格的静态站点。

### 三大核心功能

| 模块 | 说明 |
|---|---|
| **① 场景应对向导** | 交互式决策（HTML 逐步点击）：遇到「只问价不下车」「拿竞品压价」等 18 个真实场景 → 该怎么判断 → 具体怎么做，每条链路都可查看来源 |
| **② 心得精读** | 42 条方法论，按 6 大分类筛选（成交心法 / 需求与场景 / 时机与控场 / 价格与议价 / 心理学工具箱 / 个人 IP），每条带三级置信度标注与可折叠的原文证据 |
| **③ 视频文案库** | 23 条视频的**对话体实录**：旁白、摊主、顾客角色已逐段人工标注，气泡排版一目了然；点击任意视频以弹窗阅读，时间戳可跳 B 站对应秒数 |

三大模块互通但不跳转：场景向导和心得证据里的「文字实录」按钮，直接弹出对应视频的对话体实录弹窗，读完即关。

### 站点其他页面

| 页面 | 说明 |
|---|---|
| **弹弓训练**（[/slingshot/](https://laihaibo.github.io/whatever/slingshot/)） | 为铝合金 9025 定制的 8 周弹弓系统训练计划：4 阶段渐进（基础定型 → 10 米精度 → 距离与角度 → 进阶精通），含交互打卡清单、扁皮筋配置速查表、常见错误纠正与教程资源库 |
| **汉服学习**（[/hanfu/](https://laihaibo.github.io/whatever/hanfu/)） | 交领右衽汉服设计制作 6 周入门计划：4 阶段渐进（形制扫盲 → 工具打版 → 第一件交领上襦 → 成套配色设计），含交互打卡清单、名词速查表、形制红线与避坑指南、全网整理的教程资源库（B 站 / 图文 / 书目 / 社区） |

两个页面均为纯静态、可交互打卡（进度存 localStorage），并已接入全站顶部导航。

## 数据与真实性

本项目的底线是**不编造**：

- 所有心得只基于视频**标题、简介与 ASR 转写文案**提炼，证据为原文引用（附视频号与时间区间）
- 置信度三级标注：`多视频交叉印证`（≥2 条视频支撑）/ `文案明确支撑`（单条明确阐述）/ `推断`（从发布模式与数据推断，页面有 ⚠ 角标）
- 转写由本地 faster-whisper 完成后，额外做了**对话体人工整理**：逐段标注「旁白·拆解 / 摊主 / 顾客 / 广告」角色、合并同角色语块、修正同音字（赶集→感激、买价→买家等），方言对白按语义转写（标注规则见 `data/transcripts-annotated.json` 的 meta）
- 1 条 AI 音乐视频无心得内容，已在数据中显式排除

## 数据管线

```
b23.tv 短链解析 → B 站公开接口采集（WBI 签名）→ 音频流下载 → 本地 whisper 转写 → 人工提炼心得 → 校验脚本 → 静态站点
```

| 脚本 | 说明 |
|---|---|
| `scripts/fetch-bili.mjs` | `/x/space/wbi/arc/search` 主路径（完整 WBI 签名实现，经官方测试向量验证；该接口对匿名请求有强风控，支持 `BILI_SESSDATA` 环境变量走登录态） |
| `scripts/enrich-views.mjs` | 逐 bvid 调 `/x/web-interface/view` 富化元数据（无需签名，实际采用的方案） |
| `scripts/download-audio.mjs` | 匿名 html5 playurl 下载音频流（host 白名单 + 退避重试 + 3-5s 随机间隔） |
| `scripts/transcribe.py` | faster-whisper small 本地转写（模型从 ModelScope 获取，含 PyAV 19 兼容补丁，支持断点续跑） |
| `scripts/validate-insights.mjs` | 校验心得数据完整性（证据 bvid 存在性、分类/置信度合法性、决策树引用） |

风控规避记录：`AI 字幕`被 UP 主关闭、`AI 总结`接口拒绝访问，因此转写走「音频下载 + 本地 ASR」旁路；`arc/search` 匿名被风控，bvid 清单改由真实浏览器渲染页面提取（见 `data/bvids.json`）。

## 快速开始

```bash
# 环境要求：Node 22+
npm install

# 本地开发
npm run dev          # http://localhost:3000/make-money

# 生产构建（静态导出到 out/）
npm run build
npx serve out        # 本地预览静态产物
```

> 站点部署在 GitHub Pages 项目路径下（`basePath: /whatever`），本地预览请使用 `npx serve out` 而非 `next start`。

### 重新采集数据（可选）

```bash
node scripts/download-audio.mjs                 # 下载 23 条音频（约 150MB → data/audio/）
python scripts/transcribe.py                    # 本地转写（模型约 480MB → data/whisper-model/）
node scripts/validate-insights.mjs              # 校验心得数据
```

## 项目结构

```
├── app/                    # Next.js App Router
│   ├── layout.tsx          # 根布局（zh-CN）
│   ├── page.tsx            # 入口跳转页（meta refresh）
│   ├── make-money/page.tsx # 主页面（Server Component，静态读入数据）
│   ├── slingshot/page.tsx  # 弹弓训练计划页
│   └── hanfu/page.tsx      # 汉服设计制作学习计划页
├── components/
│   ├── make-money/         # 业务组件
│   │   ├── site-shell.tsx          # 页面壳：三大模块 + 全局联动事件
│   │   ├── scenario-wizard.tsx     # 场景应对向导（HTML 交互式决策树）
│   │   ├── insights-explorer.tsx   # 心得精读（分类筛选 + 证据折叠）
│   │   ├── transcript-viewer.tsx   # 视频文案实录（时间戳跳转）
│   │   └── glass-hero.tsx          # 顶部统计
│   ├── site-nav.tsx        # 全站顶部导航（服务端组件，纯链接）
│   ├── slingshot/          # 弹弓训练计划（8 周 4 阶段打卡制）
│   │   └── training-plan.tsx
│   ├── hanfu/              # 汉服学习计划（交领右衽 6 周 4 阶段打卡制）
│   │   └── learning-plan.tsx
│   └── ui/                 # shadcn 风格基础组件
├── data/                   # 数据资产（采集与提炼产物）
│   ├── videos.json         # 23 条视频元数据（标题/简介/统计/封面）
│   ├── transcripts.json    # 23 条完整 ASR 转写文案（带时间戳分段）
│   └── insights.json       # 42 条心得 + 18 个决策场景（含证据引用）
├── scripts/                # 数据管线脚本
└── .github/workflows/      # GitHub Pages 部署（Node 22）
```

## 技术栈

Next.js 15（App Router，`output: 'export'` 静态导出）· React 19 · TypeScript 5 · Tailwind CSS 4 · framer-motion · faster-whisper（数据管线）

## 免责声明

- 本项目为个人学习与研究用途，与 UP 主无任何关联
- 所有内容基于公开视频信息的二手提炼，不构成投资或经营建议
- 带「推断」标注的心得为模式推断而非视频原话，请谨慎采用
- 请尊重 UP 主的著作权：引用请回溯原视频并注明出处

## 致谢

感谢 UP 主「[嘴比饺子馅儿碎](https://space.bilibili.com/287487019)」的持续创作——把集市摊位讲成了人人听得懂的商学院。[Bilibili-API-Collect](https://github.com/SocialSisterYi/bilibili-API-collect) 社区整理的接口文档让数据采集成为可能。

## License

[MIT](./LICENSE)
