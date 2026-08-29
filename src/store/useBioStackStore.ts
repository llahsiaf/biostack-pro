import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  currentVolumeMl?: number; // Tracker Sisa Cairan Real-time
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

// Data Peptida Bawaan (Mandiri tanpa dependensi luar)
const INITIAL_FREEZER_PEPTIDES: FreezerItem[] = [
  {
    id: 'pep-reta-1',
    name: 'Retatrutide',
    category: 'GLP-1 / GIP / GCG Tri-Agonist',
    vialSize: 10,
    unit: 'mg',
    quantity: 10,
    defaultBacWater: 2.0,
    targetDose: 2.0,
    frequency: 'weekly',
    frequencyLabel: 'Mingguan (Weekly)',
    halfLifeDays: 6.0,
    maxFridgeDays: 56,
    activeDays: ['Sen'],
    injectionTime: '08:00',
  },
  {
    id: 'pep-tirz-1',
    name: 'Tirzepatide',
    category: 'GLP-1 / GIP Dual Agonist',
    vialSize: 10,
    unit: 'mg',
    quantity: 10,
    defaultBacWater: 2.0,
    targetDose: 2.5,
    frequency: 'weekly',
    frequencyLabel: 'Mingguan (Weekly)',
    halfLifeDays: 5.0,
    maxFridgeDays: 56,
    activeDays: ['Sen'],
    injectionTime: '08:00',
  },
  {
    id: 'pep-sema-1',
    name: 'Semaglutide',
    category: 'GLP-1 Receptor Agonist',
    vialSize: 5,
    unit: 'mg',
    quantity: 8,
    defaultBacWater: 2.0,
    targetDose: 0.5,
    frequency: 'weekly',
    frequencyLabel: 'Mingguan (Weekly)',
    halfLifeDays: 7.0,
    maxFridgeDays: 56,
    activeDays: ['Sen'],
    injectionTime: '08:00',
  },
  {
    id: 'pep-cagri-1',
    name: 'Cagrilintide',
    category: 'Amylin Analogue / Satiety',
    vialSize: 5,
    unit: 'mg',
    quantity: 8,
    defaultBacWater: 2.0,
    targetDose: 0.3,
    frequency: 'weekly',
    frequencyLabel: 'Mingguan (Weekly)',
    halfLifeDays: 7.0,
    maxFridgeDays: 56,
    activeDays: ['Sen'],
    injectionTime: '08:00',
  },
  {
    id: 'pep-ghk-1',
    name: 'GHK-Cu',
    category: 'Tissue Repair & Collagen',
    vialSize: 50,
    unit: 'mg',
    quantity: 10,
    defaultBacWater: 3.0,
    targetDose: 2.0,
    frequency: 'daily',
    frequencyLabel: 'Harian (Daily)',
    halfLifeDays: 0.5,
    maxFridgeDays: 28,
    activeDays: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
    injectionTime: '08:00',
  },
  {
    id: 'pep-motsc-1',
    name: 'MOTS-c',
    category: 'Mitochondrial Energy',
    vialSize: 20,
    unit: 'mg',
    quantity: 10,
    defaultBacWater: 2.0,
    targetDose: 5.0,
    frequency: '3x_week',
    frequencyLabel: '3x Seminggu',
    halfLifeDays: 1.0,
    maxFridgeDays: 28,
    activeDays: ['Sen', 'Rab', 'Jum'],
    injectionTime: '08:00',
  },
  {
    id: 'pep-lc526-1',
    name: 'LC526',
    category: 'Fat Metabolism & Liver',
    vialSize: 10,
    unit: 'mL',
    quantity: 10,
    defaultBacWater: 0,
    targetDose: 0.2,
    frequency: 'daily',
    frequencyLabel: 'Harian (Daily)',
    halfLifeDays: 1.0,
    maxFridgeDays: 60,
    activeDays: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
    injectionTime: '08:00',
  },
  {
    id: 'pep-kiss-1',
    name: 'Kisspeptin',
    category: 'Hormonal Axis Support',
    vialSize: 10,
    unit: 'mg',
    quantity: 10,
    defaultBacWater: 2.0,
    targetDose: 0.2,
    frequency: '3x_week',
    frequencyLabel: '3x Seminggu',
    halfLifeDays: 1.0,
    maxFridgeDays: 28,
    activeDays: ['Sen', 'Rab', 'Jum'],
    injectionTime: '17:15',
  },
];

// Urutan Rotasi Titik Anatomi Indonesia
export const ROTATION_SITES = [
  'KA',   // Perut Kanan Atas
  'KiA',  // Perut Kiri Atas
  'KB',   // Perut Kanan Bawah
  'KiB',  // Perut Kiri Bawah
  'PKi',  // Paha Kiri Luar
  'PKn',  // Paha Kanan Luar
  'LKi',  // Lengan Kiri Belakang
  'LKn',  // Lengan Kanan Belakang
  'BKi',  // Bokong Kiri Atas
  'BKn',  // Bokong Kanan Atas
];

interface BioStackState {
  inventory: InventoryItem[];
  freezerStock: FreezerItem[];
  injectionHistory: InjectionLog[];
  currentSite: string;

  setSite: (siteId: string) => void;
  rotateToNextSite: () => void;
  logInjection: (log: InjectionLog) => void;
  deleteInjectionLog: (id: string) => void;
  clearHistory: () => void;

  addFreezerItem: (item: FreezerItem) => void;
  removeFreezerItem: (id: string) => void;
  updateFreezerQuantity: (id: string, quantity: number) => void;

  reconstituteToFridge: (freezerItemId: string, bacWater: number) => void;
  transferLiquidToFridge: (freezerItemId: string) => void;
  removeInventoryItem: (id: string) => void;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
}

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
          currentVolumeMl: 1.0, // Tracker cairan
        },
        {
          id: 'inv-2',
          name: 'Kisspeptin',
          category: 'Hormonal Axis Support',
          vialSize: 10,
          unit: 'mg',
          bacWater: 2.0,
          targetDose: 0.2,
          doseUnit: 'mg',
          frequency: '3x_week',
          frequencyLabel: '3x Seminggu',
          halfLifeDays: 1.0,
          maxFridgeDays: 28,
          activeDays: ['Sen', 'Rab', 'Jum'],
          injectionTime: '17:15',
          reconstitutedDate: '29 Agu 2026',
          estimatedDaysLeft: 22,
          isCycleActive: false,
          isReminderActive: true,
          currentVolumeMl: 2.0, // Tracker cairan
        },
      ],
      freezerStock: INITIAL_FREEZER_PEPTIDES,
      injectionHistory: [],
      currentSite: 'KA',

      setSite: (siteId) => set({ currentSite: siteId }),

      rotateToNextSite: () => {
        const current = get().currentSite;
        const idx = ROTATION_SITES.indexOf(current);
        const nextIdx = idx >= 0 ? (idx + 1) % ROTATION_SITES.length : 0;
        set({ currentSite: ROTATION_SITES[nextIdx] });
      },

      logInjection: (log) =>
        set((state) => {
          const current = state.currentSite;
          const idx = ROTATION_SITES.indexOf(current);
          const nextIdx = idx >= 0 ? (idx + 1) % ROTATION_SITES.length : 0;
          return {
            injectionHistory: [log, ...(state.injectionHistory || [])],
            currentSite: ROTATION_SITES[nextIdx],
          };
        }),

      deleteInjectionLog: (id) =>
        set((state) => ({
          injectionHistory: (state.injectionHistory || []).filter((h) => h?.id !== id),
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
          currentVolumeMl: bacWater, // Set volume awal sesuai input BAC Water
        };

        set((state) => ({
          freezerStock: state.freezerStock.map((f) =>
            f.id === freezerItemId ? { ...f, quantity: f.quantity - 1 } : f
          ),
          inventory: [newInv, ...state.inventory],
        }));
      },

      transferLiquidToFridge: (freezerItemId) => {
        const item = get().freezerStock.find((f) => f.id === freezerItemId);
        if (!item || item.quantity <= 0) return;

        const newInv: InventoryItem = {
          id: `inv-${Date.now()}`,
          name: item.name,
          category: item.category,
          vialSize: item.vialSize,
          unit: item.unit,
          bacWater: 0,
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
          estimatedDaysLeft: item.maxFridgeDays,
          isCycleActive: false,
          isReminderActive: true,
          currentVolumeMl: item.vialSize, // Set volume awal sesuai ukuran mL vial
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
