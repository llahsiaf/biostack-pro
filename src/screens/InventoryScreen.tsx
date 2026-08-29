import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Refrigerator,
  Snowflake,
  Plus,
  Syringe,
  Clock,
  ChevronRight,
  Trash2,
  Calendar,
  AlertCircle,
} from 'lucide-react-native';
import { useBioStackStore } from '../store/useBioStackStore';
import { ActiveInventoryItem, FreezerStockItem } from '../types';
import { DoseDetailModal } from '../components/DoseDetailModal';
import { ReconstituteWizard } from '../components/ReconstituteWizard';
import { INJECTION_SITES } from '../database/defaultPeptides';

interface InventoryScreenProps {
  onNavigateToFreezer: () => void;
  onNavigateToRotation: () => void;
}

export const InventoryScreen: React.FC<InventoryScreenProps> = ({
  onNavigateToFreezer,
  onNavigateToRotation,
}) => {
  const {
    inventory,
    freezerItems,
    currentSiteIndex,
    recordInjection,
    updateActiveItem,
    removeActiveItem,
    addActiveItem,
  } = useBioStackStore();

  const [selectedItemForModal, setSelectedItemForModal] = useState<ActiveInventoryItem | null>(null);
  const [wizardFreezerItem, setWizardFreezerItem] = useState<FreezerStockItem | null>(null);

  const totalFreezerVials = freezerItems.reduce((sum, item) => sum + item.freezerStock, 0);
  const currentSite = INJECTION_SITES[currentSiteIndex];

  const handleInject = (item: ActiveInventoryItem) => {
    recordInjection(item);
    Alert.alert(
      'Injeksi Berhasil Dicatat',
      `${item.name} (${item.selectedDose} ${item.unit}) di titik ${currentSite.name}. Kuadran otomatis diputar.`
    );
  };

  const handleConfirmDelete = (id: string, name: string) => {
    Alert.alert(
      'Hapus Peptida Aktif',
      `Keluarkan ${name} dari daftar kulkas aktif?`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: () => removeActiveItem(id) },
      ]
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
        {/* Quick Top Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statIconWrapCyan}>
              <Refrigerator size={16} color="#06b6d4" />
            </View>
            <View>
              <Text style={styles.statLabel}>Kulkas Aktif</Text>
              <Text style={styles.statValue}>{inventory.length} Vial Cair</Text>
            </View>
          </View>

          <TouchableOpacity onPress={onNavigateToFreezer} style={styles.statCard}>
            <View style={styles.statIconWrapEmerald}>
              <Snowflake size={16} color="#10b981" />
            </View>
            <View>
              <Text style={styles.statLabel}>Stok Freezer</Text>
              <Text style={styles.statValue}>{totalFreezerVials} Vial</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Active Fridge Inventory</Text>
          <TouchableOpacity onPress={onNavigateToFreezer} style={styles.actionPill}>
            <Plus size={13} color="#10b981" />
            <Text style={styles.actionPillText}>Ambil Freezer</Text>
          </TouchableOpacity>
        </View>

        {/* Active Items List */}
        {inventory.length === 0 ? (
          <View style={styles.emptyState}>
            <AlertCircle size={32} color="#475569" />
            <Text style={styles.emptyTitle}>Kulkas Aktif Masih Kosong</Text>
            <Text style={styles.emptySubtitle}>
              Pindahkan dan larutkan vial peptida dari stok freezer untuk memulai pelacakan protokol injeksi.
            </Text>
            <TouchableOpacity onPress={onNavigateToFreezer} style={styles.emptyButton}>
              <Snowflake size={15} color="#022c22" />
              <Text style={styles.emptyButtonText}>Buka Stok Freezer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          inventory.map((item) => {
            const vialMg = item.vialSizeMg || 1;
            const bacMl = item.bacWaterMl || (item.unit === 'mL' ? vialMg : 2.0);
            const volMl = item.unit === 'mL' ? item.selectedDose : (item.selectedDose / vialMg) * bacMl;
            const u100Units = Math.round(volMl * 100 * 10) / 10;

            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.88}
                onPress={() => setSelectedItemForModal(item)}
                style={styles.peptideCard}
              >
                {/* Card Top Row */}
                <View style={styles.cardTop}>
                  <View style={styles.cardTitleWrap}>
                    <View style={styles.indicatorDot} />
                    <Text style={styles.cardName}>{item.name}</Text>
                    <View style={styles.badgeTag}>
                      <Text style={styles.badgeTagText}>
                        {item.vialSizeMg} {item.unit}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleConfirmDelete(item.id, item.name)}
                    style={styles.deleteBtn}
                  >
                    <Trash2 size={14} color="#64748b" />
                  </TouchableOpacity>
                </View>

                {/* Subtitle & Schedule */}
                <Text style={styles.categoryText}>
                  {item.category} • {item.schedule}
                </Text>

                {/* Dose & Volume Metric Badges */}
                <View style={styles.metricsRow}>
                  <View style={styles.miniMetric}>
                    <Text style={styles.miniMetricLabel}>Target Dosis</Text>
                    <Text style={styles.miniMetricVal}>
                      {item.selectedDose} {item.unit}
                    </Text>
                  </View>
                  <View style={styles.miniMetric}>
                    <Text style={styles.miniMetricLabel}>Spuit U-100</Text>
                    <Text style={styles.miniMetricValEmerald}>{u100Units} IU</Text>
                  </View>
                  <View style={styles.miniMetric}>
                    <Text style={styles.miniMetricLabel}>Volume</Text>
                    <Text style={styles.miniMetricValCyan}>{volMl.toFixed(2)} mL</Text>
                  </View>
                </View>

                {/* Progress Bar (Liquid Freshness) */}
                <View style={styles.shelfProgressContainer}>
                  <View style={styles.shelfLabelRow}>
                    <View style={styles.clockRow}>
                      <Clock size={11} color="#94a3b8" />
                      <Text style={styles.shelfLabel}>Batas Segar Kulkas</Text>
                    </View>
                    <Text style={styles.shelfDays}>~28 Hari Tersisa</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: '75%' }]} />
                  </View>
                </View>

                {/* Action Button: Inject Now */}
                <TouchableOpacity
                  onPress={() => handleInject(item)}
                  style={styles.injectBtn}
                >
                  <Syringe size={15} color="#022c22" />
                  <Text style={styles.injectBtnText}>
                    Suntik Sekarang ({currentSite.code} - {currentSite.name})
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Dose Detail & Interactive Syringe Modal */}
      <DoseDetailModal
        visible={!!selectedItemForModal}
        item={selectedItemForModal}
        onClose={() => setSelectedItemForModal(null)}
        onSave={(id, newDose, newBac) => {
          updateActiveItem(id, { selectedDose: newDose, bacWaterMl: newBac });
        }}
      />

      {/* Reconstitute Wizard Modal */}
      <ReconstituteWizard
        visible={!!wizardFreezerItem}
        freezerItem={wizardFreezerItem}
        onClose={() => setWizardFreezerItem(null)}
        onComplete={(newItem) => {
          addActiveItem(newItem);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#030712',
  },
  scrollBody: {
    padding: 16,
    paddingBottom: 90,
    gap: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#090d16',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  statIconWrapCyan: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconWrapEmerald: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10b981',
  },
  peptideCard: {
    backgroundColor: '#090d16',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 10,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  cardName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  badgeTag: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    fontFamily: 'Courier',
  },
  deleteBtn: {
    padding: 4,
  },
  categoryText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: -4,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  miniMetric: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
  },
  miniMetricLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#64748b',
  },
  miniMetricVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: 'Courier',
    marginTop: 2,
  },
  miniMetricValEmerald: {
    fontSize: 12,
    fontWeight: '800',
    color: '#34d399',
    fontFamily: 'Courier',
    marginTop: 2,
  },
  miniMetricValCyan: {
    fontSize: 12,
    fontWeight: '800',
    color: '#38bdf8',
    fontFamily: 'Courier',
    marginTop: 2,
  },
  shelfProgressContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 8,
    gap: 6,
  },
  shelfLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shelfLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  shelfDays: {
    fontSize: 10,
    fontWeight: '700',
    color: '#34d399',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#1e293b',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 2,
  },
  injectBtn: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 2,
  },
  injectBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#022c22',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#090d16',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    borderStyle: 'dashed',
    gap: 10,
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  emptySubtitle: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 6,
  },
  emptyButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#022c22',
  },
});
