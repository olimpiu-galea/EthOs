import { cn } from "@/lib/utils";
import { EthOsLogo } from "./ethos-logo";
import { PRODUCT_NAME } from "@/lib/brand";

type EthOsWordmarkProps = {
  className?: string;
  /** Sidebar: white text on black. Default: dark on light. */
  variant?: "sidebar" | "default";
  /** Auth / marketing hero */
  size?: "default" | "lg";
};

export function EthOsWordmark({
  className,
  variant = "default",
  size = "default",
}: EthOsWordmarkProps) {
  const onSidebar = variant === "sidebar";
  const large = size === "lg";

  return (
    <div className={cn("flex items-center gap-3 min-w-0", className)}>
      <EthOsLogo
        variant={onSidebar ? "light" : "dark"}
        className={large ? "h-10 w-10" : undefined}
      />
      <p
        className={cn(
          "font-semibold tracking-tight leading-none",
          large ? "text-2xl sm:text-3xl" : "text-lg",
          onSidebar ? "text-white" : "text-foreground",
        )}
      >
        {PRODUCT_NAME}
      </p>
    </div>
  );
}
