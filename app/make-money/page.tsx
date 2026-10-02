import insightsJson from "@/data/insights.json";
import videosJson from "@/data/videos.json";
import { GlassHero, type HeroStats } from "@/components/make-money/glass-hero";
import { SiteNav } from "@/components/site-nav";
import { SiteShell } from "@/components/make-money/site-shell";
import type { InsightsData, VideosData } from "@/lib/types";

const insights = insightsJson as unknown as InsightsData;
const videos = videosJson as unknown as VideosData;

export default function MakeMoneyPage() {
  const stats: HeroStats = {
    uname: videos.meta.uname,
    videoCount: videos.videos.length,
    totalViews: videos.videos.reduce((acc, v) => acc + (v.stat.view ?? 0), 0),
    totalLikes: videos.videos.reduce((acc, v) => acc + (v.stat.like ?? 0), 0),
    insightCount: insights.insights.length,
    categoryCount: insights.categories.length,
    fetchedAt: videos.meta.fetchedAt,
    sourceUrl: `https://space.bilibili.com/${videos.meta.mid}`,
  };

  return (
    <main className="relative mx-auto max-w-6xl px-4 pb-20 pt-0 sm:px-6">
      <SiteNav active="make-money" />
      <GlassHero stats={stats} />

      <SiteShell
        flow={insights.flowchart}
        categories={insights.categories}
        insights={insights.insights}
        videos={videos.videos}
      />

      <footer className="mt-14">
        <div className="glass p-6 text-xs leading-relaxed text-slate-500">
          <p className="font-medium text-slate-600">数据与可信度说明</p>
          <p className="mt-2">
            本页内容基于 UP 主「{videos.meta.uname}」公开视频的标题、简介与视频文案（本地 ASR 转写，同音字已轻度校正）
            人工提炼，共 {insights.insights.length} 条心得，标注置信度：多视频交叉印证 / 文案明确支撑 / 推断。
            未观看视频画面以外未公开的任何内容，不构成投资或经营建议；带「推断」角标的条目请谨慎采用。
          </p>
          <p className="mt-2">
            数据来源：{videos.meta.source} · 采集于 {videos.meta.fetchedAt.slice(0, 10)} ·{" "}
            <a
              href={`https://space.bilibili.com/${videos.meta.mid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-slate-300 underline-offset-4 hover:text-slate-700"
            >
              space.bilibili.com/{videos.meta.mid}
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
