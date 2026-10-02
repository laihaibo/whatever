"use client";

import { motion } from "framer-motion";
import type { VideoItem } from "@/lib/types";

/**
 * 视频库：23 条视频的紧凑网格，点击任意卡片即弹出对话体实录弹窗（无页面跳转）。
 */
export function VideoLibrary({
  videos,
  onOpen,
}: {
  videos: VideoItem[];
  onOpen: (bvid: string) => void;
}) {
  return (
    <section id="transcripts" className="mt-12 scroll-mt-24" aria-label="视频文案库">
      <div className="glass-strong p-8 sm:p-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">视频文案库</h2>
            <p className="mt-2 text-sm text-slate-500">
              {videos.length} 条视频的对话体实录（旁白 / 摊主 / 顾客 已整理标注）。点击任意视频，弹窗直接阅读，不用去 B 站看视频。
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((v, i) => (
            <motion.button
              key={v.bvid}
              type="button"
              onClick={() => onOpen(v.bvid)}
              whileHover={{ y: -3 }}
              className="glass glass-sheen flex items-center gap-3 p-4 text-left"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/60 text-xs font-bold tabular-nums text-slate-500 ring-1 ring-white/70">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 block text-[13.5px] font-medium leading-snug text-slate-700">
                  {v.title}
                </span>
                <span className="mt-0.5 block text-[11px] tabular-nums text-slate-400">
                  {v.pubdateISO?.slice(0, 10)} ·{" "}
                  {(v.stat.view ?? 0) >= 10000
                    ? `${((v.stat.view ?? 0) / 10000).toFixed(1)} 万播放`
                    : `${v.stat.view ?? 0} 播放`}
                </span>
              </span>
              <span className="shrink-0 text-xs text-slate-300" aria-hidden>
                📄
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
