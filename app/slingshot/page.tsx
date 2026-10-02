import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";
import { TrainingPlan } from "@/components/slingshot/training-plan";

export const metadata: Metadata = {
  title: { absolute: "弹弓训练计划 · 盖世英雄 9025" },
  description:
    "为铝合金 9025 盖世英雄定制的 8 周弹弓系统训练计划：4 阶段渐进（基础定型 → 10 米精度 → 距离与角度 → 进阶精通），含交互打卡清单、扁皮筋配置速查表、常见错误纠正与教程资源库。",
  keywords: ["弹弓", "训练计划", "盖世英雄9025", "扁皮筋", "瞄打", "斜握", "竞技弹弓"],
};

export default function SlingshotPage() {
  return (
    <main className="relative mx-auto max-w-6xl px-4 pb-20 pt-0 sm:px-6">
      <SiteNav active="slingshot" />
      <TrainingPlan />
    </main>
  );
}
