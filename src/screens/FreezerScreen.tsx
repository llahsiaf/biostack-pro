import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import {
  Snowflake,
  Plus,
  Minus,
  Trash2,
  Search,
  X,
  Check,
  FlaskConical,
  ChevronRight,
  Info,
} from 'lucide-react-native';
import { useBioStackStore } from '../store/useBioStackStore';

export const FreezerScreen: React.FC = () => {
  const {
    freezerStock,
    addFreezerItem,
    removeFreezerItem,
    updateFreezerQuantity,
    reconstituteToFridge,
  } = useBioStackStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReconstituteModalOpen, setIsReconstituteModalOpen] = useState(false);
  const [selectedPeptide, setSelectedPeptide] = useState<any>(null);

  // Form State Tambah Peptida Baru
  const [newName, setNewName] = useState('');
  const [newVialSize, setNewVialSize] = useState('10');
  const [newUnit, setNewUnit] = useState<'mg' | 'mcg' | 'mL'>('mg');
  const [newStock, setNewStock] = useState('10');
  const [newTargetDose, setNewTargetDose] = useState('1.0');
  const [newCategory, setNewCategory] = useState('Biohacking Protocol');

  // Form State Reconstitute (Pelarutan)
  const [bacWaterInput, setBacWaterInput] = useState('2');

  const filteredStock = freezerStock.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalVials = freezerStock.reduce((acc, curr) => acc + curr.quantity, 0);

  const handleSaveNewPeptide = () => {
    if (!newName.trim()) {
      Alert.alert('Peringatan', 'Nama peptida wajib diisi.');
      return;
    }

    const vialSize = parseFloat(newVialSize) || 10;
    const stockQty = parseInt(newStock, 10) || 1;
    const targetDose = parseFloat(newTargetDose) || 1.0;

    addFreezerItem({
      id: `pep-${Date.now()}`,
      name: newName.trim(),
      category: newCategory.trim() || 'General Protocol',
      vialSize,
      unit: newUnit,
      quantity: stockQty,
      defaultBacWater: 2.0,
      targetDose,
      frequency: 'weekly',
      frequencyLabel: 'Mingguan (Weekly)',
      halfLifeDays: 5.0,
      maxFridgeDays: 28,
      activeDays: ['Sen'],
      injectionTime: '08:00',
    });

    setNewName('');
    setNewVialSize('10');
    setNewStock('10');
    setNewTargetDose('1.0');
    setIsAddModalOpen(false);
  };

  const handleOpenReconstitute = (peptide: any) => {
    setSelectedPeptide(peptide);
    setBacWaterInput(peptide.defaultBacWater ? peptide.defaultBacWater.toString() : '2');
    setIsReconstituteModalOpen(true);
  };

  const handleConfirmReconstitute = () => {
    if (!selectedPeptide) return;
    const bacWater = parseFloat(bacWaterInput) || 2.0;

    reconstituteToFridge(selectedPeptide.id, bacWater);
    setIsReconstituteModalOpen(false);
    setSelectedPeptide(null);
    Alert.alert('Sukses', `${selectedPeptide.name} berhasil dilarutkan dan dipindahkan ke Kulkas Aktif.`);
  };

  return (
    <View style={styles.container}>
      {/* Banner Ringkasan Freezer */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryIconBox}>
          <Snowflake size={22} color="#10b981" />
        </View>
        <View style={styles.summaryContent}>
          <Text style={styles.summaryTitle}>Freezer Lyophilized Stock</Text>
          <Text style={styles.summarySubtitle}>
            {freezerStock.length} Senyawa • {totalVials} Vial Padat Terkunci
          </Text>
        </View>
      </View>

      {/* Tombol Tambah Peptida Baru */}
      <TouchableOpacity
        style={styles.addMainBtn}
        onPress={() => setIsAddModalOpen(true)}
      >
        <Plus size={18} color="#022c22" />
        <Text style={styles.addMainBtnText}>Tambah Peptida Baru</Text>
      </TouchableOpacity>

      {/* Bar Pencarian */}
      <View style={styles.searchBar}>
        <Search size={16} color="#64748b" />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari peptida dalam freezer..."
          placeholderTextColor="#475569"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={16} color="#64748b" />
          </TouchableOpacity>
        )}
      </View>

      {/* Daftar Peptida di Freezer */}
      <FlatList
        data={filteredStock}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.peptideCard}>
            <View style={styles.cardHeader}>
              <View style={styles.nameRow}>
                <Text style={styles.peptideName}>{item.name}</Text>
                <View style={styles.sizeBadge}>
                  <Text style={styles.sizeBadgeText}>
                    {item.vialSize} {item.unit}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    'Hapus Peptida',
                    `Apakah Anda yakin ingin menghapus ${item.name} dari freezer?`,
                    [
                      { text: 'Batal', style: 'cancel' },
                      { text: 'Hapus', style: 'destructive', onPress: () => removeFreezerItem(item.id) },
                    ]
                  );
                }}
                style={styles.deleteBtn}
              >
                <Trash2 size={16} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.peptideCategory}>{item.category}</Text>

            <View style={styles.cardActions}>
              {/* Stepper Jumlah Vial */}
              <View style={styles.stepperContainer}>
                <TouchableOpacity
                  onPress={() => updateFreezerQuantity(item.id, Math.max(0, item.quantity - 1))}
                  style={styles.stepBtn}
                >
                  <Minus size={14} color="#94a3b8" />
                </TouchableOpacity>
                <Text style={styles.stepQty}>
                  {item.quantity} <Text style={styles.stepUnit}>Vial</Text>
                </Text>
                <TouchableOpacity
                  onPress={() => updateFreezerQuantity(item.id, item.quantity + 1)}
                  style={styles.stepBtn}
                >
                  <Plus size={14} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              {/* Tombol Larutkan ke Kulkas */}
              <TouchableOpacity
                disabled={item.quantity <= 0}
                onPress={() => handleOpenReconstitute(item)}
                style={[styles.reconstituteBtn, item.quantity <= 0 && styles.reconstituteBtnDisabled]}
              >
                <FlaskConical size={14} color={item.quantity > 0 ? '#022c22' : '#64748b'} />
                <Text
                  style={[
                    styles.reconstituteBtnText,
                    item.quantity <= 0 && styles.reconstituteBtnTextDisabled,
                  ]}
                >
                  Larutkan ke Kulkas
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Modal Tambah Peptida Baru (Keyboard Adaptive) */}
      <Modal visible={isAddModalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tambah Stok Peptida Freezer</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalScrollBody}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.inputLabel}>NAMA PEPTIDA / SENYAWA</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Contoh: Epithalon, Thymosin Alpha-1"
                placeholderTextColor="#475569"
                value={newName}
                onChangeText={setNewName}
              />

              <View style={styles.twoColumnRow}>
                <View style={styles.colHalf}>
                  <Text style={styles.inputLabel}>UKURAN VIAL</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    placeholder="10"
                    placeholderTextColor="#475569"
                    value={newVialSize}
                    onChangeText={setNewVialSize}
                  />
                </View>
                <View style={styles.colHalf}>
                  <Text style={styles.inputLabel}>SATUAN</Text>
                  <View style={styles.unitSelector}>
                    {(['mg', 'mcg', 'mL'] as const).map((unit) => (
                      <TouchableOpacity
                        key={unit}
                        onPress={() => setNewUnit(unit)}
                        style={[styles.unitBtn, newUnit === unit && styles.unitBtnActive]}
                      >
                        <Text style={[styles.unitBtnText, newUnit === unit && styles.unitBtnTextActive]}>
                          {unit}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.twoColumnRow}>
                <View style={styles.colHalf}>
                  <Text style={styles.inputLabel}>JUMLAH STOK VIAL</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    placeholder="10"
                    placeholderTextColor="#475569"
                    value={newStock}
                    onChangeText={setNewStock}
                  />
                </View>
                <View style={styles.colHalf}>
                  <Text style={styles.inputLabel}>TARGET DOSIS AWAL</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    placeholder="1.0"
                    placeholderTextColor="#475569"
                    value={newTargetDose}
                    onChangeText={setNewTargetDose}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>KATEGORI PROTOKOL</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Biohacking Protocol"
                placeholderTextColor="#475569"
                value={newCategory}
                onChangeText={setNewCategory}
              />

              <TouchableOpacity onPress={handleSaveNewPeptide} style={styles.submitModalBtn}>
                <Check size={18} color="#022c22" />
                <Text style={styles.submitModalBtnText}>Simpan ke Stok Freezer</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Pelarutan BAC Water (Keyboard Adaptive) */}
      <Modal visible={isReconstituteModalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.headerWithIcon}>
                <FlaskConical size={18} color="#10b981" />
                <Text style={styles.modalTitle}>Pelarutan & Penyetelan Dosis</Text>
              </View>
              <TouchableOpacity onPress={() => setIsReconstituteModalOpen(false)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalScrollBody}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.stepIndicator}>Langkah 1: Rasio Pelarut (BAC Water)</Text>
              <Text style={styles.stepDescription}>
                Masukkan volume Bacteriostatic Water yang akan Anda injeksikan ke dalam vial{' '}
                {selectedPeptide?.name} ({selectedPeptide?.vialSize} {selectedPeptide?.unit}).
              </Text>

              <View style={styles.bacInputCard}>
                <Text style={styles.bacCardLabel}>Volume BAC Water (mL):</Text>
                <TextInput
                  style={styles.bacTextInput}
                  keyboardType="numeric"
                  value={bacWaterInput}
                  onChangeText={setBacWaterInput}
                  placeholder="2"
                  placeholderTextColor="#475569"
                />
                <Text style={styles.concentrationText}>
                  Konsentrasi Akhir:{' '}
                  {(
                    (selectedPeptide?.vialSize || 0) / (parseFloat(bacWaterInput) || 1)
                  ).toFixed(2)}{' '}
                  {selectedPeptide?.unit}/mL
                </Text>
              </View>

              <TouchableOpacity onPress={handleConfirmReconstitute} style={styles.submitModalBtn}>
                <Text style={styles.submitModalBtnText}>Lanjut & Pindahkan ke Kulkas</Text>
                <ChevronRight size={18} color="#022c22" />
              </TouchableOpacity>
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
    paddingTop: 12,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#090d16',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 12,
  },
  summaryIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryContent: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  summarySubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  addMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 12,
    marginVertical: 10,
  },
  addMainBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#022c22',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 12,
    padding: 0,
  },
  listContainer: {
    paddingBottom: 80,
    gap: 10,
  },
  peptideCard: {
    backgroundColor: '#090d16',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  peptideName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  sizeBadge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sizeBadgeText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '700',
  },
  deleteBtn: {
    padding: 4,
  },
  peptideCategory: {
    fontSize: 11,
    color: '#64748b',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: 10,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#030712',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 2,
  },
  stepBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  stepQty: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
    minWidth: 46,
    textAlign: 'center',
  },
  stepUnit: {
    fontSize: 10,
    fontWeight: '400',
    color: '#64748b',
  },
  reconstituteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingVertical: 9,
    borderRadius: 10,
  },
  reconstituteBtnDisabled: {
    backgroundColor: '#1e293b',
  },
  reconstituteBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#022c22',
  },
  reconstituteBtnTextDisabled: {
    color: '#64748b',
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
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#1e293b',
  },
  headerWithIcon: {
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
    gap: 12,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  modalInput: {
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 12,
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  colHalf: {
    flex: 1,
    gap: 4,
  },
  unitSelector: {
    flexDirection: 'row',
    backgroundColor: '#030712',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    overflow: 'hidden',
  },
  unitBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  unitBtnActive: {
    backgroundColor: '#10b981',
  },
  unitBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  unitBtnTextActive: {
    color: '#022c22',
  },
  submitModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 6,
  },
  submitModalBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#022c22',
  },
  stepIndicator: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  stepDescription: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
  },
  bacInputCard: {
    backgroundColor: '#030712',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
    gap: 8,
  },
  bacCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  bacTextInput: {
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    padding: 10,
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  concentrationText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
    textAlign: 'center',
    marginTop: 2,
  },
});
