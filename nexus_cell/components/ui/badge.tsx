import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { RpTone } from "@/components/rp/types";

// Legacy Badge, restyled as an RpTag. Variants map to tones:
// default → gold, secondary/outline → neutral, destructive → alert.
// Pass `tone` to pick any RpTone directly.
const badgeVariants = cva("rp-tag", {
  variants: {
    variant: {
      default: "rp-tag--gold",
      secondary: "",
      destructive: "rp-tag--alert",
      outline: "",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const TONE_CLASS: Record<RpTone, string> = {
  neutral: "",
  gold: "rp-tag--gold",
  green: "rp-tag--green",
  blue: "rp-tag--blue",
  alert: "rp-tag--alert",
  dim: "rp-tag--dim",
};

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  tone?: RpTone;
}

function Badge({ className, variant, tone, ...props }: BadgeProps) {
  return (
    <div
      className={cn(tone ? cn("rp-tag", TONE_CLASS[tone]) : badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
