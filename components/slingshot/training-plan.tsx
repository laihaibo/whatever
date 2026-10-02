"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

/** 入场只做位移不做透明度：内容永远可见（与 glass-hero 同策略） */
function Reveal({
  delay,
  children,
  className,
}: {
  delay: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ y: 14 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.55, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ---------------- 数据 ---------------- */

interface Stage {
  id: string;
  weeks: string;
  no: string;
  title: string;
  goal: string;
  points: string[];
  checks: string[];
  milestone: string;
}

const STAGES: Stage[] = [
  {
    id: "s1",
    no: "①",
    weeks: "第 1-2 周",
    title: "基础定型",
    goal: "5 米内把姿势固定下来",
    points: [
      "先练横握瞄打：瞄准直观、弹道可预期，是所有握法的地基",
      "后手定位：每次拉到同一个固定点（嘴角或颧骨），拉距固定是打准的第一因",
      "前手握而不死：支撑面稳定，微调靠转腰，不靠移动手臂",
      "弹丸统一：固定一款 8mm 钢珠或泥丸，不要混用",
      "每日 15-20 分钟足够，疲劳时练出来的全是坏习惯",
    ],
    checks: [
      "装好皮筋（2012 锥度 + 0.5mm 厚），确认两股等长、螺丝压牢",
      "空拉 50 次：只练后手归位到固定点，不击发",
      "3 米打易拉罐，完成 100 发适应性射击",
      "5 米鞋盒靶纸开始正式记录命中率",
      "建立训练笔记：每日发数、命中率、当天手感问题",
    ],
    milestone: "5 米 10 中 6",
  },
  {
    id: "s2",
    no: "②",
    weeks: "第 3-4 周",
    title: "10 米精度",
    goal: "把「每次都一样」变成肌肉记忆",
    points: [
      "瞄点标定：瞄点在皮筋延长线上，5-10 米的瞄点通常高于弓口约 10mm，用靶纸实测自己的实点",
      "主视眼瞄准：先测出主视眼，全程用主视眼对齐瞄点与目标",
      "呼吸控制：吸气—屏息—击发，换气时不出手",
      "转腰微调：对准目标靠腰部转动，前手保持不动",
      "每次换距离先试射 10 发找瞄点，再开始正式记录",
    ],
    checks: [
      "靶纸实测标定 5 米、10 米两个瞄点并记入笔记",
      "测主视眼，确认瞄准用的是主视眼",
      "完成 3 次 ×100 发的 10 米正式训练",
      "连续 2 次训练命中率达到 10 中 7",
      "录像自查：后手每次归位了吗？前手晃了吗？",
    ],
    milestone: "10 米 10 中 7",
  },
  {
    id: "s3",
    no: "③",
    weeks: "第 5-6 周",
    title: "距离与角度",
    goal: "15-20 米 + 仰俯角 + 风偏初识",
    points: [
      "弹道下坠：15 米起瞄点要明显抬高，逐距离实测补偿量并记录",
      "仰角俯角：高靶、低靶各打 50 发，理解角度对瞄点的影响",
      "多站位训练：换站位、换光照、换风向，别只练一个肌肉记忆点",
      "风偏初识：泥丸 10 米外受风影响明显，有风天记录偏移量",
      "开始管理皮筋寿命：记录换皮筋前的发数与手感变化",
    ],
    checks: [
      "15 米完成 3 次 ×100 发，命中率达到 10 中 5-6",
      "20 米完成 2 次 ×100 发，找到 20 米瞄点",
      "高低靶各 50 发，总结仰俯角修正口诀",
      "有风天实测风偏一次，记录风向与偏移量",
      "记录一次完整的皮筋寿命周期（装上到更换的发数）",
    ],
    milestone: "15 米 10 中 5-6",
  },
  {
    id: "s4",
    no: "④",
    weeks: "第 7-8 周",
    title: "进阶精通",
    goal: "斜握、无瞄估打与竞技检验",
    points: [
      "斜握瞄打：45° 斜握更省力更稳，从横握瞄点逐步迁移到斜握虚点",
      "无瞄估打入门：不瞄、凭感觉，从 5 米固定节奏开始，是「人弓合一」的路",
      "竞技检验：按竞技赛制用靶纸完整计分一场，检验真实水平",
      "装备管理：9025 螺丝快压换皮筋几分钟搞定，保持两股等长、按期更换",
      "毕业不是终点：进入「每周 2 次维持训练 + 每月一次计分赛」的精进节奏",
    ],
    checks: [
      "横握、斜握各 100 发对比，找到自己的斜握瞄点",
      "斜握 10 米命中率达到 10 中 6",
      "无瞄估打 5 米 100 发，体会节奏与直觉",
      "按竞技靶纸完整计分一场（≥30 发）",
      "独立完成换皮筋 + 调校全流程（两股等长、拉力对称）",
    ],
    milestone: "20 米 10 中 4+，斜握切换自如",
  },
];

const BAND_TABLE = {
  headers: ["用途", "锥度", "厚度", "原长", "弹丸", "要点"],
  rows: [
    {
      cells: ["新手 · 短拉", "2012（20-12mm）", "0.45-0.55mm", "15-18cm", "8mm 钢珠或泥丸", "拉力轻、容错高，先把动作练稳"],
      highlight: true,
    },
    { cells: ["进阶 · 中/大拉", "2515（25-15mm）", "0.65mm", "按拉距配", "9mm 钢珠", "威力大，姿态稳定后再上"], highlight: false },
    { cells: ["竞技打靶", "2012（20-12mm）", "0.65mm", "按赛制", "8-9mm 钢珠", "竞技赛场主流配置"], highlight: false },
  ],
};

const MISTAKES = [
  {
    symptom: "手抖、前手晃",
    cause: "支撑不稳、皮筋拉力过大、练太久疲劳",
    fix: "前手固定支撑，微调只靠转腰；换薄 0.05mm 的皮筋减拉力；每组休息，宁少勿疲",
  },
  {
    symptom: "近处准、远了飘",
    cause: "拉距不固定，每次初速不一样",
    fix: "后手钉死同一个定位点，拉满再打；录像自查归位，别凭感觉「差不多」",
  },
  {
    symptom: "总往一侧偏",
    cause: "用了非主视眼瞄准，或瞄点漂移",
    fix: "测主视眼并固定用它瞄；瞄点标定在皮筋延长线上，换距离就重新标",
  },
  {
    symptom: "弹丸乱飞、擦弓",
    cause: "捏兜手法不对，弹丸不居中",
    fix: "皮兜居中夹紧、弹丸垂直于皮筋；检查两股皮筋是否等长、是否拧劲",
  },
  {
    symptom: "新距离就打不中",
    cause: "弹道下坠没有补偿",
    fix: "距离每加 5 米先试射 10 发找新瞄点，记进笔记形成自己的补偿表",
  },
  {
    symptom: "皮筋寿命短、易断",
    cause: "拉伸过度、装偏、雨天暴晒",
    fix: "短拉拉伸比控制在 1:4.5-5.2；两股等长不拧劲；避光存放，起毛即换",
  },
];

const RESOURCES: {
  kind: "图文" | "视频";
  title: string;
  desc: string;
  url: string;
  site: string;
}[] = [
  {
    kind: "图文",
    title: "弹弓瞄准心法",
    desc: "弹弓要同时锁定 5 个维度（弓体、皮筋、拉距），系统讲透「转腰微调、呼吸击发」的心法",
    url: "https://zhuanlan.zhihu.com/p/267063713",
    site: "知乎专栏",
  },
  {
    kind: "图文",
    title: "弹弓怎么瞄准：方法与姿势图解",
    desc: "鞋盒做靶、画靶心、在弓上定瞄点的零基础图解流程",
    url: "https://zhuanlan.zhihu.com/p/614829982",
    site: "知乎专栏",
  },
  {
    kind: "图文",
    title: "从零开始：新手如何避免受伤并享受弹弓",
    desc: "每日 5-10 分钟起步、命中率超 60% 再升级距离的渐进训练法（本页计划的骨架来源）",
    url: "https://slingshot4funtw.org/2019/12/24/%E5%BD%88%E5%BC%93%E2%9C%94%E5%BE%9E%E9%9B%B6%E9%96%8B%E5%A7%8B%EF%BC%8C%E4%BA%AB%E5%8F%97%E3%80%8C%E5%BC%93%E8%B6%A3%E5%91%B3%E3%80%8Dfrom-zero-to-enjoy-slingshot-%E3%82%B9%E3%83%A9%E3%83%B3%E3%82%B0%E3%82%B7%E3%83%A7%E3%83%83%E3%83%88/",
    site: "弓趣味弹弓社",
  },
  {
    kind: "图文",
    title: "皮筋与钢珠配置参考表",
    desc: "厚薄皮筋与钢珠搭配的实测数据，配皮筋前先看这张表",
    url: "https://slingshot4funtw.org/2020/03/24/%E5%BC%93%E8%B6%A3%E5%91%B3%E5%8F%B0%E7%81%A3%E5%BD%88%E5%BC%93%E7%A4%BE%E2%9C%94%E7%9A%AE%E7%AD%8B%E8%88%87%E9%8B%BC%E7%8F%A0-%E9%85%8D%E7%BD%AE%E5%8F%83%E8%80%83%E8%A1%A8%E6%95%99%E5%AD%B8/",
    site: "弓趣味弹弓社",
  },
  {
    kind: "视频",
    title: "弹弓原理！新手看图打准弹弓",
    desc: "一张图讲清瞄准原理，练习三年不如看懂一张图",
    url: "https://www.bilibili.com/video/BV14h411T7VH",
    site: "bilibili",
  },
  {
    kind: "视频",
    title: "新手学弹弓：斜握瞄打要诀",
    desc: "斜握打不准的原因与要诀，阶段四的预习材料",
    url: "https://www.bilibili.com/video/BV13Q4y1q71S",
    site: "bilibili",
  },
  {
    kind: "视频",
    title: "握弓姿势和捏兜手法",
    desc: "横握、竖握、斜握三者的瞄点与打法对比，捏兜细节讲得最细",
    url: "https://www.bilibili.com/video/BV17v4y1V7si",
    site: "bilibili",
  },
  {
    kind: "视频",
    title: "解决新手玩弹弓手抖打不准",
    desc: "专门针对前手晃 / 手抖的纠正教程",
    url: "https://www.bilibili.com/video/BV1ia4y1L7Zk",
    site: "bilibili",
  },
  {
    kind: "视频",
    title: "弹弓练习的速成之法",
    desc: "高手练习方法总结：为什么近准远飘，如何科学提速",
    url: "https://www.bilibili.com/video/BV1d5411p71V",
    site: "bilibili",
  },
];

/* ---------------- 打卡清单（localStorage 持久化） ---------------- */

const STORAGE_KEY = "slingshot-training-progress-v1";

function useProgress() {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setDone(JSON.parse(raw));
    } catch {
      /* 隐私模式等场景静默降级为不持久化 */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(done));
    } catch {
      /* ignore */
    }
  }, [done, hydrated]);

  const toggle = (key: string) => setDone((prev) => ({ ...prev, [key]: !prev[key] }));
  return { done, toggle };
}

function StageChecklist({ stage }: { stage: Stage }) {
  const { done, toggle } = useProgress();
  const total = STAGES.reduce((acc, s) => acc + s.checks.length, 0);
  const doneCount = Object.values(done).filter(Boolean).length;

  return (
    <div className="mt-4 rounded-2xl border border-white/60 bg-white/40 p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-slate-800">阶段打卡</p>
        <p className="text-[11px] tabular-nums text-slate-500">
          全程进度 {doneCount}/{total} · 完成后自动保存在本机
        </p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-900/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-500 transition-[width] duration-500"
          style={{ width: `${total === 0 ? 0 : (doneCount / total) * 100}%` }}
        />
      </div>
      <ul className="mt-3 space-y-1.5">
        {stage.checks.map((item, i) => {
          const key = `${stage.id}:${i}`;
          const checked = Boolean(done[key]);
          return (
            <li key={key}>
              <label
                className={cn(
                  "flex cursor-pointer items-start gap-2.5 rounded-xl px-2.5 py-2 text-[13px] leading-relaxed transition-colors",
                  checked ? "text-slate-400" : "text-slate-700 hover:bg-white/60",
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(key)}
                  className="peer sr-only"
                />
                <span
                  aria-hidden
                  className={cn(
                    "mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold transition-colors",
                    checked
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-slate-300 bg-white/80 text-transparent",
                  )}
                >
                  ✓
                </span>
                <span className={cn(checked && "line-through decoration-slate-300")}>{item}</span>
              </label>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-800">
        <span aria-hidden>🚩</span>
        <span>
          <span className="font-semibold">进阶里程碑：</span>
          {stage.milestone}
          <span className="text-emerald-700/80">（达标再进入下一阶段，别跳级）</span>
        </span>
      </p>
    </div>
  );
}

/* ---------------- 页面主体 ---------------- */

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-medium tracking-wide text-slate-500">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h2>
    </div>
  );
}

export function TrainingPlan() {
  return (
    <div className="mt-6 space-y-6 sm:mt-8">
      {/* Hero */}
      <motion.header
        initial={{ y: 18 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease }}
        className="glass-strong relative overflow-hidden p-5 sm:p-10"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-emerald-300/40 to-teal-400/30 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-gradient-to-tr from-amber-300/35 to-orange-300/30 blur-3xl"
        />
        <div className="relative">
          <Reveal delay={0.08}>
            <p className="text-sm font-medium text-slate-500">竞技弹弓 · 8 周精进企划</p>
          </Reveal>
          <Reveal delay={0.16}>
            <h1 className="mt-2 text-[26px] font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl sm:leading-tight">
              弹弓训练计划
              <span className="mt-1.5 block text-sm font-normal text-slate-500 sm:ml-3 sm:mt-2 sm:inline sm:text-base">
                从 5 米上靶，到 20 米精通
              </span>
            </h1>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge variant="glass" className="px-3 py-1 text-sm font-semibold text-slate-800">
                盖世英雄 9025
              </Badge>
              <Badge variant="glass" className="text-xs text-slate-600">
                航空铝合金 · 扁皮筋快压
              </Badge>
              <Badge variant="glass" className="text-xs text-slate-600">
                支持短拉 / 中拉 / 大拉
              </Badge>
            </div>
          </Reveal>
          <Reveal delay={0.32}>
            <p className="mt-4 max-w-2xl text-[13px] leading-relaxed text-slate-600 sm:mt-5 sm:text-sm">
              为铝合金 9025 定制的 8 周系统计划：4 个阶段、每阶段 2 周，
              命中率达标才进阶。核心只有一句话——
              <span className="font-semibold text-slate-800">
                固定的姿势 + 固定的拉距 + 固定的弹丸，剩下的交给发数。
              </span>
            </p>
          </Reveal>
          <Reveal delay={0.4}>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-6 sm:flex sm:flex-wrap sm:gap-2.5">
              {[
                { label: "周期", value: "8 周 · 4 阶段" },
                { label: "每日", value: "15-30 分钟" },
                { label: "起点", value: "5 米易拉罐" },
                { label: "毕业", value: "20 米 10 中 4+" },
              ].map((c) => (
                <div key={c.label} className="glass-chip px-3.5 py-2 sm:px-4">
                  <span className="text-xs text-slate-500">{c.label}</span>
                  <span className="ml-2 text-sm font-semibold tabular-nums text-slate-800">{c.value}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </motion.header>

      {/* 安全与法律红线 */}
      <Reveal delay={0.1}>
        <section className="glass p-5 sm:p-8" aria-labelledby="safety">
          <SectionHeading eyebrow="开始之前，先立规矩" title="⚠️ 安全与法律红线" />
          <div id="safety" className="space-y-2.5 text-[13px] leading-relaxed text-slate-700 sm:text-sm">
            <p className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-red-800">
              <span className="font-semibold">弹弓不是管制器具，持有合法；但用错场景可能违法甚至犯罪。</span>
              禁猎区、禁猎期打鸟可触犯《刑法》第 341 条非法狩猎罪，麻雀等「三有」动物同样受保护。
            </p>
            <ul className="space-y-2">
              {[
                "严禁打鸟和一切野生动物，不因「没打中」「就一只」心存侥幸",
                "只在空旷安全场地对固定靶练习：荒地、自家院落、合规射箭/弹弓场馆",
                "人口密集区、公园、居民区、道路附近一律不出手；不对人、车辆、建筑玻璃瞄准",
                "靶位后方设置挡弹背板或挡弹幕布，射出去的弹丸要能找回来",
                "佩戴护目镜；皮筋起毛、开裂立即更换，防止回抽伤手",
                "未成年人须在成人监护下使用",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </Reveal>

      {/* 8 周计划 */}
      <section aria-label="8 周训练计划" className="space-y-4">
        <Reveal delay={0.05}>
          <div className="px-1 sm:px-2">
            <SectionHeading eyebrow="主线任务 · 命中率达标才进阶" title="8 周 · 4 阶段训练计划" />
          </div>
        </Reveal>

        {/* 阶段速览条 */}
        <Reveal delay={0.1}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5">
            {STAGES.map((s) => (
              <div key={s.id} className="glass-chip px-3.5 py-2.5">
                <p className="text-[11px] text-slate-500">
                  {s.no} {s.weeks}
                </p>
                <p className="text-[13px] font-semibold text-slate-800">{s.title}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {STAGES.map((stage, idx) => (
          <Reveal key={stage.id} delay={0.06}>
            <article className="glass glass-sheen p-5 sm:p-8">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-lg font-bold text-slate-900 sm:text-xl">
                  {stage.no} {stage.title}
                </span>
                <Badge variant="glass" className="text-[11px] text-slate-600">
                  {stage.weeks}
                </Badge>
                <span className="w-full text-[13px] text-slate-500 sm:w-auto sm:text-sm">
                  目标：{stage.goal}
                </span>
              </div>

              <div className="mt-4 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
                <div>
                  <p className="text-sm font-semibold text-slate-800">训练要点</p>
                  <ul className="mt-2 space-y-2 text-[13px] leading-relaxed text-slate-700 sm:text-sm">
                    {stage.points.map((p) => (
                      <li key={p} className="flex items-start gap-2.5">
                        <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <StageChecklist stage={stage} />
              </div>
            </article>
          </Reveal>
        ))}
      </section>

      {/* 皮筋配置速查 */}
      <Reveal delay={0.08}>
        <section className="glass p-5 sm:p-8" aria-labelledby="band-config">
          <SectionHeading eyebrow="装备课 · 9025 用扁皮筋" title="皮筋配置速查表" />
          <div id="band-config" className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-[13px]">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  {BAND_TABLE.headers.map((h) => (
                    <th key={h} className="border-b border-slate-900/10 px-3 py-2 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BAND_TABLE.rows.map((row) => (
                  <tr
                    key={row.cells[0]}
                    className={cn("text-slate-700", row.highlight && "bg-sky-400/10 font-medium")}
                  >
                    {row.cells.map((cell, i) => (
                      <td key={i} className="border-b border-slate-900/5 px-3 py-2.5 align-top">
                        {i === 0 ? <span className="text-slate-900">{cell}</span> : cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="mt-4 space-y-2 text-[13px] leading-relaxed text-slate-700 sm:text-sm">
            <li className="flex items-start gap-2.5">
              <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
              <span>
                新手就用高亮行：<span className="font-medium text-slate-900">2012 锥度 + 0.5mm 厚 + 8mm 钢珠</span>，
                短拉拉伸比控制在 1:4.5-5.2（原长 15-18cm）
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
              <span>
                8mm 钢珠是中拉力皮筋的黄金平衡点：够重压得住晃动，又够小保初速；泥丸更安全适合近距离练，但风大会漂
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
              <span>皮筋越薄初速越高但寿命越短；换皮筋务必两股等长、螺丝压牢，9025 快压结构几分钟即可完成</span>
            </li>
          </ul>
        </section>
      </Reveal>

      {/* 常见错误对照 */}
      <Reveal delay={0.08}>
        <section className="glass p-5 sm:p-8" aria-labelledby="mistakes">
          <SectionHeading eyebrow="纠错手册 · 打不准先对号入座" title="常见错误与纠正" />
          <div id="mistakes" className="grid gap-3 sm:grid-cols-2">
            {MISTAKES.map((m) => (
              <div key={m.symptom} className="rounded-2xl border border-white/60 bg-white/40 p-4">
                <p className="text-sm font-semibold text-slate-900">😩 {m.symptom}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">
                  <span className="font-medium text-slate-700">根因：</span>
                  {m.cause}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-600">
                  <span className="font-medium text-emerald-700">纠正：</span>
                  {m.fix}
                </p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* 教程资源库 */}
      <Reveal delay={0.08}>
        <section className="glass p-5 sm:p-8" aria-labelledby="resources">
          <SectionHeading eyebrow="继续深挖 · 本页计划的信息来源" title="教程资源库" />
          <div id="resources" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {RESOURCES.map((r) => (
              <a
                key={r.url}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-sheen group rounded-2xl border border-white/60 bg-white/40 p-4 transition-shadow hover:shadow-[0_8px_28px_rgba(31,38,135,0.12)]"
              >
                <div className="flex items-center gap-2">
                  <Badge
                    variant="glass"
                    className={cn(
                      "text-[11px]",
                      r.kind === "视频" ? "text-rose-600" : "text-sky-700",
                    )}
                  >
                    {r.kind}
                  </Badge>
                  <span className="text-[11px] text-slate-400">{r.site}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-900 group-hover:underline group-hover:decoration-slate-300 group-hover:underline-offset-4">
                  {r.title} <span aria-hidden>↗</span>
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-slate-500">{r.desc}</p>
              </a>
            ))}
          </div>
        </section>
      </Reveal>

      {/* 页脚说明 */}
      <footer className="px-1 pb-2 sm:px-2">
        <div className="glass p-6 text-xs leading-relaxed text-slate-500">
          <p className="font-medium text-slate-600">说明</p>
          <p className="mt-2">
            本页基于公开教程与竞技数据整理（知乎专栏、弓趣味弹弓社、B 站教学视频等，见上方资源库），
            结合 9025 盖世英雄（航空铝合金、螺丝快压扁皮筋）的装备特性编排。命中率标准参考了
            「60% 命中率再升级距离」「10 米 10 中 7-8 再练角度」等主流渐进训练法，个体差异请自行微调节奏。
          </p>
          <p className="mt-2">
            再次提醒：只在合法安全场地对固定靶练习，
            <span className="font-medium text-slate-600">严禁打鸟及任何野生动物</span>。
            打卡进度仅保存在你自己的浏览器本地（localStorage），不上传任何数据。
          </p>
        </div>
      </footer>
    </div>
  );
}
