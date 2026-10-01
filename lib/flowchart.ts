import type { FlowScenario } from "@/lib/types";

/** mermaid 节点文本换行：每 ~width 个字符插入 <br/>（中文场景下控制节点宽度） */
function wrap(text: string, width: number): string {
  if (text.length <= width) return text;
  const parts: string[] = [];
  let rest = text;
  while (rest.length > width) {
    // 优先在标点处断行
    const slice = rest.slice(0, width);
    const punctIdx = Math.max(
      slice.lastIndexOf("，"),
      slice.lastIndexOf("、"),
      slice.lastIndexOf("；"),
      slice.lastIndexOf("："),
    );
    const cut = punctIdx > width * 0.4 ? punctIdx + 1 : width;
    parts.push(rest.slice(0, cut));
    rest = rest.slice(cut);
  }
  if (rest) parts.push(rest);
  return parts.join("<br/>");
}

/** 转义 mermaid 引号标签内的特殊字符 */
function esc(text: string): string {
  return text.replace(/"/g, "”").replace(/'/g, "’");
}

/**
 * 由场景数组生成 mermaid flowchart 定义。
 * 结构（TD 树形）：根节点 → 场景 → 判断 → 动作 → ▶ 原片叶子（click 跳转 B 站）
 */
export function buildMermaidDefinition(rootLabel: string, scenarios: FlowScenario[], idPrefix: string): string {
  const lines: string[] = ["flowchart TD"];
  const rootId = `${idPrefix}ROOT`;
  lines.push(`    ${rootId}(("${esc(rootLabel)}"))`);

  scenarios.forEach((s, i) => {
    const sid = `${idPrefix}S${i}`;
    const jid = `${idPrefix}J${i}`;
    const aid = `${idPrefix}A${i}`;
    lines.push(`    ${sid}["${esc(wrap(s.scenario, 12))}"]`);
    lines.push(`    ${jid}["${esc(wrap(s.judge, 12))}"]`);
    lines.push(`    ${aid}["${esc(wrap(s.action, 16))}"]`);
    lines.push(`    ${rootId} --> ${sid} --> ${jid} --> ${aid}`);

    (s.refs ?? []).forEach((bvid, k) => {
      const vid = `${idPrefix}V${i}_${k}`;
      lines.push(`    ${vid}("▶ ${bvid}")`);
      lines.push(`    ${aid} -.-> ${vid}`);
      lines.push(`    click ${vid} href "https://www.bilibili.com/video/${bvid}" "在新标签页打开原视频"`);
    });
  });

  // 玻璃拟态风格：半透明填充 + 浅色描边，拒绝实心色块
  lines.push("    classDef root fill:#ffffffd9,stroke:#ffffff,stroke-width:2px,color:#0f172a;");
  lines.push("    classDef scen fill:#ffffff80,stroke:#ffffff,color:#1e293b;");
  lines.push("    classDef judge fill:#dbeafe99,stroke:#93c5fd,color:#1e40af;");
  lines.push("    classDef act fill:#dcfce799,stroke:#86efac,color:#166534;");
  lines.push("    classDef vid fill:#fef3c799,stroke:#fcd34d,color:#92400e;");
  lines.push("    linkStyle default stroke:#94a3b8,stroke-width:1.5px;");

  const idList = (prefix: string) => scenarios.map((_, i) => `${idPrefix}${prefix}${i}`).join(",");
  const vIds = scenarios
    .map((s, i) => (s.refs ?? []).map((_, k) => `${idPrefix}V${i}_${k}`).join(","))
    .filter(Boolean)
    .join(",");

  lines.push(`    class ${rootId} root`);
  lines.push(`    class ${idList("S")} scen`);
  lines.push(`    class ${idList("J")} judge`);
  lines.push(`    class ${idList("A")} act`);
  if (vIds) lines.push(`    class ${vIds} vid`);

  return lines.join("\n");
}
