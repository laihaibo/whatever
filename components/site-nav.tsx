import Link from "next/link";
import { cn } from "@/lib/utils";

export type SiteNavItem = "make-money" | "slingshot" | "hanfu";

const NAV_ITEMS: { id: SiteNavItem; href: string; label: string; short: string }[] = [
  { id: "make-money", href: "/make-money/", label: "赚钱心得", short: "心得" },
  { id: "slingshot", href: "/slingshot/", label: "弹弓训练", short: "弹弓" },
  { id: "hanfu", href: "/hanfu/", label: "汉服学习", short: "汉服" },
];

/**
 * 全站顶部导航（服务端组件，纯链接无客户端 JS）。
 * next/link 自动拼 basePath=/whatever；href 带尾斜杠配合 trailingSlash。
 */
export function SiteNav({ active }: { active: SiteNavItem }) {
  return (
    <nav aria-label="站点导航" className="flex justify-center px-3 pt-4 sm:pt-6">
      <div className="glass-chip flex items-center gap-0.5 p-1">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:text-[13px]",
                isActive
                  ? "bg-white/85 text-slate-900 shadow-[0_2px_10px_rgba(31,38,135,0.12)]"
                  : "text-slate-500 hover:text-slate-800",
              )}
            >
              <span className="hidden sm:inline">{item.label}</span>
              <span className="sm:hidden" aria-hidden>
                {item.short}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
