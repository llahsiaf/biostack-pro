import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActiveInventoryItem, FreezerStockItem, InjectionLog } from '../types';
import { INITIAL_FREEZER_ITEMS, INJECTION_SITES } from '../database/defaultPeptides';

interface BioStackState {
  inventory: ActiveInventoryItem[];
  freezerItems: FreezerStockItem[];
  injectionLogs: InjectionLog[];
  currentSiteIndex: number;
  selectedPeptideId: string | null;
  isLoaded: boolean;

  loadStorageData: () => Promise<void>;
  addActiveItem: (item: ActiveInventoryItem) => void;
  updateActiveItem: (id: string, partial: Partial<ActiveInventoryItem>) => void;
  removeActiveItem: (id: string) => void;
  updateFreezerStock: (id: string, delta: number) => void;
  addFreezerItem: (item: FreezerStockItem) => void;
  removeFreezerItem: (id: string) => void;
  recordInjection: (item: ActiveInventoryItem) => void;
  advanceSiteRotation: () => void;
  setSiteIndex: (index: number) => void;
  setSelectedPeptideId: (id: string | null) => void;
  resetToDefaults: () => Promise<void>;
  clearLogs: () => void;
}

const STORAGE_KEYS = {
  INVENTORY: '@biostack_inventory_v2',
  FREEZER: '@biostack_freezer_v2',
  LOGS: '@biostack_logs_v2',
  SITE_INDEX: '@biostack_site_index_v2',
};

export const useBioStackStore = create<BioStackState>((set, get) => ({
  inventory: [],
  freezerItems: INITIAL_FREEZER_ITEMS,
  injectionLogs: [],
  currentSiteIndex: 0,
  selectedPeptideId: null,
  isLoaded: false,

  loadStorageData: async () => {
    try {
      const [invData, freezerData, logsData, siteData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.INVENTORY),
        AsyncStorage.getItem(STORAGE_KEYS.FREEZER),
        AsyncStorage.getItem(STORAGE_KEYS.LOGS),
        AsyncStorage.getItem(STORAGE_KEYS.SITE_INDEX),
      ]);

      const inventory = invData ? JSON.parse(invData) : [];
      const freezerItems = freezerData ? JSON.parse(freezerData) : INITIAL_FREEZER_ITEMS;
      const injectionLogs = logsData ? JSON.parse(logsData) : [];
      const currentSiteIndex = siteData ? parseInt(siteData, 10) : 0;

      set({
        inventory,
        freezerItems,
        injectionLogs,
        currentSiteIndex,
        selectedPeptideId: inventory.length > 0 ? inventory[0].id : null,
        isLoaded: true,
      });
    } catch (e) {
      set({ isLoaded: true });
    }
  },

  addActiveItem: (item) => {
    const updated = [item, ...get().inventory];
    set({ inventory: updated, selectedPeptideId: item.id });
    AsyncStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(updated));
  },

  updateActiveItem: (id, partial) => {
    const updated = get().inventory.map((item) =>
      item.id === id ? { ...item, ...partial } : item
    );
    set({ inventory: updated });
    AsyncStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(updated));
  },

  removeActiveItem: (id) => {
    const updated = get().inventory.filter((item) => item.id !== id);
    const nextSelected = updated.length > 0 ? updated[0].id : null;
    set({ inventory: updated, selectedPeptideId: nextSelected });
    AsyncStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(updated));
  },

  updateFreezerStock: (id, delta) => {
    const updated = get().freezerItems.map((item) =>
      item.id === id
        ? { ...item, freezerStock: Math.max(0, item.freezerStock + delta) }
        : item
    );
    set({ freezerItems: updated });
    AsyncStorage.setItem(STORAGE_KEYS.FREEZER, JSON.stringify(updated));
  },

  addFreezerItem: (item) => {
    const updated = [...get().freezerItems, item];
    set({ freezerItems: updated });
    AsyncStorage.setItem(STORAGE_KEYS.FREEZER, JSON.stringify(updated));
  },

  removeFreezerItem: (id) => {
    const updated = get().freezerItems.filter((item) => item.id !== id);
    set({ freezerItems: updated });
    AsyncStorage.setItem(STORAGE_KEYS.FREEZER, JSON.stringify(updated));
  },

  recordInjection: (item) => {
    const dose = item.selectedDose;
    const vialMg = item.vialSizeMg || 1;
    const bacMl = item.bacWaterMl || (item.unit === 'mL' ? vialMg : 2.0);
    const volMl = item.unit === 'mL' ? dose : (dose / vialMg) * bacMl;
    const u100Units = Math.round(volMl * 100 * 10) / 10;
    const clicks = Math.round(volMl * (item.penClicksPerMl || 100));

    const site = INJECTION_SITES[get().currentSiteIndex];
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const newLog: InjectionLog = {
      id: `log-${Date.now()}`,
      peptideId: item.id,
      peptideName: item.name,
      dose,
      unit: item.unit,
      volMl,
      u100Units,
      clicks,
      locationId: site.code,
      locationName: site.name,
      dateStr,
      timeStr,
      timestamp: now.toISOString(),
    };

    const updatedLogs = [newLog, ...get().injectionLogs];
    const nextSite = (get().currentSiteIndex + 1) % INJECTION_SITES.length;

    set({ injectionLogs: updatedLogs, currentSiteIndex: nextSite });
    AsyncStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updatedLogs));
    AsyncStorage.setItem(STORAGE_KEYS.SITE_INDEX, nextSite.toString());
  },

  advanceSiteRotation: () => {
    const next = (get().currentSiteIndex + 1) % INJECTION_SITES.length;
    set({ currentSiteIndex: next });
    AsyncStorage.setItem(STORAGE_KEYS.SITE_INDEX, next.toString());
  },

  setSiteIndex: (index) => {
    set({ currentSiteIndex: index % INJECTION_SITES.length });
    AsyncStorage.setItem(STORAGE_KEYS.SITE_INDEX, index.toString());
  },

  setSelectedPeptideId: (id) => set({ selectedPeptideId: id }),

  resetToDefaults: async () => {
    set({
      inventory: [],
      freezerItems: INITIAL_FREEZER_ITEMS,
      injectionLogs: [],
      currentSiteIndex: 0,
      selectedPeptideId: null,
    });
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.INVENTORY),
      AsyncStorage.setItem(STORAGE_KEYS.FREEZER, JSON.stringify(INITIAL_FREEZER_ITEMS)),
      AsyncStorage.removeItem(STORAGE_KEYS.LOGS),
      AsyncStorage.setItem(STORAGE_KEYS.SITE_INDEX, '0'),
    ]);
  },

  clearLogs: () => {
    set({ injectionLogs: [] });
    AsyncStorage.removeItem(STORAGE_KEYS.LOGS);
  },
}));
