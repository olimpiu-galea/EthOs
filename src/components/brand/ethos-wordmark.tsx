import Image from "next/image";
import { cn } from "@/lib/utils";
import { PRODUCT_NAME } from "@/lib/brand";
import ethlogoLogin from "@mockAlerts/ethlogoLogin.png";

type EthOsWordmarkProps = {
  className?: string;
  /** Auth / marketing hero */
  size?: "default" | "lg";
};

export function EthOsWordmark({
  className,
  size = "default",
}: EthOsWordmarkProps) {
  const large = size === "lg";

  return (
    <Image
      src={ethlogoLogin}
      alt={PRODUCT_NAME}
      priority
      className={cn(
        "h-auto w-auto object-contain",
        large ? "max-h-14 sm:max-h-[4.25rem]" : "max-h-9 sm:max-h-10",
        className,
      )}
    />
  );
}
