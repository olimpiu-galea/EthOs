import { cn } from "@/lib/utils";
import { EthOsLogo } from "./ethos-logo";
import { PRODUCT_NAME, PRODUCT_SCOPE_SHORT, PRODUCT_TAGLINE } from "@/lib/brand";

type EthOsWordmarkProps = {
  className?: string;
  showTagline?: boolean;
  showScope?: boolean;
  /** Sidebar: white text on black. Default: dark on light. */
  variant?: "sidebar" | "default";
  companyName?: string;
};

export function EthOsWordmark({
  className,
  showTagline = false,
  showScope = false,
  variant = "default",
  companyName,
}: EthOsWordmarkProps) {
  const onSidebar = variant === "sidebar";

  return (
    <div className={cn("flex items-center gap-3 min-w-0", className)}>
      <EthOsLogo variant={onSidebar ? "light" : "dark"} />
      <div className="min-w-0">
        <p
          className={cn(
            "font-semibold tracking-tight text-lg leading-none",
            onSidebar ? "text-white" : "text-foreground",
          )}
        >
          {PRODUCT_NAME}
        </p>
        {showTagline && (
          <p
            className={cn(
              "text-[11px] mt-1 leading-snug",
              onSidebar ? "text-white/60" : "text-muted-foreground",
            )}
          >
            {PRODUCT_TAGLINE}
          </p>
        )}
        {companyName && (
          <p
            className={cn(
              "text-xs truncate mt-0.5",
              onSidebar ? "text-white/50" : "text-muted-foreground",
            )}
          >
            {companyName}
          </p>
        )}
        {showScope && !companyName && (
          <p
            className={cn(
              "text-[10px] mt-1 leading-snug",
              onSidebar ? "text-white/45" : "text-muted-foreground",
            )}
          >
            {PRODUCT_SCOPE_SHORT}
          </p>
        )}
      </div>
    </div>
  );
}
