import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  RotateCw,
  Compass,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from 'lucide-react-native';
import { useBioStackStore } from '../store/useBioStackStore';

type BodyZone = 'perut' | 'paha' | 'lengan' | 'bokong';

interface SitePoint {
  id: string;
  code: string;
  name: string;
  subText: string;
  zone: BodyZone;
}

const ALL_SITES: SitePoint[] = [
  // Zona Perut (Abdomen)
  { id: 'TL', code: 'TL', name: 'Kiri Atas (TL)', subText: 'Perut kiri atas (2-3 cm dari pusar)', zone: 'perut' },
  { id: 'TR', code: 'TR', name: 'Kanan Atas (TR)', subText: 'Perut kanan atas (2-3 cm dari pusar)', zone: 'perut' },
  { id: 'BR', code: 'BR', name: 'Kanan Bawah (BR)', subText: 'Perut kanan bawah (2-3 cm dari pusar)', zone: 'perut' },
  { id: 'BL', code: 'BL', name: 'Kiri Bawah (BL)', subText: 'Perut kiri bawah (2-3 cm dari pusar)', zone: 'perut' },

  // Zona Paha (Thighs)
  { id: 'LT', code: 'LT', name: 'Paha Kiri Luar (LT)', subText: 'Sisi luar paha atas kiri', zone: 'paha' },
  { id: 'RT', code: 'RT', name: 'Paha Kanan Luar (RT)', subText: 'Sisi luar paha atas kanan', zone: 'paha' },

  // Zona Lengan (Upper Arms)
  { id: 'LA', code: 'LA', name: 'Lengan Kiri (LA)', subText: 'Trisep / sisi belakang lengan kiri', zone: 'lengan' },
  { id: 'RA', code: 'RA', name: 'Lengan Kanan (RA)', subText: 'Trisep / sisi belakang lengan kanan', zone: 'lengan' },

  // Zona Bokong (Glutes)
  { id: 'LG', code: 'LG', name: 'Bokong Kiri (LG)', subText: 'Kuadran atas luar bokong kiri', zone: 'bokong' },
  { id: 'RG', code: 'RG', name: 'Bokong Kanan (RG)', subText: 'Kuadran atas luar bokong kanan', zone: 'bokong' },
];

export const RotationScreen: React.FC = () => {
  const { currentSite, setSite, rotateToNextSite, injectionHistory } = useBioStackStore();
  const [selectedZone, setSelectedZone] = useState<BodyZone>('perut');

  const currentPoint = ALL_SITES.find((s) => s.id === currentSite) || ALL_SITES[0];
  const activeZoneSites = ALL_SITES.filter((s) => s.zone === selectedZone);

  const getSiteLastUsed = (siteId: string) => {
    const log = injectionHistory.find((h) => h.siteId === siteId);
    if (!log) return 'Belum ada log';
    return log.timestamp;
  };

  const handleNextRotation = () => {
    rotateToNextSite();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Banner Protokol */}
      <View style={styles.bannerCard}>
        <View style={styles.bannerIconBox}>
          <Compass size={20} color="#10b981" />
        </View>
        <View style={styles.bannerContent}>
          <Text style={styles.bannerTitle}>Protokol Rotasi Anatomi</Text>
          <Text style={styles.bannerDesc}>
            Mencegah lipohipertrofi dan penumpukan jaringan parut subkutan.
          </Text>
        </View>
      </View>

      {/* Kartu Target Titik Aktif */}
      <View style={styles.activeTargetCard}>
        <View style={styles.targetHeaderRow}>
          <View>
            <Text style={styles.targetLabel}>TARGET TITIK BERIKUTNYA</Text>
            <Text style={styles.targetName}>{currentPoint.name}</Text>
          </View>
          <View style={styles.targetCodeBadge}>
            <Text style={styles.targetCodeText}>{currentPoint.code}</Text>
          </View>
        </View>
        <Text style={styles.targetSubText}>{currentPoint.subText}</Text>

        <TouchableOpacity style={styles.rotateActionBtn} onPress={handleNextRotation}>
          <RotateCw size={16} color="#022c22" />
          <Text style={styles.rotateActionBtnText}>Putar ke Titik Selanjutnya</Text>
        </TouchableOpacity>
      </View>

      {/* Pemilih Tab Kategori Zona Anatomi */}
      <View style={styles.zoneSelectorContainer}>
        {(['perut', 'paha', 'lengan', 'bokong'] as BodyZone[]).map((zone) => (
          <TouchableOpacity
            key={zone}
            onPress={() => setSelectedZone(zone)}
            style={[styles.zoneTab, selectedZone === zone && styles.zoneTabActive]}
          >
            <Text style={[styles.zoneTabText, selectedZone === zone && styles.zoneTabTextActive]}>
              {zone.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Peta Visual Anatomi */}
      <View style={styles.visualMapCard}>
        <View style={styles.torsoOutline}>
          {selectedZone === 'perut' && (
            <View style={styles.gridOverlay}>
              <View style={styles.navelCircle}>
                <Text style={styles.navelText}>PUSAR</Text>
              </View>

              <View style={styles.rowQuadrant}>
                <TouchableOpacity
                  onPress={() => setSite('TR')}
                  style={[styles.mapPoint, currentSite === 'TR' && styles.mapPointActive]}
                >
                  <Text style={[styles.mapPointCode, currentSite === 'TR' && styles.mapPointCodeActive]}>TR</Text>
                  <Text style={styles.mapPointLabel}>Kanan Atas</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSite('TL')}
                  style={[styles.mapPoint, currentSite === 'TL' && styles.mapPointActive]}
                >
                  <Text style={[styles.mapPointCode, currentSite === 'TL' && styles.mapPointCodeActive]}>TL</Text>
                  <Text style={styles.mapPointLabel}>Kiri Atas</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.rowQuadrant}>
                <TouchableOpacity
                  onPress={() => setSite('BR')}
                  style={[styles.mapPoint, currentSite === 'BR' && styles.mapPointActive]}
                >
                  <Text style={[styles.mapPointCode, currentSite === 'BR' && styles.mapPointCodeActive]}>BR</Text>
                  <Text style={styles.mapPointLabel}>Kanan Bawah</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSite('BL')}
                  style={[styles.mapPoint, currentSite === 'BL' && styles.mapPointActive]}
                >
                  <Text style={[styles.mapPointCode, currentSite === 'BL' && styles.mapPointCodeActive]}>BL</Text>
                  <Text style={styles.mapPointLabel}>Kiri Bawah</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {selectedZone === 'paha' && (
            <View style={styles.limbsRow}>
              <TouchableOpacity
                onPress={() => setSite('LT')}
                style={[styles.limbBtn, currentSite === 'LT' && styles.mapPointActive]}
              >
                <Text style={[styles.mapPointCode, currentSite === 'LT' && styles.mapPointCodeActive]}>LT</Text>
                <Text style={styles.mapPointLabel}>Paha Kiri Luar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSite('RT')}
                style={[styles.limbBtn, currentSite === 'RT' && styles.mapPointActive]}
              >
                <Text style={[styles.mapPointCode, currentSite === 'RT' && styles.mapPointCodeActive]}>RT</Text>
                <Text style={styles.mapPointLabel}>Paha Kanan Luar</Text>
              </TouchableOpacity>
            </View>
          )}

          {selectedZone === 'lengan' && (
            <View style={styles.limbsRow}>
              <TouchableOpacity
                onPress={() => setSite('LA')}
                style={[styles.limbBtn, currentSite === 'LA' && styles.mapPointActive]}
              >
                <Text style={[styles.mapPointCode, currentSite === 'LA' && styles.mapPointCodeActive]}>LA</Text>
                <Text style={styles.mapPointLabel}>Lengan Kiri Belakang</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSite('RA')}
                style={[styles.limbBtn, currentSite === 'RA' && styles.mapPointActive]}
              >
                <Text style={[styles.mapPointCode, currentSite === 'RA' && styles.mapPointCodeActive]}>RA</Text>
                <Text style={styles.mapPointLabel}>Lengan Kanan Belakang</Text>
              </TouchableOpacity>
            </View>
          )}

          {selectedZone === 'bokong' && (
            <View style={styles.limbsRow}>
              <TouchableOpacity
                onPress={() => setSite('LG')}
                style={[styles.limbBtn, currentSite === 'LG' && styles.mapPointActive]}
              >
                <Text style={[styles.mapPointCode, currentSite === 'LG' && styles.mapPointCodeActive]}>LG</Text>
                <Text style={styles.mapPointLabel}>Bokong Kiri Atas</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSite('RG')}
                style={[styles.limbBtn, currentSite === 'RG' && styles.mapPointActive]}
              >
                <Text style={[styles.mapPointCode, currentSite === 'RG' && styles.mapPointCodeActive]}>RG</Text>
                <Text style={styles.mapPointLabel}>Bokong Kanan Atas</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Grid Pilihan Titik Manual */}
      <Text style={styles.sectionHeaderTitle}>PILIH TITIK MANUAL ({selectedZone.toUpperCase()})</Text>
      <View style={styles.manualGrid}>
        {activeZoneSites.map((item) => {
          const isSelected = currentSite === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => setSite(item.id)}
              style={[styles.manualSiteCard, isSelected && styles.manualSiteCardActive]}
            >
              <View style={styles.siteCardTop}>
                <Text style={[styles.siteCardCode, isSelected && styles.siteCardCodeActive]}>
                  {item.code}
                </Text>
                {isSelected ? (
                  <CheckCircle2 size={16} color="#10b981" />
                ) : (
                  <Clock size={14} color="#64748b" />
                )}
              </View>
              <Text style={styles.siteCardName}>{item.name}</Text>
              <Text style={styles.siteCardSub}>{getSiteLastUsed(item.id)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.safetyCard}>
        <ShieldCheck size={16} color="#10b981" />
        <Text style={styles.safetyText}>
          Jarak penyuntikan minimal 2.5 cm dari bekas tusukan sebelumnya untuk menjaga elastisitas jaringan lemak subkutan.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 80,
    gap: 12,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  bannerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
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
  bannerDesc: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  activeTargetCard: {
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  targetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 0.5,
  },
  targetName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 2,
  },
  targetCodeBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  targetCodeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10b981',
  },
  targetSubText: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 8,
  },
  rotateActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingVertical: 10,
    borderRadius: 10,
  },
  rotateActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#022c22',
  },
  zoneSelectorContainer: {
    flexDirection: 'row',
    backgroundColor: '#090d16',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 4,
  },
  zoneTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  zoneTabActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  zoneTabText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  zoneTabTextActive: {
    color: '#10b981',
  },
  visualMapCard: {
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  torsoOutline: {
    width: '100%',
    minHeight: 180,
    backgroundColor: '#030712',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
    justifyContent: 'center',
  },
  gridOverlay: {
    gap: 16,
    position: 'relative',
  },
  navelCircle: {
    position: 'absolute',
    top: '44%',
    left: '42%',
    width: 50,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#38bdf8',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  navelText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#38bdf8',
  },
  rowQuadrant: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  mapPoint: {
    width: 90,
    height: 70,
    borderRadius: 12,
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  mapPointActive: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  mapPointCode: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748b',
  },
  mapPointCodeActive: {
    color: '#10b981',
  },
  mapPointLabel: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '600',
  },
  limbsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    gap: 12,
  },
  limbBtn: {
    flex: 1,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  sectionHeaderTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  manualGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  manualSiteCard: {
    width: '48.5%',
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  manualSiteCardActive: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  siteCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  siteCardCode: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
  },
  siteCardCodeActive: {
    color: '#10b981',
  },
  siteCardName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  siteCardSub: {
    fontSize: 9,
    color: '#64748b',
  },
  safetyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    padding: 12,
    borderRadius: 12,
  },
  safetyText: {
    flex: 1,
    fontSize: 10,
    color: '#94a3b8',
    lineHeight: 14,
  },
});
