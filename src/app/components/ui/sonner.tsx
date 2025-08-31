"use client";

import React from "react";
import { useTheme } from "next-themes";
import {
  Toaster as SonnerToaster,
  toast as sonnerToast,
} from "sonner";

type ToasterProps = React.ComponentProps<typeof SonnerToaster>;

/**
 * Toaster component — renders Sonner's Toaster with your theme and classNames.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <SonnerToaster
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          // adjust class names as you prefer — these keys are for Sonner's built-in parts
          title:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };

/* -------------------------------------------------------------------------- */
/* Wrapper toast API                                                            */
/* -------------------------------------------------------------------------- */
/**
 * Provide a small wrapper so callers can do:
 *   import { toast } from "@/app/components/Toaster";
 *   toast({ title: "Saved", description: "Saved successfully", duration: 4000 });
 *
 * Instead of calling sonnerToast(...) directly and getting TypeScript errors
 * when passing an object with `title`/`description`.
 */

// Infer Sonner's options type from the function signature so we stay in sync
type SonnerOptions = Parameters<typeof sonnerToast>[1];

/** payload accepted by our wrapper */
export type AppToastPayload = {
  title?: React.ReactNode;
  description?: React.ReactNode;
} & (SonnerOptions extends undefined ? Record<string, unknown> : SonnerOptions);

/** wrapper that renders title + description into a ReactNode for Sonner */
export function toast({ title, description, ...options }: AppToastPayload) {
  const content = (
    <div className="min-w-[200px]">
      {title && <div className="font-semibold mb-1">{title}</div>}
      {description && <div className="text-sm">{description}</div>}
    </div>
  );

  // call Sonner's toast with rendered node + options
  return sonnerToast(content as React.ReactNode, options as SonnerOptions);
}
