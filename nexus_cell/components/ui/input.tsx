import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

// Legacy Input, restyled as the kit's .rp-input (44px, panel ground,
// #4C5257 outline, blue focus border). New code should use RpInput.
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn("rp-input", className)}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
