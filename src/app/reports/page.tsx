import { ReportsHubFunctional } from "@/components/reports/reports-hub-functional";
import { PRODUCT_NAME } from "@/lib/brand";

export const metadata = {
  title: `Reports | ${PRODUCT_NAME}`,
  description: "Operations reporting — DOR and site packs",
};

export default function ReportsPage() {
  return <ReportsHubFunctional />;
}
