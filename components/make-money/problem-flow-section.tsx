import MermaidFlowLazy from "@/components/make-money/mermaid-flow-lazy";
import { buildMermaidDefinition } from "@/lib/flowchart";
import type { FlowchartData } from "@/lib/types";

export function ProblemFlowSection({ flow }: { flow: FlowchartData }) {
  // 14 个卖方场景拆成两棵树并排，避免单图过宽
  const half = Math.ceil(flow.scenarios.length / 2);
  const sellerA = buildMermaidDefinition(flow.root, flow.scenarios.slice(0, half), "sa");
  const sellerB = buildMermaidDefinition(flow.root, flow.scenarios.slice(half), "sb");
  const buyer = buildMermaidDefinition(flow.buyerBranch.label, flow.buyerBranch.scenarios, "by");

  return (
    <section id="problem-flow" className="mt-14 scroll-mt-8" aria-label={flow.title}>
      <div className="glass-strong p-8 sm:p-10">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">{flow.title}</h2>
        <p className="mt-2 text-sm text-slate-500">{flow.subtitle}</p>

        <div className="mt-6">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">
            卖家视角 · {flow.scenarios.length} 个场景（图内可左右滑动，点「▶ 视频号」回原片）
          </p>
          <div className="grid grid-cols-1 gap-5 2xl:grid-cols-2">
            <MermaidFlowLazy definition={sellerA} id="seller-a" />
            <MermaidFlowLazy definition={sellerB} id="seller-b" />
          </div>
        </div>

        <div className="mt-8">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">
            买家视角 · {flow.buyerBranch.scenarios.length} 个场景（自己买东西怎么砍价）
          </p>
          <MermaidFlowLazy definition={buyer} id="buyer" />
        </div>

        <p className="mt-5 text-xs leading-relaxed text-slate-400">
          图表由 Mermaid 在浏览器端懒加载渲染（next/dynamic + ssr:false），
          每条链路「场景 → 判断 → 动作 → 原片」均取材自视频文案，
          点击琥珀色「▶ 视频号」叶子节点可在新标签页打开对应视频。
        </p>
      </div>
    </section>
  );
}
