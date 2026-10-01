"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { bilibiliUrl } from "@/lib/utils";
import type { FlowScenario, FlowchartData } from "@/lib/types";

/**
 * 场景应对向导（HTML 交互式，替代 Mermaid 流程图）：
 * 场景列表 → 点击进入逐步引导（遇到什么场景 → 怎么判断 → 具体怎么做 → 来源）
 */
export function ScenarioWizard({ flow }: { flow: FlowchartData }) {
  const [group, setGroup] = useState<"seller" | "buyer">("seller");
  const [selected, setSelected] = useState<number | null>(null);

  const scenarios: FlowScenario[] = group === "seller" ? flow.scenarios : flow.buyerBranch.scenarios;
  const current = selected != null ? scenarios[selected] : null;

  const switchGroup = (g: "seller" | "buyer") => {
    setGroup(g);
    setSelected(null);
  };

  return (
    <section id="wizard" className="mt-12 scroll-mt-24" aria-label="场景应对向导">
      <div className="glass-strong p-8 sm:p-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">场景应对向导</h2>
            <p className="mt-2 text-sm text-slate-500">
              {flow.subtitle}—— 不用看流程图，也不用去看视频：点场景 → 看判断 → 照着做，想追来源再点「文字实录」。
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => switchGroup("seller")}
              className={`glass-chip px-4 py-2 text-sm font-medium transition-all ${
                group === "seller" ? "bg-white/75 text-slate-900 shadow-[0_4px_16px_rgba(31,38,135,0.12)]" : "text-slate-600 hover:bg-white/50"
              }`}
            >
              🧑‍🌾 卖家视角 {flow.scenarios.length}
            </button>
            <button
              type="button"
              onClick={() => switchGroup("buyer")}
              className={`glass-chip px-4 py-2 text-sm font-medium transition-all ${
                group === "buyer" ? "bg-white/75 text-slate-900 shadow-[0_4px_16px_rgba(31,38,135,0.12)]" : "text-slate-600 hover:bg-white/50"
              }`}
            >
              🛒 买家视角 {flow.buyerBranch.scenarios.length}
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {current ? (
            <motion.div
              key={`detail-${group}-${selected}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mt-8"
            >
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="glass-chip px-4 py-1.5 text-xs font-medium text-slate-600 transition-all hover:bg-white/60"
              >
                ← 返回全部场景
              </button>

              <div className="relative mt-6 space-y-0">
                <Step
                  index={1}
                  label="遇到什么场景"
                  tone="slate"
                  text={current.scenario}
                />
                <Arrow />
                <Step index={2} label="心里怎么判断" tone="blue" text={current.judge} />
                <Arrow />
                <Step index={3} label="具体怎么做" tone="green" text={current.action} />
                <Arrow dashed />
                <div className="flex flex-wrap items-center gap-2 pl-2 sm:pl-4">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-400">来源</span>
                  {current.refs.map((bvid) => (
                    <span key={bvid} className="inline-flex overflow-hidden rounded-full ring-1 ring-amber-500/30">
                      <a
                        href={bilibiliUrl(bvid)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-amber-500/15 px-3 py-1.5 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-500/25"
                      >
                        ▶ 原片 {bvid}
                      </a>
                      <WizardTranscriptLink bvid={bvid} />
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={`list-${group}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
              {scenarios.map((s, i) => (
                <motion.button
                  key={s.id}
                  type="button"
                  onClick={() => setSelected(i)}
                  whileHover={{ y: -3 }}
                  className="glass glass-sheen group flex items-center gap-4 p-5 text-left"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/60 text-sm font-bold tabular-nums text-slate-500 ring-1 ring-white/70">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold leading-snug text-slate-800">
                      {s.scenario}
                    </span>
                    <span className="mt-1 block truncate text-xs text-slate-400">{s.judge} → {s.action}</span>
                  </span>
                  <span className="shrink-0 text-slate-300 transition-colors group-hover:text-slate-500">→</span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function WizardTranscriptLink({ bvid }: { bvid: string }) {
  return (
    <a
      href="#transcripts"
      onClick={() => {
        // 通知文案实录组件定位到该视频（由 SiteShell 挂载的全局事件监听处理）
        window.dispatchEvent(new CustomEvent("open-transcript", { detail: { bvid } }));
      }}
      className="bg-white/50 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-white/75"
    >
      📄 文字实录
    </a>
  );
}

function Step({
  index,
  label,
  text,
  tone,
}: {
  index: number;
  label: string;
  text: string;
  tone: "slate" | "blue" | "green";
}) {
  const tones = {
    slate: "bg-white/55 ring-white/70",
    blue: "bg-sky-500/10 ring-sky-500/25",
    green: "bg-emerald-500/10 ring-emerald-500/25",
  } as const;
  const labelTones = {
    slate: "text-slate-500",
    blue: "text-sky-700",
    green: "text-emerald-700",
  } as const;

  return (
    <div className={`rounded-2xl px-5 py-4 ring-1 ${tones[tone]} backdrop-blur-md`}>
      <p className={`text-xs font-semibold uppercase tracking-wider ${labelTones[tone]}`}>
        第 {index} 步 · {label}
      </p>
      <p className="mt-1.5 text-[15px] font-medium leading-relaxed text-slate-800">{text}</p>
    </div>
  );
}

function Arrow({ dashed = false }: { dashed?: boolean }) {
  return (
    <div className="flex justify-center py-1" aria-hidden>
      <svg width="14" height="22" viewBox="0 0 14 22" fill="none">
        <path
          d="M7 0v18M7 20l-4-4M7 20l4-4"
          stroke={dashed ? "#f59e0b" : "#94a3b8"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray={dashed ? "3 3" : undefined}
        />
      </svg>
    </div>
  );
}
