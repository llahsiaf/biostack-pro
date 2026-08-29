import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { RotateCcw, MapPin, ShieldCheck } from 'lucide-react-native';
import { useBioStackStore } from '../store/useBioStackStore';
import { BodyMapRotation } from '../components/BodyMapRotation';

const SITE_DATA = [
  { id: 'KA', label: 'Kanan Atas', desc: 'Kuadran kanan atas perut', color: '#10b981' },
  { id: 'KiA', label: 'Kiri Atas', desc: 'Kuadran kiri atas perut', color: '#10b981' },
  { id: 'KB', label: 'Kanan Bawah', desc: 'Kuadran kanan bawah perut', color: '#10b981' },
  { id: 'KiB', label: 'Kiri Bawah', desc: 'Kuadran kiri bawah perut', color: '#10b981' },
  { id: 'PKi', label: 'Paha Kiri', desc: 'Sisi luar paha kiri', color: '#38bdf8' },
  { id: 'PKn', label: 'Paha Kanan', desc: 'Sisi luar paha kanan', color: '#38bdf8' },
  { id: 'LKi', label: 'Lengan Kiri', desc: 'Lengan bawah kiri', color: '#f59e0b' },
  { id: 'LKn', label: 'Lengan Kanan', desc: 'Lengan bawah kanan', color: '#f59e0b' },
  { id: 'BKi', label: 'Bokong Kiri', desc: 'Kuartal atas kiri', color: '#a855f7' },
  { id: 'BKn', label: 'Bokong Kanan', desc: 'Kuartal atas kanan', color: '#a855f7' },
];

const ZONES: Record<string, string[]> = {
  Perut: ['KA', 'KiA', 'KB', 'KiB'],
  Paha: ['PKi', 'PKn'],
  Lengan: ['LKi', 'LKn'],
  Bokong: ['BKi', 'BKn'],
};

export const RotationScreen: React.FC = () => {
  const { currentSite, setSite, rotateToNextSite, injectionHistory } = useBioStackStore();
  const [activeZone, setActiveZone] = useState('Perut');

  // ============================================================
  // FIX: Cari log TERAKHIR (paling baru), bukan pertama
  // ============================================================
  // Sebelumnya: injectionHistory.find(...) → dapat log pertama
  // Sekarang: [...injectionHistory].reverse().find(...) → dapat log terbaru
  // ============================================================
  const getSiteLastUsed = (siteId: string) => {
    const history = injectionHistory || [];
    // Reverse copy agar tidak mutasi array asli, lalu find
    const lastLog = [...history].reverse().find((log) => log?.siteId === siteId);
    return lastLog?.timestamp || 'Belum pernah';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.bannerCard}>
        <Text style={styles.bannerTitle}>Protokol Rotasi Situs</Text>
        <Text style={styles.bannerSub}>
          Rotasi situs mencegah lipohipertrofi. Jarak antar injeksi minimal 2.5 cm.
        </Text>
      </View>

      <BodyMapRotation />

      <View style={styles.targetCard}>
        <View style={styles.targetLeft}>
          <MapPin size={16} color="#10b981" />
          <View>
            <Text style={styles.targetLabel}>Target Injeksi Selanjutnya</Text>
            <Text style={styles.targetValue}>
              {SITE_DATA.find((s) => s.id === currentSite)?.label || currentSite}
            </Text>
            <Text style={styles.targetSub}>
              Terakhir digunakan: {getSiteLastUsed(currentSite)}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={rotateToNextSite} style={styles.rotateBtn}>
          <RotateCcw size={14} color="#022c22" />
          <Text style={styles.rotateBtnText}>Putar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.zoneTabs}>
        {Object.keys(ZONES).map((zone) => (
          <TouchableOpacity
            key={zone}
            onPress={() => setActiveZone(zone)}
            style={[styles.zoneTab, activeZone === zone && styles.zoneTabActive]}
          >
            <Text style={[styles.zoneTabText, activeZone === zone && styles.zoneTabTextActive]}>
              {zone}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.siteGrid}>
        {ZONES[activeZone].map((siteId) => {
          const site = SITE_DATA.find((s) => s.id === siteId);
          if (!site) return null;
          const isActive = siteId === currentSite;

          return (
            <TouchableOpacity
              key={siteId}
              onPress={() => setSite(siteId)}
              style={[
                styles.siteCard,
                isActive && { borderColor: site.color, backgroundColor: `${site.color}15` },
              ]}
            >
              <View style={[styles.siteDot, { backgroundColor: site.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.siteName, isActive && { color: site.color }]}>
                  {site.label}
                </Text>
                <Text style={styles.siteDesc}>{site.desc}</Text>
                <Text style={styles.siteLastUsed}>
                  Terakhir: {getSiteLastUsed(siteId)}
                </Text>
              </View>
              {isActive && <View style={[styles.activeBadge, { borderColor: site.color }]}><Text style={[styles.activeBadgeText, { color: site.color }]}>AKTIF</Text></View>}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.safetyCard}>
        <ShieldCheck size={16} color="#38bdf8" />
        <View style={{ flex: 1 }}>
          <Text style={styles.safetyTitle}>Safety Distance Protocol</Text>
          <Text style={styles.safetyText}>
            Jarak minimal antar titik injeksi: 2.5 cm. Hindari suntik di area yang sama dalam jangka waktu 48 jam.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712', paddingHorizontal: 14, paddingTop: 8 },
  bannerCard: { backgroundColor: '#090d16', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', padding: 14, marginBottom: 12, gap: 4 },
  bannerTitle: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  bannerSub: { fontSize: 10, color: '#94a3b8', lineHeight: 16 },
  targetCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#090d16', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', padding: 14, marginBottom: 12 },
  targetLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  targetLabel: { fontSize: 9, color: '#64748b', fontWeight: '700' },
  targetValue: { fontSize: 16, fontWeight: '900', color: '#ffffff' },
  targetSub: { fontSize: 9, color: '#94a3b8', marginTop: 2 },
  rotateBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  rotateBtnText: { fontSize: 11, fontWeight: '800', color: '#022c22' },
  zoneTabs: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  zoneTab: { flex: 1, backgroundColor: '#090d16', borderWidth: 1, borderColor: '#1e293b', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  zoneTabActive: { backgroundColor: '#1e293b', borderColor: '#38bdf8' },
  zoneTabText: { fontSize: 11, fontWeight: '700', color: '#64748b' },
  zoneTabTextActive: { color: '#38bdf8' },
  siteGrid: { gap: 8, marginBottom: 12 },
  siteCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#090d16', borderWidth: 1, borderColor: '#1e293b', borderRadius: 10, padding: 12 },
  siteDot: { width: 10, height: 10, borderRadius: 5 },
  siteName: { fontSize: 13, fontWeight: '800', color: '#ffffff' },
  siteDesc: { fontSize: 9, color: '#64748b', marginTop: 1 },
  siteLastUsed: { fontSize: 9, color: '#475569', marginTop: 3, fontStyle: 'italic' },
  activeBadge: { borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  activeBadgeText: { fontSize: 8, fontWeight: '800' },
  safetyCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(56, 189, 248, 0.05)', borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.2)', borderRadius: 12, padding: 14, marginBottom: 20 },
  safetyTitle: { fontSize: 12, fontWeight: '800', color: '#38bdf8' },
  safetyText: { fontSize: 10, color: '#94a3b8', lineHeight: 16, marginTop: 2 },
});
