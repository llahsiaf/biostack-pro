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
  History,
  Download,
  Trash2,
  Syringe,
  MapPin,
  Calendar,
  Clock,
  Filter,
  Activity,
  CheckCircle2,
} from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useBioStackStore } from '../store/useBioStackStore';

export const HistoryScreen: React.FC = () => {
  const { injectionLogs, clearLogs } = useBioStackStore();
  const [selectedPeptideFilter, setSelectedPeptideFilter] = useState<string>('ALL');

  // Filter Unique Peptide Names
  const peptideNames = Array.from(new Set(injectionLogs.map((l) => l.peptideName)));

  const filteredLogs =
    selectedPeptideFilter === 'ALL'
      ? injectionLogs
      : injectionLogs.filter((l) => l.peptideName === selectedPeptideFilter);

  const handleExportCSV = async () => {
    if (injectionLogs.length === 0) {
      Alert.alert('Log Kosong', 'Belum ada data injeksi yang dapat diekspor.');
      return;
    }

    try {
      const header = 'ID,Tanggal,Waktu,Peptida,Dosis,Satuan,Volume(mL),Unit U-100(IU),Dial Klik,Lokasi\n';
      const rows = injectionLogs
        .map(
          (l) =>
            `"${l.id}","${l.dateStr}","${l.timeStr}","${l.peptideName}",${l.dose},"${l.unit}",${l.volMl.toFixed(3)},${l.u100Units},${l.clicks},"${l.locationName}"`
        )
        .join('\n');

      const csvContent = header + rows;
      const fileUri = `${FileSystem.documentDirectory}BioStack_Injeksi_Logs.csv`;

      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Sukses', `Data CSV tersimpan di direktori: ${fileUri}`);
      }
    } catch (error) {
      Alert.alert('Gagal Ekspor', 'Terjadi kesalahan saat memproses data CSV.');
    }
  };

  const handleConfirmClear = () => {
    Alert.alert(
      'Hapus Seluruh Riwayat',
      'Apakah Anda yakin ingin mengosongkan seluruh riwayat log injeksi?',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus Semua', style: 'destructive', onPress: clearLogs },
      ]
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
        {/* Header Summary Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.iconWrapEmerald}>
              <History size={18} color="#10b981" />
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>Riwayat & Log Injeksi</Text>
              <Text style={styles.headerSubtitle}>
                Total {injectionLogs.length} sesi penyuntikan terekam
              </Text>
            </View>
          </View>

          {/* Action Row: Export & Clear */}
          <View style={styles.headerActionRow}>
            <TouchableOpacity onPress={handleExportCSV} style={styles.exportBtn}>
              <Download size={13} color="#022c22" />
              <Text style={styles.exportBtnText}>Ekspor CSV</Text>
            </TouchableOpacity>

            {injectionLogs.length > 0 && (
              <TouchableOpacity onPress={handleConfirmClear} style={styles.clearBtn}>
                <Trash2 size={13} color="#94a3b8" />
                <Text style={styles.clearBtnText}>Bersihkan Log</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Scroll Horisontal */}
        {peptideNames.length > 0 && (
          <View style={styles.filterSection}>
            <View style={styles.filterHeader}>
              <Filter size={12} color="#64748b" />
              <Text style={styles.filterLabel}>Filter Peptida</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              <TouchableOpacity
                onPress={() => setSelectedPeptideFilter('ALL')}
                style={[styles.filterChip, selectedPeptideFilter === 'ALL' && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, selectedPeptideFilter === 'ALL' && styles.filterChipTextActive]}>
                  Semua ({injectionLogs.length})
                </Text>
              </TouchableOpacity>

              {peptideNames.map((name) => {
                const count = injectionLogs.filter((l) => l.peptideName === name).length;
                const isSelected = selectedPeptideFilter === name;
                return (
                  <TouchableOpacity
                    key={name}
                    onPress={() => setSelectedPeptideFilter(name)}
                    style={[styles.filterChip, isSelected && styles.filterChipActive]}
                  >
                    <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                      {name} ({count})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Logs List */}
        {filteredLogs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Activity size={32} color="#475569" />
            <Text style={styles.emptyTitle}>Belum Ada Riwayat Injeksi</Text>
            <Text style={styles.emptySubtitle}>
              Catatan injeksi akan muncul otomatis di sini setiap kali Anda menekan tombol "Suntik Sekarang" di tab Inventory.
            </Text>
          </View>
        ) : (
          filteredLogs.map((log) => (
            <View key={log.id} style={styles.logCard}>
              <View style={styles.logCardTop}>
                <View style={styles.peptideTitleRow}>
                  <Syringe size={15} color="#10b981" />
                  <Text style={styles.logPeptideName}>{log.peptideName}</Text>
                </View>
                <View style={styles.locationBadge}>
                  <MapPin size={11} color="#06b6d4" />
                  <Text style={styles.locationBadgeText}>{log.locationId}</Text>
                </View>
              </View>

              {/* Timestamp & Location Detail */}
              <View style={styles.timestampRow}>
                <View style={styles.timeItem}>
                  <Calendar size={11} color="#64748b" />
                  <Text style={styles.timeText}>{log.dateStr}</Text>
                </View>
                <View style={styles.timeItem}>
                  <Clock size={11} color="#64748b" />
                  <Text style={styles.timeText}>{log.timeStr}</Text>
                </View>
                <Text style={styles.locDescText}>• {log.locationName}</Text>
              </View>

              {/* Injection Specs Grid */}
              <View style={styles.specsGrid}>
                <View style={styles.specBox}>
                  <Text style={styles.specLabel}>Dosis</Text>
                  <Text style={styles.specValueEmerald}>
                    {log.dose} {log.unit}
                  </Text>
                </View>
                <View style={styles.specBox}>
                  <Text style={styles.specLabel}>Spuit U-100</Text>
                  <Text style={styles.specValueCyan}>{log.u100Units} IU</Text>
                </View>
                <View style={styles.specBox}>
                  <Text style={styles.specLabel}>Volume</Text>
                  <Text style={styles.specValue}>{log.volMl.toFixed(3)} mL</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
    gap: 12,
  },
  headerCard: {
    backgroundColor: '#090d16',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrapEmerald: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  headerActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  exportBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#022c22',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  filterSection: {
    gap: 6,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  filterScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  filterChip: {
    backgroundColor: '#090d16',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  filterChipActive: {
    backgroundColor: '#10b981',
    borderColor: '#34d399',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  filterChipTextActive: {
    color: '#022c22',
  },
  logCard: {
    backgroundColor: '#090d16',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 8,
  },
  logCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  peptideTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logPeptideName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  locationBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38bdf8',
    fontFamily: 'Courier',
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 10,
    color: '#94a3b8',
  },
  locDescText: {
    fontSize: 10,
    color: '#64748b',
  },
  specsGrid: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 8,
  },
  specBox: {
    flex: 1,
    alignItems: 'center',
  },
  specLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#64748b',
  },
  specValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: 'Courier',
    marginTop: 2,
  },
  specValueEmerald: {
    fontSize: 11,
    fontWeight: '800',
    color: '#34d399',
    fontFamily: 'Courier',
    marginTop: 2,
  },
  specValueCyan: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38bdf8',
    fontFamily: 'Courier',
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: '#090d16',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 8,
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  emptySubtitle: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
  },
});
