"use client";

import { useCallback, useState } from "react";
import { ScenarioWizard } from "@/components/make-money/scenario-wizard";
import { InsightsExplorer } from "@/components/make-money/insights-explorer";
import { VideoLibrary } from "@/components/make-money/video-library";
import { TranscriptModal, type ModalTarget } from "@/components/make-money/transcript-modal";
import type { Category, Insight, VideoItem, FlowchartData } from "@/lib/types";

const NAV_ITEMS = [
  { href: "#wizard", label: "① 场景指南" },
  { href: "#insights", label: "② 心得精读" },
  { href: "#transcripts", label: "③ 视频库" },
];

/**
 * 页面主体（客户端壳）：场景向导 → 心得精读 → 视频库。
 * 所有「看原文」动作都以弹窗形式打开对话体实录，不做页面内跳转。
 */
export function SiteShell({
  flow,
  categories,
  insights,
  videos,
}: {
  flow: FlowchartData;
  categories: Category[];
  insights: Insight[];
  videos: VideoItem[];
}) {
  const [modalTarget, setModalTarget] = useState<ModalTarget | null>(null);

  const openTranscript = useCallback((bvid: string, t?: number) => {
    setModalTarget({ bvid, t });
  }, []);

  const closeModal = useCallback(() => setModalTarget(null), []);

  return (
    <>
      {/* 顶部玻璃导航（容器不拦截点击，仅芯片可点） */}
      <nav className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-4" aria-label="页面导航">
        <div className="glass-chip pointer-events-auto flex items-center gap-1 px-2 py-1.5">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-white/70 hover:text-slate-900"
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      <ScenarioWizard flow={flow} onOpenTranscript={openTranscript} />
      <InsightsExplorer categories={categories} insights={insights} onOpenTranscript={openTranscript} />
      <VideoLibrary videos={videos} onOpen={openTranscript} />

      {/* 弹窗不进 AnimatePresence：关闭即卸载，功能不依赖动画帧 */}
      {modalTarget && <TranscriptModal target={modalTarget} onClose={closeModal} />}
    </>
  );
}
