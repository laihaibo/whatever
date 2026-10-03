import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";
import { LearningPlan } from "@/components/hanfu/learning-plan";

export const metadata: Metadata = {
  title: { absolute: "汉服设计制作入门 · 交领右衽 6 周学习计划" },
  description:
    "面向新手的交领右衽汉服设计制作 6 周入门计划：4 阶段渐进（形制扫盲 → 工具打版 → 第一件交领上襦 → 成套配色设计），含交互打卡清单、名词速查表、形制避坑指南与教程资源库。",
  keywords: ["汉服", "交领右衽", "汉服制作", "汉服裁剪", "打版", "晋制襦裙", "八破裙", "汉服入门"],
};

export default function HanfuPage() {
  return (
    <main className="relative mx-auto max-w-6xl px-4 pb-20 pt-0 sm:px-6">
      <SiteNav active="hanfu" />
      <LearningPlan />
    </main>
  );
}
