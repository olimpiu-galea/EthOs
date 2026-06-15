/** Demo fixture — Lakeview Ethanol maintenance spare-parts inventory (CMMS / storeroom) */

export type SparePartRisk = "low" | "medium" | "high" | "critical";

export type SparePartCategory =
  | "Pump part"
  | "Valve"
  | "Sensor"
  | "Motor"
  | "Bearing"
  | "Seal"
  | "Electrical"
  | "Safety";

export type MaintenancePart = {
  id: string;
  partId: string;
  partName: string;
  category: SparePartCategory;
  plantId: "PLY" | "TRE";
  area: string;
  assetId: string;
  assetName: string;
  criticality: SparePartRisk;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  minimumStock: number;
  reorderQuantity: number;
  unitOfMeasure: string;
  leadTimeDays: number;
  lastUsedDate: string;
  usageFrequency: string;
  openWorkOrders: number;
  workOrderIds: string[];
  stockoutRisk: SparePartRisk;
  downtimeImpact: string;
  recommendedAction: string;
  storageLocation: string;
  owner: string;
  lastUpdatedAt: string;
  /** When replenishment is in flight — reference only */
  relatedPurchaseOrderId?: string;
};

export const LAKEVIEW_MAINTENANCE_PARTS: MaintenancePart[] = [
  {
    id: "part-1",
    partId: "SP-PUMP-SEAL-044",
    partName: "Centrifugal Pump Mechanical Seal",
    category: "Seal",
    plantId: "TRE",
    area: "Distillation",
    assetId: "P-4402",
    assetName: "Beer Feed Pump",
    criticality: "critical",
    currentStock: 2,
    reservedStock: 1,
    availableStock: 1,
    minimumStock: 2,
    reorderQuantity: 4,
    unitOfMeasure: "kits",
    leadTimeDays: 14,
    lastUsedDate: "2026-05-28",
    usageFrequency: "Monthly",
    openWorkOrders: 1,
    workOrderIds: ["WO-88721"],
    stockoutRisk: "high",
    downtimeImpact: "Potential distillation feed interruption",
    recommendedAction: "Reorder immediately",
    storageLocation: "Warehouse A / Bin 14-C",
    owner: "Maintenance Planner",
    lastUpdatedAt: "2026-06-15T09:30:00Z",
    relatedPurchaseOrderId: "PO-10495",
  },
  {
    id: "part-2",
    partId: "SP-VALVE-ACT-2104",
    partName: "Control Valve Actuator Assembly",
    category: "Valve",
    plantId: "PLY",
    area: "Fermentation",
    assetId: "PV-2104",
    assetName: "Fermenter Pressure Control Valve",
    criticality: "high",
    currentStock: 0,
    reservedStock: 0,
    availableStock: 0,
    minimumStock: 1,
    reorderQuantity: 2,
    unitOfMeasure: "ea",
    leadTimeDays: 21,
    lastUsedDate: "2026-04-12",
    usageFrequency: "Quarterly",
    openWorkOrders: 1,
    workOrderIds: ["WO-88640"],
    stockoutRisk: "critical",
    downtimeImpact: "Pressure control on fermenter bank B",
    recommendedAction: "Escalate PO and consider rental actuator",
    storageLocation: "Warehouse B / Bin 02-A",
    owner: "Maintenance Planner",
    lastUpdatedAt: "2026-06-15T08:45:00Z",
  },
  {
    id: "part-3",
    partId: "SP-SENSOR-DIAPH-6418",
    partName: "RTD Thermowell Diaphragm Seal",
    category: "Sensor",
    plantId: "PLY",
    area: "Fermentation",
    assetId: "TT-6418-B",
    assetName: "Batch 6418 Temperature Probe",
    criticality: "high",
    currentStock: 3,
    reservedStock: 1,
    availableStock: 2,
    minimumStock: 2,
    reorderQuantity: 4,
    unitOfMeasure: "ea",
    leadTimeDays: 10,
    lastUsedDate: "2026-05-15",
    usageFrequency: "As needed",
    openWorkOrders: 1,
    workOrderIds: ["WO-88705"],
    stockoutRisk: "medium",
    downtimeImpact: "Temperature monitoring gap during cal swap",
    recommendedAction: "Reserve one kit for upcoming cal WO",
    storageLocation: "Instrument crib / Shelf 3",
    owner: "Reliability",
    lastUpdatedAt: "2026-06-15T09:00:00Z",
  },
  {
    id: "part-4",
    partId: "SP-PUMP-IMPELLER-4402",
    partName: "Pump Impeller — 4402 trim",
    category: "Pump part",
    plantId: "TRE",
    area: "Distillation",
    assetId: "P-4402",
    assetName: "Beer Feed Pump",
    criticality: "medium",
    currentStock: 1,
    reservedStock: 0,
    availableStock: 1,
    minimumStock: 1,
    reorderQuantity: 1,
    unitOfMeasure: "ea",
    leadTimeDays: 28,
    lastUsedDate: "2025-11-02",
    usageFrequency: "Annual",
    openWorkOrders: 0,
    workOrderIds: [],
    stockoutRisk: "low",
    downtimeImpact: "Extended outage if impeller damage",
    recommendedAction: "Monitor — long lead; no open WO",
    storageLocation: "Warehouse A / Oversize rack",
    owner: "Maintenance Planner",
    lastUpdatedAt: "2026-06-14T12:00:00Z",
  },
  {
    id: "part-5",
    partId: "SP-MOTOR-BRG-MCC12",
    partName: "Motor Bearing Set — MCC-12 fan",
    category: "Bearing",
    plantId: "PLY",
    area: "Electrical",
    assetId: "MCC-12",
    assetName: "MCC Room 12 Cooling Fan",
    criticality: "medium",
    currentStock: 4,
    reservedStock: 0,
    availableStock: 4,
    minimumStock: 2,
    reorderQuantity: 4,
    unitOfMeasure: "sets",
    leadTimeDays: 7,
    lastUsedDate: "2026-03-20",
    usageFrequency: "Semi-annual",
    openWorkOrders: 0,
    workOrderIds: [],
    stockoutRisk: "low",
    downtimeImpact: "MCC thermal risk if fan fails",
    recommendedAction: "Stock adequate",
    storageLocation: "Electrical storeroom / Bin 7",
    owner: "Electrical maint.",
    lastUpdatedAt: "2026-06-15T07:30:00Z",
  },
  {
    id: "part-6",
    partId: "SP-PSV-DISC-6418",
    partName: "PSV Rupture Disc — 6418 header",
    category: "Safety",
    plantId: "PLY",
    area: "Fermentation",
    assetId: "PSV-6418",
    assetName: "Fermenter Relief Device",
    criticality: "critical",
    currentStock: 1,
    reservedStock: 0,
    availableStock: 1,
    minimumStock: 2,
    reorderQuantity: 3,
    unitOfMeasure: "ea",
    leadTimeDays: 18,
    lastUsedDate: "2026-01-10",
    usageFrequency: "Rare",
    openWorkOrders: 0,
    workOrderIds: [],
    stockoutRisk: "high",
    downtimeImpact: "Cannot return fermenter without spare disc",
    recommendedAction: "Reorder to restore safety margin",
    storageLocation: "Safety cage / Locker S2",
    owner: "Reliability",
    lastUpdatedAt: "2026-06-15T09:15:00Z",
  },
  {
    id: "part-7",
    partId: "SP-FLOW-ELEM-6402",
    partName: "Magnetic Flow Meter Electrode",
    category: "Sensor",
    plantId: "PLY",
    area: "Distillation",
    assetId: "FT-6402-A",
    assetName: "Beer Flow Transmitter",
    criticality: "high",
    currentStock: 0,
    reservedStock: 0,
    availableStock: 0,
    minimumStock: 1,
    reorderQuantity: 2,
    unitOfMeasure: "ea",
    leadTimeDays: 16,
    lastUsedDate: "2026-02-18",
    usageFrequency: "As needed",
    openWorkOrders: 1,
    workOrderIds: ["WO-88710"],
    stockoutRisk: "critical",
    downtimeImpact: "Mass balance blind spot on beer feed",
    recommendedAction: "Borrow from TRE spare or expedite PO",
    storageLocation: "Instrument crib / Shelf 1",
    owner: "Maintenance Planner",
    lastUpdatedAt: "2026-06-15T09:30:00Z",
  },
  {
    id: "part-8",
    partId: "SP-HX-GASKET-3012",
    partName: "Plate HX Gasket Set — E-3012",
    category: "Pump part",
    plantId: "TRE",
    area: "Utilities",
    assetId: "E-3012",
    assetName: "Beer Preheater",
    criticality: "medium",
    currentStock: 2,
    reservedStock: 2,
    availableStock: 0,
    minimumStock: 2,
    reorderQuantity: 4,
    unitOfMeasure: "sets",
    leadTimeDays: 12,
    lastUsedDate: "2026-05-01",
    usageFrequency: "Annual PM",
    openWorkOrders: 1,
    workOrderIds: ["WO-88695"],
    stockoutRisk: "high",
    downtimeImpact: "PM cannot complete without gaskets",
    recommendedAction: "Release reservation after PM or reorder",
    storageLocation: "Warehouse A / Bin 08-D",
    owner: "Maintenance Planner",
    lastUpdatedAt: "2026-06-15T08:00:00Z",
  },
  {
    id: "part-9",
    partId: "SP-VALVE-STEM-CIP",
    partName: "CIP Drain Valve Stem Kit",
    category: "Valve",
    plantId: "PLY",
    area: "Utilities",
    assetId: "XV-CIP-DRAIN",
    assetName: "CIP Drain Isolation Valve",
    criticality: "low",
    currentStock: 5,
    reservedStock: 0,
    availableStock: 5,
    minimumStock: 2,
    reorderQuantity: 4,
    unitOfMeasure: "kits",
    leadTimeDays: 5,
    lastUsedDate: "2026-04-30",
    usageFrequency: "Quarterly",
    openWorkOrders: 0,
    workOrderIds: [],
    stockoutRisk: "low",
    downtimeImpact: "Minor CIP delay only",
    recommendedAction: "Monitor",
    storageLocation: "CIP storeroom",
    owner: "Utilities maint.",
    lastUpdatedAt: "2026-06-14T18:00:00Z",
  },
  {
    id: "part-10",
    partId: "SP-PLC-MOD-DCS",
    partName: "DCS I/O Module — analog input",
    category: "Electrical",
    plantId: "PLY",
    area: "Controls",
    assetId: "PLC-DCS-01",
    assetName: "DCS Rack Primary",
    criticality: "critical",
    currentStock: 1,
    reservedStock: 0,
    availableStock: 1,
    minimumStock: 2,
    reorderQuantity: 2,
    unitOfMeasure: "ea",
    leadTimeDays: 35,
    lastUsedDate: "2025-09-14",
    usageFrequency: "Rare",
    openWorkOrders: 0,
    workOrderIds: [],
    stockoutRisk: "medium",
    downtimeImpact: "Single point failure for analog loops",
    recommendedAction: "Long-lead critical spare — approve reorder",
    storageLocation: "Controls cage / ES-01",
    owner: "Reliability",
    lastUpdatedAt: "2026-06-15T06:30:00Z",
  },
];

export function maintenancePartsKpis(parts: MaintenancePart[]) {
  return {
    total: parts.length,
    criticalRisks: parts.filter(
      (p) => p.stockoutRisk === "critical" || p.stockoutRisk === "high",
    ).length,
    belowMinimum: parts.filter((p) => p.availableStock < p.minimumStock).length,
    neededByWo: parts.filter((p) => p.openWorkOrders > 0).length,
    noCoverage: parts.filter(
      (p) =>
        p.availableStock === 0 &&
        (p.criticality === "critical" || p.criticality === "high"),
    ).length,
    longLead: parts.filter((p) => p.leadTimeDays >= 21).length,
  };
}

export function criticalSparePartRisks(parts: MaintenancePart[]) {
  return parts.filter(
    (p) => p.stockoutRisk === "critical" || p.stockoutRisk === "high",
  );
}

export function partsBelowMinimum(parts: MaintenancePart[]) {
  return parts.filter((p) => p.availableStock < p.minimumStock);
}

export function partsNeededByWorkOrders(parts: MaintenancePart[]) {
  return parts.filter((p) => p.openWorkOrders > 0);
}

export function criticalAssetsNoCoverage(parts: MaintenancePart[]) {
  return parts.filter(
    (p) =>
      p.availableStock === 0 &&
      (p.criticality === "critical" || p.criticality === "high"),
  );
}

export function longLeadTimeParts(parts: MaintenancePart[]) {
  return parts.filter((p) => p.leadTimeDays >= 21);
}
