import type { Metadata } from "next";
import { PlantComplianceDemo } from "@/components/compliance/plant-compliance-demo";
import { PRODUCT_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Plant Compliance · ${PRODUCT_NAME}`,
  description:
    "Lakeview Energy plant compliance — fermentation QA, lab schedule, shift documentation, and industry challenges.",
};

export default function CompliancePage() {
  return <PlantComplianceDemo />;
}
