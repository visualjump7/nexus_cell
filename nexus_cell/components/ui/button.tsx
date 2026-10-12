import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Legacy shadcn-style Button, restyled onto the Roaring Pines kit classes.
// Variant names are kept; new code should use RpButton from '@/components/rp'.
const buttonVariants = cva(
  "disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "rp-btn-solid",
        destructive: "rp-btn-danger",
        outline: "rp-btn-ghost",
        secondary: "rp-btn-ghost",
        ghost: "rp-btn-text",
        link: "rp-link inline-flex items-center gap-2 text-rp-text underline-offset-4 hover:underline",
      },
      size: {
        default: "",
        sm: "rp-btn--sm",
        lg: "",
        icon: "rp-btn-icon",
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
