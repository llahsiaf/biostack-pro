import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Modal,
  ScrollView,
} from 'react-native';
import {
  FlaskConical,
  Target,
  History as HistoryIcon,
  Snowflake,
  Syringe,
  Bell,
  AlertTriangle,
  X,
  CheckCircle2,
} from 'lucide-react-native';
import { useBioStackStore } from './src/store/useBioStackStore';
import { InventoryScreen } from './src/screens/InventoryScreen';
import { RotationScreen } from './src/screens/RotationScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { FreezerScreen } from './src/screens/FreezerScreen';
import { FloatingAIChat } from './src/components/FloatingAIChat';

export default function App() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'rotation' | 'history' | 'freezer'>('inventory');
  const [isHypoModalOpen, setIsHypoModalOpen] = useState(false);
  const { isLoaded, loadStorageData } = useBioStackStore();

  useEffect(() => {
    loadStorageData();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#030712" />

      {/* Top Main App Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.brandIconWrap}>
            <Syringe size={18} color="#10b981" />
          </View>
          <View>
            <View style={styles.titleWithBadge}>
              <Text style={styles.brandName}>BioStack</Text>
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            </View>
            <Text style={styles.brandSubtitle}>Peptide Protocol & Pharmacokinetics</Text>
          </View>
        </View>

        {/* Top Right Quick Alert / Hypo Buttons */}
        <View style={styles.topActions}>
          <TouchableOpacity
            onPress={() => setIsHypoModalOpen(true)}
            style={styles.hypoBtn}
          >
            <AlertTriangle size={15} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 4-Tab Navigation Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => setActiveTab('inventory')}
          style={[styles.tabButton, activeTab === 'inventory' && styles.tabButtonActive]}
        >
          <FlaskConical
            size={16}
            color={activeTab === 'inventory' ? '#10b981' : '#64748b'}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'inventory' && styles.tabButtonTextActive,
            ]}
          >
            Inventory
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('rotation')}
          style={[styles.tabButton, activeTab === 'rotation' && styles.tabButtonActive]}
        >
          <Target
            size={16}
            color={activeTab === 'rotation' ? '#10b981' : '#64748b'}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'rotation' && styles.tabButtonTextActive,
            ]}
          >
            Rotasi
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('history')}
          style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
        >
          <HistoryIcon
            size={16}
            color={activeTab === 'history' ? '#10b981' : '#64748b'}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'history' && styles.tabButtonTextActive,
            ]}
          >
            Riwayat
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('freezer')}
          style={[styles.tabButton, activeTab === 'freezer' && styles.tabButtonActive]}
        >
          <Snowflake
            size={16}
            color={activeTab === 'freezer' ? '#10b981' : '#64748b'}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'freezer' && styles.tabButtonTextActive,
            ]}
          >
            Freezer
          </Text>
        </TouchableOpacity>
      </View>

      {/* Screen Body View */}
      <View style={styles.screenContainer}>
        {activeTab === 'inventory' && (
          <InventoryScreen
            onNavigateToFreezer={() => setActiveTab('freezer')}
            onNavigateToRotation={() => setActiveTab('rotation')}
          />
        )}
        {activeTab === 'rotation' && <RotationScreen />}
        {activeTab === 'history' && <HistoryScreen />}
        {activeTab === 'freezer' && <FreezerScreen />}
      </View>

      {/* Floating Action Button AI Consultation */}
      <FloatingAIChat />

      {/* Hypo Protocol Emergency Sheet */}
      <Modal visible={isHypoModalOpen} animationType="fade" transparent>
        <View style={styles.emergencyBackdrop}>
          <View style={styles.emergencyCard}>
            <View style={styles.emergencyHeader}>
              <View style={styles.emergencyTitleRow}>
                <AlertTriangle size={18} color="#ef4444" />
                <Text style={styles.emergencyTitle}>Protokol Hipoglikemia</Text>
              </View>
              <TouchableOpacity onPress={() => setIsHypoModalOpen(false)}>
                <X size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.emergencyScroll}>
              <Text style={styles.emergencyWarning}>
                Jika mengalami gejala gemetar, pusing, keringat dingin pasca injeksi GLP-1/GIP:
              </Text>

              <View style={styles.stepBox}>
                <Text style={styles.stepNum}>1</Text>
                <Text style={styles.stepTxt}>
                  Konsumsi 15-20 gram karbohidrat cepat serap (contoh: 1/2 gelas jus buah atau 3 sendok teh madu).
                </Text>
              </View>

              <View style={styles.stepBox}>
                <Text style={styles.stepNum}>2</Text>
                <Text style={styles.stepTxt}>
                  Istirahat dan tunggu 15 menit, lalu ukur kadar gula darah jika tersedia glukometer.
                </Text>
              </View>

              <View style={styles.stepBox}>
                <Text style={styles.stepNum}>3</Text>
                <Text style={styles.stepTxt}>
                  Jika gejala belum membaik, ulangi 15 gram karbohidrat. Hubungi kontak darurat jika gejala menetap.
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              onPress={() => setIsHypoModalOpen(false)}
              style={styles.emergencyCloseBtn}
            >
              <CheckCircle2 size={16} color="#ffffff" />
              <Text style={styles.emergencyCloseText}>Saya Mengerti</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#030712',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: '#030712',
    borderBottomWidth: 1,
    borderColor: '#0f172a',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  proBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  proBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#022c22',
  },
  brandSubtitle: {
    fontSize: 10,
    color: '#64748b',
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hypoBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#090d16',
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  tabButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  tabButtonTextActive: {
    color: '#10b981',
  },
  screenContainer: {
    flex: 1,
  },
  emergencyBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emergencyCard: {
    backgroundColor: '#0b0f19',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ef4444',
    padding: 16,
    width: '100%',
    maxHeight: '75%',
    gap: 12,
  },
  emergencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: '#1e293b',
  },
  emergencyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emergencyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ef4444',
  },
  emergencyScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  emergencyWarning: {
    fontSize: 11,
    color: '#cbd5e1',
    lineHeight: 16,
  },
  stepBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  stepNum: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    width: 20,
    height: 20,
    borderRadius: 10,
    textAlign: 'center',
    lineHeight: 20,
  },
  stepTxt: {
    flex: 1,
    fontSize: 11,
    color: '#cbd5e1',
    lineHeight: 16,
  },
  emergencyCloseBtn: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emergencyCloseText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
});
