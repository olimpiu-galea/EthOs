import { cn } from "@/lib/utils";

type EthOsLogoProps = {
  className?: string;
  /** white circles on dark sidebar; dark on light surfaces */
  variant?: "light" | "dark";
};

/** Molecule-style mark matching EthOs reference */
export function EthOsLogo({ className, variant = "light" }: EthOsLogoProps) {
  const fill = variant === "light" ? "white" : "currentColor";
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={cn("h-8 w-8 shrink-0", className)}
    >
      <circle cx="16" cy="8" r="3.5" fill={fill} />
      <circle cx="8" cy="18" r="3" fill={fill} opacity="0.9" />
      <circle cx="24" cy="18" r="3" fill={fill} opacity="0.9" />
      <circle cx="12" cy="26" r="2.5" fill={fill} opacity="0.75" />
      <circle cx="20" cy="26" r="2.5" fill={fill} opacity="0.75" />
      <circle cx="16" cy="16" r="2" fill={fill} opacity="0.55" />
    </svg>
  );
}
