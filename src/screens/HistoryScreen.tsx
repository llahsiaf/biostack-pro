import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Share,
} from 'react-native';
import {
  History,
  Trash2,
  Download,
  Calendar,
  Syringe,
  MapPin,
  Activity,
} from 'lucide-react-native';
import { useBioStackStore } from '../store/useBioStackStore';

// Pemetaan Nama Titik Anatomi Indonesia
const SITE_LABEL_MAP: Record<string, string> = {
  KA: 'Perut Kanan Atas',
  KiA: 'Perut Kiri Atas',
  KB: 'Perut Kanan Bawah',
  KiB: 'Perut Kiri Bawah',
  PKi: 'Paha Kiri Luar',
  PKn: 'Paha Kanan Luar',
  LKi: 'Lengan Kiri',
  LKn: 'Lengan Kanan',
  BKi: 'Bokong Kiri',
  BKn: 'Bokong Kanan',
  // Backward compatibility untuk log lama
  TR: 'Perut Kanan Atas',
  TL: 'Perut Kiri Atas',
  BR: 'Perut Kanan Bawah',
  BL: 'Perut Kiri Bawah',
  LT: 'Paha Kiri Luar',
  RT: 'Paha Kanan Luar',
  LA: 'Lengan Kiri',
  RA: 'Lengan Kanan',
  LG: 'Bokong Kiri',
  RG: 'Bokong Kanan',
};

export const HistoryScreen: React.FC = () => {
  const { injectionHistory, deleteInjectionLog, clearHistory } = useBioStackStore();
  const [filterPeptide, setFilterPeptide] = useState<string>('all');

  // Proteksi data jika storage mengembalikan nilai null/undefined
  const safeHistory = Array.isArray(injectionHistory) ? injectionHistory.filter(Boolean) : [];

  // Ambil daftar nama peptida unik untuk filter
  const uniquePeptides = Array.from(
    new Set(safeHistory.map((item) => item?.peptideName).filter(Boolean))
  );

  const filteredHistory = filterPeptide === 'all'
    ? safeHistory
    : safeHistory.filter((item) => item?.peptideName === filterPeptide);

  const handleExportCSV = async () => {
    if (safeHistory.length === 0) {
      Alert.alert('Info', 'Belum ada data riwayat untuk diekspor.');
      return;
    }

    try {
      const header = 'ID,Peptida,Dosis,Satuan,Volume(mL),Titik_Injeksi,Waktu\n';
      const rows = safeHistory
        .map(
          (h) =>
            `"${h?.id || ''}","${h?.peptideName || ''}","${h?.dose || 0}","${h?.unit || ''}","${h?.volumeMl || ''}","${h?.siteId || ''}","${h?.timestamp || ''}"`
        )
        .join('\n');

      const csvData = header + rows;

      await Share.share({
        title: 'Riwayat Injeksi BioStack PRO',
        message: csvData,
      });
    } catch (e) {
      Alert.alert('Gagal', 'Tidak dapat mengekspor riwayat.');
    }
  };

  const handleClearAll = () => {
    if (safeHistory.length === 0) return;

    Alert.alert(
      'Hapus Semua Riwayat',
      'Apakah Anda yakin ingin menghapus seluruh log riwayat injeksi? Tindakan ini tidak dapat dibatalkan.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus Semua',
          style: 'destructive',
          onPress: () => clearHistory(),
        },
      ]
    );
  };

  const getSiteDisplay = (siteId: string) => {
    if (!siteId) return 'KA';
    return SITE_LABEL_MAP[siteId] ? `${siteId} (${SITE_LABEL_MAP[siteId]})` : siteId;
  };

  return (
    <View style={styles.container}>
      {/* Banner Ringkasan Riwayat */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryIconBox}>
          <History size={20} color="#10b981" />
        </View>
        <View style={styles.summaryContent}>
          <Text style={styles.summaryTitle}>Log Administrasi Peptida</Text>
          <Text style={styles.summarySubtitle}>
            Total {safeHistory.length} tindakan penyuntikan tercatat
          </Text>
        </View>
        <View style={styles.actionBtnRow}>
          <TouchableOpacity onPress={handleExportCSV} style={styles.iconActionBtn}>
            <Download size={16} color="#38bdf8" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClearAll} style={styles.iconActionBtn}>
            <Trash2 size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Peptida */}
      {uniquePeptides.length > 0 && (
        <View style={styles.filterScroll}>
          <TouchableOpacity
            onPress={() => setFilterPeptide('all')}
            style={[styles.filterChip, filterPeptide === 'all' && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, filterPeptide === 'all' && styles.filterChipTextActive]}>
              Semua ({safeHistory.length})
            </Text>
          </TouchableOpacity>

          {uniquePeptides.map((pep) => (
            <TouchableOpacity
              key={pep}
              onPress={() => setFilterPeptide(pep)}
              style={[styles.filterChip, filterPeptide === pep && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, filterPeptide === pep && styles.filterChipTextActive]}>
                {pep}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Daftar Log Injeksi */}
      <FlatList
        data={filteredHistory}
        keyExtractor={(item, index) => item?.id || `history-item-${index}`}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Activity size={32} color="#64748b" />
            <Text style={styles.emptyTitle}>Belum Ada Log Injeksi</Text>
            <Text style={styles.emptySub}>
              Tekan tombol Suntik Sekarang pada tab Inventory untuk mencatat log penyuntikan baru.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          if (!item) return null;

          return (
            <View style={styles.logCard}>
              <View style={styles.logHeader}>
                <View style={styles.peptideNameRow}>
                  <Syringe size={14} color="#10b981" />
                  <Text style={styles.peptideNameText}>{item.peptideName || 'Senyawa Peptida'}</Text>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    Alert.alert('Hapus Log', 'Hapus catatan injeksi ini?', [
                      { text: 'Batal', style: 'cancel' },
                      { text: 'Hapus', style: 'destructive', onPress: () => deleteInjectionLog(item.id) },
                    ]);
                  }}
                  style={styles.deleteBtn}
                >
                  <Trash2 size={14} color="#64748b" />
                </TouchableOpacity>
              </View>

              <View style={styles.logDetailsRow}>
                <View style={styles.badgeDose}>
                  <Text style={styles.badgeDoseText}>
                    {item.dose || 0} {item.unit || 'mg'}
                  </Text>
                </View>

                {Boolean(item.volumeMl) && (
                  <View style={styles.badgeVolume}>
                    <Text style={styles.badgeVolumeText}>{item.volumeMl} mL</Text>
                  </View>
                )}

                <View style={styles.badgeSite}>
                  <MapPin size={10} color="#38bdf8" />
                  <Text style={styles.badgeSiteText}>{getSiteDisplay(item.siteId)}</Text>
                </View>
              </View>

              <View style={styles.logFooter}>
                <Calendar size={11} color="#64748b" />
                <Text style={styles.timestampText}>{item.timestamp || '-'}</Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
    gap: 10,
    marginBottom: 10,
  },
  summaryIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryContent: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  summarySubtitle: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  actionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconActionBtn: {
    padding: 8,
    backgroundColor: '#030712',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  filterChipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
  },
  filterChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  filterChipTextActive: {
    color: '#10b981',
  },
  listContainer: {
    paddingBottom: 80,
    gap: 8,
  },
  emptyCard: {
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    marginTop: 30,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  emptySub: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 15,
  },
  logCard: {
    backgroundColor: '#090d16',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
    gap: 8,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  peptideNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  peptideNameText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  deleteBtn: {
    padding: 4,
  },
  logDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  badgeDose: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeDoseText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#f59e0b',
  },
  badgeVolume: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeVolumeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#06b6d4',
  },
  badgeSite: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeSiteText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38bdf8',
  },
  logFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderTopWidth: 1,
    borderColor: '#111827',
    paddingTop: 6,
  },
  timestampText: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '600',
  },
});
