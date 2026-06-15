import { cn } from "@/lib/utils";
import { EthOsLogo } from "./ethos-logo";
import { PRODUCT_NAME } from "@/lib/brand";

type EthOsWordmarkProps = {
  className?: string;
  /** Sidebar: white text on black. Default: dark on light. */
  variant?: "sidebar" | "default";
};

export function EthOsWordmark({
  className,
  variant = "default",
}: EthOsWordmarkProps) {
  const onSidebar = variant === "sidebar";

  return (
    <div className={cn("flex items-center gap-3 min-w-0", className)}>
      <EthOsLogo variant={onSidebar ? "light" : "dark"} />
      <p
        className={cn(
          "font-semibold tracking-tight text-lg leading-none",
          onSidebar ? "text-white" : "text-foreground",
        )}
      >
        {PRODUCT_NAME}
      </p>
    </div>
  );
}
