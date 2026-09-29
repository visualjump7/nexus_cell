import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-none text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3989CB] focus-visible:ring-offset-2 focus-visible:ring-offset-nexus disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#F5F5F5] text-[#0A0B0C] hover:bg-[#CDA14B] font-display font-medium uppercase tracking-[0.16em] text-[13px]",
        destructive: "bg-red-600 text-white hover:bg-red-500 font-display uppercase tracking-[0.16em] text-[13px]",
        outline: "border border-[#26292C] bg-transparent text-[#9AA0A4] hover:border-[#CDA14B] hover:text-white font-display font-normal uppercase tracking-[0.14em] text-[11px]",
        secondary: "bg-[#141618] border border-[#1F1F1F] text-white hover:border-[#26292C]",
        ghost: "bg-transparent text-[#9AA0A4] hover:text-white hover:bg-[#141618]",
        link: "text-accent underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3",
        lg: "h-[42px] px-8",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
