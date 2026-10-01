"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Category, Confidence, EvidenceItem, Insight } from "@/lib/types";

export interface VideoRef {
  title: string;
  url: string;
  pubdateISO: string | null;
}

/** 分类色 → Tailwind 静态类映射（保证 JIT 扫描到） */
const categoryTone: Record<string, { chip: string; dot: string }> = {
  blue: { chip: "bg-blue-500/12 text-blue-700 ring-1 ring-blue-500/25", dot: "bg-blue-500" },
  green: { chip: "bg-emerald-500/12 text-emerald-700 ring-1 ring-emerald-500/25", dot: "bg-emerald-500" },
  amber: { chip: "bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/25", dot: "bg-amber-500" },
  rose: { chip: "bg-rose-500/12 text-rose-700 ring-1 ring-rose-500/25", dot: "bg-rose-500" },
  violet: { chip: "bg-violet-500/12 text-violet-700 ring-1 ring-violet-500/25", dot: "bg-violet-500" },
  cyan: { chip: "bg-cyan-500/12 text-cyan-700 ring-1 ring-cyan-500/25", dot: "bg-cyan-500" },
};

const confidenceMeta: Record<Confidence, { label: string; tone: string }> = {
  high: { label: "多视频交叉印证", tone: "bg-emerald-500/12 text-emerald-700 ring-1 ring-emerald-500/25" },
  medium: { label: "文案明确支撑", tone: "bg-sky-500/12 text-sky-700 ring-1 ring-sky-500/25" },
  inferred: { label: "推断", tone: "bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/30" },
};

const fieldLabel: Record<EvidenceItem["field"], string> = {
  title: "标题",
  description: "简介",
  transcript: "视频文案",
};

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function EvidenceRow({ ev, video }: { ev: EvidenceItem; video?: VideoRef }) {
  return (
    <li className="flex items-start gap-2.5">
      <span
        aria-hidden
        className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400/70 ring-1 ring-white/60"
      />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-relaxed text-slate-600">「{ev.quote}」</p>
        <a
          href={video?.url ?? `https://www.bilibili.com/video/${ev.bvid}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-400 transition-colors hover:text-blue-600"
          title={video?.title}
        >
          ▶ {fieldLabel[ev.field]} · {ev.bvid}
          {ev.t ? ` · ${fmtTime(ev.t[0])}–${fmtTime(ev.t[1])}` : ""}
        </a>
      </div>
    </li>
  );
}

function InsightCard({
  insight,
  category,
  videoMap,
}: {
  insight: Insight;
  category: Category;
  videoMap: Record<string, VideoRef>;
}) {
  const tone = categoryTone[category.color] ?? categoryTone.blue;
  const conf = confidenceMeta[insight.confidence];

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.96, y: 18 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      whileHover={{ y: -4 }}
      className="glass glass-sheen flex h-full flex-col p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", tone.chip)}>
          <span aria-hidden>{category.icon}</span>
          {category.name}
        </span>
        <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", conf.tone)}>
          {insight.confidence === "inferred" && "⚠ "}
          {conf.label}
        </span>
      </div>

      <h3 className="mt-3 text-[17px] font-semibold leading-snug text-slate-900">{insight.title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{insight.summary}</p>

      {insight.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {insight.tags.map((t) => (
            <Badge key={t} variant="secondary" className="text-[11px]">
              {t}
            </Badge>
          ))}
        </div>
      )}

      {insight.note && (
        <p className="mt-3 rounded-xl bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-800 ring-1 ring-amber-500/20">
          {insight.note}
        </p>
      )}

      <div className="mt-auto pt-4">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">原文证据</p>
        <ul className="space-y-2.5">
          {insight.evidence.map((ev, i) => (
            <EvidenceRow key={`${insight.id}-${i}`} ev={ev} video={videoMap[ev.bvid]} />
          ))}
        </ul>
      </div>
    </motion.article>
  );
}

export function InsightsExplorer({
  categories,
  insights,
  videoMap,
}: {
  categories: Category[];
  insights: Insight[];
  videoMap: Record<string, VideoRef>;
}) {
  const [active, setActive] = useState<string>("all");

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: insights.length };
    for (const c of categories) map[c.id] = insights.filter((i) => i.categoryId === c.id).length;
    return map;
  }, [categories, insights]);

  const filtered = active === "all" ? insights : insights.filter((i) => i.categoryId === active);

  return (
    <section className="mt-10" aria-label="赚钱心得列表">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActive("all")}
          className={cn(
            "glass-chip px-4 py-2 text-sm font-medium transition-all",
            active === "all"
              ? "bg-white/75 text-slate-900 shadow-[0_4px_16px_rgba(31,38,135,0.12)]"
              : "text-slate-600 hover:bg-white/50",
          )}
        >
          全部 <span className="ml-1 text-xs tabular-nums text-slate-400">{counts.all}</span>
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActive(c.id)}
            className={cn(
              "glass-chip px-4 py-2 text-sm font-medium transition-all",
              active === c.id
                ? "bg-white/75 text-slate-900 shadow-[0_4px_16px_rgba(31,38,135,0.12)]"
                : "text-slate-600 hover:bg-white/50",
            )}
          >
            <span aria-hidden className="mr-1">
              {c.icon}
            </span>
            {c.name} <span className="ml-1 text-xs tabular-nums text-slate-400">{counts[c.id]}</span>
          </button>
        ))}
      </div>

      <motion.div layout className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((insight) => {
            const category =
              categories.find((c) => c.id === insight.categoryId) ??
              ({ id: insight.categoryId, name: insight.categoryId, icon: "•", color: "blue", description: "" } as Category);
            return (
              <InsightCard
                key={insight.id}
                insight={insight}
                category={category}
                videoMap={videoMap}
              />
            );
          })}
        </AnimatePresence>
      </motion.div>

      {filtered.length === 0 && (
        <p className="mt-10 text-center text-sm text-slate-400">该分类暂无心得</p>
      )}
    </section>
  );
}
