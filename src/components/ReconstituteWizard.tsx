import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { X, FlaskConical, ChevronRight, Check, Info, ShieldAlert } from 'lucide-react-native';
import { FreezerStockItem, ActiveInventoryItem } from '../types';
import { MASTER_PEPTIDE_DATABASE } from '../database/defaultPeptides';

interface ReconstituteWizardProps {
  visible: boolean;
  freezerItem: FreezerStockItem | null;
  onClose: () => void;
  onComplete: (newItem: ActiveInventoryItem) => void;
}

export const ReconstituteWizard: React.FC<ReconstituteWizardProps> = ({
  visible,
  freezerItem,
  onClose,
  onComplete,
}) => {
  if (!freezerItem) return null;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const def = MASTER_PEPTIDE_DATABASE.find((p) => p.name.toLowerCase() === freezerItem.name.toLowerCase());

  const [bacWater, setBacWater] = useState<number>(freezerItem.bacWaterMl || def?.defaultBacWaterMl || 2.0);
  const [selectedDose, setSelectedDose] = useState<number>(freezerItem.defaultDose || 1.0);
  const [schedule, setSchedule] = useState<string>(freezerItem.schedule || 'Mingguan (Weekly)');
  const [injectionTime, setInjectionTime] = useState<string>('08:00');

  const handleFinish = () => {
    const today = new Date().toISOString().split('T')[0];
    const newItem: ActiveInventoryItem = {
      id: `active-${Date.now()}`,
      freezerId: freezerItem.id,
      name: freezerItem.name,
      vialSizeMg: freezerItem.vialSizeMg,
      unit: freezerItem.unit,
      category: freezerItem.category,
      schedule,
      injectionDays: freezerItem.injectionDays || ['Sen'],
      bacWaterMl: bacWater,
      selectedDose,
      presetDoses: freezerItem.presetDoses,
      penClicksPerMl: freezerItem.penClicksPerMl || 100,
      reconstitutedAt: today,
      maxShelfLifeDays: 56,
      estEmptyDays: 30,
      injectionTime,
      reminderEnabled: true,
      hasCycle: false,
      cycleOnWeeks: 8,
      cycleOffWeeks: 4,
      cycleStartDate: today,
    };
    onComplete(newItem);
    setStep(1);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <FlaskConical size={18} color="#10b981" />
              <Text style={styles.headerTitle}>Pelarutan & Penyetelan Dosis</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Stepper Progress */}
          <View style={styles.stepperRow}>
            {[1, 2, 3].map((s) => (
              <View
                key={s}
                style={[
                  styles.stepSegment,
                  step >= s && styles.stepSegmentActive,
                  step === s && styles.stepSegmentCurrent,
                ]}
              />
            ))}
          </View>

          <ScrollView contentContainerStyle={styles.bodyScroll}>
            {step === 1 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepHeader}>Langkah 1: Rasio Pelarut (BAC Water)</Text>
                <Text style={styles.stepDesc}>
                  Masukkan volume Bacteriostatic Water yang akan Anda injeksikan ke dalam vial {freezerItem.name} ({freezerItem.vialSizeMg}{freezerItem.unit}).
                </Text>

                <View style={styles.cardBox}>
                  <Text style={styles.fieldLabel}>Volume BAC Water (mL):</Text>
                  <TextInput
                    style={styles.inputField}
                    keyboardType="numeric"
                    value={bacWater.toString()}
                    onChangeText={(v) => setBacWater(parseFloat(v) || 1.0)}
                  />
                  <Text style={styles.calcSubtext}>
                    Konsentrasi Akhir: {((freezerItem.vialSizeMg / (bacWater || 1))).toFixed(2)} {freezerItem.unit}/mL
                  </Text>
                </View>
              </View>
            )}

            {step === 2 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepHeader}>Langkah 2: Dosis Awal & Jadwal</Text>
                <Text style={styles.stepDesc}>Tentukan takaran suntik per sesi dan jadwal injeksi rutin Anda.</Text>

                <View style={styles.cardBox}>
                  <Text style={styles.fieldLabel}>Target Dosis ({freezerItem.unit}):</Text>
                  <TextInput
                    style={styles.inputField}
                    keyboardType="numeric"
                    value={selectedDose.toString()}
                    onChangeText={(v) => setSelectedDose(parseFloat(v) || 0)}
                  />

                  <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Jam Penyuntikan Rutin:</Text>
                  <TextInput
                    style={styles.inputField}
                    value={injectionTime}
                    onChangeText={setInjectionTime}
                    placeholder="08:00"
                  />
                </View>
              </View>
            )}

            {step === 3 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepHeader}>Langkah 3: Panduan & Tips Klinis Pelarutan</Text>
                <View style={styles.tipsBox}>
                  <View style={styles.tipRow}>
                    <Info size={16} color="#06b6d4" />
                    <Text style={styles.tipText}>
                      Alirkan air BAC perlahan menuruni dinding kaca vial, jangan semprotkan langsung ke bubuk.
                    </Text>
                  </View>
                  <View style={styles.tipRow}>
                    <ShieldAlert size={16} color="#f59e0b" />
                    <Text style={styles.tipText}>
                      Putar melingkar secara perlahan (gentle swirl). Jangan mengocok vial agar rantai peptida tidak rusak.
                    </Text>
                  </View>
                  <View style={styles.tipRow}>
                    <Check size={16} color="#10b981" />
                    <Text style={styles.tipText}>
                      Simpan segera di kulkas suhu 2°C - 8°C dan jauhkan dari paparan sinar lampu langsung.
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Navigation Buttons */}
          <View style={styles.footerRow}>
            {step > 1 && (
              <TouchableOpacity onPress={() => setStep((s) => (s - 1) as any)} style={styles.prevBtn}>
                <Text style={styles.prevBtnText}>Kembali</Text>
              </TouchableOpacity>
            )}
            {step < 3 ? (
              <TouchableOpacity onPress={() => setStep((s) => (s + 1) as any)} style={styles.nextBtn}>
                <Text style={styles.nextBtnText}>Lanjut</Text>
                <ChevronRight size={16} color="#022c22" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleFinish} style={styles.finishBtn}>
                <Check size={16} color="#022c22" />
                <Text style={styles.finishBtnText}>Pindahkan ke Kulkas</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  container: { backgroundColor: '#0b0f19', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: '#1e293b', maxHeight: '85%', padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, borderColor: '#1e293b' },
  headerTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 14, fontWeight: '800', color: '#ffffff' },
  stepperRow: { flexDirection: 'row', gap: 6, marginVertical: 12 },
  stepSegment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#1e293b' },
  stepSegmentActive: { backgroundColor: '#06b6d4' },
  stepSegmentCurrent: { backgroundColor: '#10b981' },
  bodyScroll: { paddingVertical: 8, gap: 12 },
  stepContent: { gap: 8 },
  stepHeader: { fontSize: 13, fontWeight: '800', color: '#ffffff' },
  stepDesc: { fontSize: 11, color: '#94a3b8', lineHeight: 16 },
  cardBox: { backgroundColor: '#0f172a', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#1e293b', marginTop: 4 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', marginBottom: 6 },
  inputField: { backgroundColor: '#090d16', borderRadius: 8, borderWidth: 1, borderColor: '#334155', color: '#ffffff', fontSize: 14, fontWeight: '700', padding: 8, textAlign: 'center', fontFamily: 'Courier' },
  calcSubtext: { fontSize: 10, color: '#34d399', fontWeight: '700', marginTop: 8, textAlign: 'center' },
  tipsBox: { gap: 8, marginTop: 4 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#0f172a', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#1e293b' },
  tipText: { flex: 1, fontSize: 11, color: '#cbd5e1', lineHeight: 16 },
  footerRow: { flexDirection: 'row', gap: 8, paddingTop: 12, borderTopWidth: 1, borderColor: '#1e293b' },
  prevBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#1e293b', alignItems: 'center' },
  prevBtnText: { color: '#94a3b8', fontWeight: '700', fontSize: 12 },
  nextBtn: { flex: 2, paddingVertical: 12, borderRadius: 12, backgroundColor: '#10b981', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 },
  nextBtnText: { color: '#022c22', fontWeight: '800', fontSize: 12 },
  finishBtn: { flex: 2, paddingVertical: 12, borderRadius: 12, backgroundColor: '#10b981', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  finishBtnText: { color: '#022c22', fontWeight: '800', fontSize: 12 },
});
