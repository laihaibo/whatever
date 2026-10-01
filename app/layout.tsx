import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "赚钱心得 · 嘴比饺子馅儿碎",
    template: "%s · 赚钱心得",
  },
  description:
    "基于 B 站 UP 主「嘴比饺子馅儿碎」全部视频标题、简介与文案提炼的结构化赚钱心得：成交心法、需求场景、时机控场、价格议价、心理学工具箱，以及场景应对决策树。",
  keywords: ["赚钱心得", "农村MBA", "摆摊卖菜", "销售", "成交", "嘴比饺子馅儿碎"],
};

export const viewport: Viewport = {
  themeColor: "#f0f9ff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
