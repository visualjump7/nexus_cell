import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-2 py-0.5 font-display text-[11px] font-normal uppercase tracking-[0.14em] leading-tight transition-colors focus:outline-none focus:ring-2 focus:ring-[#3989CB] focus:ring-offset-2 focus:ring-offset-nexus",
  {
    variants: {
      variant: {
        default: "border-[#CDA14B]/40 bg-transparent text-[#CDA14B]",
        secondary: "border-[#26292C] bg-[#141618] text-[#9AA0A4]",
        destructive: "border-transparent bg-red-600 text-white",
        outline: "border-[#26292C] text-[#9AA0A4]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
