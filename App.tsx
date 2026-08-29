import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Image,
  Alert,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import {
  FlaskConical,
  RotateCw,
  History,
  Snowflake,
  Bell,
} from 'lucide-react-native';

import { InventoryScreen } from './src/screens/InventoryScreen';
import { RotationScreen } from './src/screens/RotationScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { FreezerScreen } from './src/screens/FreezerScreen';
import { FloatingAIChat } from './src/components/FloatingAIChat';

// Konfigurasi handler notifikasi lokal internal
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'rotation' | 'history' | 'freezer'>('inventory');

  // Mendaftarkan Izin Notifikasi ke Sistem iOS secara otomatis saat startup
  useEffect(() => {
    async function requestNotificationPermissions() {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        if (existingStatus !== 'granted') {
          await Notifications.requestPermissionsAsync({
            ios: {
              allowAlert: true,
              allowBadge: true,
              allowSound: true,
              provideAppNotificationSettings: true,
            },
          });
        }
      } catch (error) {
        // Fallback aman untuk simulator
      }
    }

    requestNotificationPermissions();
  }, []);

  // Fungsi Pemicu Izin Manual (Tombol Lonceng)
  const handleManualNotificationRequest = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        finalStatus = status;
      }

      if (finalStatus === 'granted') {
        Alert.alert('Status Notifikasi', 'Izin notifikasi sudah AKTIF. BioStack akan mengirimkan pengingat jadwal injeksi Anda.');
      } else {
        Alert.alert(
          'Izin Ditolak', 
          'Notifikasi terblokir oleh iOS. Silakan buka Pengaturan > BioStack > izinkan Notifikasi secara manual.'
        );
      }
    } catch (error) {
      Alert.alert('Gagal', 'Sistem tidak dapat memproses permintaan izin saat ini.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#030712" />

      {/* Header Utama BioStack PRO */}
      <View style={styles.topHeader}>
        <View style={styles.headerContent}>
          <View style={styles.brandingRow}>
            {/* Memanggil icon.png dari direktori root */}
            <View style={styles.brandIconBox}>
              <Image
                source={require('./icon.png')}
                style={styles.brandIconImage}
                resizeMode="cover"
              />
            </View>
            <View>
              <View style={styles.titleWithBadge}>
                <Text style={styles.appTitle}>BioStack</Text>
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              </View>
              <Text style={styles.appSubtitle}>Peptide Protocol & Pharmacokinetics</Text>
            </View>
          </View>

          {/* Tombol Pemicu Izin Notifikasi Manual */}
          <TouchableOpacity 
            onPress={handleManualNotificationRequest} 
            style={styles.notificationBtn}
          >
            <Bell size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigasi Tab Utama */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={[styles.navTab, activeTab === 'inventory' && styles.navTabActive]}
          onPress={() => setActiveTab('inventory')}
        >
          <FlaskConical size={16} color={activeTab === 'inventory' ? '#10b981' : '#64748b'} />
          <Text style={[styles.navTabText, activeTab === 'inventory' && styles.navTabTextActive]}>
            Inventory
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, activeTab === 'rotation' && styles.navTabActive]}
          onPress={() => setActiveTab('rotation')}
        >
          <RotateCw size={16} color={activeTab === 'rotation' ? '#10b981' : '#64748b'} />
          <Text style={[styles.navTabText, activeTab === 'rotation' && styles.navTabTextActive]}>
            Rotasi
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, activeTab === 'history' && styles.navTabActive]}
          onPress={() => setActiveTab('history')}
        >
          <History size={16} color={activeTab === 'history' ? '#10b981' : '#64748b'} />
          <Text style={[styles.navTabText, activeTab === 'history' && styles.navTabTextActive]}>
            Riwayat
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, activeTab === 'freezer' && styles.navTabActive]}
          onPress={() => setActiveTab('freezer')}
        >
          <Snowflake size={16} color={activeTab === 'freezer' ? '#10b981' : '#64748b'} />
          <Text style={[styles.navTabText, activeTab === 'freezer' && styles.navTabTextActive]}>
            Freezer
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tampilan Konten Layar Aktif */}
      <View style={styles.mainContent}>
        {activeTab === 'inventory' && <InventoryScreen />}
        {activeTab === 'rotation' && <RotationScreen />}
        {activeTab === 'history' && <HistoryScreen />}
        {activeTab === 'freezer' && <FreezerScreen />}
      </View>

      {/* Tombol AI Chat Assistant Melayang */}
      <FloatingAIChat />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  topHeader: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#111827',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    backgroundColor: '#090d16',
    overflow: 'hidden',
  },
  brandIconImage: {
    width: '100%',
    height: '100%',
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  proBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10b981',
  },
  appSubtitle: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  notificationBtn: {
    padding: 8,
    backgroundColor: '#090d16',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  navBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: '#030712',
    borderBottomWidth: 1,
    borderBottomColor: '#111827',
  },
  navTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  navTabActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: '#10b981',
  },
  navTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  navTabTextActive: {
    color: '#10b981',
  },
  mainContent: {
    flex: 1,
  },
});
