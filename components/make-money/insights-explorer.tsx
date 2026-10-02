"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { bilibiliUrl, cn, formatTime } from "@/lib/utils";
import type { Category, Confidence, EvidenceItem, Insight } from "@/lib/types";

export interface VideoRef {
  title: string;
  url: string;
  pubdateISO: string | null;
}

const categoryTone: Record<string, { chip: string }> = {
  blue: { chip: "bg-blue-500/12 text-blue-700 ring-1 ring-blue-500/25" },
  green: { chip: "bg-emerald-500/12 text-emerald-700 ring-1 ring-emerald-500/25" },
  amber: { chip: "bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/25" },
  rose: { chip: "bg-rose-500/12 text-rose-700 ring-1 ring-rose-500/25" },
  violet: { chip: "bg-violet-500/12 text-violet-700 ring-1 ring-violet-500/25" },
  cyan: { chip: "bg-cyan-500/12 text-cyan-700 ring-1 ring-cyan-500/25" },
};

const confidenceMeta: Record<Confidence, { label: string; tone: string }> = {
  high: { label: "多视频交叉印证", tone: "bg-emerald-500/12 text-emerald-700 ring-1 ring-emerald-500/25" },
  medium: { label: "文案明确支撑", tone: "bg-sky-500/12 text-sky-700 ring-1 ring-sky-500/25" },
  inferred: { label: "推断", tone: "bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/30" },
};

const fieldLabel: Record<EvidenceItem["field"], string> = {
  title: "标题",
  description: "简介",
  transcript: "文案",
};

function EvidenceRow({
  ev,
  onOpenTranscript,
}: {
  ev: EvidenceItem;
  onOpenTranscript: (bvid: string, t?: number) => void;
}) {
  return (
    <li className="rounded-xl bg-white/45 px-3.5 py-3 ring-1 ring-white/60">
      <p className="text-[13.5px] leading-relaxed text-slate-700">「{ev.quote}」</p>
      <div className="mt-2 flex items-center gap-2">
        {ev.field === "transcript" ? (
          <button
            type="button"
            onClick={() => onOpenTranscript(ev.bvid, ev.t?.[0])}
            className="rounded-full bg-sky-500/12 px-2.5 py-1 text-[11px] font-medium text-sky-700 ring-1 ring-sky-500/25 transition-colors hover:bg-sky-500/20"
          >
            📄 在实录中阅读{ev.t ? ` · ${formatTime(ev.t[0])}` : ""}
          </button>
        ) : (
          <span className="rounded-full bg-slate-900/5 px-2.5 py-1 text-[11px] font-medium text-slate-500">
            {fieldLabel[ev.field]}
          </span>
        )}
        <a
          href={bilibiliUrl(ev.bvid, ev.t?.[0])}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-slate-400 transition-colors hover:text-blue-600"
        >
          ▶ {ev.bvid}
        </a>
      </div>
    </li>
  );
}

function InsightCard({
  insight,
  category,
  onOpenTranscript,
}: {
  insight: Insight;
  category: Category;
  onOpenTranscript: (bvid: string, t?: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const tone = categoryTone[category.color] ?? categoryTone.blue;
  const conf = confidenceMeta[insight.confidence];

  return (
    <motion.article
      layout
      initial={{ y: 14 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className="glass flex h-full flex-col p-6"
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

      <h3 className="mt-3 text-xl font-bold leading-snug tracking-tight text-slate-900">{insight.title}</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{insight.summary}</p>

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
        <p className="mt-3 rounded-xl bg-amber-500/10 px-3.5 py-2.5 text-[13px] leading-relaxed text-amber-800 ring-1 ring-amber-500/20">
          {insight.note}
        </p>
      )}

      <div className="mt-auto pt-4">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-[13px] font-medium text-slate-500 transition-colors hover:text-slate-800"
        >
          {expanded ? "收起证据 ↑" : `查看原文证据（${insight.evidence.length} 条）↓`}
        </button>
        {expanded && (
          <ul className="mt-3 space-y-2">
            {insight.evidence.map((ev, i) => (
              <EvidenceRow key={`${insight.id}-${i}`} ev={ev} onOpenTranscript={onOpenTranscript} />
            ))}
          </ul>
        )}
      </div>
    </motion.article>
  );
}

export function InsightsExplorer({
  categories,
  insights,
  onOpenTranscript,
}: {
  categories: Category[];
  insights: Insight[];
  onOpenTranscript: (bvid: string, t?: number) => void;
}) {
  const [active, setActive] = useState<string>("all");

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: insights.length };
    for (const c of categories) map[c.id] = insights.filter((i) => i.categoryId === c.id).length;
    return map;
  }, [categories, insights]);

  const filtered = active === "all" ? insights : insights.filter((i) => i.categoryId === active);

  return (
    <section id="insights" className="mt-12 scroll-mt-24" aria-label="赚钱心得精读">
      <div className="glass-strong p-8 sm:p-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">心得精读</h2>
            <p className="mt-2 text-sm text-slate-500">
              {insights.length} 条方法论，每条都可展开核对原文证据；点「在实录中阅读」直接定位到对应文案位置。
            </p>
          </div>
        </div>

        <div className="mt-5 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
          <button
            type="button"
            onClick={() => setActive("all")}
            className={cn(
              "glass-chip shrink-0 whitespace-nowrap px-4 py-2 text-sm font-medium transition-all",
              active === "all" ? "bg-white/75 text-slate-900 shadow-[0_4px_16px_rgba(31,38,135,0.12)]" : "text-slate-600 hover:bg-white/50",
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
                "glass-chip shrink-0 whitespace-nowrap px-4 py-2 text-sm font-medium transition-all",
                active === c.id ? "bg-white/75 text-slate-900 shadow-[0_4px_16px_rgba(31,38,135,0.12)]" : "text-slate-600 hover:bg-white/50",
              )}
            >
              <span aria-hidden className="mr-1">
                {c.icon}
              </span>
              {c.name} <span className="ml-1 text-xs tabular-nums text-slate-400">{counts[c.id]}</span>
            </button>
          ))}
        </div>

      <motion.div layout className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
        {filtered.map((insight) => {
          const category =
            categories.find((c) => c.id === insight.categoryId) ??
            ({ id: insight.categoryId, name: insight.categoryId, icon: "•", color: "blue", description: "" } as Category);
          return (
            <InsightCard
              key={insight.id}
              insight={insight}
              category={category}
              onOpenTranscript={onOpenTranscript}
            />
          );
        })}
      </motion.div>

        {filtered.length === 0 && <p className="mt-10 text-center text-sm text-slate-400">该分类暂无心得</p>}
      </div>
    </section>
  );
}
