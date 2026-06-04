"use client";

import { useRouter } from "next/navigation";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { TOAST_DURATION_MS, useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { toasts, dismiss } = useToast();
  const router = useRouter();

  return (
    <ToastProvider duration={TOAST_DURATION_MS}>
      {toasts.map(
        ({
          id,
          title,
          description,
          href,
          duration = TOAST_DURATION_MS,
          className,
          ...props
        }) => (
          <Toast
            key={id}
            duration={duration}
            {...props}
            className={cn(
              className,
              href &&
                "cursor-pointer hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-primary",
            )}
            onClick={(e) => {
              if (!href) return;
              const target = e.target as HTMLElement;
              if (target.closest("[toast-close]")) return;
              dismiss(id);
              router.push(href);
            }}
            onKeyDown={(e) => {
              if (!href) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                dismiss(id);
                router.push(href);
              }
            }}
            tabIndex={href ? 0 : undefined}
            role={href ? "link" : undefined}
          >
            <div className="grid gap-1 pr-2">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
              {href && (
                <p className="text-xs text-primary/90 mt-1 font-medium">
                  View in Agenda →
                </p>
              )}
            </div>
            <ToastClose />
          </Toast>
        ),
      )}
      <ToastViewport />
    </ToastProvider>
  );
}
