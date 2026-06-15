import type { Metadata } from "next";
import { MaintenanceHub } from "@/components/maintenance/maintenance-hub";
import { PRODUCT_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Maintenance · ${PRODUCT_NAME}`,
  description:
    "Lakeview Ethanol plant asset registry — sensors, valves, tanks, calibration, warranty, and PM tracking.",
};

export default function MaintenancePage() {
  return <MaintenanceHub />;
}
