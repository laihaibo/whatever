"use client";

import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import annotatedJson from "@/data/transcripts-annotated.json";
import { bilibiliUrl, cn, formatTime } from "@/lib/utils";
import type { AnnotatedBlock, AnnotatedData, DialogueRole } from "@/lib/types";

const annotated = annotatedJson as unknown as AnnotatedData;

export interface ModalTarget {
  bvid: string;
  t?: number;
}

const roleMeta: Record<DialogueRole, { label: string; avatar: string }> = {
  narration: { label: "旁白·拆解", avatar: "🎙️" },
  owner: { label: "摊主", avatar: "🧑‍🌾" },
  customer: { label: "顾客", avatar: "🧕" },
  ad: { label: "广告", avatar: "📢" },
  other: { label: "其他", avatar: "🎵" },
};

/** 单个语块：旁白/广告/其他为全宽注释行；摊主/顾客为聊天气泡 */
function Block({
  block,
  bvid,
  highlight,
  innerRef,
}: {
  block: AnnotatedBlock;
  bvid: string;
  highlight: boolean;
  innerRef?: (el: HTMLDivElement | null) => void;
}) {
  const timeChip = (
    <a
      href={bilibiliUrl(bvid, block.start)}
      target="_blank"
      rel="noopener noreferrer"
      title="跳转到原视频对应位置"
      className={cn(
        "shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium tabular-nums ring-1 transition-colors",
        highlight
          ? "bg-amber-500/20 text-amber-800 ring-amber-500/40"
          : "bg-white/60 text-slate-400 ring-white/70 hover:bg-sky-500/15 hover:text-sky-700",
      )}
    >
      {formatTime(block.start)}
    </a>
  );

  // 旁白（含重点金句）
  if (block.role === "narration") {
    return (
      <div ref={innerRef} id={undefined} className={cn("px-1", highlight && "scroll-mt-4")}>
        <div
          className={cn(
            "rounded-xl border-l-[3px] px-4 py-3",
            block.highlight
              ? "border-amber-400 bg-amber-500/12"
              : "border-slate-300/70 bg-slate-900/3",
          )}
        >
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider">
            <span className={block.highlight ? "text-amber-700" : "text-slate-400"}>
              {block.highlight ? "⭐ 旁白 · 划重点" : "🎙️ 旁白 · 拆解"}
            </span>
            {timeChip}
          </p>
          <p
            className={cn(
              "mt-1.5 text-[14.5px] leading-relaxed",
              block.highlight ? "font-medium text-amber-900" : "text-slate-600",
            )}
          >
            {block.text}
          </p>
        </div>
      </div>
    );
  }

  // 广告
  if (block.role === "ad") {
    return (
      <div ref={innerRef}>
        <div className="rounded-xl bg-slate-500/10 px-4 py-3 ring-1 ring-slate-400/30">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <span>📢 广告 · 恰饭时间</span>
            {timeChip}
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">{block.text}</p>
        </div>
      </div>
    );
  }

  // 其他（歌词等）
  if (block.role === "other") {
    return (
      <div ref={innerRef}>
        <div className="rounded-xl bg-violet-500/8 px-4 py-3 ring-1 ring-violet-400/25">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-violet-500">
            <span>🎵 其他</span>
            {timeChip}
          </p>
          <p className="mt-1.5 text-[13px] italic leading-relaxed text-violet-700/80">{block.text}</p>
        </div>
      </div>
    );
  }

  // 摊主 / 顾客：聊天气泡
  const isOwner = block.role === "owner";
  const meta = roleMeta[block.role];
  return (
    <div ref={innerRef} className={cn("flex items-end gap-2.5", !isOwner && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base ring-1 ring-white/70",
          isOwner ? "bg-emerald-500/15" : "bg-sky-500/15",
        )}
        aria-hidden
      >
        {meta.avatar}
      </div>
      <div className={cn("max-w-[82%]", !isOwner && "text-right")}>
        <p
          className={cn(
            "mb-1 flex items-center gap-2 text-[11px] font-semibold",
            !isOwner && "flex-row-reverse",
          )}
        >
          <span className={isOwner ? "text-emerald-700" : "text-sky-700"}>{meta.label}</span>
          {timeChip}
        </p>
        <div
          className={cn(
            "inline-block rounded-2xl px-4 py-2.5 text-left text-[14.5px] leading-relaxed text-slate-700 ring-1",
            isOwner
              ? "rounded-tl-md bg-white/75 ring-white/80"
              : "rounded-tr-md bg-sky-500/12 ring-sky-400/30",
          )}
        >
          {block.text}
        </div>
      </div>
    </div>
  );
}

export function TranscriptModal({
  target,
  onClose,
}: {
  target: ModalTarget | null;
  onClose: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const transcript = useMemo(
    () => (target ? annotated.transcripts.find((t) => t.bvid === target.bvid) : undefined),
    [target],
  );

  // 定位到证据对应的时间块并短暂高亮
  useEffect(() => {
    if (!target?.t || !scrollRef.current) return;
    const t = target.t;
    const timer = setTimeout(() => {
      const el = scrollRef.current?.querySelector<HTMLElement>(`[data-t-start="${Math.floor(t)}"]`)
        ?? scrollRef.current?.querySelectorAll<HTMLElement>("[data-block-index]");
      // 找到包含 t 的块：由渲染时的 data 属性标记
      const blocks = scrollRef.current?.querySelectorAll<HTMLElement>("[data-block]");
      if (!blocks) return;
      let hit: HTMLElement | null = null;
      blocks.forEach((b) => {
        const s = Number(b.dataset.start);
        const e = Number(b.dataset.end);
        if (t >= s && t <= e) hit = b;
      });
      const goal = (hit ?? blocks[0]) as HTMLElement | undefined;
      goal?.scrollIntoView({ behavior: "smooth", block: "center" });
      goal?.classList.add("ring-2", "ring-sky-400/60");
      setTimeout(() => goal?.classList.remove("ring-2", "ring-sky-400/60"), 2500);
    }, 250);
    return () => clearTimeout(timer);
  }, [target]);

  // 打开时锁定页面滚动 + Esc 关闭 + 聚焦关闭按钮
  useEffect(() => {
    if (!target) return;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [target, onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      aria-modal="true"
      role="dialog"
      aria-label="视频文案实录"
    >
      {/* 遮罩 */}
      <button
        type="button"
        aria-label="关闭"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-slate-900/45 backdrop-blur-sm"
      />

      {target && transcript && (
        <motion.div
          initial={{ y: 48 }}
          animate={{ y: 0 }}
          exit={{ y: 24 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-white/70 bg-gradient-to-b from-white/97 to-white/93 shadow-[0_24px_80px_rgba(15,23,42,0.25)] backdrop-blur-2xl sm:max-h-[88vh] sm:rounded-3xl"
        >
          {/* 移动端拖拽指示条 */}
          <div aria-hidden className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-slate-300/70 sm:hidden" />

          {/* 头部 */}
          <div className="border-b border-slate-900/8 px-5 pb-3.5 pt-2.5 sm:px-6 sm:pb-4 sm:pt-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="line-clamp-2 text-base font-bold leading-snug tracking-tight text-slate-900 sm:text-[17px]">
                  {transcript.title}
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  对话体实录 · {transcript.blocks.length} 段 · 人工整理，方言对白按语义转写
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={bilibiliUrl(transcript.bvid, target.t)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-chip px-3 py-1.5 text-xs font-medium text-slate-600 transition-all hover:bg-white/80"
                >
                  ▶ 在 B 站打开
                </a>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/5 text-slate-500 transition-colors hover:bg-slate-900/10 hover:text-slate-800"
                  aria-label="关闭弹窗"
                >
                  ✕
                </button>
              </div>
            </div>
            {/* 图例 */}
            <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
              <span className="rounded-full bg-slate-900/4 px-2 py-0.5 text-slate-500">🎙️ 旁白·拆解</span>
              <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 text-emerald-700">🧑‍🌾 摊主（左）</span>
              <span className="rounded-full bg-sky-500/12 px-2 py-0.5 text-sky-700">🧕 顾客（右）</span>
              <span className="rounded-full bg-amber-500/12 px-2 py-0.5 text-amber-700">⭐ 划重点</span>
              <span className="rounded-full bg-slate-500/8 px-2 py-0.5 text-slate-400">📢 广告</span>
            </div>
          </div>

          {/* 正文 */}
          <div ref={scrollRef} className="flex-1 space-y-3.5 overflow-y-auto px-6 py-5">
            {transcript.blocks.map((block, i) => (
              <div
                key={i}
                data-block
                data-start={block.start}
                data-end={block.end}
                data-block-index={i}
              >
                <Block block={block} bvid={transcript.bvid} highlight={false} />
              </div>
            ))}
            <p className="pt-2 text-center text-[11px] text-slate-300">
              —— 实录完 · 点击时间戳可跳转原视频对应位置 ——
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
