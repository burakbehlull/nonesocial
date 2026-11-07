import * as React from "react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip"

const IconButton = React.forwardRef(({ 
  className, 
  children, 
  tooltip, 
  variant = "default",
  size = "default",
  active = false,
  ...props 
}, ref) => {
  const variants = {
    default: "hover:bg-accent hover:text-accent-foreground",
    primary: "hover:bg-primary/10 hover:text-primary",
    success: "bg-success/10 text-success hover:bg-success/20",
    destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20",
    ghost: "hover:bg-accent/50",
  }

  const sizes = {
    sm: "h-8 w-8",
    default: "h-10 w-10",
    lg: "h-12 w-12",
  }

  const button = (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-full transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        "interactive",
        variants[variant],
        sizes[size],
        active && "bg-primary text-primary-foreground hover:bg-primary/90",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return button
})

IconButton.displayName = "IconButton"

export { IconButton }
