import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_PEPTIDES } from '../database/defaultPeptides';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  vialSize: number;
  unit: 'mg' | 'mcg' | 'mL';
  bacWater: number;
  targetDose: number;
  doseUnit: 'mg' | 'mcg' | 'mL';
  volumeMl?: string;
  frequency: string;
  frequencyLabel: string;
  halfLifeDays: number;
  maxFridgeDays: number;
  activeDays: string[];
  injectionTime: string;
  reconstitutedDate?: string;
  estimatedDaysLeft?: number;
  isCycleActive?: boolean;
  isReminderActive?: boolean;
}

export interface FreezerItem {
  id: string;
  name: string;
  category: string;
  vialSize: number;
  unit: 'mg' | 'mcg' | 'mL';
  quantity: number;
  defaultBacWater: number;
  targetDose: number;
  frequency: string;
  frequencyLabel: string;
  halfLifeDays: number;
  maxFridgeDays: number;
  activeDays: string[];
  injectionTime: string;
}

export interface InjectionLog {
  id: string;
  peptideName: string;
  dose: number;
  unit: string;
  volumeMl: string;
  siteId: string;
  timestamp: string;
}

interface BioStackState {
  inventory: InventoryItem[];
  freezerStock: FreezerItem[];
  injectionHistory: InjectionLog[];
  currentSite: string;

  // Actions
  setSite: (siteId: string) => void;
  rotateToNextSite: () => void;
  logInjection: (log: InjectionLog) => void;
  deleteInjectionLog: (id: string) => void;
  clearHistory: () => void;

  addFreezerItem: (item: FreezerItem) => void;
  removeFreezerItem: (id: string) => void;
  updateFreezerQuantity: (id: string, quantity: number) => void;

  reconstituteToFridge: (freezerItemId: string, bacWater: number) => void;
  removeInventoryItem: (id: string) => void;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
}

const ROTATION_SITES = ['TL', 'TR', 'BR', 'BL', 'LT', 'RT', 'LA', 'RA', 'LG', 'RG'];

export const useBioStackStore = create<BioStackState>()(
  persist(
    (set, get) => ({
      inventory: [
        {
          id: 'inv-1',
          name: 'Retatrutide',
          category: 'GLP-1 / GIP / GCG Tri-Agonist',
          vialSize: 10,
          unit: 'mg',
          bacWater: 1.0,
          targetDose: 2.0,
          doseUnit: 'mg',
          frequency: 'weekly',
          frequencyLabel: 'Mingguan (Weekly)',
          halfLifeDays: 6.0,
          maxFridgeDays: 56,
          activeDays: ['Sen'],
          injectionTime: '08:00',
          reconstitutedDate: '28 Agu 2026',
          estimatedDaysLeft: 34,
          isCycleActive: false,
          isReminderActive: true,
        },
        {
          id: 'inv-2',
          name: 'GHK-Cu',
          category: 'Tissue Repair / Anti-Aging',
          vialSize: 50,
          unit: 'mg',
          bacWater: 3.0,
          targetDose: 2.0,
          doseUnit: 'mg',
          frequency: 'daily',
          frequencyLabel: 'Harian (Daily)',
          halfLifeDays: 0.5,
          maxFridgeDays: 28,
          activeDays: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
          injectionTime: '08:00',
          reconstitutedDate: '28 Agu 2026',
          estimatedDaysLeft: 24,
          isCycleActive: false,
          isReminderActive: true,
        },
      ],
      freezerStock: DEFAULT_PEPTIDES.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        vialSize: p.defaultVialSize,
        unit: p.vialUnit,
        quantity: p.defaultStock,
        defaultBacWater: p.defaultBacWater,
        targetDose: p.targetDose,
        frequency: p.frequency,
        frequencyLabel: p.frequencyLabel,
        halfLifeDays: p.halfLifeDays,
        maxFridgeDays: p.maxFridgeDays,
        activeDays: p.activeDays,
        injectionTime: p.injectionTime,
      })),
      injectionHistory: [],
      currentSite: 'TR',

      setSite: (siteId) => set({ currentSite: siteId }),

      rotateToNextSite: () => {
        const current = get().currentSite;
        const idx = ROTATION_SITES.indexOf(current);
        const nextIdx = (idx + 1) % ROTATION_SITES.length;
        set({ currentSite: ROTATION_SITES[nextIdx] });
      },

      logInjection: (log) =>
        set((state) => ({
          injectionHistory: [log, ...state.injectionHistory],
        })),

      deleteInjectionLog: (id) =>
        set((state) => ({
          injectionHistory: state.injectionHistory.filter((h) => h.id !== id),
        })),

      clearHistory: () => set({ injectionHistory: [] }),

      addFreezerItem: (item) =>
        set((state) => ({
          freezerStock: [item, ...state.freezerStock],
        })),

      removeFreezerItem: (id) =>
        set((state) => ({
          freezerStock: state.freezerStock.filter((f) => f.id !== id),
        })),

      updateFreezerQuantity: (id, quantity) =>
        set((state) => ({
          freezerStock: state.freezerStock.map((f) =>
            f.id === id ? { ...f, quantity } : f
          ),
        })),

      reconstituteToFridge: (freezerItemId, bacWater) => {
        const item = get().freezerStock.find((f) => f.id === freezerItemId);
        if (!item || item.quantity <= 0) return;

        const newInv: InventoryItem = {
          id: `inv-${Date.now()}`,
          name: item.name,
          category: item.category,
          vialSize: item.vialSize,
          unit: item.unit,
          bacWater: bacWater,
          targetDose: item.targetDose,
          doseUnit: item.unit,
          frequency: item.frequency,
          frequencyLabel: item.frequencyLabel,
          halfLifeDays: item.halfLifeDays,
          maxFridgeDays: item.maxFridgeDays,
          activeDays: item.activeDays || ['Sen'],
          injectionTime: item.injectionTime || '08:00',
          reconstitutedDate: new Date().toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
          estimatedDaysLeft: Math.round(item.maxFridgeDays * 0.8),
          isCycleActive: false,
          isReminderActive: true,
        };

        set((state) => ({
          freezerStock: state.freezerStock.map((f) =>
            f.id === freezerItemId ? { ...f, quantity: f.quantity - 1 } : f
          ),
          inventory: [newInv, ...state.inventory],
        }));
      },

      removeInventoryItem: (id) =>
        set((state) => ({
          inventory: state.inventory.filter((inv) => inv.id !== id),
        })),

      updateInventoryItem: (id, updates) =>
        set((state) => ({
          inventory: state.inventory.map((inv) =>
            inv.id === id ? { ...inv, ...updates } : inv
          ),
        })),
    }),
    {
      name: 'biostack-pro-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
