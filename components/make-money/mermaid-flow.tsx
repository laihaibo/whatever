"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Mermaid 渲染器（仅在客户端挂载后执行）：
 * - useEffect 内动态 import('mermaid')，库不进入首屏 bundle
 * - initialize({ startOnLoad: false })，手动 render 后注入 SVG
 * - 组件本身由上层 next/dynamic({ ssr: false }) 引入，服务端零渲染
 */
export default function MermaidFlow({
  definition,
  id,
}: {
  definition: string;
  id: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          securityLevel: "loose", // 允许节点 click 链接跳转 B 站
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "PingFang SC", "HarmonyOS Sans SC", "Microsoft YaHei", sans-serif',
          flowchart: { useMaxWidth: false, padding: 12 },
          themeVariables: {
            fontSize: "14px",
            primaryTextColor: "#1e293b",
            lineColor: "#94a3b8",
            backgroundColor: "transparent",
          },
        });
        const { svg } = await mermaid.render(`mermaid-${id}`, definition);
        if (cancelled) return;
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
          setReady(true);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [definition, id]);

  if (error) {
    return (
      <div className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm leading-relaxed text-rose-700 ring-1 ring-rose-500/20">
        流程图渲染失败：{error}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl bg-white/25 p-4 ring-1 ring-white/50">
      {!ready && (
        <div className="flex h-40 items-center justify-center text-sm text-slate-400">
          正在加载流程图…
        </div>
      )}
      <div ref={containerRef} className={ready ? "mermaid-svg flex w-max justify-start" : "hidden"} />
    </div>
  );
}
