import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import {
  Snowflake,
  Plus,
  Minus,
  FlaskConical,
  Layers,
  Search,
  PlusCircle,
  Trash2,
  X,
  Check,
} from 'lucide-react-native';
import { useBioStackStore } from '../store/useBioStackStore';
import { FreezerStockItem } from '../types';
import { ReconstituteWizard } from '../components/ReconstituteWizard';

export const FreezerScreen: React.FC = () => {
  const {
    freezerItems,
    updateFreezerStock,
    addFreezerItem,
    removeFreezerItem,
    addActiveItem,
  } = useBioStackStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemForRecon, setSelectedItemForRecon] = useState<FreezerStockItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State Tambah Peptida Baru ke Freezer
  const [newName, setNewName] = useState('');
  const [newSize, setNewSize] = useState('10');
  const [newUnit, setNewUnit] = useState<'mg' | 'mcg' | 'mL'>('mg');
  const [newCategory, setNewCategory] = useState('Biohacking Protocol');
  const [newStock, setNewStock] = useState('10');
  const [newDefaultDose, setNewDefaultDose] = useState('1.0');

  const totalVials = freezerItems.reduce((sum, item) => sum + item.freezerStock, 0);

  const filteredItems = freezerItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreatePeptide = () => {
    if (!newName.trim()) {
      Alert.alert('Data Kurang', 'Silakan masukkan nama peptida.');
      return;
    }

    const newItem: FreezerStockItem = {
      id: `freezer-custom-${Date.now()}`,
      name: newName.trim(),
      vialSizeMg: parseFloat(newSize) || 10,
      unit: newUnit,
      category: newCategory,
      freezerStock: parseInt(newStock, 10) || 1,
      bacWaterMl: newUnit === 'mL' ? 0 : 2.0,
      defaultDose: parseFloat(newDefaultDose) || 1.0,
      presetDoses: {
        low: (parseFloat(newDefaultDose) || 1.0) * 0.5,
        standard: parseFloat(newDefaultDose) || 1.0,
        high: (parseFloat(newDefaultDose) || 1.0) * 2.0,
      },
      schedule: 'Mingguan (Weekly)',
      injectionDays: ['Sen'],
      penClicksPerMl: 100,
      halfLifeHours: 24,
    };

    addFreezerItem(newItem);
    setIsAddModalOpen(false);
    setNewName('');
    Alert.alert('Sukses', `${newItem.name} berhasil ditambahkan ke stok freezer.`);
  };

  const handleConfirmDelete = (id: string, name: string) => {
    Alert.alert(
      'Hapus Peptida Freezer',
      `Hapus data stok ${name} secara permanen?`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: () => removeFreezerItem(id) },
      ]
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
        {/* Header Stats Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.headerIconWrap}>
              <Snowflake size={18} color="#10b981" />
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>Freezer Lyophilized Stock</Text>
              <Text style={styles.headerSubtitle}>
                {freezerItems.length} Senyawa • {totalVials} Vial Padat Terkunci
              </Text>
            </View>
          </View>

          <TouchableOpacity onPress={() => setIsAddModalOpen(true)} style={styles.addPeptideBtn}>
            <PlusCircle size={14} color="#022c22" />
            <Text style={styles.addPeptideBtnText}>Tambah Senyawa Baru</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={14} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari peptida dalam freezer..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Freezer Peptide Stock List */}
        {filteredItems.map((item) => (
          <View key={item.id} style={styles.stockCard}>
            <View style={styles.stockCardTop}>
              <View style={styles.titleInfo}>
                <Text style={styles.peptideName}>{item.name}</Text>
                <View style={styles.badgePill}>
                  <Text style={styles.badgePillText}>
                    {item.vialSizeMg} {item.unit}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => handleConfirmDelete(item.id, item.name)}
                style={styles.trashBtn}
              >
                <Trash2 size={13} color="#475569" />
              </TouchableOpacity>
            </View>

            <Text style={styles.categoryLabel}>{item.category}</Text>

            {/* Counter & Action Row */}
            <View style={styles.counterRow}>
              <View style={styles.stepperWrap}>
                <TouchableOpacity
                  onPress={() => updateFreezerStock(item.id, -1)}
                  style={styles.stepBtn}
                >
                  <Minus size={13} color="#94a3b8" />
                </TouchableOpacity>

                <View style={styles.stockValueWrap}>
                  <Text style={styles.stockValue}>{item.freezerStock}</Text>
                  <Text style={styles.stockUnit}>Vial</Text>
                </View>

                <TouchableOpacity
                  onPress={() => updateFreezerStock(item.id, 1)}
                  style={styles.stepBtn}
                >
                  <Plus size={13} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              {/* Reconstitute & Transfer to Fridge Button */}
              <TouchableOpacity
                disabled={item.freezerStock <= 0}
                onPress={() => setSelectedItemForRecon(item)}
                style={[styles.reconBtn, item.freezerStock <= 0 && styles.reconBtnDisabled]}
              >
                <FlaskConical size={13} color={item.freezerStock > 0 ? '#022c22' : '#64748b'} />
                <Text
                  style={[
                    styles.reconBtnText,
                    item.freezerStock <= 0 && styles.reconBtnTextDisabled,
                  ]}
                >
                  Larutkan ke Kulkas
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Modal Tambah Peptida Manual */}
      <Modal visible={isAddModalOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tambah Stok Peptida Freezer</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <X size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formScroll}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Nama Peptida / Senyawa</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Contoh: Epithalon, Thymosin Alpha-1"
                  placeholderTextColor="#475569"
                  value={newName}
                  onChangeText={setNewName}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Ukuran Vial</Text>
                  <TextInput
                    style={styles.formInput}
                    keyboardType="numeric"
                    value={newSize}
                    onChangeText={setNewSize}
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Satuan</Text>
                  <View style={styles.unitSelector}>
                    {(['mg', 'mcg', 'mL'] as const).map((u) => (
                      <TouchableOpacity
                        key={u}
                        onPress={() => setNewUnit(u)}
                        style={[styles.unitBtn, newUnit === u && styles.unitBtnActive]}
                      >
                        <Text style={[styles.unitBtnText, newUnit === u && styles.unitBtnTextActive]}>
                          {u}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Jumlah Stok Vial</Text>
                  <TextInput
                    style={styles.formInput}
                    keyboardType="numeric"
                    value={newStock}
                    onChangeText={setNewStock}
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Target Dosis Awal</Text>
                  <TextInput
                    style={styles.formInput}
                    keyboardType="numeric"
                    value={newDefaultDose}
                    onChangeText={setNewDefaultDose}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Kategori Protokol</Text>
                <TextInput
                  style={styles.formInput}
                  value={newCategory}
                  onChangeText={setNewCategory}
                />
              </View>
            </ScrollView>

            <TouchableOpacity onPress={handleCreatePeptide} style={styles.savePeptideBtn}>
              <Check size={16} color="#022c22" />
              <Text style={styles.savePeptideBtnText}>Simpan ke Stok Freezer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Wizard Reconstitute Modal */}
      <ReconstituteWizard
        visible={!!selectedItemForRecon}
        freezerItem={selectedItemForRecon}
        onClose={() => setSelectedItemForRecon(null)}
        onComplete={(newItem) => {
          if (selectedItemForRecon) {
            updateFreezerStock(selectedItemForRecon.id, -1);
          }
          addActiveItem(newItem);
          Alert.alert('Sukses', `${newItem.name} berhasil dilarutkan dan dipindahkan ke kulkas aktif.`);
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
  headerIconWrap: {
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
  addPeptideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingVertical: 9,
    borderRadius: 10,
  },
  addPeptideBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#022c22',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#090d16',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 12,
    paddingVertical: 9,
  },
  stockCard: {
    backgroundColor: '#090d16',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 8,
  },
  stockCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  peptideName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  badgePill: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    fontFamily: 'Courier',
  },
  trashBtn: {
    padding: 4,
  },
  categoryLabel: {
    fontSize: 10,
    color: '#64748b',
    marginTop: -4,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 6,
    paddingHorizontal: 8,
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockValueWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    minWidth: 42,
    justifyContent: 'center',
  },
  stockValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    fontFamily: 'Courier',
  },
  stockUnit: {
    fontSize: 9,
    color: '#64748b',
  },
  reconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  reconBtnDisabled: {
    backgroundColor: '#1e293b',
  },
  reconBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#022c22',
  },
  reconBtnTextDisabled: {
    color: '#64748b',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0b0f19',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    maxHeight: '85%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#1e293b',
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  formScroll: {
    paddingVertical: 12,
    gap: 10,
  },
  formGroup: {
    gap: 4,
  },
  formRow: {
    flexDirection: 'row',
    gap: 8,
  },
  formLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  formInput: {
    backgroundColor: '#090d16',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    color: '#ffffff',
    fontSize: 12,
    padding: 8,
  },
  unitSelector: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: '#090d16',
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  unitBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
  },
  unitBtnActive: {
    backgroundColor: '#10b981',
  },
  unitBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  unitBtnTextActive: {
    color: '#022c22',
  },
  savePeptideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 11,
    marginTop: 6,
  },
  savePeptideBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#022c22',
  },
});
