import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  Snowflake,
  Plus,
  Search,
  Trash2,
  FlaskConical,
  X,
  Droplets,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react-native';
import { useBioStackStore, FreezerItem } from '../store/useBioStackStore';

export const FreezerScreen: React.FC = () => {
  const {
    freezerStock,
    updateFreezerQuantity,
    removeFreezerItem,
    addFreezerItem,
    reconstituteToFridge,
    transferLiquidToFridge,
  } = useBioStackStore();

  const [searchQuery, setSearchQuery] = useState('');
  
  // State Modal Tambah Peptida Baru
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Tissue Repair & Recovery');
  const [newVialSize, setNewVialSize] = useState('10');
  const [newUnit, setNewUnit] = useState<'mg' | 'mcg' | 'mL'>('mg');
  const [newQuantity, setNewQuantity] = useState('5');
  const [newDefaultBac, setNewDefaultBac] = useState('2.0');
  const [newTargetDose, setNewTargetDose] = useState('2.0');
  const [newFrequency, setNewFrequency] = useState('weekly');
  const [newFrequencyLabel, setNewFrequencyLabel] = useState('Mingguan (Weekly)');
  const [newHalfLife, setNewHalfLife] = useState('7');
  const [newMaxFridgeDays, setNewMaxFridgeDays] = useState('56');

  // State Modal Pelarutan (Reconstitute)
  const [selectedFreezerItem, setSelectedFreezerItem] = useState<FreezerItem | null>(null);
  const [isReconstituteModalOpen, setIsReconstituteModalOpen] = useState(false);
  const [bacWaterInput, setBacWaterInput] = useState('2.0');

  const stockList = freezerStock || [];
  const totalVials = stockList.reduce((acc, curr) => acc + (curr.quantity || 0), 0);

  const filteredStock = stockList.filter((item) =>
    item?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item?.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleActionOnItem = (item: FreezerItem) => {
    if (item.quantity <= 0) {
      Alert.alert('Stok Habis', `Stok ${item.name} di freezer sudah 0. Tambah stok terlebih dahulu.`);
      return;
    }

    // Bypass pelarutan jika berstatus cairan mL
    if (item.unit === 'mL') {
      Alert.alert(
        'Pindahkan ke Kulkas',
        `${item.name} adalah senyawa cairan siap pakai (${item.vialSize} mL). Pindahkan 1 vial langsung ke kulkas aktif tanpa pelarutan BAC Water?`,
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Pindahkan',
            onPress: () => {
              transferLiquidToFridge(item.id);
              Alert.alert('Berhasil', `${item.name} berhasil dipindahkan ke kulkas aktif.`);
            },
          },
        ]
      );
      return;
    }

    // Peptida bubuk / lyophilized (mg / mcg) -> Buka modal pelarutan
    setSelectedFreezerItem(item);
    setBacWaterInput((item.defaultBacWater || 2.0).toString());
    setIsReconstituteModalOpen(true);
  };

  const handleConfirmReconstitute = () => {
    if (!selectedFreezerItem) return;
    const bac = parseFloat(bacWaterInput) || 2.0;

    reconstituteToFridge(selectedFreezerItem.id, bac);
    setIsReconstituteModalOpen(false);
    Alert.alert(
      'Pelarutan Selesai',
      `1 vial ${selectedFreezerItem.name} berhasil dilarutkan dengan ${bac} mL BAC Water dan dimasukkan ke kulkas aktif.`
    );
  };

  const handleAddNewPeptide = () => {
    if (!newName.trim()) {
      Alert.alert('Peringatan', 'Harap masukkan nama peptida.');
      return;
    }

    const newItem: FreezerItem = {
      id: `pep-${Date.now()}`,
      name: newName.trim(),
      category: newCategory.trim() || 'General Peptide',
      vialSize: parseFloat(newVialSize) || 10,
      unit: newUnit,
      quantity: parseInt(newQuantity, 10) || 1,
      defaultBacWater: newUnit === 'mL' ? 0 : parseFloat(newDefaultBac) || 2.0,
      targetDose: parseFloat(newTargetDose) || 1.0,
      frequency: newFrequency,
      frequencyLabel: newFrequencyLabel,
      halfLifeDays: parseFloat(newHalfLife) || 7,
      maxFridgeDays: parseInt(newMaxFridgeDays, 10) || 56,
      activeDays: ['Sen'],
      injectionTime: '08:00',
    };

    addFreezerItem(newItem);
    setIsAddModalOpen(false);

    // Reset Form
    setNewName('');
    setNewVialSize('10');
    setNewQuantity('5');
    Alert.alert('Sukses', `${newItem.name} berhasil ditambahkan ke Freezer.`);
  };

  return (
    <View style={styles.container}>
      {/* Banner Ringkasan Freezer */}
      <View style={styles.bannerCard}>
        <View style={styles.bannerIconBox}>
          <Snowflake size={20} color="#38bdf8" />
        </View>
        <View style={styles.bannerContent}>
          <Text style={styles.bannerTitle}>Freezer Lyophilized Stock</Text>
          <Text style={styles.bannerSubtitle}>
            {stockList.length} Senyawa • {totalVials} Vial Padat Terkunci
          </Text>
        </View>
      </View>

      {/* Tombol Tambah Peptida Baru */}
      <TouchableOpacity onPress={() => setIsAddModalOpen(true)} style={styles.addMainBtn}>
        <Plus size={16} color="#022c22" />
        <Text style={styles.addMainBtnText}>Tambah Peptida Baru</Text>
      </TouchableOpacity>

      {/* Kolom Pencarian */}
      <View style={styles.searchBar}>
        <Search size={16} color="#64748b" />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari peptida dalam freezer..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={16} color="#64748b" />
          </TouchableOpacity>
        )}
      </View>

      {/* Daftar Stok Peptida Freezer */}
      <FlatList
        data={filteredStock}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Snowflake size={32} color="#64748b" />
            <Text style={styles.emptyTitle}>Tidak Ditemukan Peptida</Text>
            <Text style={styles.emptySub}>Tidak ada stok freezer yang cocok dengan pencarian.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isLiquid = item.unit === 'mL';

          return (
            <View style={styles.freezerCard}>
              <View style={styles.cardHeader}>
                <View style={styles.titleRow}>
                  <Text style={styles.peptideName}>{item.name}</Text>
                  <View style={styles.sizeBadge}>
                    <Text style={styles.sizeBadgeText}>{item.vialSize} {item.unit}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    Alert.alert('Hapus Senyawa', `Hapus ${item.name} dari freezer?`, [
                      { text: 'Batal', style: 'cancel' },
                      { text: 'Hapus', style: 'destructive', onPress: () => removeFreezerItem(item.id) },
                    ]);
                  }}
                  style={styles.deleteBtn}
                >
                  <Trash2 size={16} color="#64748b" />
                </TouchableOpacity>
              </View>

              <Text style={styles.categoryText}>{item.category}</Text>

              {/* Baris Kontrol Stok & Tombol Aksi */}
              <View style={styles.actionRow}>
                <View style={styles.qtyControl}>
                  <TouchableOpacity
                    onPress={() => updateFreezerQuantity(item.id, Math.max(0, item.quantity - 1))}
                    style={styles.qtyBtn}
                  >
                    <Text style={styles.qtyBtnText}>-</Text>
                  </TouchableOpacity>

                  <Text style={styles.qtyValueText}>{item.quantity} <Text style={styles.qtyUnitText}>Vial</Text></Text>

                  <TouchableOpacity
                    onPress={() => updateFreezerQuantity(item.id, item.quantity + 1)}
                    style={styles.qtyBtn}
                  >
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>

                {/* Tombol Khusus Satuan mL (Pindahkan) vs mg/mcg (Larutkan) */}
                {isLiquid ? (
                  <TouchableOpacity onPress={() => handleActionOnItem(item)} style={styles.transferActionBtn}>
                    <ArrowRight size={14} color="#022c22" />
                    <Text style={styles.reconstituteBtnText}>Pindahkan ke Kulkas</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => handleActionOnItem(item)} style={styles.reconstituteBtn}>
                    <FlaskConical size={14} color="#022c22" />
                    <Text style={styles.reconstituteBtnText}>Larutkan ke Kulkas</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
      />

      {/* Modal Pelarutan BAC Water (Hanya untuk bubuk mg/mcg) */}
      <Modal visible={isReconstituteModalOpen} animationType="fade" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <FlaskConical size={18} color="#10b981" />
                <Text style={styles.modalHeading}>Pelarutan Peptida</Text>
              </View>
              <TouchableOpacity onPress={() => setIsReconstituteModalOpen(false)}>
                <X size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {selectedFreezerItem && (
              <ScrollView contentContainerStyle={styles.reconstituteBody} keyboardShouldPersistTaps="handled">
                <Text style={styles.reconPeptideName}>
                  {selectedFreezerItem.name} ({selectedFreezerItem.vialSize} {selectedFreezerItem.unit})
                </Text>
                <Text style={styles.reconPeptideDesc}>
                  Masukkan volume Bacteriostatic (BAC) Water yang akan disuntikkan ke dalam vial bubuk.
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Volume BAC Water (mL):</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={bacWaterInput}
                    onChangeText={setBacWaterInput}
                    placeholder="Contoh: 2.0"
                    placeholderTextColor="#64748b"
                  />
                </View>

                {/* Kalkulasi Klinis Otomatis */}
                {parseFloat(bacWaterInput) > 0 && (
                  <View style={styles.reconPreviewBox}>
                    <Text style={styles.reconPreviewTitle}>Hasil Konsentrasi Larutan:</Text>
                    <Text style={styles.reconPreviewVal}>
                      {(selectedFreezerItem.vialSize / parseFloat(bacWaterInput)).toFixed(2)} {selectedFreezerItem.unit}/mL
                    </Text>
                    <Text style={styles.reconPreviewSub}>
                      Target dosis {selectedFreezerItem.targetDose} {selectedFreezerItem.unit} = {((selectedFreezerItem.targetDose / (selectedFreezerItem.vialSize / parseFloat(bacWaterInput))) * 100).toFixed(0)} IU pada spuit U-100.
                    </Text>
                  </View>
                )}

                <View style={styles.modalActionsRow}>
                  <TouchableOpacity onPress={() => setIsReconstituteModalOpen(false)} style={styles.modalCancelBtn}>
                    <Text style={styles.modalCancelBtnText}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleConfirmReconstitute} style={styles.modalSaveBtn}>
                    <Text style={styles.modalSaveBtnText}>Larutkan & Masukkan Kulkas</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Tambah Peptida Baru ke Freezer */}
      <Modal visible={isAddModalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalLargeBox}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Plus size={18} color="#10b981" />
                <Text style={styles.modalHeading}>Tambah Peptida ke Freezer</Text>
              </View>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <X size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.addModalBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nama Peptida / Senyawa:</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Contoh: Semaglutide"
                  placeholderTextColor="#64748b"
                  value={newName}
                  onChangeText={setNewName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Kategori / Deskripsi Medis:</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Contoh: GLP-1 Receptor Agonist"
                  placeholderTextColor="#64748b"
                  value={newCategory}
                  onChangeText={setNewCategory}
                />
              </View>

              {/* Satuan & Ukuran Vial */}
              <View style={styles.twoColRow}>
                <View style={styles.colBox}>
                  <Text style={styles.inputLabel}>Ukuran Vial:</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={newVialSize}
                    onChangeText={setNewVialSize}
                  />
                </View>

                <View style={styles.colBox}>
                  <Text style={styles.inputLabel}>Satuan:</Text>
                  <View style={styles.unitSelectorRow}>
                    {(['mg', 'mcg', 'mL'] as ('mg' | 'mcg' | 'mL')[]).map((u) => (
                      <TouchableOpacity
                        key={u}
                        onPress={() => setNewUnit(u)}
                        style={[styles.unitChip, newUnit === u && styles.unitChipActive]}
                      >
                        <Text style={[styles.unitChipText, newUnit === u && styles.unitChipTextActive]}>{u}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Jumlah Stok & Default BAC Water */}
              <View style={styles.twoColRow}>
                <View style={styles.colBox}>
                  <Text style={styles.inputLabel}>Jumlah Stok (Vial):</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={newQuantity}
                    onChangeText={setNewQuantity}
                  />
                </View>

                {newUnit !== 'mL' && (
                  <View style={styles.colBox}>
                    <Text style={styles.inputLabel}>Default BAC Water (mL):</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={newDefaultBac}
                      onChangeText={setNewDefaultBac}
                    />
                  </View>
                )}
              </View>

              {/* Target Dosis */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Target Dosis Default ({newUnit}):</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={newTargetDose}
                  onChangeText={setNewTargetDose}
                />
              </View>

              <View style={styles.modalActionsRow}>
                <TouchableOpacity onPress={() => setIsAddModalOpen(false)} style={styles.modalCancelBtn}>
                  <Text style={styles.modalCancelBtnText}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAddNewPeptide} style={styles.modalSaveBtn}>
                  <Text style={styles.modalSaveBtnText}>Simpan ke Freezer</Text>
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
  bannerCard: {
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
  bannerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  bannerSubtitle: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  addMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  addMainBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#022c22',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 12,
  },
  listContainer: {
    paddingBottom: 80,
    gap: 10,
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
  freezerCard: {
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  peptideName: {
    fontSize: 14,
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
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
  },
  deleteBtn: {
    padding: 4,
  },
  categoryText: {
    fontSize: 10,
    color: '#64748b',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#030712',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 8,
  },
  qtyBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  qtyBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#94a3b8',
  },
  qtyValueText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  qtyUnitText: {
    fontSize: 9,
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
    paddingVertical: 8,
    borderRadius: 8,
  },
  transferActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#38bdf8',
    paddingVertical: 8,
    borderRadius: 8,
  },
  reconstituteBtnText: {
    fontSize: 11,
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
    paddingBottom: 12,
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
  reconstituteBody: {
    paddingTop: 12,
    gap: 10,
  },
  addModalBody: {
    paddingTop: 12,
    gap: 10,
  },
  reconPeptideName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#38bdf8',
  },
  reconPeptideDesc: {
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
  unitSelectorRow: {
    flexDirection: 'row',
    gap: 4,
  },
  unitChip: {
    flex: 1,
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  unitChipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10b981',
  },
  unitChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  unitChipTextActive: {
    color: '#10b981',
  },
  reconPreviewBox: {
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 10,
    padding: 10,
    gap: 2,
  },
  reconPreviewTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10b981',
  },
  reconPreviewVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  reconPreviewSub: {
    fontSize: 9,
    color: '#64748b',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
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
  modalSaveBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#022c22',
  },
});
