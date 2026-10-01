"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import MermaidFlow from "./mermaid-flow";

type MermaidFlowProps = ComponentProps<typeof MermaidFlow>;

/**
 * next/dynamic 懒加载包装（ssr: false 在客户端组件中合法）：
 * - MermaidFlow 及其内部 import 的 mermaid 库都不会出现在 SSR HTML 与首屏 bundle 中
 * - 加载期间展示玻璃风骨架
 */
const MermaidFlowLazy = dynamic<MermaidFlowProps>(() => import("./mermaid-flow"), {
  ssr: false,
  loading: () => (
    <div className="flex h-56 items-center justify-center rounded-2xl bg-white/25 ring-1 ring-white/50">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-slate-300" />
        正在懒加载流程图…
      </div>
    </div>
  ),
});

export default MermaidFlowLazy;
