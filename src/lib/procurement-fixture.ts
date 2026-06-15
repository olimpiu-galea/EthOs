/** Demo fixture — Lakeview Ethanol procurement (ERP / buying workflow) */

export type ProcurementRiskLevel = "low" | "medium" | "high" | "critical";

export type PurchaseOrderStatus =
  | "not_started"
  | "requested"
  | "approved"
  | "ordered"
  | "shipped"
  | "received";

export type ProcurementCategory =
  | "Chemical"
  | "Consumable"
  | "Feedstock"
  | "Nutrient"
  | "Biological"
  | "CIP"
  | "Service";

export type ProcurementItem = {
  id: string;
  itemId: string;
  itemName: string;
  category: ProcurementCategory;
  plantId: "PLY" | "TRE";
  area: string;
  currentStock: number;
  unitOfMeasure: string;
  minimumStock: number;
  targetStock: number;
  daysOfCover: number;
  consumptionRate: number;
  consumptionUnit: string;
  leadTimeDays: number;
  requiredByDate: string;
  supplierName: string;
  lastPurchasePrice: number;
  priceUnit: string;
  estimatedCost: number;
  purchaseOrderStatus: PurchaseOrderStatus;
  purchaseOrderId?: string;
  riskLevel: ProcurementRiskLevel;
  operationalImpact: string;
  recommendedAction: string;
  owner: string;
  lastUpdatedAt: string;
  /** When a spare part overlaps maintenance domain — reference only */
  relatedWorkOrderId?: string;
};

export const PURCHASE_ORDER_LABELS: Record<PurchaseOrderStatus, string> = {
  not_started: "Not started",
  requested: "Requested",
  approved: "Approved",
  ordered: "Ordered",
  shipped: "Shipped",
  received: "Received",
};

export const LAKEVIEW_PROCUREMENT_ITEMS: ProcurementItem[] = [
  {
    id: "proc-1",
    itemId: "CHEM-ENZ-001",
    itemName: "Alpha Amylase Enzyme",
    category: "Chemical",
    plantId: "PLY",
    area: "Fermentation",
    currentStock: 420,
    unitOfMeasure: "L",
    minimumStock: 300,
    targetStock: 900,
    daysOfCover: 4.8,
    consumptionRate: 87.5,
    consumptionUnit: "L/day",
    leadTimeDays: 7,
    requiredByDate: "2026-06-22",
    supplierName: "Preferred Supplier A",
    lastPurchasePrice: 18.4,
    priceUnit: "/ L",
    estimatedCost: 8832,
    purchaseOrderStatus: "requested",
    purchaseOrderId: "PO-10492",
    riskLevel: "high",
    operationalImpact: "Fermentation yield risk if liquefaction dosing stops",
    recommendedAction: "Expedite purchase order",
    owner: "Procurement",
    lastUpdatedAt: "2026-06-15T09:30:00Z",
  },
  {
    id: "proc-2",
    itemId: "CHEM-GLUCO-001",
    itemName: "Gluco Amylase",
    category: "Chemical",
    plantId: "PLY",
    area: "Fermentation",
    currentStock: 310,
    unitOfMeasure: "L",
    minimumStock: 200,
    targetStock: 600,
    daysOfCover: 6.2,
    consumptionRate: 50,
    consumptionUnit: "L/day",
    leadTimeDays: 7,
    requiredByDate: "2026-06-25",
    supplierName: "Preferred Supplier A",
    lastPurchasePrice: 22.1,
    priceUnit: "/ L",
    estimatedCost: 6410,
    purchaseOrderStatus: "approved",
    purchaseOrderId: "PO-10488",
    riskLevel: "medium",
    operationalImpact: "Saccharification rate may drop",
    recommendedAction: "Confirm ship date with supplier",
    owner: "Procurement",
    lastUpdatedAt: "2026-06-15T09:30:00Z",
  },
  {
    id: "proc-3",
    itemId: "FEED-CORN-001",
    itemName: "Yellow #2 Corn",
    category: "Feedstock",
    plantId: "PLY",
    area: "Mash",
    currentStock: 12500,
    unitOfMeasure: "bu",
    minimumStock: 8000,
    targetStock: 20000,
    daysOfCover: 9.5,
    consumptionRate: 1315,
    consumptionUnit: "bu/day",
    leadTimeDays: 3,
    requiredByDate: "2026-06-20",
    supplierName: "Midwest Grain Co-op",
    lastPurchasePrice: 4.82,
    priceUnit: "/ bu",
    estimatedCost: 36150,
    purchaseOrderStatus: "ordered",
    purchaseOrderId: "PO-10475",
    riskLevel: "low",
    operationalImpact: "Mash throughput unaffected this week",
    recommendedAction: "Monitor railcar ETA",
    owner: "Procurement",
    lastUpdatedAt: "2026-06-15T08:00:00Z",
  },
  {
    id: "proc-4",
    itemId: "BIO-YEAST-001",
    itemName: "Active Dry Yeast",
    category: "Biological",
    plantId: "PLY",
    area: "Fermentation",
    currentStock: 180,
    unitOfMeasure: "kg",
    minimumStock: 200,
    targetStock: 500,
    daysOfCover: 3.1,
    consumptionRate: 58,
    consumptionUnit: "kg/day",
    leadTimeDays: 5,
    requiredByDate: "2026-06-18",
    supplierName: "BioFerm Supply",
    lastPurchasePrice: 12.6,
    priceUnit: "/ kg",
    estimatedCost: 4032,
    purchaseOrderStatus: "not_started",
    riskLevel: "critical",
    operationalImpact: "Batch 6418 pitch window at risk",
    recommendedAction: "Raise emergency PO today",
    owner: "Procurement",
    lastUpdatedAt: "2026-06-15T09:45:00Z",
  },
  {
    id: "proc-5",
    itemId: "NUT-DAP-001",
    itemName: "DAP Nutrient",
    category: "Nutrient",
    plantId: "PLY",
    area: "Fermentation",
    currentStock: 24,
    unitOfMeasure: "bags",
    minimumStock: 10,
    targetStock: 40,
    daysOfCover: 12,
    consumptionRate: 2,
    consumptionUnit: "bags/day",
    leadTimeDays: 4,
    requiredByDate: "2026-06-28",
    supplierName: "ChemServe Midwest",
    lastPurchasePrice: 48,
    priceUnit: "/ bag",
    estimatedCost: 768,
    purchaseOrderStatus: "received",
    purchaseOrderId: "PO-10460",
    riskLevel: "low",
    operationalImpact: "No immediate fermentation impact",
    recommendedAction: "Monitor consumption",
    owner: "Procurement",
    lastUpdatedAt: "2026-06-14T16:00:00Z",
  },
  {
    id: "proc-6",
    itemId: "CIP-CAUST-001",
    itemName: "CIP Caustic 50%",
    category: "CIP",
    plantId: "PLY",
    area: "Utilities",
    currentStock: 310,
    unitOfMeasure: "gal",
    minimumStock: 150,
    targetStock: 500,
    daysOfCover: 8.4,
    consumptionRate: 37,
    consumptionUnit: "gal/day",
    leadTimeDays: 6,
    requiredByDate: "2026-06-24",
    supplierName: "ChemServe Midwest",
    lastPurchasePrice: 2.15,
    priceUnit: "/ gal",
    estimatedCost: 409,
    purchaseOrderStatus: "shipped",
    purchaseOrderId: "PO-10490",
    riskLevel: "medium",
    operationalImpact: "CIP window may slip if delivery late",
    recommendedAction: "Track inbound shipment",
    owner: "Procurement",
    lastUpdatedAt: "2026-06-15T07:15:00Z",
  },
  {
    id: "proc-7",
    itemId: "SP-PUMP-SEAL-044",
    itemName: "Centrifugal Pump Mechanical Seal Kit",
    category: "Consumable",
    plantId: "TRE",
    area: "Distillation",
    currentStock: 1,
    unitOfMeasure: "kits",
    minimumStock: 2,
    targetStock: 4,
    daysOfCover: 0,
    consumptionRate: 0.25,
    consumptionUnit: "kits/month",
    leadTimeDays: 14,
    requiredByDate: "2026-06-20",
    supplierName: "Rotating Equipment Parts Co.",
    lastPurchasePrice: 1240,
    priceUnit: "/ kit",
    estimatedCost: 2480,
    purchaseOrderStatus: "ordered",
    purchaseOrderId: "PO-10495",
    riskLevel: "high",
    operationalImpact: "Beer feed pump P-4402 reliability",
    recommendedAction: "Coordinate with maintenance on WO timing",
    owner: "Procurement",
    lastUpdatedAt: "2026-06-15T09:30:00Z",
    relatedWorkOrderId: "WO-88721",
  },
  {
    id: "proc-8",
    itemId: "SVC-CAL-INST",
    itemName: "Annual Instrument Calibration Service",
    category: "Service",
    plantId: "PLY",
    area: "Fermentation",
    currentStock: 0,
    unitOfMeasure: "contract",
    minimumStock: 1,
    targetStock: 1,
    daysOfCover: 0,
    consumptionRate: 1,
    consumptionUnit: "contract/year",
    leadTimeDays: 21,
    requiredByDate: "2026-07-01",
    supplierName: "Precision Cal Labs",
    lastPurchasePrice: 18500,
    priceUnit: "/ year",
    estimatedCost: 18500,
    purchaseOrderStatus: "requested",
    purchaseOrderId: "PO-10499",
    riskLevel: "medium",
    operationalImpact: "TT-6418-B calibration window",
    recommendedAction: "Route for approval before month end",
    owner: "Procurement",
    lastUpdatedAt: "2026-06-15T06:00:00Z",
  },
];

export function procurementKpis(items: ProcurementItem[]) {
  return {
    total: items.length,
    criticalRisks: items.filter(
      (i) => i.riskLevel === "critical" || i.riskLevel === "high",
    ).length,
    belowMinimum: items.filter((i) => i.currentStock <= i.minimumStock).length,
    stockoutBeforeLead: items.filter(
      (i) => i.daysOfCover < i.leadTimeDays,
    ).length,
    openPos: items.filter(
      (i) =>
        i.purchaseOrderStatus !== "received" &&
        i.purchaseOrderStatus !== "not_started",
    ).length,
    supplierIssues: items.filter(
      (i) => i.leadTimeDays >= 14 && i.daysOfCover < i.leadTimeDays,
    ).length,
  };
}

export function criticalPurchaseRisks(items: ProcurementItem[]) {
  return items.filter(
    (i) => i.riskLevel === "critical" || i.riskLevel === "high",
  );
}

export function itemsBelowMinimum(items: ProcurementItem[]) {
  return items.filter((i) => i.currentStock <= i.minimumStock);
}

export function stockoutBeforeLeadTime(items: ProcurementItem[]) {
  return items.filter((i) => i.daysOfCover < i.leadTimeDays);
}

export function openPurchaseOrders(items: ProcurementItem[]) {
  return items.filter(
    (i) =>
      i.purchaseOrderStatus !== "received" &&
      i.purchaseOrderStatus !== "not_started",
  );
}

export function supplierLeadTimeIssues(items: ProcurementItem[]) {
  return items.filter(
    (i) => i.leadTimeDays >= 14 && i.daysOfCover < i.leadTimeDays,
  );
}
