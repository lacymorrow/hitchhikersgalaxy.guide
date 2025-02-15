/**
 * @component Button
 * @description A versatile button component with multiple variants and sizes.
 * @author shadcn
 * @version 1.0.0
 * @status stable
 *
 * @preview
 * ```tsx
 * <Button>Click me</Button>
 * ```
 *
 * @previewVariant primary - #ffffff
 * @previewVariant destructive - #fef2f2 - dark
 * @previewVariant outline - transparent
 *
 * @example Default
 * Basic button with default styling
 * ```tsx
 * <Button>Default Button</Button>
 * ```
 *
 * @example Destructive
 * Button for destructive actions
 * ```tsx
 * <Button variant="destructive">Delete</Button>
 * ```
 *
 * @example Outline
 * Button with outline styling
 * ```tsx
 * <Button variant="outline">Outline</Button>
 * ```
 *
 * @prop variant - The visual style variant of the button - "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" - default: "default"
 * @prop size - The size of the button - "default" | "sm" | "lg" | "icon" - default: "default"
 * @prop asChild - Whether to render as a child component - boolean - default: false
 * @prop className - Additional CSS classes - string
 *
 * @do Use for primary actions that require user interaction
 * @do Keep button text concise and action-oriented
 * @do Use appropriate variants to convey meaning
 *
 * @dont Don't use multiple primary buttons in the same section
 * @dont Don't use for navigation, use Link instead
 *
 * @note The asChild prop allows rendering as any element via Radix UI's Slot
 * @note Custom styles can be applied via className prop
 *
 * @accessibility
 * Buttons are focusable and can be triggered with both mouse and keyboard.
 * Use aria-label when the button only contains an icon.
 *
 * @customization
 * The button component can be customized using Tailwind CSS classes.
 * Variants and sizes can be extended in the button.variants configuration.
 */

import { Slot } from "@radix-ui/react-slot"
import { type VariantProps, cva } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
