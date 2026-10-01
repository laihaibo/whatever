"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import transcriptsJson from "@/data/transcripts.json";
import { Badge } from "@/components/ui/badge";
import { bilibiliUrl, cn, formatTime } from "@/lib/utils";
import type { Category, Insight, TranscriptItem, TranscriptsData, VideoItem } from "@/lib/types";

const transcripts = (transcriptsJson as unknown as TranscriptsData).transcripts;

export interface TranscriptTarget {
  bvid: string;
  t?: number;
}

/**
 * 视频文案实录：左侧视频列表 + 右侧完整转写原文。
 * 时间戳可点击跳转 B 站对应秒数；支持从场景向导/心得证据定位到具体位置。
 */
export function TranscriptViewer({
  videos,
  insights,
  categories,
  target,
}: {
  videos: VideoItem[];
  insights: Insight[];
  categories: Category[];
  target: TranscriptTarget | null;
}) {
  const [selectedBvid, setSelectedBvid] = useState<string>(transcripts[0]?.bvid ?? "");
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected: TranscriptItem | undefined = useMemo(
    () => transcripts.find((t) => t.bvid === selectedBvid) ?? transcripts[0],
    [selectedBvid],
  );
  const video = useMemo(() => videos.find((v) => v.bvid === selectedBvid), [videos, selectedBvid]);

  const relatedInsights = useMemo(
    () => insights.filter((i) => i.evidence.some((e) => e.bvid === selectedBvid)),
    [insights, selectedBvid],
  );
  const categoryOf = (id: string) => categories.find((c) => c.id === id);

  // 响应外部定位（场景向导 / 心得证据的「文字实录」按钮）
  useEffect(() => {
    if (!target) return;
    setSelectedBvid(target.bvid);
    if (target.t != null) {
      const item = transcripts.find((t) => t.bvid === target.bvid);
      const idx = item?.segments.findIndex((seg) => seg.start <= target.t! && seg.end >= target.t!) ?? -1;
      const finalIdx = idx >= 0 ? idx : item?.segments.findIndex((seg) => seg.start >= (target.t ?? 0)) ?? -1;
      if (finalIdx >= 0) {
        setHighlightIdx(finalIdx);
        setTimeout(() => {
          document
            .getElementById(`seg-${target.bvid}-${finalIdx}`)
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 400);
      }
    }
  }, [target]);

  // 切换视频时重置高亮
  useEffect(() => setHighlightIdx(null), [selectedBvid]);

  return (
    <section id="transcripts" className="mt-12 scroll-mt-24" aria-label="视频文案实录">
      <div className="glass-strong p-6 sm:p-10">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">视频文案实录</h2>
        <p className="mt-2 text-sm text-slate-500">
          全部 {transcripts.length} 条视频的完整转写原文，不用去 B 站看视频，直接读文字。
          点击任意时间戳可跳到原视频对应位置；文字由本地 ASR 转写，存在同音字误差（如「赶集→感激」），请按语义理解。
        </p>

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[290px_1fr]">
          {/* 左侧：视频列表 */}
          <div
            ref={listRef}
            className="max-h-[560px] space-y-1.5 overflow-y-auto rounded-2xl bg-white/25 p-2.5 ring-1 ring-white/50 lg:sticky lg:top-24"
          >
            {transcripts.map((t, i) => {
              const v = videos.find((x) => x.bvid === t.bvid);
              const active = t.bvid === selectedBvid;
              return (
                <button
                  key={t.bvid}
                  type="button"
                  onClick={() => setSelectedBvid(t.bvid)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all",
                    active
                      ? "bg-white/80 shadow-[0_4px_16px_rgba(31,38,135,0.1)]"
                      : "hover:bg-white/50",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums ring-1",
                      active ? "bg-slate-800 text-white ring-slate-800" : "bg-white/60 text-slate-500 ring-white/70",
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate text-[13px] font-medium", active ? "text-slate-900" : "text-slate-600")}>
                      {t.title}
                    </span>
                    <span className="text-[11px] tabular-nums text-slate-400">
                      {v?.pubdateISO?.slice(0, 10) ?? "—"} · {(v?.stat.view ?? 0) >= 10000
                        ? `${((v?.stat.view ?? 0) / 10000).toFixed(1)}万播放`
                        : `${v?.stat.view ?? 0}播放`}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* 右侧：详情 */}
          <div className="min-w-0">
            {selected && (
              <div className="rounded-2xl bg-white/40 p-5 ring-1 ring-white/60 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="text-lg font-bold leading-snug text-slate-900">{selected.title}</h3>
                  <a
                    href={bilibiliUrl(selected.bvid)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-chip shrink-0 px-3 py-1.5 text-xs font-medium text-slate-600 transition-all hover:bg-white/70"
                  >
                    ▶ 在 B 站打开
                  </a>
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {video?.pubdateISO && <Badge variant="secondary">发布 {video.pubdateISO.slice(0, 10)}</Badge>}
                  {selected.duration != null && <Badge variant="secondary">时长 {formatTime(selected.duration)}</Badge>}
                  {video && <Badge variant="secondary">播放 {(video.stat.view ?? 0).toLocaleString("zh-CN")}</Badge>}
                  {video && <Badge variant="secondary">点赞 {(video.stat.like ?? 0).toLocaleString("zh-CN")}</Badge>}
                  {video && <Badge variant="secondary">收藏 {(video.stat.favorite ?? 0).toLocaleString("zh-CN")}</Badge>}
                </div>

                {video?.description && (
                  <p className="mt-4 rounded-xl bg-slate-900/4 px-4 py-3 text-[13px] leading-relaxed text-slate-600">
                    <span className="font-semibold text-slate-500">简介：</span>
                    {video.description}
                  </p>
                )}

                {relatedInsights.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                      本条提炼的心得（{relatedInsights.length}）
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {relatedInsights.map((ins) => {
                        const cat = categoryOf(ins.categoryId);
                        return (
                          <span
                            key={ins.id}
                            className="inline-flex items-center gap-1 rounded-full bg-white/55 px-2.5 py-1 text-xs text-slate-600 ring-1 ring-white/70"
                            title={ins.summary}
                          >
                            <span aria-hidden>{cat?.icon}</span>
                            {ins.title}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="mt-5 flex items-center justify-between border-t border-slate-900/5 pt-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    转写原文（{selected.segments.length} 段）
                  </p>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(selected.text).catch(() => {})}
                    className="text-xs text-slate-400 transition-colors hover:text-slate-700"
                  >
                    复制全文
                  </button>
                </div>

                <ol className="mt-3 space-y-1">
                  {selected.segments.map((seg, i) => (
                    <li
                      key={i}
                      id={`seg-${selected.bvid}-${i}`}
                      className={cn(
                        "flex items-start gap-3 rounded-lg px-2.5 py-1.5 transition-colors",
                        highlightIdx === i && "bg-amber-500/15 ring-1 ring-amber-500/40",
                      )}
                    >
                      <a
                        href={bilibiliUrl(selected.bvid, seg.start)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="跳转到原视频对应位置"
                        className="mt-0.5 shrink-0 rounded-md bg-white/60 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-slate-400 ring-1 ring-white/70 transition-colors hover:bg-sky-500/15 hover:text-sky-700"
                      >
                        {formatTime(seg.start)}
                      </a>
                      <span className="text-[14px] leading-relaxed text-slate-700">{seg.text}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
