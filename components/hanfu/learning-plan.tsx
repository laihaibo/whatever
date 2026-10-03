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
    weeks: "第 1 周",
    title: "形制扫盲与审美输入",
    goal: "分清「交领右衽」和影楼装，建起自己的参考图库",
    points: [
      "认准核心特征：左襟压右襟、衣襟向右掩（上身呈小写 y 字），配平面裁剪、前后中缝、系带固定",
      "红线先立：右衽是生者衣，左衽是逝者衣——方向裁错整件报废",
      "只认交领：晋制襦裙、明制道袍/直身、深衣制（曲裾）都属交领系；对襟褙子、立领袄、圆领袍不在本计划内",
      "审美输入每天 20 分钟：出土文物图 > 服饰史考据文 > 影视剧照，商家详情图只看不禁",
      "建「形制档案」：每张参考图标注朝代、形制、出土或文献来源，攒 30 张起步",
    ],
    checks: [
      "读完一篇形制谱系综述（推荐汉服荟「形制谱系全解」，见文末资源库）",
      "能一句话讲清交领右衽与对襟、立领、圆领的区别",
      "建立 30+ 张参考图收藏夹，且每张标注了形制与来源",
      "挑一套影楼装/汉元素，指出它至少两处形制问题（领型、混搭或面料）",
      "定下自己的第一套目标：晋制襦裙，或中衣 + 直身练手线",
    ],
    milestone: "能独立判断一件衣服是不是形制正确的交领右衽",
  },
  {
    id: "s2",
    no: "②",
    weeks: "第 2 周",
    title: "工具、布料与打版",
    goal: "买齐工具，画出自己尺码的第一张交领上襦裁剪图",
    points: [
      "工具从简起步：软尺、划粉、长尺、布剪、珠针、熨斗即可；缝纫机不是必需，手缝来去缝是入门基本功",
      "第一件用棉/棉麻练手：便宜、挺括、服帖；真丝雪纺留到第三件以后",
      "汉服是平面裁剪、无省道：宽松全靠裁剪图里的放量，别拿西式收腰思维来改",
      "量体只记这几个数：颈围、胸围、衣长、袖长、袖根宽、腰围、裙长",
      "打版先抄后改：从爱汉服、贴吧「汉服制作研习吧」找现成裁剪图，再按自己的尺码换算",
    ],
    checks: [
      "集齐工具清单（含手缝针线或缝纫机，任选其一）",
      "完成量体并把 7 个数据记入笔记",
      "抄绘一张交领上襦裁剪图，按自己尺码完成换算并标注缝份（统一 1cm）",
      "用旧床单或报纸 1:1 拼出纸样，核对襟线交叠方向为左襟压右襟",
      "买好第一块练手布（2-3 米棉布，先做中衣）",
    ],
    milestone: "交出一张可执行的交领上襦裁剪图（含尺码与缝份标注）",
  },
  {
    id: "s3",
    no: "③",
    weeks: "第 3-4 周",
    title: "第一件：交领中衣与上襦",
    goal: "把纸样变成能穿出门的第一件交领上衣",
    points: [
      "先做中衣再走上襦：中衣是版型的试衣间，所有打版错误在旧床单上暴露最便宜",
      "直线平缝，会摩擦的边全用来去缝（正对正缝一次、修剪后反对反再缝一次），无锁边机也干净",
      "上袖是新手第一坑：袖山先疏缝一圈再正式车缝，前后袖窿的对位记号裁剪时就打",
      "领缘与襟缘用同一条贴边连续翻烫，交领的 y 字挺不挺全看这段",
      "系带钉在腋下：左襟系带藏内、右襟系带外露，各留 40cm 以上，系紧后 y 字才不滑开",
    ],
    checks: [
      "用旧布完成中衣试制，试穿并记录版型问题（肩宽/袖根/衣长）",
      "改出 v2 纸样：把试制暴露的问题全部回改到图上",
      "正式布完成交领上襦，所有毛边用平缝 + 来去缝处理",
      "上袖无褶皱，领缘襟缘翻烫平直，y 字左右对称",
      "钉好两对系带，上身实测右衽方向正确（左襟在右襟之上）",
    ],
    milestone: "一件能穿出门的交领上襦，拍照存进「作品集」",
  },
  {
    id: "s4",
    no: "④",
    weeks: "第 5-6 周",
    title: "成套与配色设计",
    goal: "做完下裙，完成第一套有设计感的交领穿搭",
    points: [
      "下裙选八破裙（间色破裙）：两片式布片拼接打褶，工艺只有裁直、拼准、褶匀三件事",
      "间色是晋制的灵魂：裙片两色交替（如杏色 × 绛红），全套主色不超过 3 个",
      "设计三原则：裙深则襦浅、缘边与裙中一色呼应、全身只留一个视觉重点",
      "腰襕别省：襦与腰襕分色既是晋制的形制特征，也是搭配的层次所在",
      "完整穿搭 = 中衣 + 上襦 + 破裙 + 腰带 + 鞋，成套拍照并写复盘",
    ],
    checks: [
      "完成八破裙：拼接缝份对齐、褶距均匀、裙头牢固",
      "试穿调整裙长与腰头，行走时下摆不拖地",
      "先画配色小样（布片或色卡）再下单买布，主色 ≤ 3",
      "全套穿搭完整出门一次（或正式拍摄一套照片）",
      "写 300 字复盘：下一件做明制道袍还是深衣？暗摆、续衽钩边各要先查哪些资料",
    ],
    milestone: "第一套完整交领右衽穿搭成衣 + 复盘笔记",
  },
];

/** 名词速查表：读教程时随手对照 */
const TERMS = {
  headers: ["名词", "含义"],
  rows: [
    { cells: ["右衽", "左襟压住右襟、衣襟向右掩，汉服核心形制特征；反之为左衽（逝者衣）"], highlight: true },
    { cells: ["中缝", "衣片前后正中的拼接缝线，平面裁剪汉服的身份标志"], highlight: false },
    { cells: ["续衽", "把衣襟加长延展以便交掩的工艺，《礼记》深衣「续衽钩边」即指此"], highlight: false },
    { cells: ["腰襕", "上襦下缘另接的一道横条布，晋制襦与裙衔接的分色特征"], highlight: false },
    { cells: ["破裙", "多幅梯形布片拼接的褶裙，「八破」即 8 片；两色交替称间色裙"], highlight: false },
    { cells: ["暗摆", "明制道袍下摆的内置摆结构，是道袍区别于直裰、直身的核心细节"], highlight: false },
    { cells: ["来去缝", "正面相对缝一次、修剪后反面相对再缝一次的无毛边缝法，新手救星"], highlight: false },
    { cells: ["打版 / 制图", "按量体数据画裁剪图；汉服为平面裁剪，无需西式省道"], highlight: false },
  ],
};

/** 避坑清单：翻车现场与急救 */
const MISTAKES = [
  {
    symptom: "做出来是左衽",
    cause: "裁剪时把襟线方向画反，或拼裁片时左右摆错",
    fix: "下剪前先用纸样拼一遍确认「左襟压右襟」；发现即拆，缝完才改等于重做",
  },
  {
    symptom: "交领 y 字滑开露里衣",
    cause: "衣襟延展量（续衽）不够，或系带位置太高",
    fix: "加大续衽量、系带下移到腋下，系紧后再照镜确认交叠稳定",
  },
  {
    symptom: "袖山皱成包子",
    cause: "袖山与袖窿没打对位记号，缝份忽大忽小",
    fix: "裁剪时先打前后袖窿记号，疏缝固定一圈再正式车缝",
  },
  {
    symptom: "裙子拖地显矮",
    cause: "裙长照抄网店尺寸，没按自己的实际腰线量",
    fix: "从自己腰线量到地面再减 3-5cm，穿好后裙缘应近足面而不扫地",
  },
  {
    symptom: "成衣洗一次就变形",
    cause: "布料没有预缩就裁剪",
    fix: "任何布下水洗 + 晾干 + 熨平之后再下剪，棉麻尤甚",
  },
  {
    symptom: "做出来像戏服 / 影楼装",
    cause: "颜色过多、雪纺亮片反光面料、不同朝代部件混搭",
    fix: "收敛到 2-3 个哑光主色，单套只穿同一朝代形制的部件",
  },
];

const RESOURCES: {
  kind: "视频" | "图文" | "书目" | "社区";
  title: string;
  desc: string;
  url: string;
  site: string;
}[] = [
  {
    kind: "图文",
    title: "汉服荟 · 形制谱系全解",
    desc: "从晋制到明制的形制谱系综述，阶段①的必读综述，道袍暗摆等结构讲得清楚",
    url: "https://www.hanfuge.com",
    site: "汉服荟",
  },
  {
    kind: "图文",
    title: "爱汉服 · 汉服裁剪制图合集",
    desc: "大量现成裁剪图与褶裙教程，阶段②「先抄后改」的抄图来源",
    url: "https://www.aihanfu.com",
    site: "爱汉服",
  },
  {
    kind: "图文",
    title: "手工客 · 交领上襦制作教程",
    desc: "棉质交领上襦全过程图文，中缝、右衽、平面裁剪三特征对照实操",
    url: "https://www.ishougongke.com",
    site: "手工客",
  },
  {
    kind: "社区",
    title: "百度贴吧 · 汉服制作研习吧",
    desc: "网友裁剪图与翻车帖的大本营，搜「交领」「晋制」「裁剪图」收获最大",
    url: "https://tieba.baidu.com/f?kw=汉服制作研习",
    site: "百度贴吧",
  },
  {
    kind: "社区",
    title: "知乎 · 交领汉服制作经验帖",
    desc: "搜「交领上襦 裁剪」「晋制 制作」，步骤拆解与避坑经验最集中",
    url: "https://www.zhihu.com/search?type=content&q=交领上襦 裁剪",
    site: "知乎",
  },
  {
    kind: "视频",
    title: "B 站搜索：交领上襦制作",
    desc: "「汉服制作 交领上襦」「上襦缝纫过程」都有全程实录，上袖前先看一遍",
    url: "https://search.bilibili.com/all?keyword=汉服制作 交领上襦",
    site: "bilibili",
  },
  {
    kind: "视频",
    title: "B 站搜索：晋制汉服制作",
    desc: "阶段④预习：晋制襦裙、腰襕工艺的完整制作视频合集",
    url: "https://search.bilibili.com/all?keyword=晋制汉服 制作",
    site: "bilibili",
  },
  {
    kind: "视频",
    title: "B 站搜索：八破裙教程",
    desc: "间色破裙的拼接与打褶全过程，阶段④的下裙主力教程",
    url: "https://search.bilibili.com/all?keyword=八破裙 教程",
    site: "bilibili",
  },
  {
    kind: "书目",
    title: "《汉服制作专业图解教程》刘西西",
    desc: "人民邮电出版社，逐件图解制图与缝制流程，适合当案头工具书",
    url: "https://search.douban.com/book/subject_search?search_text=汉服制作专业图解教程",
    site: "豆瓣读书",
  },
  {
    kind: "书目",
    title: "《美人罗裳：汉服制作专业教程》顾小思",
    desc: "人民邮电出版社，多款汉服从量体到成衣的完整案例，新手友好",
    url: "https://search.douban.com/book/subject_search?search_text=美人罗裳 汉服制作",
    site: "豆瓣读书",
  },
];

/* ---------------- 打卡清单（localStorage 持久化） ---------------- */

const STORAGE_KEY = "hanfu-learning-progress-v1";

/**
 * 状态提升：整个页面只调用一次 useProgress，
 * 各阶段清单共享同一份进度（避免逐实例调用导致计数不同步）。
 */
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

function StageChecklist({
  stage,
  done,
  toggle,
  doneCount,
  total,
}: {
  stage: Stage;
  done: Record<string, boolean>;
  toggle: (key: string) => void;
  doneCount: number;
  total: number;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-white/60 bg-white/40 p-4 sm:p-5 lg:mt-0">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-slate-800">阶段打卡</p>
        <p className="text-[11px] tabular-nums text-slate-500">
          全程进度 {doneCount}/{total} · 完成后自动保存在本机
        </p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-900/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-rose-400 to-red-500 transition-[width] duration-500"
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

export function LearningPlan() {
  const { done, toggle } = useProgress();
  const total = STAGES.reduce((acc, s) => acc + s.checks.length, 0);
  const doneCount = Object.values(done).filter(Boolean).length;

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
          className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-rose-300/40 to-red-300/30 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-gradient-to-tr from-amber-300/35 to-orange-300/30 blur-3xl"
        />
        <div className="relative">
          <Reveal delay={0.08}>
            <p className="text-sm font-medium text-slate-500">汉服手作 · 交领右衽 6 周入门企划</p>
          </Reveal>
          <Reveal delay={0.16}>
            <h1 className="mt-2 text-[26px] font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl sm:leading-tight">
              汉服设计制作入门
              <span className="mt-1.5 block text-sm font-normal text-slate-500 sm:ml-3 sm:mt-2 sm:inline sm:text-base">
                只认交领右衽，从形制到成衣
              </span>
            </h1>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge variant="glass" className="px-3 py-1 text-sm font-semibold text-slate-800">
                交领右衽
              </Badge>
              <Badge variant="glass" className="text-xs text-slate-600">
                主线 · 晋制襦裙
              </Badge>
              <Badge variant="glass" className="text-xs text-slate-600">
                平面裁剪 · 无省道
              </Badge>
            </div>
          </Reveal>
          <Reveal delay={0.32}>
            <p className="mt-4 max-w-2xl text-[13px] leading-relaxed text-slate-600 sm:mt-5 sm:text-sm">
              6 周上手交领右衽的设计与制作：4 个阶段，每阶段交付一件实物或一次实测，达标才进阶。
              核心只有一句话——
              <span className="font-semibold text-slate-800">
                先把形制做对，再谈配色设计；方向（右衽）错了，缝得再好也是废件。
              </span>
            </p>
          </Reveal>
          <Reveal delay={0.4}>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-6 sm:flex sm:flex-wrap sm:gap-2.5">
              {[
                { label: "周期", value: "6 周 · 4 阶段" },
                { label: "投入", value: "每周 3-5 小时" },
                { label: "起点", value: "一件旧布中衣" },
                { label: "毕业", value: "第一套交领穿搭" },
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

      {/* 形制红线 */}
      <Reveal delay={0.1}>
        <section className="glass p-5 sm:p-8" aria-labelledby="rules">
          <SectionHeading eyebrow="开始之前，先立规矩" title="⚠️ 形制红线" />
          <div id="rules" className="space-y-2.5 text-[13px] leading-relaxed text-slate-700 sm:text-sm">
            <p className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-red-800">
              <span className="font-semibold">右衽是底线：左襟压右襟为右衽（生者衣），左衽是逝者衣。</span>
              裁剪方向错了不是瑕疵，是整件报废——下剪前永远先用纸样拼一遍。
            </p>
            <ul className="space-y-2">
              {[
                "只认交领右衽：对襟（褙子、宋制衫）、立领（明制袄）、圆领袍（唐制）不在本计划内",
                "拒绝朝代混搭：晋制上襦别配明制马面，单套只穿同一形制体系的部件",
                "直裾慎入：直裾深衣文物依据薄弱、圈内争议大，网上现货多为影楼版型，入门先绕开",
                "拒绝影楼装配方：雪纺 + 亮片 + 夸张大袖 + 乱系带 = 戏服；哑光天然面料 + 形制正确才是汉服",
                "所有布料先下水预缩、晾干熨平再裁剪，棉麻尤甚",
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

      {/* 6 周计划 */}
      <section aria-label="6 周学习计划" className="space-y-4">
        <Reveal delay={0.05}>
          <div className="px-1 sm:px-2">
            <SectionHeading eyebrow="主线任务 · 交付达标才进阶" title="6 周 · 4 阶段学习计划" />
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

        {STAGES.map((stage) => (
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
                  <p className="text-sm font-semibold text-slate-800">学习要点</p>
                  <ul className="mt-2 space-y-2 text-[13px] leading-relaxed text-slate-700 sm:text-sm">
                    {stage.points.map((p) => (
                      <li key={p} className="flex items-start gap-2.5">
                        <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <StageChecklist
                  stage={stage}
                  done={done}
                  toggle={toggle}
                  doneCount={doneCount}
                  total={total}
                />
              </div>
            </article>
          </Reveal>
        ))}
      </section>

      {/* 名词速查 */}
      <Reveal delay={0.08}>
        <section className="glass p-5 sm:p-8" aria-labelledby="terms">
          <SectionHeading eyebrow="术语课 · 读教程前先混个脸熟" title="名词速查表" />
          <div id="terms" className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-[13px]">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  {TERMS.headers.map((h) => (
                    <th key={h} className="border-b border-slate-900/10 px-3 py-2 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TERMS.rows.map((row) => (
                  <tr
                    key={row.cells[0]}
                    className={cn("text-slate-700", row.highlight && "bg-rose-400/10 font-medium")}
                  >
                    {row.cells.map((cell, i) => (
                      <td key={i} className="border-b border-slate-900/5 px-3 py-2.5 align-top">
                        {i === 0 ? <span className="whitespace-nowrap text-slate-900">{cell}</span> : cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="mt-4 space-y-2 text-[13px] leading-relaxed text-slate-700 sm:text-sm">
            <li className="flex items-start gap-2.5">
              <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
              <span>
                新手顺序固定：<span className="font-medium text-slate-900">中衣 → 上襦 → 下裙 → 成套</span>，
                每一件都是下一件的版型基础，跳步省下的时间会在拆线时加倍还回去
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
              <span>缝份统一 1cm 并画在纸样上；所有裁片先打对位记号再缝合，上袖尤其如此</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
              <span>汉服没有省道：宽松感全靠裁剪图里的放量，别拿西式收腰思维改版</span>
            </li>
          </ul>
        </section>
      </Reveal>

      {/* 避坑清单 */}
      <Reveal delay={0.08}>
        <section className="glass p-5 sm:p-8" aria-labelledby="mistakes">
          <SectionHeading eyebrow="急救手册 · 翻车先对号入座" title="常见翻车与纠正" />
          <div id="mistakes" className="grid gap-3 sm:grid-cols-2">
            {MISTAKES.map((m) => (
              <div key={m.symptom} className="rounded-2xl border border-white/60 bg-white/40 p-4">
                <p className="text-sm font-semibold text-slate-900">😰 {m.symptom}</p>
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
                      r.kind === "视频" && "text-rose-600",
                      r.kind === "图文" && "text-sky-700",
                      r.kind === "书目" && "text-violet-700",
                      r.kind === "社区" && "text-emerald-700",
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
            本页基于公开教程与社区资源整理（汉服荟、爱汉服、手工客、百度贴吧「汉服制作研习吧」、
            B 站教学视频，以及刘西西《汉服制作专业图解教程》、顾小思《美人罗裳》等书目，见上方资源库）。
            形制标准以出土文物与服饰史研究为准；有争议的形制（如直裾）请先自行查阅考据资料再决定是否制作。
          </p>
          <p className="mt-2">
            进阶方向：明制道袍（重点啃暗摆结构）→ 深衣制曲裾（续衽钩边）。
            打卡进度仅保存在你自己的浏览器本地（localStorage），不上传任何数据。
          </p>
        </div>
      </footer>
    </div>
  );
}
