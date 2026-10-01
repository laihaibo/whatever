import { cva, type VariantProps } from "class-variance-authority";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * shadcn/ui 风格的 Badge（shadcn CLI 在本环境不可交互，按其组件规范手写，API 保持一致）
 * 玻璃拟态变体：半透明底 + 细边框，拒绝实心色块
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "border-transparent bg-slate-900/80 text-slate-50",
        secondary: "border-transparent bg-slate-900/5 text-slate-600",
        outline: "border-slate-900/10 text-slate-700",
        glass: "border-white/60 bg-white/45 text-slate-700 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  style?: CSSProperties;
}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
