"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ScenarioWizard } from "@/components/make-money/scenario-wizard";
import { InsightsExplorer } from "@/components/make-money/insights-explorer";
import { VideoLibrary } from "@/components/make-money/video-library";
import { TranscriptModal, type ModalTarget } from "@/components/make-money/transcript-modal";
import { cn } from "@/lib/utils";
import type { Category, Insight, VideoItem, FlowchartData } from "@/lib/types";

type TabId = "wizard" | "insights" | "transcripts";

const TABS: { id: TabId; label: string; short: string }[] = [
  { id: "wizard", label: "① 场景指南", short: "场景" },
  { id: "insights", label: "② 心得精读", short: "心得" },
  { id: "transcripts", label: "③ 视频库", short: "实录" },
];

const VALID_HASH = new Set(TABS.map((t) => t.id));

function tabFromHash(): TabId {
  const h = window.location.hash.replace("#", "");
  return VALID_HASH.has(h as TabId) ? (h as TabId) : "wizard";
}

/**
 * 页面主体（客户端壳）：Tab 分段控件切换三大模块。
 * - 面板保持挂载（hidden 切换），各模块内部状态在切 Tab 后保留
 * - Tab 与 location.hash 双向同步（可深链/刷新定位）
 * - 所有「看原文」动作以弹窗形式打开对话体实录，不做页面内跳转
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
  const [tab, setTab] = useState<TabId>("wizard");
  const [modalTarget, setModalTarget] = useState<ModalTarget | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  // 初始 Tab 来自 hash
  useEffect(() => {
    setTab(tabFromHash());
  }, []);

  const switchTab = useCallback((next: TabId) => {
    setTab(next);
    history.replaceState(null, "", `#${next}`);
    // 若滚动位置超过 Tab 栏，回滚到 Tab 栏（instant，不依赖动画帧）
    requestAnimationFrame(() => {
      const barTop = barRef.current?.getBoundingClientRect().top ?? 0;
      if (barTop < 0) {
        window.scrollTo({ top: window.scrollY + barTop - 8, behavior: "instant" as ScrollBehavior });
      }
    });
  }, []);

  const openTranscript = useCallback((bvid: string, t?: number) => {
    setModalTarget({ bvid, t });
  }, []);

  const closeModal = useCallback(() => setModalTarget(null), []);

  return (
    <>
      {/* 吸顶分段式 Tab（iOS 风格） */}
      <div ref={barRef} className="pointer-events-none sticky top-0 z-40 flex justify-center px-3 pt-3 pb-2">
        <div
          role="tablist"
          aria-label="内容分区"
          className="glass-chip pointer-events-auto flex items-center gap-0.5 p-1"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => switchTab(t.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:text-[13px]",
                tab === t.id
                  ? "bg-white/85 text-slate-900 shadow-[0_2px_10px_rgba(31,38,135,0.12)]"
                  : "text-slate-500 hover:text-slate-800",
              )}
            >
              <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden" aria-hidden>
                {t.short}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 面板：保持挂载，hidden 切换（保留各模块内部状态） */}
      <div role="tabpanel" aria-label="场景指南" hidden={tab !== "wizard"} className={cn(tab !== "wizard" && "hidden")}>
        <ScenarioWizard flow={flow} onOpenTranscript={openTranscript} />
      </div>
      <div role="tabpanel" aria-label="心得精读" hidden={tab !== "insights"} className={cn(tab !== "insights" && "hidden")}>
        <InsightsExplorer categories={categories} insights={insights} onOpenTranscript={openTranscript} />
      </div>
      <div role="tabpanel" aria-label="视频库" hidden={tab !== "transcripts"} className={cn(tab !== "transcripts" && "hidden")}>
        <VideoLibrary videos={videos} onOpen={openTranscript} />
      </div>

      {/* 弹窗不进 AnimatePresence：关闭即卸载，功能不依赖动画帧 */}
      {modalTarget && <TranscriptModal target={modalTarget} onClose={closeModal} />}
    </>
  );
}
