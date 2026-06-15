import type { Metadata } from "next";
import { PlantCopilotDemo } from "@/components/copilot/plant-copilot-demo";
import { PRODUCT_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Plant Copilot · ${PRODUCT_NAME}`,
  description:
    "Ask anything with full plant context — playbooks, batches, lab, DCS, and shift handover in one conversation.",
};

export default function CopilotPage() {
  return <PlantCopilotDemo />;
}
