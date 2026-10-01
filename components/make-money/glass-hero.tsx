"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export interface HeroStats {
  uname: string;
  videoCount: number;
  totalViews: number;
  totalLikes: number;
  insightCount: number;
  categoryCount: number;
  fetchedAt: string;
  sourceUrl: string;
}

function formatCount(n: number): string {
  if (n >= 100000000) return `${(n / 100000000).toFixed(2)} 亿`;
  if (n >= 10000) return `${(n / 10000).toFixed(1)} 万`;
  return n.toLocaleString("zh-CN");
}

const ease = [0.22, 1, 0.36, 1] as const;

/** 直接使用 initial/animate + 延迟，避免 variants 编排在 SSR 预渲染页面上不触发 */
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
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function GlassHero({ stats }: { stats: HeroStats }) {
  const chips = [
    { label: "视频", value: `${stats.videoCount} 条` },
    { label: "累计播放", value: formatCount(stats.totalViews) },
    { label: "累计点赞", value: formatCount(stats.totalLikes) },
    { label: "提炼心得", value: `${stats.insightCount} 条` },
    { label: "方法论分类", value: `${stats.categoryCount} 类` },
  ];

  return (
    <motion.header
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease }}
      className="glass-strong relative overflow-hidden p-8 sm:p-10"
    >
      {/* 装饰性柔光斑 */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-sky-300/40 to-blue-400/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-gradient-to-tr from-pink-300/35 to-violet-300/30 blur-3xl"
      />

      <div className="relative">
        <Reveal delay={0.08}>
          <p className="text-sm font-medium text-slate-500">B 站 UP 主 · 内容拆解企划</p>
        </Reveal>

        <Reveal delay={0.16}>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            赚钱心得
            <span className="ml-3 align-middle text-base font-normal text-slate-500">
              每一集都在讲「怎么把东西卖出去」
            </span>
          </h1>
        </Reveal>

        <Reveal delay={0.24}>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="glass" className="px-3 py-1 text-sm font-semibold text-slate-800">
              {stats.uname}
            </Badge>
            <Badge variant="glass" className="text-xs text-slate-600">
              bilibili 知名三农UP主
            </Badge>
            <a
              href={stats.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-500 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-slate-800"
            >
              前往空间 ↗
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.32}>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-600">
            把「返乡摆摊卖菜」拍成了一部连续剧式的销售课：集市成交术一～十、议价篇、砍价篇。
            本页基于全部 23 条视频的标题、简介与完整文案（本地 ASR 转写）逐条提炼，
            每条心得都附原文证据，可点回原视频。
          </p>
        </Reveal>

        <Reveal delay={0.4}>
          <div className="mt-6 flex flex-wrap gap-2.5">
            {chips.map((c) => (
              <div key={c.label} className="glass-chip px-4 py-2">
                <span className="text-xs text-slate-500">{c.label}</span>
                <span className="ml-2 text-sm font-semibold tabular-nums text-slate-800">{c.value}</span>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.48}>
          <p className="mt-4 text-xs text-slate-400">
            数据采集于 {stats.fetchedAt.slice(0, 10)} · 公开接口 + 页面文案，不含任何私信数据
          </p>
        </Reveal>
      </div>
    </motion.header>
  );
}
