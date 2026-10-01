"use client";

import { useEffect, useState } from "react";
import { ScenarioWizard } from "@/components/make-money/scenario-wizard";
import { InsightsExplorer } from "@/components/make-money/insights-explorer";
import { TranscriptViewer, type TranscriptTarget } from "@/components/make-money/transcript-viewer";
import type { Category, Insight, VideoItem, FlowchartData } from "@/lib/types";

const NAV_ITEMS = [
  { href: "#wizard", label: "① 场景指南" },
  { href: "#insights", label: "② 心得精读" },
  { href: "#transcripts", label: "③ 文案实录" },
];

/**
 * 页面主体（客户端壳）：场景向导 → 心得精读 → 文案实录，三者通过
 * 「open-transcript」自定义事件互通（向导/心得的证据可直达实录对应位置）。
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
  const [transcriptTarget, setTranscriptTarget] = useState<TranscriptTarget | null>(null);

  // 监听全局事件：场景向导「文字实录」按钮 / 心得证据「在实录中阅读」
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ bvid: string; t?: number }>).detail;
      if (detail?.bvid) {
        setTranscriptTarget(detail);
        requestAnimationFrame(() => {
          document.getElementById("transcripts")?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    };
    window.addEventListener("open-transcript", handler);
    return () => window.removeEventListener("open-transcript", handler);
  }, []);

  const openTranscript = (bvid: string, t?: number) => {
    setTranscriptTarget({ bvid, t });
    requestAnimationFrame(() => {
      document.getElementById("transcripts")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <>
      {/* 顶部玻璃导航 */}
      <nav className="fixed inset-x-0 top-3 z-50 flex justify-center px-4" aria-label="页面导航">
        <div className="glass-chip flex items-center gap-1 px-2 py-1.5">
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

      <ScenarioWizard flow={flow} />
      <InsightsExplorer categories={categories} insights={insights} onOpenTranscript={openTranscript} />
      <TranscriptViewer videos={videos} insights={insights} categories={categories} target={transcriptTarget} />
    </>
  );
}
