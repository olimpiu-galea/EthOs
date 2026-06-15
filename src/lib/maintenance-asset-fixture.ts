/** Demo fixture — Lakeview Ethanol plant asset registry (CMMS-style) */

export type MaintenanceAssetCategory =
  | "sensors"
  | "valves"
  | "tanks"
  | "piping"
  | "pumps"
  | "heat_exchangers"
  | "electrical"
  | "safety";

export type AssetComplianceStatus =
  | "compliant"
  | "due_soon"
  | "overdue"
  | "out_of_service";

export type MaintenanceAsset = {
  id: string;
  assetTag: string;
  name: string;
  category: MaintenanceAssetCategory;
  location: string;
  area: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  criticality: "A" | "B" | "C";
  installDate: string;
  warranty: {
    start: string;
    end: string;
    type: "manufacturer" | "extended" | "parts_only";
    vendor: string;
  };
  calibration?: {
    lastDate: string;
    nextDue: string;
    interval: string;
    certNumber: string;
    tolerance: string;
    provider: string;
  };
  verification: {
    lastDate: string;
    nextDue: string;
    method: string;
  };
  inspection: {
    lastDate: string;
    nextDue: string;
    type: string;
  };
  pm: {
    lastDate: string;
    nextDue: string;
    interval: string;
  };
  licenseExpiry?: string;
  owner: string;
  status: AssetComplianceStatus;
  notes: string;
};

export const MAINTENANCE_CATEGORY_LABELS: Record<
  MaintenanceAssetCategory,
  string
> = {
  sensors: "Sensors & instruments",
  valves: "Control valves",
  tanks: "Tanks & vessels",
  piping: "Piping & headers",
  pumps: "Pumps & rotating",
  heat_exchangers: "Heat exchangers",
  electrical: "Electrical & drives",
  safety: "Safety & relief",
};

export const LAKEVIEW_MAINTENANCE_ASSETS: MaintenanceAsset[] = [
  {
    id: "a1",
    assetTag: "TT-6418-B",
    name: "Ferm B bulk temperature",
    category: "sensors",
    location: "Fermenter B · top port",
    area: "Fermentation",
    manufacturer: "Rosemount",
    model: "3144P",
    serialNumber: "RM-4418821",
    criticality: "A",
    installDate: "2022-03-14",
    warranty: {
      start: "2022-03-14",
      end: "2025-03-14",
      type: "manufacturer",
      vendor: "Emerson",
    },
    calibration: {
      lastDate: "2025-11-12",
      nextDue: "2026-06-15",
      interval: "6 months",
      certNumber: "CAL-2025-8841",
      tolerance: "±0.25 °F",
      provider: "Midwest Instrument Services",
    },
    verification: {
      lastDate: "2026-01-08",
      nextDue: "2026-07-08",
      method: "Loop check vs lab reference",
    },
    inspection: {
      lastDate: "2025-09-01",
      nextDue: "2026-09-01",
      type: "Annual instrument walkdown",
    },
    pm: {
      lastDate: "2026-02-01",
      nextDue: "2026-08-01",
      interval: "6 months",
    },
    owner: "James Reed",
    status: "compliant",
    notes: "Feeds Daily Demo playbook · compare-before-correct on 6418.",
  },
  {
    id: "a2",
    assetTag: "AT-FERM-B",
    name: "Dissolved O₂ analyzer",
    category: "sensors",
    location: "Ferm B recirc line",
    area: "Fermentation",
    manufacturer: "Mettler Toledo",
    model: "InPro 6850i",
    serialNumber: "MT-902114",
    criticality: "A",
    installDate: "2021-08-20",
    warranty: {
      start: "2021-08-20",
      end: "2024-08-20",
      type: "extended",
      vendor: "MT Service Contract",
    },
    calibration: {
      lastDate: "2025-08-22",
      nextDue: "2026-02-22",
      interval: "6 months",
      certNumber: "CAL-2025-7102",
      tolerance: "±2 % sat O₂",
      provider: "Lakeview Lab QA",
    },
    verification: {
      lastDate: "2025-10-15",
      nextDue: "2026-04-15",
      method: "Span gas verification",
    },
    inspection: {
      lastDate: "2025-06-01",
      nextDue: "2026-06-01",
      type: "Membrane & electrolyte review",
    },
    pm: {
      lastDate: "2025-12-10",
      nextDue: "2026-03-10",
      interval: "3 months",
    },
    owner: "QA / Lab",
    status: "due_soon",
    notes: "Calibration window closes in 12 days — schedule before next 6418 drop.",
  },
  {
    id: "a3",
    assetTag: "PV-2104",
    name: "Steam to reboiler control valve",
    category: "valves",
    location: "Distillation · E-3012 steam header",
    area: "Distillation",
    manufacturer: "Fisher",
    model: "DVC6200 / GX",
    serialNumber: "FS-2104-88",
    criticality: "A",
    installDate: "2019-11-02",
    warranty: {
      start: "2019-11-02",
      end: "2022-11-02",
      type: "parts_only",
      vendor: "Emerson Local",
    },
    verification: {
      lastDate: "2025-07-20",
      nextDue: "2026-01-20",
      method: "Stroke test + positioner feedback",
    },
    inspection: {
      lastDate: "2025-04-10",
      nextDue: "2026-04-10",
      type: "Packing leak survey",
    },
    pm: {
      lastDate: "2025-11-01",
      nextDue: "2026-05-01",
      interval: "6 months",
    },
    owner: "Maintenance",
    status: "overdue",
    notes: "Verification overdue 4 months — stroke test blocked until outage window.",
  },
  {
    id: "a4",
    assetTag: "TW-6105",
    name: "Beer well storage tank",
    category: "tanks",
    location: "Beer well farm · TW-6105",
    area: "Beer handling",
    manufacturer: "Tank Craft",
    model: "API 650 · 619k gal",
    serialNumber: "TC-6105-2017",
    criticality: "A",
    installDate: "2017-05-18",
    warranty: {
      start: "2017-05-18",
      end: "2020-05-18",
      type: "manufacturer",
      vendor: "Tank Craft",
    },
    verification: {
      lastDate: "2025-03-01",
      nextDue: "2026-03-01",
      method: "API 653 visual + UT spot",
    },
    inspection: {
      lastDate: "2025-03-01",
      nextDue: "2026-03-01",
      type: "Annual tank integrity",
    },
    pm: {
      lastDate: "2026-01-15",
      nextDue: "2026-07-15",
      interval: "6 months",
    },
    owner: "Brian Henderson",
    status: "compliant",
    notes: "Commingling point for ferm drops · rack loadout downstream.",
  },
  {
    id: "a5",
    assetTag: "PH-CIP-01",
    name: "Ferm loop CIP supply header",
    category: "piping",
    location: "CIP skid · Ferm A/B loop",
    area: "Utilities",
    manufacturer: "Lakeview fab",
    model: "3\" SS316L header",
    serialNumber: "LV-CIP-01",
    criticality: "B",
    installDate: "2018-09-12",
    warranty: {
      start: "2018-09-12",
      end: "2018-09-12",
      type: "parts_only",
      vendor: "N/A — in-house",
    },
    verification: {
      lastDate: "2025-12-01",
      nextDue: "2026-06-01",
      method: "Hydro test log review",
    },
    inspection: {
      lastDate: "2025-08-20",
      nextDue: "2026-08-20",
      type: "External corrosion walkdown",
    },
    pm: {
      lastDate: "2026-02-20",
      nextDue: "2026-05-20",
      interval: "3 months",
    },
    owner: "Maintenance",
    status: "due_soon",
    notes: "PM due before next enzy CIP campaign.",
  },
  {
    id: "a6",
    assetTag: "P-4402",
    name: "Beer transfer centrifugal pump",
    category: "pumps",
    location: "Beer well → distillation feed",
    area: "Beer handling",
    manufacturer: "Goulds",
    model: "3196 MTX",
    serialNumber: "GD-4402-44",
    criticality: "A",
    installDate: "2020-02-28",
    warranty: {
      start: "2020-02-28",
      end: "2023-02-28",
      type: "extended",
      vendor: "Xylem",
    },
    verification: {
      lastDate: "2025-10-05",
      nextDue: "2026-04-05",
      method: "Vibration baseline + seal leak check",
    },
    inspection: {
      lastDate: "2025-10-05",
      nextDue: "2026-10-05",
      type: "Mechanical seal inspection",
    },
    pm: {
      lastDate: "2025-12-18",
      nextDue: "2026-06-18",
      interval: "6 months",
    },
    owner: "Maintenance",
    status: "compliant",
    notes: "Coupled to batch 6418 beer well routing in demo path.",
  },
  {
    id: "a7",
    assetTag: "E-3012",
    name: "Distillation reboiler",
    category: "heat_exchangers",
    location: "Column C-301 · sump",
    area: "Distillation",
    manufacturer: "Alfa Laval",
    model: "M10-BFG",
    serialNumber: "AL-3012-09",
    criticality: "A",
    installDate: "2016-06-01",
    warranty: {
      start: "2016-06-01",
      end: "2019-06-01",
      type: "manufacturer",
      vendor: "Alfa Laval",
    },
    verification: {
      lastDate: "2025-05-12",
      nextDue: "2026-05-12",
      method: "Thermal performance check",
    },
    inspection: {
      lastDate: "2025-05-12",
      nextDue: "2026-05-12",
      type: "Tube bundle external exam",
    },
    pm: {
      lastDate: "2025-11-30",
      nextDue: "2026-05-30",
      interval: "6 months",
    },
    owner: "Maintenance",
    status: "compliant",
    notes: "Steam via PV-2104 · fouling watch in winter.",
  },
  {
    id: "a8",
    assetTag: "MCC-12",
    name: "Ferm agitator VFD",
    category: "electrical",
    location: "MCC-12 · line 4",
    area: "Fermentation",
    manufacturer: "Allen-Bradley",
    model: "PowerFlex 755",
    serialNumber: "AB-PF755-4418",
    criticality: "A",
    installDate: "2021-01-15",
    warranty: {
      start: "2021-01-15",
      end: "2024-01-15",
      type: "manufacturer",
      vendor: "Rockwell",
    },
    licenseExpiry: "2026-12-31",
    verification: {
      lastDate: "2025-09-18",
      nextDue: "2026-09-18",
      method: "Firmware audit + torque limit test",
    },
    inspection: {
      lastDate: "2025-09-18",
      nextDue: "2026-09-18",
      type: "Arc flash label review",
    },
    pm: {
      lastDate: "2026-01-05",
      nextDue: "2026-07-05",
      interval: "6 months",
    },
    owner: "Maintenance",
    status: "compliant",
    notes: "TechConnect license renew Q4 · agitator alarm tied to Ferm B.",
  },
  {
    id: "a9",
    assetTag: "PSV-6418",
    name: "Ferm B relief valve",
    category: "safety",
    location: "Ferm B vapor header",
    area: "Fermentation",
    manufacturer: "Crosby",
    model: "JOS-E",
    serialNumber: "CR-PSV-6418",
    criticality: "A",
    installDate: "2017-04-22",
    warranty: {
      start: "2017-04-22",
      end: "2017-04-22",
      type: "parts_only",
      vendor: "Emerson",
    },
    verification: {
      lastDate: "2024-06-01",
      nextDue: "2026-06-01",
      method: "RV pop test @ 15 psig",
    },
    inspection: {
      lastDate: "2024-06-01",
      nextDue: "2026-06-01",
      type: "API 576 relief device",
    },
    pm: {
      lastDate: "2024-06-01",
      nextDue: "2026-06-01",
      interval: "24 months",
    },
    owner: "Brian Henderson",
    status: "due_soon",
    notes: "RV test due before summer pressure season · board item.",
  },
  {
    id: "a10",
    assetTag: "FT-6402-A",
    name: "Ferm A flow transmitter",
    category: "sensors",
    location: "Ferm A drop line",
    area: "Fermentation",
    manufacturer: "Krohne",
    model: "OPTIFLUX 4300",
    serialNumber: "KH-6402-01",
    criticality: "B",
    installDate: "2023-06-10",
    warranty: {
      start: "2023-06-10",
      end: "2026-06-10",
      type: "manufacturer",
      vendor: "Krohne",
    },
    calibration: {
      lastDate: "2025-12-01",
      nextDue: "2026-06-01",
      interval: "6 months",
      certNumber: "CAL-2025-9200",
      tolerance: "±0.5 % of reading",
      provider: "Midwest Instrument Services",
    },
    verification: {
      lastDate: "2025-12-01",
      nextDue: "2026-06-01",
      method: "Grab sample vs meter totalizer",
    },
    inspection: {
      lastDate: "2025-06-10",
      nextDue: "2026-06-10",
      type: "Electrode & liner check",
    },
    pm: {
      lastDate: "2025-12-01",
      nextDue: "2026-06-01",
      interval: "6 months",
    },
    owner: "James Reed",
    status: "compliant",
    notes: "Active batch 6402 reference meter.",
  },
  {
    id: "a11",
    assetTag: "XV-CIP-DRAIN",
    name: "CIP drain block valve",
    category: "valves",
    location: "CIP return · basement",
    area: "Utilities",
    manufacturer: "Swagelok",
    model: "40G series ball",
    serialNumber: "SW-XV-882",
    criticality: "C",
    installDate: "2019-04-01",
    warranty: {
      start: "2019-04-01",
      end: "2019-04-01",
      type: "parts_only",
      vendor: "Swagelok",
    },
    verification: {
      lastDate: "2025-02-14",
      nextDue: "2026-02-14",
      method: "Seat leak Class VI check",
    },
    inspection: {
      lastDate: "2025-02-14",
      nextDue: "2026-02-14",
      type: "Manual valve exercise",
    },
    pm: {
      lastDate: "2025-08-14",
      nextDue: "2026-02-14",
      interval: "6 months",
    },
    owner: "Maintenance",
    status: "out_of_service",
    notes: "Tagged out — replacement ordered · do not energize CIP return.",
  },
  {
    id: "a12",
    assetTag: "PLC-DCS-01",
    name: "DCS engineering workstation",
    category: "electrical",
    location: "Control room · rack 2",
    area: "Controls",
    manufacturer: "Honeywell",
    model: "Experion PKS R510",
    serialNumber: "HW-EXP-510",
    criticality: "A",
    installDate: "2020-11-01",
    warranty: {
      start: "2020-11-01",
      end: "2023-11-01",
      type: "extended",
      vendor: "Honeywell",
    },
    licenseExpiry: "2026-09-30",
    verification: {
      lastDate: "2025-09-30",
      nextDue: "2026-09-30",
      method: "Cyber patch baseline + backup restore test",
    },
    inspection: {
      lastDate: "2025-09-30",
      nextDue: "2026-09-30",
      type: "UPS & HVAC for control room",
    },
    pm: {
      lastDate: "2025-12-15",
      nextDue: "2026-06-15",
      interval: "6 months",
    },
    owner: "Company Admin",
    status: "due_soon",
    notes: "License renewal quote pending · playbook tags read from this node.",
  },
];

export function maintenanceKpis(assets: MaintenanceAsset[]) {
  return {
    total: assets.length,
    overdue: assets.filter((a) => a.status === "overdue").length,
    dueSoon: assets.filter((a) => a.status === "due_soon").length,
    outOfService: assets.filter((a) => a.status === "out_of_service").length,
    warrantyExpiring: assets.filter((a) => {
      const end = new Date(a.warranty.end).getTime();
      const now = Date.now();
      const ninety = 90 * 24 * 60 * 60 * 1000;
      return end > now && end - now < ninety;
    }).length,
  };
}
