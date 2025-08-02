import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"

import { cn } from "@/app/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:cursor-pointer hover:shadow-lg active:scale-[0.98]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-lg active:scale-[0.98]",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:shadow-sm active:scale-[0.98]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-lg active:scale-[0.98]",
        ghost: "hover:bg-accent hover:text-accent-foreground hover:shadow-sm active:scale-[0.98]",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-success text-success-foreground hover:bg-success/90 hover:shadow-lg active:scale-[0.98]",
        warning: "bg-warning text-warning-foreground hover:bg-warning/90 hover:shadow-lg active:scale-[0.98]",
        // New gradient variant
        gradient: "bg-gradient-to-r from-primary to-primary-dark text-primary-foreground hover:opacity-90 hover:shadow-lg active:scale-[0.98]"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
      animation: {
        none: "",
        pulse: "animate-pulse",
        bounce: "animate-bounce",
        ping: "animate-ping",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "none"
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  ripple?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, animation, loading, ripple, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const [coords, setCoords] = React.useState({ x: -1, y: -1 });
    const [isRippling, setIsRippling] = React.useState(false);

    React.useEffect(() => {
      if (coords.x !== -1 && coords.y !== -1) {
        setIsRippling(true);
        setTimeout(() => setIsRippling(false), 600);
      } else {
        setIsRippling(false);
      }
    }, [coords]);

    React.useEffect(() => {
      if (!isRippling) setCoords({ x: -1, y: -1 });
    }, [isRippling]);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (ripple) {
        const rect = e.currentTarget.getBoundingClientRect();
        setCoords({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
      
      if (props.onClick) {
        props.onClick(e);
      }
    };

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, animation, className }),
          loading && "cursor-not-allowed",
          "relative overflow-hidden"
        )}
        ref={ref}
        onClick={handleClick}
        disabled={props.disabled || loading}
        {...props}
      >
        {loading && (
          <motion.span
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></span>
          </motion.span>
        )}
        
        <span className={cn("flex items-center gap-2", loading ? "opacity-0" : "opacity-100")}>
          {props.children}
        </span>
        
        {isRippling && ripple && (
          <motion.span
            className="absolute block rounded-full bg-white/30"
            initial={{ width: 0, height: 0, opacity: 0.7 }}
            animate={{ 
              width: 200, 
              height: 200,
              opacity: 0
            }}
            style={{
              left: coords.x,
              top: coords.y,
              transform: "translate(-50%, -50%)"
            }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }