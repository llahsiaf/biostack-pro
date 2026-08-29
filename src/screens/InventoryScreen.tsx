import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Switch,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Share,
} from 'react-native';
import {
  FlaskConical,
  Calendar,
  Clock,
  Trash2,
  Droplets,
  Syringe,
  X,
  Check,
  Snowflake,
  Plus,
} from 'lucide-react-native';
import { useBioStackStore } from '../store/useBioStackStore';

const DAYS_OF_WEEK = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export const InventoryScreen: React.FC = () => {
  const {
    inventory,
    freezerStock,
    currentSite,
    logInjection,
    removeInventoryItem,
    updateInventoryItem,
  } = useBioStackStore();

  // State Modal Jadwal & Pengaturan Suntik
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Form State Modal Jadwal
  const [activeFrequency, setActiveFrequency] = useState<string>('weekly');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Sen']);
  const [reconstituteDate, setReconstituteDate] = useState('28 Agu 2026');
  const [injectionTime, setInjectionTime] = useState('08:00');
  const [estimatedDaysLeft, setEstimatedDaysLeft] = useState('35');
  const [maxExpiredDays, setMaxExpiredDays] = useState('56');
  const [isCycleActive, setIsCycleActive] = useState(false);
  const [isReminderActive, setIsReminderActive] = useState(true);

  const totalFreezerVials = freezerStock.reduce((acc, curr) => acc + curr.quantity, 0);

  // Cek apakah hari ini adalah jadwal suntik
  const isTodayInjectionDay = (itemDays: string[]) => {
    const dayMap = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const currentDay = dayMap[new Date().getDay()];
    return itemDays?.includes(currentDay) ?? false;
  };

  const handleOpenScheduleModal = (item: any) => {
    setSelectedItem(item);
    setActiveFrequency(item.frequency || 'weekly');
    setSelectedDays(item.activeDays || ['Sen']);
    setReconstituteDate(item.reconstitutedDate || '28 Agu 2026');
    setInjectionTime(item.injectionTime || '08:00');
    setEstimatedDaysLeft((item.estimatedDaysLeft || 35).toString());
    setMaxExpiredDays((item.maxFridgeDays || 56).toString());
    setIsCycleActive(item.isCycleActive ?? false);
    setIsReminderActive(item.isReminderActive ?? true);
    setIsScheduleModalOpen(true);
  };

  const handleApplyPreset = (preset: 'daily' | '2x' | '3x' | 'weekly') => {
    setActiveFrequency(preset);
    if (preset === 'daily') setSelectedDays([...DAYS_OF_WEEK]);
    if (preset === '2x') setSelectedDays(['Sen', 'Kam']);
    if (preset === '3x') setSelectedDays(['Sen', 'Rab', 'Jum']);
    if (preset === 'weekly') setSelectedDays(['Sen']);
  };

  const toggleDaySelection = (day: string) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter((d) => d !== day));
      }
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSaveSchedule = () => {
    if (!selectedItem) return;

    updateInventoryItem(selectedItem.id, {
      frequency: activeFrequency,
      activeDays: selectedDays,
      reconstitutedDate: reconstituteDate,
      injectionTime: injectionTime,
      estimatedDaysLeft: parseInt(estimatedDaysLeft, 10) || 30,
      maxFridgeDays: parseInt(maxExpiredDays, 10) || 56,
      isCycleActive,
      isReminderActive,
    });

    setIsScheduleModalOpen(false);
    Alert.alert('Sukses', 'Jadwal dan pengaturan injeksi berhasil diperbarui.');
  };

  const handleSyncAppleCalendar = async () => {
    if (!selectedItem) return;
    const icsSummary = `Protokol Injeksi BioStack: ${selectedItem.name} (${selectedItem.targetDose} ${selectedItem.unit})`;
    const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//BioStack PRO//ID\nBEGIN:VEVENT\nSUMMARY:${icsSummary}\nDESCRIPTION:Dosis: ${selectedItem.targetDose} ${selectedItem.unit}\\nWaktu: ${injectionTime}\\nHari: ${selectedDays.join(', ')}\nSTATUS:CONFIRMED\nEND:VEVENT\nEND:VCALENDAR`;

    try {
      await Share.share({
        title: `${selectedItem.name} Schedule (.ics)`,
        message: icsContent,
      });
    } catch (e) {
      Alert.alert('Info', 'Kalender disiapkan.');
    }
  };

  const handleInjectNow = (item: any) => {
    logInjection({
      id: `inj-${Date.now()}`,
      peptideName: item.name,
      dose: item.targetDose,
      unit: item.unit,
      volumeMl: item.volumeMl || ((item.targetDose / (item.vialSize / (item.bacWater || 2)))).toFixed(3),
      siteId: currentSite,
      timestamp: new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    });

    Alert.alert(
      'Injeksi Dicatat',
      `Pemberian ${item.targetDose} ${item.unit} ${item.name} pada titik ${currentSite} berhasil disimpan ke Riwayat.`
    );
  };

  return (
    <View style={styles.container}>
      {/* Ringkasan Status Kulkas & Freezer */}
      <View style={styles.topStatsRow}>
        <View style={styles.statCard}>
          <Droplets size={20} color="#10b981" />
          <View>
            <Text style={styles.statLabel}>Aktif di Kulkas</Text>
            <Text style={styles.statValue}>{inventory.length} <Text style={styles.statUnit}>Vial Cair</Text></Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <Snowflake size={20} color="#38bdf8" />
          <View>
            <Text style={styles.statLabel}>Stok Freezer</Text>
            <Text style={styles.statValue}>{totalFreezerVials} <Text style={styles.statUnit}>Vial Beku</Text></Text>
          </View>
        </View>
      </View>

      {/* Subheader Section */}
      <View style={styles.sectionHeaderRow}>
        <View>
          <View style={styles.activeTitleRow}>
            <Droplets size={14} color="#10b981" />
            <Text style={styles.sectionTitle}>Active Fridge Inventory</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Peptida dilarutkan & siap disuntikkan</Text>
        </View>
      </View>

      {/* Daftar Kartu Peptida Aktif */}
      <FlatList
        data={inventory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <FlaskConical size={32} color="#64748b" />
            <Text style={styles.emptyTitle}>Kulkas Masih Kosong</Text>
            <Text style={styles.emptySub}>Buka tab Freezer lalu tekan Larutkan ke Kulkas untuk mulai melarutkan peptida.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const bac = item.bacWater || 2.0;
          const concentration = item.vialSize / bac;
          const volMl = (item.targetDose / concentration).toFixed(3);
          const spuitIu = Math.round(parseFloat(volMl) * 100);
          const dialClicks = spuitIu;
          const isToday = isTodayInjectionDay(item.activeDays || ['Sen']);

          return (
            <View style={styles.fridgeCard}>
              {/* Header Kartu */}
              <View style={styles.cardTopRow}>
                <View style={styles.cardIdentity}>
                  <Text style={styles.peptideTitle}>{item.name}</Text>
                  <View style={styles.vialBadge}>
                    <Text style={styles.vialBadgeText}>{item.vialSize}{item.unit} Vial</Text>
                  </View>
                  <View style={[styles.statusBadge, isToday ? styles.statusBadgeActive : styles.statusBadgeRest]}>
                    <Text style={[styles.statusBadgeText, isToday ? styles.statusTextActive : styles.statusTextRest]}>
                      {isToday ? 'Injeksi Hari Ini' : 'Hari Rest'}
                    </Text>
                  </View>
                </View>

                {/* Tombol Aksi Kanan Atas */}
                <View style={styles.cardHeaderActions}>
                  <TouchableOpacity onPress={handleSyncAppleCalendar} style={styles.headerIconBtn}>
                    <Calendar size={16} color="#94a3b8" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleOpenScheduleModal(item)} style={styles.headerIconBtn}>
                    <Clock size={16} color="#94a3b8" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert('Hapus Vial', `Keluarkan ${item.name} dari kulkas aktif?`, [
                        { text: 'Batal', style: 'cancel' },
                        { text: 'Hapus', style: 'destructive', onPress: () => removeInventoryItem(item.id) },
                      ]);
                    }}
                    style={styles.headerIconBtn}
                  >
                    <Trash2 size={16} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sub-label Kategori */}
              <Text style={styles.categorySubText}>
                {item.category} • {item.frequencyLabel || 'Mingguan (Weekly)'}
              </Text>

              {/* Badge Parameter Klinis 3 Kolom */}
              <View style={styles.paramPillsRow}>
                <View style={styles.dosePill}>
                  <Text style={styles.dosePillText}>Dosis: {item.targetDose} {item.unit}</Text>
                </View>
                <View style={styles.spuitPill}>
                  <Text style={styles.spuitPillText}>Spuit: {spuitIu} IU ({volMl} mL)</Text>
                </View>
                <View style={styles.dialPill}>
                  <Text style={styles.dialPillText}>Dial: {dialClicks} Klik</Text>
                </View>
              </View>

              {/* Baris Hari Aktif & Jam Penyuntikan */}
              <View style={styles.scheduleRow}>
                <View style={styles.daySelectorRow}>
                  <Text style={styles.hariLabel}>Hari:</Text>
                  {DAYS_OF_WEEK.map((d) => {
                    const isSelected = item.activeDays?.includes(d);
                    return (
                      <View key={d} style={[styles.dayChip, isSelected && styles.dayChipActive]}>
                        <Text style={[styles.dayChipText, isSelected && styles.dayChipTextActive]}>
                          {d}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                <View style={styles.timeDisplay}>
                  <Clock size={12} color="#38bdf8" />
                  <Text style={styles.timeDisplayText}>{item.injectionTime || '08:00'}</Text>
                </View>
              </View>

              {/* Status Sisa Cairan & Progress */}
              <View style={styles.liquidProgressCard}>
                <View style={styles.progressHeaderRow}>
                  <View style={styles.liquidLeftRow}>
                    <Droplets size={12} color="#38bdf8" />
                    <Text style={styles.liquidLeftText}>
                      Sisa Cairan (~{item.estimatedDaysLeft || 34} Hari Lagi)
                    </Text>
                  </View>
                  <Text style={styles.liquidRightText}>Kapasitas Aman (97%)</Text>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: '97%' }]} />
                </View>

                <View style={styles.progressFooterRow}>
                  <Text style={styles.dateInfoText}>Dilarutkan: {item.reconstitutedDate || '28 Agu 2026'}</Text>
                  <Text style={styles.dateInfoText}>Exp Kulkas: {item.maxFridgeDays || 56} Hari</Text>
                </View>
              </View>

              {/* Tombol Eksekusi Injeksi */}
              <TouchableOpacity onPress={() => handleInjectNow(item)} style={styles.injectActionBtn}>
                <Syringe size={16} color="#022c22" />
                <Text style={styles.injectActionBtnText}>Suntik Sekarang ({currentSite})</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />

      {/* Modal Jadwal & Pengaturan Suntik (Triggered by Clock Icon) */}
      <Modal visible={isScheduleModalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Clock size={18} color="#38bdf8" />
                <Text style={styles.modalTitle}>Jadwal & Pengaturan Suntik</Text>
              </View>
              <TouchableOpacity onPress={() => setIsScheduleModalOpen(false)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              {/* Protokol Medis Header Row */}
              <View style={styles.protocolHeaderBox}>
                <Text style={styles.protocolLabel}>Protokol Medis:</Text>
                <View style={styles.protocolActiveBadge}>
                  <Text style={styles.protocolActiveText}>
                    {activeFrequency === 'weekly' ? 'Mingguan (Weekly)' : activeFrequency === 'daily' ? 'Harian (Daily)' : `${activeFrequency}x Seminggu`}
                  </Text>
                </View>
              </View>

              {/* Preset Frekuensi Injeksi */}
              <Text style={styles.settingSectionTitle}>Preset Frekuensi Injeksi:</Text>
              <View style={styles.presetGrid}>
                <TouchableOpacity
                  onPress={() => handleApplyPreset('daily')}
                  style={[styles.presetCard, activeFrequency === 'daily' && styles.presetCardActive]}
                >
                  <Text style={[styles.presetName, activeFrequency === 'daily' && styles.presetNameActive]}>Harian (Daily)</Text>
                  <Text style={styles.presetSub}>Setiap Hari</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleApplyPreset('2x')}
                  style={[styles.presetCard, activeFrequency === '2x' && styles.presetCardActive]}
                >
                  <Text style={[styles.presetName, activeFrequency === '2x' && styles.presetNameActive]}>2x Seminggu</Text>
                  <Text style={styles.presetSub}>Sen, Kam</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleApplyPreset('3x')}
                  style={[styles.presetCard, activeFrequency === '3x' && styles.presetCardActive]}
                >
                  <Text style={[styles.presetName, activeFrequency === '3x' && styles.presetNameActive]}>3x Seminggu</Text>
                  <Text style={styles.presetSub}>Sen, Rab, Jum</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleApplyPreset('weekly')}
                  style={[styles.presetCard, activeFrequency === 'weekly' && styles.presetCardActive]}
                >
                  <Text style={[styles.presetName, activeFrequency === 'weekly' && styles.presetNameActive]}>Mingguan (Weekly)</Text>
                  <Text style={styles.presetSub}>Sen</Text>
                </TouchableOpacity>
              </View>

              {/* Pemilih Hari Penyuntikan Aktif */}
              <Text style={styles.settingSectionTitle}>Pilih Hari Penyuntikan Aktif:</Text>
              <View style={styles.daySelectorModalRow}>
                {DAYS_OF_WEEK.map((d) => {
                  const isChecked = selectedDays.includes(d);
                  return (
                    <TouchableOpacity
                      key={d}
                      onPress={() => toggleDaySelection(d)}
                      style={[styles.modalDayChip, isChecked && styles.modalDayChipActive]}
                    >
                      <Text style={[styles.modalDayChipText, isChecked && styles.modalDayChipTextActive]}>
                        {d}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Tanggal Dilarutkan */}
              <Text style={styles.settingSectionTitle}>Tanggal Dilarutkan:</Text>
              <TextInput
                style={styles.modalTextInput}
                value={reconstituteDate}
                onChangeText={setReconstituteDate}
              />

              {/* Jam Penyuntikan */}
              <Text style={styles.settingSectionTitle}>Jam Penyuntikan:</Text>
              <TextInput
                style={styles.modalTextInputTime}
                value={injectionTime}
                onChangeText={setInjectionTime}
                placeholder="08.00"
                placeholderTextColor="#64748b"
              />

              {/* Baris Estimasi Habis & Max Expired */}
              <View style={styles.twoColRow}>
                <View style={styles.colBox}>
                  <Text style={styles.colWarnLabel}>Estimasi Habis (Hari):</Text>
                  <TextInput
                    style={styles.colWarnInput}
                    keyboardType="numeric"
                    value={estimatedDaysLeft}
                    onChangeText={setEstimatedDaysLeft}
                  />
                </View>

                <View style={styles.colBox}>
                  <Text style={styles.colMutedLabel}>Max Expired (Hari):</Text>
                  <TextInput
                    style={styles.colMutedInput}
                    keyboardType="numeric"
                    value={maxExpiredDays}
                    onChangeText={setMaxExpiredDays}
                  />
                </View>
              </View>

              {/* Switch Periodisasi & Notifikasi */}
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Aktifkan Siklus / Periodisasi (Cycle)</Text>
                <Switch
                  value={isCycleActive}
                  onValueChange={setIsCycleActive}
                  trackColor={{ false: '#1e293b', true: '#10b981' }}
                  thumbColor="#ffffff"
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Aktifkan Notifikasi Pengingat</Text>
                <Switch
                  value={isReminderActive}
                  onValueChange={setIsReminderActive}
                  trackColor={{ false: '#1e293b', true: '#10b981' }}
                  thumbColor="#ffffff"
                />
              </View>

              {/* Tombol Sinkronisasi Kalender */}
              <TouchableOpacity onPress={handleSyncAppleCalendar} style={styles.calendarSyncBtn}>
                <Calendar size={16} color="#38bdf8" />
                <Text style={styles.calendarSyncBtnText}>Sync ke Apple Calendar (.ics)</Text>
              </TouchableOpacity>

              {/* Footer Modal Actions */}
              <View style={styles.modalFooterRow}>
                <TouchableOpacity onPress={() => setIsScheduleModalOpen(false)} style={styles.cancelModalBtn}>
                  <Text style={styles.cancelModalBtnText}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveSchedule} style={styles.saveModalBtn}>
                  <Text style={styles.saveModalBtnText}>Simpan Pengaturan</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  topStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  statLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 2,
  },
  statUnit: {
    fontSize: 10,
    fontWeight: '400',
    color: '#94a3b8',
  },
  sectionHeaderRow: {
    marginBottom: 10,
  },
  activeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  listContainer: {
    paddingBottom: 80,
    gap: 12,
  },
  emptyCard: {
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  emptySub: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
  },
  fridgeCard: {
    backgroundColor: '#090d16',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
    gap: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  peptideTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  vialBadge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  vialBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  statusBadgeRest: {
    backgroundColor: '#1e293b',
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  statusTextActive: {
    color: '#10b981',
  },
  statusTextRest: {
    color: '#64748b',
  },
  cardHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerIconBtn: {
    padding: 6,
  },
  categorySubText: {
    fontSize: 11,
    color: '#64748b',
  },
  paramPillsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  dosePill: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dosePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#f59e0b',
  },
  spuitPill: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  spuitPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#06b6d4',
  },
  dialPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dialPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38bdf8',
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#030712',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  daySelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hariLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    marginRight: 2,
  },
  dayChip: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#0f172a',
  },
  dayChipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  dayChipText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
  },
  dayChipTextActive: {
    color: '#10b981',
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeDisplayText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  liquidProgressCard: {
    backgroundColor: '#030712',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 10,
    gap: 6,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liquidLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liquidLeftText: {
    fontSize: 10,
    color: '#38bdf8',
    fontWeight: '700',
  },
  liquidRightText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38bdf8',
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: '#1e293b',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#38bdf8',
    borderRadius: 2,
  },
  progressFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateInfoText: {
    fontSize: 9,
    color: '#64748b',
  },
  injectActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 12,
  },
  injectActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#022c22',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#090d16',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#1e293b',
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  modalScrollBody: {
    padding: 16,
    gap: 10,
  },
  protocolHeaderBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#030712',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  protocolLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38bdf8',
  },
  protocolActiveBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: '#38bdf8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  protocolActiveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38bdf8',
  },
  settingSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    marginTop: 4,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetCard: {
    width: '48.5%',
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    padding: 10,
    gap: 2,
  },
  presetCardActive: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  presetName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
  },
  presetNameActive: {
    color: '#38bdf8',
  },
  presetSub: {
    fontSize: 9,
    color: '#475569',
  },
  daySelectorModalRow: {
    flexDirection: 'row',
    gap: 6,
  },
  modalDayChip: {
    flex: 1,
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalDayChipActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  modalDayChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  modalDayChipTextActive: {
    color: '#022c22',
    fontWeight: '800',
  },
  modalTextInput: {
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    padding: 10,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalTextInputTime: {
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    padding: 10,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
  },
  colBox: {
    flex: 1,
    gap: 4,
  },
  colWarnLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#f59e0b',
  },
  colWarnInput: {
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderRadius: 10,
    padding: 10,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  colMutedLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
  },
  colMutedInput: {
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    padding: 10,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#030712',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  switchLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  calendarSyncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: '#38bdf8',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  calendarSyncBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38bdf8',
  },
  modalFooterRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    paddingBottom: 20,
  },
  cancelModalBtn: {
    flex: 1,
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelModalBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  saveModalBtn: {
    flex: 2,
    backgroundColor: '#06b6d4',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveModalBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#022c22',
  },
});
