"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      richColors
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          // Sonner falls back to its own (barely-there) defaults for typed
          // toasts unless these are set explicitly — match the same
          // semantic colors StatusBadge already uses app-wide.
          "--success-bg": "var(--color-emerald-50)",
          "--success-text": "var(--color-emerald-700)",
          "--success-border": "var(--color-emerald-200)",
          "--info-bg": "var(--color-blue-50)",
          "--info-text": "var(--color-blue-700)",
          "--info-border": "var(--color-blue-200)",
          "--warning-bg": "var(--color-amber-50)",
          "--warning-text": "var(--color-amber-800)",
          "--warning-border": "var(--color-amber-200)",
          "--error-bg": "var(--color-red-50)",
          "--error-text": "var(--color-red-700)",
          "--error-border": "var(--color-red-200)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
