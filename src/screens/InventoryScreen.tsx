import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import {
  FlaskConical,
  Plus,
  Trash2,
  Syringe,
  Calendar,
  Clock,
  Droplets,
  CheckCircle2,
  AlertCircle,
  X,
  Sliders,
  CalendarCheck,
  Snowflake,
} from 'lucide-react-native';
import { useBioStackStore, InventoryItem, FreezerItem } from '../store/useBioStackStore';
import { exportToAppleCalendar } from '../utils/calendarHelper';

const DAYS_OF_WEEK = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

const FREQUENCY_PRESETS = [
  { id: 'daily', label: 'Harian (Daily)', sub: 'Setiap Hari', days: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'] },
  { id: '2x_week', label: '2x Seminggu', sub: 'Sen, Kam', days: ['Sen', 'Kam'] },
  { id: '3x_week', label: '3x Seminggu', sub: 'Sen, Rab, Jum', days: ['Sen', 'Rab', 'Jum'] },
  { id: 'weekly', label: 'Mingguan (Weekly)', sub: 'Sen', days: ['Sen'] },
];

export const InventoryScreen: React.FC = () => {
  const {
    inventory,
    freezerStock,
    currentSite,
    logInjection,
    removeInventoryItem,
    updateInventoryItem,
    reconstituteToFridge,
    transferLiquidToFridge,
  } = useBioStackStore();

  // State Modal Ambil dari Freezer
  const [isTakeFreezerModalOpen, setIsTakeFreezerModalOpen] = useState(false);
  const [selectedFreezerItem, setSelectedFreezerItem] = useState<FreezerItem | null>(null);
  const [freezerBacInput, setFreezerBacInput] = useState('2.0');

  // State Modal Edit Dosis Peptida
  const [isEditDoseModalOpen, setIsEditDoseModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editTargetDose, setEditTargetDose] = useState('');
  const [editBacWater, setEditBacWater] = useState('');

  // State Modal Konfigurasi Jadwal & Notifikasi
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleItem, setScheduleItem] = useState<InventoryItem | null>(null);
  const [activeDays, setActiveDays] = useState<string[]>([]);
  const [injectionTime, setInjectionTime] = useState('08:00');
  const [frequencyKey, setFrequencyKey] = useState('weekly');
  const [frequencyLabel, setFrequencyLabel] = useState('Mingguan (Weekly)');
  const [estimatedHabis, setEstimatedHabis] = useState('28');
  const [maxExpired, setMaxExpired] = useState('28');
  const [isCycleActive, setIsCycleActive] = useState(false);
  const [isReminderActive, setIsReminderActive] = useState(true);

  const inventoryList = inventory || [];
  const freezerList = freezerStock || [];
  const totalFreezerVials = freezerList.reduce((acc, curr) => acc + (curr.quantity || 0), 0);

  // Helper Menghitung Hari Ini Aktif Suntik
  const isInjectToday = (itemDays: string[]) => {
    const todayIndex = new Date().getDay(); // 0 = Min, 1 = Sen, ...
    const dayMap = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const currentDayName = dayMap[todayIndex];
    return itemDays?.includes(currentDayName);
  };

  // Helper Kalkulasi Klinis (IU, mL, & Klik Dial)
  const calculateMetrics = (item: InventoryItem) => {
    if (item.unit === 'mL') {
      const vol = item.targetDose || 0.2;
      const iu = Math.round(vol * 100);
      return { volumeMl: vol.toFixed(3), iu, dialClicks: iu };
    }

    const bac = item.bacWater > 0 ? item.bacWater : 2.0;
    const concentration = item.vialSize / bac; // misal 10mg / 2mL = 5 mg/mL
    const vol = concentration > 0 ? (item.targetDose || 1.0) / concentration : 0.2;
    const iu = Math.round(vol * 100);
    return { volumeMl: vol.toFixed(3), iu, dialClicks: iu };
  };

  // Bersihkan teks badge protokol dari typo double x / underscore
  const getCleanFrequencyLabel = (label: string, freqKey: string) => {
    if (!label) return 'Protokol Medis';
    let clean = label.replace(/3x_weekx/gi, '3x').replace(/2xx/gi, '2x').replace(/3xx/gi, '3x').replace(/_+/g, ' ');
    return clean;
  };

  // Aksi Tombol Suntik Sekarang (Auto Log & Auto Rotate)
  const handleInjectNow = (item: InventoryItem) => {
    const metrics = calculateMetrics(item);
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const timeFormatted = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });

    logInjection({
      id: `log-${Date.now()}`,
      peptideName: item.name,
      dose: item.targetDose,
      unit: item.unit,
      volumeMl: metrics.volumeMl,
      siteId: currentSite,
      timestamp: `${dateFormatted}, ${timeFormatted}`,
    });

    Alert.alert(
      'Injeksi Berhasil Dicatat',
      `${item.name} (${item.targetDose} ${item.unit} / ${metrics.iu} IU) telah disuntikkan pada titik ${currentSite}. Lokasi injeksi telah otomatis diputar.`
    );
  };

  // Buka Modal Edit Dosis
  const openEditDoseModal = (item: InventoryItem) => {
    setEditingItem(item);
    setEditTargetDose((item.targetDose || 0).toString());
    setEditBacWater((item.bacWater || 0).toString());
    setIsEditDoseModalOpen(true);
  };

  const handleSaveDose = () => {
    if (!editingItem) return;
    const newTarget = parseFloat(editTargetDose) || editingItem.targetDose;
    const newBac = parseFloat(editBacWater) || editingItem.bacWater;

    updateInventoryItem(editingItem.id, {
      targetDose: newTarget,
      bacWater: editingItem.unit === 'mL' ? 0 : newBac,
    });

    setIsEditDoseModalOpen(false);
  };

  // Buka Modal Jadwal & Kalender
  const openScheduleModal = (item: InventoryItem) => {
    setScheduleItem(item);
    setActiveDays(item.activeDays || ['Sen']);
    setInjectionTime(item.injectionTime || '08:00');
    setFrequencyKey(item.frequency || 'weekly');
    setFrequencyLabel(item.frequencyLabel || 'Mingguan (Weekly)');
    setEstimatedHabis((item.estimatedDaysLeft || 28).toString());
    setMaxExpired((item.maxFridgeDays || 28).toString());
    setIsCycleActive(Boolean(item.isCycleActive));
    setIsReminderActive(item.isReminderActive !== false);
    setIsScheduleModalOpen(true);
  };

  const handleSelectFrequencyPreset = (preset: typeof FREQUENCY_PRESETS[0]) => {
    setFrequencyKey(preset.id);
    setFrequencyLabel(preset.label);
    setActiveDays(preset.days);
  };

  const toggleDay = (day: string) => {
    if (activeDays.includes(day)) {
      if (activeDays.length > 1) {
        setActiveDays(activeDays.filter((d) => d !== day));
      }
    } else {
      setActiveDays([...activeDays, day]);
    }
  };

  const handleSaveSchedule = () => {
    if (!scheduleItem) return;

    updateInventoryItem(scheduleItem.id, {
      frequency: frequencyKey,
      frequencyLabel: frequencyLabel,
      activeDays: activeDays,
      injectionTime: injectionTime,
      estimatedDaysLeft: parseInt(estimatedHabis, 10) || 28,
      maxFridgeDays: parseInt(maxExpired, 10) || 28,
      isCycleActive: isCycleActive,
      isReminderActive: isReminderActive,
    });

    setIsScheduleModalOpen(false);
  };

  const handleSyncAppleCalendar = async () => {
    if (!scheduleItem) return;
    const metrics = calculateMetrics(scheduleItem);

    await exportToAppleCalendar({
      peptideName: scheduleItem.name,
      targetDose: scheduleItem.targetDose,
      unit: scheduleItem.unit,
      activeDays: activeDays,
      injectionTime: injectionTime,
      frequencyLabel: frequencyLabel,
      volumeMl: metrics.volumeMl,
      dialClicks: metrics.dialClicks,
    });
  };

  // Ambil Stok dari Freezer
  const handleTakeFromFreezer = (item: FreezerItem) => {
    if (item.quantity <= 0) {
      Alert.alert('Stok Habis', `Stok ${item.name} di freezer adalah 0.`);
      return;
    }

    if (item.unit === 'mL') {
      transferLiquidToFridge(item.id);
      setIsTakeFreezerModalOpen(false);
      Alert.alert('Berhasil', `${item.name} berhasil dipindahkan ke kulkas aktif.`);
      return;
    }

    setSelectedFreezerItem(item);
    setFreezerBacInput((item.defaultBacWater || 2.0).toString());
  };

  const handleConfirmReconstituteFromModal = () => {
    if (!selectedFreezerItem) return;
    const bac = parseFloat(freezerBacInput) || 2.0;

    reconstituteToFridge(selectedFreezerItem.id, bac);
    setSelectedFreezerItem(null);
    setIsTakeFreezerModalOpen(false);
    Alert.alert('Selesai', `1 vial ${selectedFreezerItem.name} berhasil dilarutkan ke kulkas.`);
  };

  return (
    <View style={styles.container}>
      {/* Top Banner Status Kulkas & Freezer */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Droplets size={18} color="#10b981" />
          <View>
            <Text style={styles.statLabel}>Aktif di Kulkas</Text>
            <Text style={styles.statValue}>{inventoryList.length} <Text style={styles.statSub}>Vial Cair</Text></Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <Snowflake size={18} color="#38bdf8" />
          <View>
            <Text style={styles.statLabel}>Stok Freezer</Text>
            <Text style={styles.statValue}>{totalFreezerVials} <Text style={styles.statSub}>Vial Beku</Text></Text>
          </View>
        </View>
      </View>

      {/* Header Section Active Fridge Inventory + Tombol Ambil Freezer */}
      <View style={styles.sectionHeaderRow}>
        <View>
          <View style={styles.sectionTitleWithIcon}>
            <Droplets size={14} color="#10b981" />
            <Text style={styles.sectionTitle}>Active Fridge Inventory</Text>
          </View>
          <Text style={styles.sectionSub}>Peptida dilarutkan & siap disuntikkan</Text>
        </View>

        {/* Tombol Ambil Freezer */}
        <TouchableOpacity
          onPress={() => {
            setSelectedFreezerItem(null);
            setIsTakeFreezerModalOpen(true);
          }}
          style={styles.takeFreezerBtn}
        >
          <Plus size={12} color="#022c22" />
          <Text style={styles.takeFreezerBtnText}>Ambil Freezer</Text>
        </TouchableOpacity>
      </View>

      {/* Daftar Kartu Peptida Kulkas Aktif */}
      <FlatList
        data={inventoryList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <FlaskConical size={32} color="#64748b" />
            <Text style={styles.emptyTitle}>Kulkas Masih Kosong</Text>
            <Text style={styles.emptySub}>
              Tekan tombol Ambil Freezer di atas untuk melarutkan peptida siap pakai.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isToday = isInjectToday(item.activeDays);
          const metrics = calculateMetrics(item);
          const progressPercent = Math.min(100, Math.max(10, ((item.estimatedDaysLeft || 20) / (item.maxFridgeDays || 28)) * 100));

          return (
            <View style={styles.peptideCard}>
              {/* Bagian Atas Kartu: Header & Aksi Cepat */}
              <View style={styles.cardHeader}>
                <TouchableOpacity
                  style={styles.cardHeaderLeft}
                  onPress={() => openEditDoseModal(item)}
                >
                  <Text style={styles.peptideName}>{item.name}</Text>
                  <View style={styles.vialBadge}>
                    <Text style={styles.vialBadgeText}>{item.vialSize}{item.unit} Vial</Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.headerActionRow}>
                  {isToday ? (
                    <View style={styles.badgeToday}>
                      <Text style={styles.badgeTodayText}>Injeksi Hari Ini</Text>
                    </View>
                  ) : (
                    <View style={styles.badgeRest}>
                      <Text style={styles.badgeRestText}>Hari Rest</Text>
                    </View>
                  )}

                  <TouchableOpacity onPress={() => openScheduleModal(item)} style={styles.iconBtn}>
                    <Calendar size={14} color="#94a3b8" />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => openScheduleModal(item)} style={styles.iconBtn}>
                    <Clock size={14} color="#94a3b8" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert('Hapus Senyawa', `Keluarkan ${item.name} dari kulkas?`, [
                        { text: 'Batal', style: 'cancel' },
                        { text: 'Hapus', style: 'destructive', onPress: () => removeInventoryItem(item.id) },
                      ]);
                    }}
                    style={styles.iconBtn}
                  >
                    <Trash2 size={14} color="#64748b" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Deskripsi & Protokol */}
              <TouchableOpacity onPress={() => openEditDoseModal(item)}>
                <Text style={styles.categorySubText}>
                  {item.category} • {getCleanFrequencyLabel(item.frequencyLabel, item.frequency)}
                </Text>

                {/* 3 Kolom Parameter Dosis */}
                <View style={styles.doseMetricsGrid}>
                  <View style={styles.metricChipDose}>
                    <Text style={styles.metricChipDoseText}>
                      Dosis: {item.targetDose} {item.unit}
                    </Text>
                  </View>

                  <View style={styles.metricChipSpuit}>
                    <Text style={styles.metricChipSpuitText}>
                      Spuit: {metrics.iu} IU ({metrics.volumeMl} mL)
                    </Text>
                  </View>

                  <View style={styles.metricChipDial}>
                    <Text style={styles.metricChipDialText}>
                      Dial: {metrics.dialClicks} Klik
                    </Text>
                  </View>
                </View>

                {/* Hari Aktif & Jam Injeksi */}
                <View style={styles.daysRowContainer}>
                  <Text style={styles.daysRowLabel}>Hari:</Text>
                  <View style={styles.daysChipsList}>
                    {DAYS_OF_WEEK.map((day) => {
                      const isActive = item.activeDays?.includes(day);
                      return (
                        <View key={day} style={[styles.dayDot, isActive && styles.dayDotActive]}>
                          <Text style={[styles.dayDotText, isActive && styles.dayDotTextActive]}>{day}</Text>
                        </View>
                      );
                    })}
                  </View>

                  <View style={styles.timeTag}>
                    <Clock size={10} color="#38bdf8" />
                    <Text style={styles.timeTagText}>{item.injectionTime || '08:00'}</Text>
                  </View>
                </View>

                {/* Progress Bar Sisa Cairan & Expired */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressTextRow}>
                    <View style={styles.progressTitleRow}>
                      <Droplets size={11} color="#38bdf8" />
                      <Text style={styles.progressTitle}>Sisa Cairan (~{item.estimatedDaysLeft || 22} Hari Lagi)</Text>
                    </View>
                    <Text style={styles.progressPercentText}>Kapasitas Aman ({Math.round(progressPercent)}%)</Text>
                  </View>

                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                  </View>

                  <View style={styles.progressFooterRow}>
                    <Text style={styles.progressFooterText}>Dilarutkan: {item.reconstitutedDate || '28 Agu 2026'}</Text>
                    <Text style={styles.progressFooterText}>Exp Kulkas: {item.maxFridgeDays || 28} Hari</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Tombol Utama Suntik Sekarang (Auto Rotate) */}
              <TouchableOpacity
                onPress={() => handleInjectNow(item)}
                style={styles.injectMainBtn}
              >
                <Syringe size={15} color="#022c22" />
                <Text style={styles.injectMainBtnText}>Suntik Sekarang ({currentSite})</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />

      {/* Modal 1: Edit Parameter Dosis & BAC Water */}
      <Modal visible={isEditDoseModalOpen} animationType="fade" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Sliders size={16} color="#10b981" />
                <Text style={styles.modalHeading}>Atur Dosis & Konsentrasi</Text>
              </View>
              <TouchableOpacity onPress={() => setIsEditDoseModalOpen(false)}>
                <X size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {editingItem && (
              <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
                <Text style={styles.modalPeptideTitle}>
                  {editingItem.name} ({editingItem.vialSize} {editingItem.unit})
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Target Dosis ({editingItem.unit}):</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={editTargetDose}
                    onChangeText={setEditTargetDose}
                  />
                </View>

                {editingItem.unit !== 'mL' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Volume BAC Water (mL):</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={editBacWater}
                      onChangeText={setEditBacWater}
                    />
                  </View>
                )}

                <View style={styles.modalActionsRow}>
                  <TouchableOpacity onPress={() => setIsEditDoseModalOpen(false)} style={styles.modalCancelBtn}>
                    <Text style={styles.modalCancelBtnText}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSaveDose} style={styles.modalSaveBtn}>
                    <Text style={styles.modalSaveBtnText}>Simpan Perubahan</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal 2: Jadwal, Notifikasi & Kalender Apple (.ics) */}
      <Modal visible={isScheduleModalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalLargeBox}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Clock size={16} color="#38bdf8" />
                <Text style={styles.modalHeading}>Jadwal & Pengaturan Suntik</Text>
              </View>
              <TouchableOpacity onPress={() => setIsScheduleModalOpen(false)}>
                <X size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {scheduleItem && (
              <ScrollView contentContainerStyle={styles.modalScrollBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Badge Protokol Bersih */}
                <View style={styles.protocolBanner}>
                  <Text style={styles.protocolBannerLabel}>Protokol Medis:</Text>
                  <View style={styles.protocolBadge}>
                    <Text style={styles.protocolBadgeText}>
                      {getCleanFrequencyLabel(frequencyLabel, frequencyKey)}
                    </Text>
                  </View>
                </View>

                {/* Preset Frekuensi Injeksi */}
                <Text style={styles.sectionSubHeading}>Preset Frekuensi Injeksi:</Text>
                <View style={styles.presetGrid}>
                  {FREQUENCY_PRESETS.map((p) => {
                    const isSelected = frequencyKey === p.id;
                    return (
                      <TouchableOpacity
                        key={p.id}
                        onPress={() => handleSelectFrequencyPreset(p)}
                        style={[styles.presetCard, isSelected && styles.presetCardActive]}
                      >
                        <Text style={[styles.presetTitle, isSelected && styles.presetTitleActive]}>{p.label}</Text>
                        <Text style={styles.presetSub}>{p.sub}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Pemilih Hari Aktif */}
                <Text style={styles.sectionSubHeading}>Pilih Hari Penyuntikan Aktif:</Text>
                <View style={styles.daysSelectorRow}>
                  {DAYS_OF_WEEK.map((d) => {
                    const isSelected = activeDays.includes(d);
                    return (
                      <TouchableOpacity
                        key={d}
                        onPress={() => toggleDay(d)}
                        style={[styles.dayToggleChip, isSelected && styles.dayToggleChipActive]}
                      >
                        <Text style={[styles.dayToggleText, isSelected && styles.dayToggleTextActive]}>{d}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Jam Penyuntikan */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Jam Penyuntikan:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={injectionTime}
                    onChangeText={setInjectionTime}
                    placeholder="08:00"
                    placeholderTextColor="#64748b"
                  />
                </View>

                {/* Estimasi Habis & Max Expired */}
                <View style={styles.twoColRow}>
                  <View style={styles.colBox}>
                    <Text style={styles.inputLabelWarning}>Estimasi Habis (Hari):</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={estimatedHabis}
                      onChangeText={setEstimatedHabis}
                    />
                  </View>

                  <View style={styles.colBox}>
                    <Text style={styles.inputLabel}>Max Expired (Hari):</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={maxExpired}
                      onChangeText={setMaxExpired}
                    />
                  </View>
                </View>

                {/* Toggle Periodisasi Siklus */}
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>Aktifkan Siklus / Periodisasi (Cycle)</Text>
                  <Switch
                    value={isCycleActive}
                    onValueChange={setIsCycleActive}
                    trackColor={{ false: '#1e293b', true: '#10b981' }}
                  />
                </View>

                {/* Toggle Notifikasi Pengingat */}
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>Aktifkan Notifikasi Pengingat</Text>
                  <Switch
                    value={isReminderActive}
                    onValueChange={setIsReminderActive}
                    trackColor={{ false: '#1e293b', true: '#10b981' }}
                  />
                </View>

                {/* Tombol Sinkronisasi Apple Calendar */}
                <TouchableOpacity onPress={handleSyncAppleCalendar} style={styles.syncCalendarBtn}>
                  <CalendarCheck size={16} color="#38bdf8" />
                  <Text style={styles.syncCalendarBtnText}>Sync ke Apple Calendar (.ics)</Text>
                </TouchableOpacity>

                {/* Aksi Simpan Jadwal */}
                <View style={styles.modalActionsRow}>
                  <TouchableOpacity onPress={() => setIsScheduleModalOpen(false)} style={styles.modalCancelBtn}>
                    <Text style={styles.modalCancelBtnText}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSaveSchedule} style={styles.modalSaveScheduleBtn}>
                    <Text style={styles.modalSaveBtnText}>Simpan Pengaturan</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal 3: Ambil dari Freezer */}
      <Modal visible={isTakeFreezerModalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalLargeBox}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Snowflake size={16} color="#38bdf8" />
                <Text style={styles.modalHeading}>Ambil Stok dari Freezer</Text>
              </View>
              <TouchableOpacity onPress={() => setIsTakeFreezerModalOpen(false)}>
                <X size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              {!selectedFreezerItem ? (
                <>
                  <Text style={styles.sectionSubHeading}>Pilih peptida yang ingin dipindahkan ke kulkas:</Text>
                  {freezerList.map((f) => (
                    <TouchableOpacity
                      key={f.id}
                      onPress={() => handleTakeFromFreezer(f)}
                      style={styles.freezerSelectCard}
                    >
                      <View style={styles.freezerSelectCardInfo}>
                        <Text style={styles.freezerItemName}>{f.name}</Text>
                        <Text style={styles.freezerItemCategory}>{f.category} • {f.vialSize} {f.unit}</Text>
                      </View>
                      <View style={styles.freezerItemQtyBadge}>
                        <Text style={styles.freezerItemQtyText}>{f.quantity} Vial</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </>
              ) : (
                <View style={styles.modalBody}>
                  <Text style={styles.modalPeptideTitle}>
                    Pelarutan: {selectedFreezerItem.name} ({selectedFreezerItem.vialSize} {selectedFreezerItem.unit})
                  </Text>
                  <Text style={styles.reconSubDesc}>
                    Masukkan jumlah Bacteriostatic (BAC) Water untuk melarutkan peptida ini ke kulkas aktif.
                  </Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Volume BAC Water (mL):</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={freezerBacInput}
                      onChangeText={setFreezerBacInput}
                      placeholder="Contoh: 2.0"
                      placeholderTextColor="#64748b"
                    />
                  </View>

                  <View style={styles.modalActionsRow}>
                    <TouchableOpacity onPress={() => setSelectedFreezerItem(null)} style={styles.modalCancelBtn}>
                      <Text style={styles.modalCancelBtnText}>Kembali</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleConfirmReconstituteFromModal} style={styles.modalSaveBtn}>
                      <Text style={styles.modalSaveBtnText}>Larutkan Sekarang</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
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
    paddingTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 10,
    gap: 10,
  },
  statLabel: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '700',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  statSub: {
    fontSize: 10,
    fontWeight: '400',
    color: '#94a3b8',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  sectionSub: {
    fontSize: 9,
    color: '#64748b',
  },
  takeFreezerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  takeFreezerBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#022c22',
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
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  emptySub: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
  },
  peptideCard: {
    backgroundColor: '#090d16',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  peptideName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  vialBadge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  vialBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
  },
  headerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeToday: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10b981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeTodayText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10b981',
  },
  badgeRest: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeRestText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
  },
  iconBtn: {
    padding: 4,
  },
  categorySubText: {
    fontSize: 10,
    color: '#64748b',
  },
  doseMetricsGrid: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 4,
  },
  metricChipDose: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metricChipDoseText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#f59e0b',
  },
  metricChipSpuit: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metricChipSpuitText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#06b6d4',
  },
  metricChipDial: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metricChipDialText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38bdf8',
  },
  daysRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 4,
  },
  daysRowLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
  },
  daysChipsList: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  dayDot: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  dayDotActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  dayDotText: {
    fontSize: 8,
    color: '#64748b',
    fontWeight: '700',
  },
  dayDotTextActive: {
    color: '#022c22',
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timeTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  progressContainer: {
    backgroundColor: '#030712',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 8,
    gap: 4,
    marginVertical: 4,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38bdf8',
  },
  progressPercentText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#38bdf8',
  },
  progressBarBg: {
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
    marginTop: 2,
  },
  progressFooterText: {
    fontSize: 8,
    color: '#64748b',
  },
  injectMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  injectMainBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#022c22',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalBox: {
    backgroundColor: '#090d16',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
  },
  modalLargeBox: {
    backgroundColor: '#090d16',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    maxHeight: '85%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#1e293b',
    paddingBottom: 10,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  modalBody: {
    paddingTop: 12,
    gap: 10,
  },
  modalScrollBody: {
    paddingTop: 12,
    gap: 10,
  },
  modalPeptideTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  reconSubDesc: {
    fontSize: 10,
    color: '#94a3b8',
    lineHeight: 14,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  inputLabelWarning: {
    fontSize: 10,
    fontWeight: '700',
    color: '#f59e0b',
  },
  textInput: {
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 8,
    padding: 10,
    color: '#ffffff',
    fontSize: 12,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
  },
  colBox: {
    flex: 1,
    gap: 4,
  },
  protocolBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#030712',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  protocolBannerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38bdf8',
  },
  protocolBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: '#38bdf8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  protocolBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38bdf8',
  },
  sectionSubHeading: {
    fontSize: 10,
    fontWeight: '800',
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
    borderRadius: 8,
    padding: 8,
    gap: 2,
  },
  presetCardActive: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  presetTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  presetTitleActive: {
    color: '#38bdf8',
  },
  presetSub: {
    fontSize: 8,
    color: '#64748b',
  },
  daysSelectorRow: {
    flexDirection: 'row',
    gap: 4,
  },
  dayToggleChip: {
    flex: 1,
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  dayToggleChipActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  dayToggleText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
  },
  dayToggleTextActive: {
    color: '#022c22',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  toggleLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  syncCalendarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#38bdf8',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  syncCalendarBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38bdf8',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  modalSaveBtn: {
    flex: 2,
    backgroundColor: '#10b981',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalSaveScheduleBtn: {
    flex: 2,
    backgroundColor: '#38bdf8',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalSaveBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#022c22',
  },
  freezerSelectCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
  },
  freezerSelectCardInfo: {
    gap: 2,
  },
  freezerItemName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  freezerItemCategory: {
    fontSize: 9,
    color: '#64748b',
  },
  freezerItemQtyBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  freezerItemQtyText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#38bdf8',
  },
});
