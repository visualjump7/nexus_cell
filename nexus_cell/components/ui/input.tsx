import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-9 w-full rounded-sm border border-[#26292C] bg-[#0E0F11] px-3 py-2 text-sm text-[#F5F5F5] placeholder:text-[#6E7578] focus:border-[#CDA14B] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3989CB] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
