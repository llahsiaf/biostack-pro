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
import Svg, { Rect, Line, Text as SvgText, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import {
  FlaskConical,
  Plus,
  Trash2,
  Syringe,
  Calendar,
  Clock,
  Droplets,
  CheckCircle2,
  X,
  CalendarCheck,
  Snowflake,
  Activity,
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

  const [isTakeFreezerModalOpen, setIsTakeFreezerModalOpen] = useState(false);
  const [selectedFreezerItem, setSelectedFreezerItem] = useState<FreezerItem | null>(null);
  const [freezerBacInput, setFreezerBacInput] = useState('2.0');

  // State Modal Dosis Presisi
  const [isEditDoseModalOpen, setIsEditDoseModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editTargetDose, setEditTargetDose] = useState('');
  const [editBacWater, setEditBacWater] = useState('');

  // State Modal Jadwal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleItem, setScheduleItem] = useState<InventoryItem | null>(null);
  const [activeDays, setActiveDays] = useState<string[]>([]);
  const [injectionTime, setInjectionTime] = useState('08:00');
  const [frequencyKey, setFrequencyKey] = useState('weekly');
  const [frequencyLabel, setFrequencyLabel] = useState('Mingguan (Weekly)');
  const [isCycleActive, setIsCycleActive] = useState(false);
  const [isReminderActive, setIsReminderActive] = useState(true);

  const inventoryList = inventory || [];
  const freezerList = freezerStock || [];
  const totalFreezerVials = freezerList.reduce((acc, curr) => acc + (curr.quantity || 0), 0);

  const isInjectToday = (itemDays: string[]) => {
    const todayIndex = new Date().getDay();
    const dayMap = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    return itemDays?.includes(dayMap[todayIndex]);
  };

  // Helper Kalkulasi Klinis (Digunakan Live di Modal)
  const calculateMetrics = (item: InventoryItem, overrideDose?: string, overrideBac?: string) => {
    const dose = overrideDose !== undefined ? parseFloat(overrideDose) || 0 : item.targetDose;
    const bac = overrideBac !== undefined ? parseFloat(overrideBac) || 0 : item.bacWater;

    if (item.unit === 'mL') {
      const iu = Math.round(dose * 100);
      return { volumeMl: dose.toFixed(3), iu, dialClicks: Math.round(dose * 100) };
    }

    const safeBac = bac > 0 ? bac : 2.0;
    const concentration = item.vialSize / safeBac;
    const vol = concentration > 0 ? dose / concentration : 0;
    const iu = Math.round(vol * 100);
    return { volumeMl: vol.toFixed(3), iu, dialClicks: iu };
  };

  // Kalkulasi Status Sisa Cairan Real-time
  const getLiquidStatus = (item: InventoryItem) => {
    const initialVol = item.unit === 'mL' ? item.vialSize : (item.bacWater > 0 ? item.bacWater : 2.0);
    const currentVol = item.currentVolumeMl !== undefined ? item.currentVolumeMl : initialVol;
    const progressPercent = Math.max(0, Math.min(100, (currentVol / initialVol) * 100));

    const metrics = calculateMetrics(item);
    const injectVol = parseFloat(metrics.volumeMl);
    const dosesLeft = injectVol > 0 ? Math.floor(currentVol / injectVol) : 0;
    
    let daysMultiplier = 7;
    if(item.frequency === 'daily') daysMultiplier = 1;
    if(item.frequency === '2x_week') daysMultiplier = 3.5;
    if(item.frequency === '3x_week') daysMultiplier = 2.33;
    
    const daysLeft = Math.round(dosesLeft * daysMultiplier);

    return { currentVol, initialVol, progressPercent, daysLeft };
  };

  // AKSI: Ekspor Apple Calendar Langsung (Shortcut)
  const handleDirectSyncCalendar = async (item: InventoryItem) => {
    const metrics = calculateMetrics(item);
    await exportToAppleCalendar({
      peptideName: item.name,
      targetDose: item.targetDose,
      unit: item.unit,
      activeDays: item.activeDays || ['Sen'],
      injectionTime: item.injectionTime || '08:00',
      frequencyLabel: item.frequencyLabel || 'Mingguan (Weekly)',
      volumeMl: metrics.volumeMl,
      dialClicks: metrics.dialClicks,
    });
  };

  // AKSI: Suntik Sekarang (Kurangi Sisa Cairan)
  const handleInjectNow = (item: InventoryItem) => {
    const metrics = calculateMetrics(item);
    const injectVol = parseFloat(metrics.volumeMl);
    const liquid = getLiquidStatus(item);

    if (liquid.currentVol < injectVol) {
      Alert.alert('Cairan Tidak Cukup', `Sisa cairan (${liquid.currentVol.toFixed(2)} mL) kurang dari dosis yang ditarik (${injectVol} mL). Siapkan vial baru.`);
      return;
    }

    const now = new Date();
    logInjection({
      id: `log-${Date.now()}`,
      peptideName: item.name,
      dose: item.targetDose,
      unit: item.unit,
      volumeMl: metrics.volumeMl,
      siteId: currentSite,
      timestamp: now.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    });

    const newVolume = Math.max(0, liquid.currentVol - injectVol);
    updateInventoryItem(item.id, { currentVolumeMl: newVolume });

    Alert.alert('Injeksi Berhasil', `${item.name} telah disuntikkan. Sisa cairan di kulkas diperbarui otomatis.`);
  };

  // MODAL: Dosis Presisi
  const openEditDoseModal = (item: InventoryItem) => {
    setEditingItem(item);
    setEditTargetDose((item.targetDose || 0).toString());
    setEditBacWater((item.bacWater || 0).toString());
    setIsEditDoseModalOpen(true);
  };

  const handleApplyPreset = (multiplier: number) => {
    if (!editingItem) return;
    const standardDose = editingItem.targetDose || 1;
    setEditTargetDose((standardDose * multiplier).toString());
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

  // MODAL: Jadwal
  const openScheduleModal = (item: InventoryItem) => {
    setScheduleItem(item);
    setActiveDays(item.activeDays || ['Sen']);
    setInjectionTime(item.injectionTime || '08:00');
    setFrequencyKey(item.frequency || 'weekly');
    setFrequencyLabel(item.frequencyLabel || 'Mingguan (Weekly)');
    setIsCycleActive(Boolean(item.isCycleActive));
    setIsReminderActive(item.isReminderActive !== false);
    setIsScheduleModalOpen(true);
  };

  const handleSaveSchedule = () => {
    if (!scheduleItem) return;
    updateInventoryItem(scheduleItem.id, {
      frequency: frequencyKey,
      frequencyLabel: frequencyLabel,
      activeDays: activeDays,
      injectionTime: injectionTime,
      isCycleActive: isCycleActive,
      isReminderActive: isReminderActive,
    });
    setIsScheduleModalOpen(false);
  };

  // RENDER: Kartu Inventory
  return (
    <View style={styles.container}>
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

      <View style={styles.sectionHeaderRow}>
        <View>
          <View style={styles.sectionTitleWithIcon}>
            <Droplets size={14} color="#10b981" />
            <Text style={styles.sectionTitle}>Active Fridge Inventory</Text>
          </View>
          <Text style={styles.sectionSub}>Peptida dilarutkan & siap disuntikkan</Text>
        </View>
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

      <FlatList
        data={inventoryList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <FlaskConical size={32} color="#64748b" />
            <Text style={styles.emptyTitle}>Kulkas Masih Kosong</Text>
            <Text style={styles.emptySub}>Tekan tombol Ambil Freezer di atas.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isToday = isInjectToday(item.activeDays);
          const metrics = calculateMetrics(item);
          const liquid = getLiquidStatus(item);

          return (
            <View style={styles.peptideCard}>
              <View style={styles.cardHeader}>
                <TouchableOpacity style={styles.cardHeaderLeft} onPress={() => openEditDoseModal(item)}>
                  <Text style={styles.peptideName}>{item.name}</Text>
                  <View style={styles.vialBadge}>
                    <Text style={styles.vialBadgeText}>{item.vialSize}{item.unit} Vial</Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.headerActionRow}>
                  {isToday ? (
                    <View style={styles.badgeToday}><Text style={styles.badgeTodayText}>Injeksi Hari Ini</Text></View>
                  ) : (
                    <View style={styles.badgeRest}><Text style={styles.badgeRestText}>Hari Rest</Text></View>
                  )}

                  {/* Kalender: Direct Sync */}
                  <TouchableOpacity onPress={() => handleDirectSyncCalendar(item)} style={styles.iconBtn}>
                    <Calendar size={14} color="#94a3b8" />
                  </TouchableOpacity>

                  {/* Jam: Buka Modal Schedule */}
                  <TouchableOpacity onPress={() => openScheduleModal(item)} style={styles.iconBtn}>
                    <Clock size={14} color="#94a3b8" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => Alert.alert('Hapus Senyawa', `Keluarkan ${item.name}?`, [
                      { text: 'Batal', style: 'cancel' },
                      { text: 'Hapus', style: 'destructive', onPress: () => removeInventoryItem(item.id) },
                    ])}
                    style={styles.iconBtn}
                  >
                    <Trash2 size={14} color="#64748b" />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity onPress={() => openEditDoseModal(item)}>
                <Text style={styles.categorySubText}>{item.category} • {item.frequencyLabel.replace(/_+/g, ' ')}</Text>

                <View style={styles.doseMetricsGrid}>
                  <View style={styles.metricChipDose}><Text style={styles.metricChipDoseText}>Dosis: {item.targetDose} {item.unit}</Text></View>
                  <View style={styles.metricChipSpuit}><Text style={styles.metricChipSpuitText}>Spuit: {metrics.iu} IU ({metrics.volumeMl} mL)</Text></View>
                  <View style={styles.metricChipDial}><Text style={styles.metricChipDialText}>Dial: {metrics.dialClicks} Klik</Text></View>
                </View>

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

                {/* Progress Bar Sisa Cairan Tersinkron */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressTextRow}>
                    <View style={styles.progressTitleRow}>
                      <Droplets size={11} color="#38bdf8" />
                      <Text style={styles.progressTitle}>Sisa Cairan (~{liquid.daysLeft} Hari Lagi)</Text>
                    </View>
                    <Text style={styles.progressPercentText}>Kapasitas Aman ({Math.round(liquid.progressPercent)}%)</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${liquid.progressPercent}%` }]} />
                  </View>
                  <View style={styles.progressFooterRow}>
                    <Text style={styles.progressFooterText}>Dilarutkan: {item.reconstitutedDate || '-'}</Text>
                    <Text style={styles.progressFooterText}>Exp Kulkas: {item.maxFridgeDays || 28} Hari</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => handleInjectNow(item)} style={styles.injectMainBtn}>
                <Syringe size={15} color="#022c22" />
                <Text style={styles.injectMainBtnText}>Suntik Sekarang ({currentSite})</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />

      {/* MODAL 1: RESTORASI UI KALKULATOR DOSIS PRESISI */}
      <Modal visible={isEditDoseModalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.doseModalOverlay}>
          <View style={styles.doseModalBox}>
            
            {editingItem && (() => {
              const liveMetrics = calculateMetrics(editingItem, editTargetDose, editBacWater);
              const iuPercent = Math.min(100, Math.max(0, liveMetrics.iu));
              const svgWidth = 280;
              const fillWidth = (iuPercent / 100) * 180; // 180 is max width of barrel liquid

              return (
                <ScrollView contentContainerStyle={styles.doseModalScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  <View style={styles.doseModalHeader}>
                    <View>
                      <Text style={styles.doseModalTitle}>{editingItem.name}</Text>
                      <Text style={styles.doseModalSub}>{editingItem.vialSize} {editingItem.unit} Vial • {editingItem.category}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setIsEditDoseModalOpen(false)} style={styles.closeIconCircle}>
                      <X size={18} color="#94a3b8" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.sectionHeadingMini}>PRESET DOSIS CEPAT</Text>
                  <View style={styles.presetDoseRow}>
                    <TouchableOpacity onPress={() => handleApplyPreset(0.5)} style={styles.presetDoseBtn}>
                      <Text style={styles.presetDoseBtnLabel}>LOW</Text>
                      <Text style={styles.presetDoseBtnVal}>{(editingItem.targetDose * 0.5).toFixed(1)} {editingItem.unit}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleApplyPreset(1)} style={[styles.presetDoseBtn, styles.presetDoseBtnActive]}>
                      <Text style={[styles.presetDoseBtnLabel, styles.presetTextActive]}>STANDARD</Text>
                      <Text style={[styles.presetDoseBtnVal, styles.presetTextActive]}>{editingItem.targetDose} {editingItem.unit}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleApplyPreset(2)} style={styles.presetDoseBtn}>
                      <Text style={styles.presetDoseBtnLabel}>HIGH</Text>
                      <Text style={styles.presetDoseBtnVal}>{(editingItem.targetDose * 2).toFixed(1)} {editingItem.unit}</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.fancyInputContainer}>
                    <View style={styles.fancyInputHeader}>
                      <Text style={styles.fancyInputTitle}>Target Dosis Injeksi</Text>
                      <Text style={styles.fancyInputTitleVal}>{editTargetDose || 0} {editingItem.unit}</Text>
                    </View>
                    <TextInput
                      style={styles.fancyTextInput}
                      keyboardType="numeric"
                      value={editTargetDose}
                      onChangeText={setEditTargetDose}
                      textAlign="center"
                    />
                  </View>

                  {editingItem.unit !== 'mL' && (
                    <View style={styles.fancyInputContainer}>
                      <View style={styles.fancyInputHeader}>
                        <Text style={styles.fancyInputTitle}>Volume Pelarut (BAC Water)</Text>
                        <Text style={styles.fancyInputTitleValBlue}>{editBacWater || 0} mL</Text>
                      </View>
                      <TextInput
                        style={styles.fancyTextInputBlue}
                        keyboardType="numeric"
                        value={editBacWater}
                        onChangeText={setEditBacWater}
                        textAlign="center"
                      />
                    </View>
                  )}

                  {/* SVG SIMULASI SPUIT U-100 */}
                  <View style={styles.svgCardBox}>
                    <View style={styles.svgCardHeader}>
                      <Text style={styles.svgCardTitle}>SIMULASI SPUIT U-100</Text>
                      <Text style={styles.svgCardVal}>{liveMetrics.iu} IU ({liveMetrics.volumeMl} mL)</Text>
                    </View>
                    
                    <View style={styles.svgWrapper}>
                      <Svg height="80" width={svgWidth} viewBox="0 0 280 80">
                        <Defs>
                          <LinearGradient id="liquidGrad" x1="0" y1="0" x2="1" y2="0">
                            <Stop offset="0" stopColor="#06b6d4" stopOpacity="1" />
                            <Stop offset="1" stopColor="#10b981" stopOpacity="1" />
                          </LinearGradient>
                        </Defs>
                        {/* Spuit Body */}
                        <Rect x="40" y="20" width="180" height="40" fill="#0f172a" stroke="#334155" strokeWidth="2" rx="4" />
                        {/* Plunger Right End (Needle side) */}
                        <Rect x="220" y="25" width="10" height="30" fill="#1e293b" />
                        <Line x1="230" y1="40" x2="260" y2="40" stroke="#475569" strokeWidth="2" />
                        {/* Plunger Push Left */}
                        <Rect x="20" y="15" width="20" height="50" fill="#1e293b" rx="2" />
                        <Line x1="10" y1="40" x2="20" y2="40" stroke="#475569" strokeWidth="4" />
                        
                        {/* Ticks & Numbers */}
                        {[0, 20, 40, 60, 80, 100].map((tick, i) => (
                          <G key={i}>
                            <Line x1={40 + i * 36} y1="20" x2={40 + i * 36} y2="30" stroke="#64748b" strokeWidth="1.5" />
                            <SvgText x={40 + i * 36} y="45" fill="#64748b" fontSize="9" textAnchor="middle">{tick}</SvgText>
                          </G>
                        ))}

                        {/* Liquid Fill */}
                        {liveMetrics.iu > 0 && (
                          <Rect x="40" y="22" width={fillWidth} height="36" fill="url(#liquidGrad)" rx="2" />
                        )}

                        {/* Indicator Line */}
                        {liveMetrics.iu > 0 && (
                          <G>
                            <Line x1={40 + fillWidth} y1="15" x2={40 + fillWidth} y2="65" stroke="#10b981" strokeWidth="2" strokeDasharray="3,3" />
                            <SvgText x={40 + fillWidth} y="75" fill="#10b981" fontSize="10" fontWeight="bold" textAnchor="middle">
                              Garis {liveMetrics.iu} IU
                            </SvgText>
                          </G>
                        )}
                      </Svg>
                    </View>
                  </View>

                  {/* Panel Kalkulasi Presisi */}
                  <View style={styles.calcPanel}>
                    <View style={styles.calcHeader}>
                      <Activity size={14} color="#10b981" />
                      <Text style={styles.calcHeaderTitle}>HASIL KALKULASI PRESISI</Text>
                    </View>
                    <View style={styles.calcGrid}>
                      <View style={styles.calcBoxBlue}>
                        <Text style={styles.calcBoxLabel}>Volume</Text>
                        <Text style={styles.calcBoxVal}>{liveMetrics.volumeMl}</Text>
                        <Text style={styles.calcBoxSub}>mL</Text>
                      </View>
                      <View style={styles.calcBoxGreen}>
                        <Text style={styles.calcBoxLabelGreen}>Spuit U-100</Text>
                        <Text style={styles.calcBoxValGreen}>{liveMetrics.iu}</Text>
                        <Text style={styles.calcBoxSubGreen}>IU</Text>
                      </View>
                      <View style={styles.calcBoxBlue}>
                        <Text style={styles.calcBoxLabel}>Dial Pen</Text>
                        <Text style={styles.calcBoxVal}>{liveMetrics.dialClicks}</Text>
                        <Text style={styles.calcBoxSub}>Klik</Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity onPress={handleSaveDose} style={styles.applyBtn}>
                    <CheckCircle2 size={16} color="#022c22" />
                    <Text style={styles.applyBtnText}>Terapkan & Simpan Dosis</Text>
                  </TouchableOpacity>
                </ScrollView>
              );
            })()}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL 2: Jadwal & Kalender (Khusus Pengaturan) */}
      <Modal visible={isScheduleModalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.doseModalOverlay}>
          <View style={styles.modalLargeBox}>
            <View style={styles.modalHeaderBasic}>
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
                <Text style={styles.sectionHeadingMini}>PRESET FREKUENSI INJEKSI:</Text>
                <View style={styles.presetGrid}>
                  {FREQUENCY_PRESETS.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => { setFrequencyKey(p.id); setFrequencyLabel(p.label); setActiveDays(p.days); }}
                      style={[styles.freqCard, frequencyKey === p.id && styles.freqCardActive]}
                    >
                      <Text style={[styles.freqTitle, frequencyKey === p.id && styles.freqTitleActive]}>{p.label}</Text>
                      <Text style={styles.freqSub}>{p.sub}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.sectionHeadingMini}>HARI AKTIF:</Text>
                <View style={styles.daysSelectorRow}>
                  {DAYS_OF_WEEK.map((d) => {
                    const isSel = activeDays.includes(d);
                    return (
                      <TouchableOpacity
                        key={d}
                        onPress={() => {
                          if (isSel && activeDays.length > 1) setActiveDays(activeDays.filter((x) => x !== d));
                          else if (!isSel) setActiveDays([...activeDays, d]);
                        }}
                        style={[styles.dayToggleChip, isSel && styles.dayToggleChipActive]}
                      >
                        <Text style={[styles.dayToggleText, isSel && styles.dayToggleTextActive]}>{d}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.fancyInputContainer}>
                  <Text style={styles.fancyInputTitle}>Jam Penyuntikan:</Text>
                  <TextInput style={styles.textInputBasic} value={injectionTime} onChangeText={setInjectionTime} />
                </View>

                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>Aktifkan Siklus / Periodisasi (Cycle)</Text>
                  <Switch value={isCycleActive} onValueChange={setIsCycleActive} trackColor={{ false: '#1e293b', true: '#10b981' }} />
                </View>

                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>Aktifkan Notifikasi Pengingat</Text>
                  <Switch value={isReminderActive} onValueChange={setIsReminderActive} trackColor={{ false: '#1e293b', true: '#10b981' }} />
                </View>

                <View style={styles.modalActionsRow}>
                  <TouchableOpacity onPress={() => setIsScheduleModalOpen(false)} style={styles.modalCancelBtn}>
                    <Text style={styles.modalCancelBtnText}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSaveSchedule} style={styles.modalSaveScheduleBtn}>
                    <Text style={styles.applyBtnText}>Simpan Pengaturan</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL 3: Ambil dari Freezer (Tetap Minimalis) */}
      <Modal visible={isTakeFreezerModalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.doseModalOverlay}>
          <View style={styles.modalLargeBox}>
            <View style={styles.modalHeaderBasic}>
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
                freezerList.map((f) => (
                  <TouchableOpacity
                    key={f.id}
                    onPress={() => {
                      if (f.quantity <= 0) return;
                      if (f.unit === 'mL') { transferLiquidToFridge(f.id); setIsTakeFreezerModalOpen(false); }
                      else { setSelectedFreezerItem(f); setFreezerBacInput((f.defaultBacWater || 2).toString()); }
                    }}
                    style={styles.freezerSelectCard}
                  >
                    <View>
                      <Text style={styles.freezerItemName}>{f.name}</Text>
                      <Text style={styles.freezerItemCategory}>{f.category} • {f.vialSize} {f.unit}</Text>
                    </View>
                    <View style={styles.freezerItemQtyBadge}><Text style={styles.freezerItemQtyText}>{f.quantity} Vial</Text></View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={{ gap: 10 }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Pelarutan: {selectedFreezerItem.name}</Text>
                  <TextInput style={styles.textInputBasic} keyboardType="numeric" value={freezerBacInput} onChangeText={setFreezerBacInput} placeholder="Volume BAC Water (mL)" placeholderTextColor="#64748b" />
                  <TouchableOpacity onPress={() => { reconstituteToFridge(selectedFreezerItem.id, parseFloat(freezerBacInput) || 2.0); setIsTakeFreezerModalOpen(false); setSelectedFreezerItem(null); }} style={styles.modalSaveScheduleBtn}>
                    <Text style={styles.applyBtnText}>Larutkan ke Kulkas</Text>
                  </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: '#030712', paddingHorizontal: 14, paddingTop: 8 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  statCard: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#090d16', borderWidth: 1, borderColor: '#1e293b', borderRadius: 12, padding: 10, gap: 10 },
  statLabel: { fontSize: 9, color: '#64748b', fontWeight: '700' },
  statValue: { fontSize: 14, fontWeight: '800', color: '#ffffff' },
  statSub: { fontSize: 10, fontWeight: '400', color: '#94a3b8' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitleWithIcon: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#ffffff' },
  sectionSub: { fontSize: 9, color: '#64748b' },
  takeFreezerBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#10b981', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  takeFreezerBtnText: { fontSize: 10, fontWeight: '800', color: '#022c22' },
  listContainer: { paddingBottom: 80, gap: 12 },
  emptyCard: { backgroundColor: '#090d16', borderWidth: 1, borderColor: '#1e293b', borderRadius: 14, padding: 24, alignItems: 'center', gap: 8, marginTop: 20 },
  emptyTitle: { fontSize: 13, fontWeight: '800', color: '#ffffff' },
  emptySub: { fontSize: 10, color: '#64748b', textAlign: 'center' },
  peptideCard: { backgroundColor: '#090d16', borderRadius: 14, borderWidth: 1, borderColor: '#1e293b', padding: 12, gap: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  peptideName: { fontSize: 14, fontWeight: '800', color: '#ffffff' },
  vialBadge: { backgroundColor: '#1e293b', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  vialBadgeText: { fontSize: 9, fontWeight: '700', color: '#94a3b8' },
  headerActionRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeToday: { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderWidth: 1, borderColor: '#10b981', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  badgeTodayText: { fontSize: 9, fontWeight: '800', color: '#10b981' },
  badgeRest: { backgroundColor: '#1e293b', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  badgeRestText: { fontSize: 9, fontWeight: '700', color: '#64748b' },
  iconBtn: { padding: 4 },
  categorySubText: { fontSize: 10, color: '#64748b' },
  doseMetricsGrid: { flexDirection: 'row', gap: 6, marginVertical: 4 },
  metricChipDose: { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  metricChipDoseText: { fontSize: 10, fontWeight: '800', color: '#f59e0b' },
  metricChipSpuit: { backgroundColor: 'rgba(6, 182, 212, 0.1)', borderWidth: 1, borderColor: 'rgba(6, 182, 212, 0.3)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  metricChipSpuitText: { fontSize: 10, fontWeight: '800', color: '#06b6d4' },
  metricChipDial: { backgroundColor: 'rgba(56, 189, 248, 0.1)', borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.3)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  metricChipDialText: { fontSize: 10, fontWeight: '800', color: '#38bdf8' },
  daysRowContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 4 },
  daysRowLabel: { fontSize: 10, color: '#64748b', fontWeight: '700' },
  daysChipsList: { flexDirection: 'row', gap: 4, flex: 1 },
  dayDot: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, backgroundColor: '#030712', borderWidth: 1, borderColor: '#1e293b' },
  dayDotActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  dayDotText: { fontSize: 8, color: '#64748b', fontWeight: '700' },
  dayDotTextActive: { color: '#022c22' },
  timeTag: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  timeTagText: { fontSize: 10, fontWeight: '800', color: '#ffffff' },
  progressContainer: { backgroundColor: '#030712', borderRadius: 8, borderWidth: 1, borderColor: '#1e293b', padding: 8, gap: 4, marginVertical: 4 },
  progressTextRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  progressTitle: { fontSize: 10, fontWeight: '800', color: '#38bdf8' },
  progressPercentText: { fontSize: 9, fontWeight: '700', color: '#38bdf8' },
  progressBarBg: { height: 4, backgroundColor: '#1e293b', borderRadius: 2, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#38bdf8', borderRadius: 2 },
  progressFooterRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  progressFooterText: { fontSize: 8, color: '#64748b' },
  injectMainBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#10b981', paddingVertical: 10, borderRadius: 10, marginTop: 4 },
  injectMainBtnText: { fontSize: 12, fontWeight: '800', color: '#022c22' },

  // STYLES MODAL DOSIS PRESISI (Gambar 1)
  doseModalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.85)', justifyContent: 'flex-end' },
  doseModalBox: { backgroundColor: '#0f172a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18, height: '85%' },
  doseModalScroll: { paddingBottom: 40, gap: 14 },
  doseModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  doseModalTitle: { fontSize: 18, fontWeight: '900', color: '#ffffff' },
  doseModalSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  closeIconCircle: { backgroundColor: '#1e293b', padding: 6, borderRadius: 12 },
  sectionHeadingMini: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 0.5, marginTop: 4 },
  
  presetDoseRow: { flexDirection: 'row', gap: 8 },
  presetDoseBtn: { flex: 1, backgroundColor: '#1e293b', paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 2 },
  presetDoseBtnActive: { backgroundColor: '#10b981' },
  presetDoseBtnLabel: { fontSize: 9, fontWeight: '800', color: '#94a3b8' },
  presetDoseBtnVal: { fontSize: 13, fontWeight: '800', color: '#ffffff' },
  presetTextActive: { color: '#022c22' },

  fancyInputContainer: { backgroundColor: '#090d16', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', padding: 12, gap: 8 },
  fancyInputHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fancyInputTitle: { fontSize: 11, fontWeight: '800', color: '#94a3b8' },
  fancyInputTitleVal: { fontSize: 12, fontWeight: '800', color: '#10b981' },
  fancyInputTitleValBlue: { fontSize: 12, fontWeight: '800', color: '#38bdf8' },
  fancyTextInput: { backgroundColor: '#030712', borderRadius: 8, borderWidth: 1, borderColor: '#10b981', color: '#ffffff', fontSize: 16, fontWeight: '800', paddingVertical: 10 },
  fancyTextInputBlue: { backgroundColor: '#030712', borderRadius: 8, borderWidth: 1, borderColor: '#38bdf8', color: '#ffffff', fontSize: 16, fontWeight: '800', paddingVertical: 10 },

  svgCardBox: { backgroundColor: '#090d16', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', padding: 14, gap: 10 },
  svgCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  svgCardTitle: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 0.5 },
  svgCardVal: { fontSize: 11, fontWeight: '800', color: '#10b981' },
  svgWrapper: { alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },

  calcPanel: { backgroundColor: '#090d16', borderRadius: 12, borderWidth: 1, borderColor: '#10b981', padding: 12, gap: 12 },
  calcHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  calcHeaderTitle: { fontSize: 10, fontWeight: '800', color: '#10b981' },
  calcGrid: { flexDirection: 'row', gap: 8 },
  calcBoxBlue: { flex: 1, backgroundColor: '#030712', borderWidth: 1, borderColor: '#1e293b', borderRadius: 8, padding: 10, alignItems: 'center', gap: 2 },
  calcBoxGreen: { flex: 1, backgroundColor: 'rgba(16, 185, 129, 0.1)', borderWidth: 1, borderColor: '#10b981', borderRadius: 8, padding: 10, alignItems: 'center', gap: 2 },
  calcBoxLabel: { fontSize: 9, fontWeight: '700', color: '#64748b' },
  calcBoxVal: { fontSize: 16, fontWeight: '900', color: '#ffffff' },
  calcBoxSub: { fontSize: 9, color: '#64748b' },
  calcBoxLabelGreen: { fontSize: 9, fontWeight: '800', color: '#10b981' },
  calcBoxValGreen: { fontSize: 16, fontWeight: '900', color: '#10b981' },
  calcBoxSubGreen: { fontSize: 9, fontWeight: '800', color: '#10b981' },

  applyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#10b981', paddingVertical: 14, borderRadius: 12, marginTop: 10 },
  applyBtnText: { fontSize: 13, fontWeight: '900', color: '#022c22' },

  // Modal Setting Basic
  modalLargeBox: { backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', padding: 16, maxHeight: '85%' },
  modalHeaderBasic: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: '#1e293b', paddingBottom: 10 },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalHeading: { fontSize: 13, fontWeight: '800', color: '#ffffff' },
  modalScrollBody: { paddingTop: 12, gap: 12 },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  freqCard: { width: '48.5%', backgroundColor: '#030712', borderWidth: 1, borderColor: '#1e293b', borderRadius: 8, padding: 10 },
  freqCardActive: { borderColor: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.1)' },
  freqTitle: { fontSize: 11, fontWeight: '800', color: '#ffffff' },
  freqTitleActive: { color: '#38bdf8' },
  freqSub: { fontSize: 9, color: '#64748b' },
  daysSelectorRow: { flexDirection: 'row', gap: 4 },
  dayToggleChip: { flex: 1, backgroundColor: '#030712', borderWidth: 1, borderColor: '#1e293b', paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  dayToggleChipActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  dayToggleText: { fontSize: 10, fontWeight: '700', color: '#64748b' },
  dayToggleTextActive: { color: '#022c22' },
  textInputBasic: { backgroundColor: '#030712', borderRadius: 8, borderWidth: 1, borderColor: '#1e293b', color: '#ffffff', fontSize: 12, padding: 10 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  toggleLabel: { fontSize: 11, fontWeight: '700', color: '#cbd5e1' },
  modalActionsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  modalCancelBtn: { flex: 1, backgroundColor: '#030712', borderWidth: 1, borderColor: '#1e293b', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalCancelBtnText: { fontSize: 12, fontWeight: '700', color: '#94a3b8' },
  modalSaveScheduleBtn: { flex: 2, backgroundColor: '#38bdf8', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  
  freezerSelectCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#030712', borderWidth: 1, borderColor: '#1e293b', padding: 12, borderRadius: 10 },
  freezerItemName: { fontSize: 12, fontWeight: '800', color: '#ffffff' },
  freezerItemCategory: { fontSize: 9, color: '#64748b' },
  freezerItemQtyBadge: { backgroundColor: 'rgba(56, 189, 248, 0.1)', borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.3)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  freezerItemQtyText: { fontSize: 9, fontWeight: '800', color: '#38bdf8' },
});
