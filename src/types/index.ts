export type PeptideUnit = 'mg' | 'mcg' | 'mL';

export interface PeptideDefinition {
  id: string;
  name: string;
  category: string;
  vialSizeMg: number;
  unit: PeptideUnit;
  defaultBacWaterMl: number;
  doseRange: { min: number; max: number; step: number };
  presetDoses: { low: number; standard: number; high: number };
  halfLifeHours: number;
  defaultSchedule: string;
  defaultDays: string[];
  timingTip: string;
  reconInstructions: string;
}

export interface ActiveInventoryItem {
  id: string;
  freezerId: string;
  name: string;
  vialSizeMg: number;
  unit: PeptideUnit;
  category: string;
  schedule: string;
  injectionDays: string[];
  bacWaterMl: number;
  selectedDose: number;
  presetDoses: { low: number; standard: number; high: number };
  penClicksPerMl: number;
  reconstitutedAt: string;
  maxShelfLifeDays: number;
  estEmptyDays: number;
  injectionTime: string;
  reminderEnabled: boolean;
  hasCycle: boolean;
  cycleOnWeeks: number;
  cycleOffWeeks: number;
  cycleStartDate: string;
}

export interface FreezerStockItem {
  id: string;
  name: string;
  vialSizeMg: number;
  unit: PeptideUnit;
  category: string;
  freezerStock: number;
  bacWaterMl: number;
  defaultDose: number;
  presetDoses: { low: number; standard: number; high: number };
  schedule: string;
  injectionDays: string[];
  penClicksPerMl: number;
  halfLifeHours: number;
}

export interface InjectionLog {
  id: string;
  peptideId: string;
  peptideName: string;
  dose: number;
  unit: PeptideUnit;
  volMl: number;
  u100Units: number;
  clicks: number;
  locationId: string;
  locationName: string;
  dateStr: string;
  timeStr: string;
  timestamp: string;
}

export interface InjectionSite {
  id: string;
  code: string;
  name: string;
  desc: string;
  side: string;
  cx: number;
  cy: number;
}
