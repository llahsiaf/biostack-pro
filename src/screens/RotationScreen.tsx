import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Svg, { Rect, Circle, Path, Text as SvgText, G } from 'react-native-svg';
import {
  RotateCw,
  Compass,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from 'lucide-react-native';
import { useBioStackStore, ROTATION_SITES } from '../store/useBioStackStore';

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
  { id: 'KA', code: 'KA', name: 'Kanan Atas (KA)', subText: 'Perut kanan atas (2-3 cm dari pusar)', zone: 'perut' },
  { id: 'KiA', code: 'KiA', name: 'Kiri Atas (KiA)', subText: 'Perut kiri atas (2-3 cm dari pusar)', zone: 'perut' },
  { id: 'KB', code: 'KB', name: 'Kanan Bawah (KB)', subText: 'Perut kanan bawah (2-3 cm dari pusar)', zone: 'perut' },
  { id: 'KiB', code: 'KiB', name: 'Kiri Bawah (KiB)', subText: 'Perut kiri bawah (2-3 cm dari pusar)', zone: 'perut' },

  // Zona Paha (Thighs)
  { id: 'PKi', code: 'PKi', name: 'Paha Kiri (PKi)', subText: 'Sisi luar paha atas kiri', zone: 'paha' },
  { id: 'PKn', code: 'PKn', name: 'Paha Kanan (PKn)', subText: 'Sisi luar paha atas kanan', zone: 'paha' },

  // Zona Lengan (Upper Arms)
  { id: 'LKi', code: 'LKi', name: 'Lengan Kiri (LKi)', subText: 'Trisep / sisi belakang lengan kiri', zone: 'lengan' },
  { id: 'LKn', code: 'LKn', name: 'Lengan Kanan (LKn)', subText: 'Trisep / sisi belakang lengan kanan', zone: 'lengan' },

  // Zona Bokong (Glutes)
  { id: 'BKi', code: 'BKi', name: 'Bokong Kiri (BKi)', subText: 'Kuadran atas luar bokong kiri', zone: 'bokong' },
  { id: 'BKn', code: 'BKn', name: 'Bokong Kanan (BKn)', subText: 'Kuadran atas luar bokong kanan', zone: 'bokong' },
];

export const RotationScreen: React.FC = () => {
  const { currentSite, setSite, rotateToNextSite, injectionHistory } = useBioStackStore();
  const [selectedZone, setSelectedZone] = useState<BodyZone>('perut');

  const currentPoint = ALL_SITES.find((s) => s.id === currentSite) || ALL_SITES[0];
  const activeZoneSites = ALL_SITES.filter((s) => s.zone === selectedZone);

  const getSiteLastUsed = (siteId: string) => {
    const history = Array.isArray(injectionHistory) ? injectionHistory : [];
    const log = history.find((h) => h?.siteId === siteId);
    if (!log) return 'Belum ada log';
    return log.timestamp || 'Baru saja';
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

      {/* Peta Visual Anatomi Vektor SVG */}
      <View style={styles.visualMapCard}>
        <Text style={styles.mapHeaderTitle}>DIAGRAM SILUET ANATOMI ({selectedZone.toUpperCase()})</Text>
        <View style={styles.svgContainer}>
          <Svg height="190" width="100%" viewBox="0 0 300 180">
            {/* Perut / Abdomen Zone */}
            {selectedZone === 'perut' && (
              <G>
                {/* Torso Outline */}
                <Path
                  d="M100 20 Q150 10 200 20 L210 160 Q150 170 90 160 Z"
                  fill="#090d16"
                  stroke="#1e293b"
                  strokeWidth="2"
                />
                {/* Pusar (Navel) */}
                <Circle cx="150" cy="90" r="12" fill="#030712" stroke="#38bdf8" strokeWidth="1.5" />
                <SvgText x="150" y="93" fill="#38bdf8" fontSize="8" fontWeight="bold" textAnchor="middle">
                  PUSAR
                </SvgText>

                {/* Kuadran KA (Kanan Atas) */}
                <G onPress={() => setSite('KA')} style={{ cursor: 'pointer' }}>
                  <Rect
                    x="105"
                    y="35"
                    width="38"
                    height="42"
                    rx="8"
                    fill={currentSite === 'KA' ? 'rgba(16, 185, 129, 0.2)' : '#0f172a'}
                    stroke={currentSite === 'KA' ? '#10b981' : '#334155'}
                    strokeWidth={currentSite === 'KA' ? '2' : '1'}
                  />
                  <SvgText x="124" y="52" fill={currentSite === 'KA' ? '#10b981' : '#ffffff'} fontSize="11" fontWeight="bold" textAnchor="middle">
                    KA
                  </SvgText>
                  <SvgText x="124" y="65" fill="#94a3b8" fontSize="7" textAnchor="middle">
                    Kanan Atas
                  </SvgText>
                </G>

                {/* Kuadran KiA (Kiri Atas) */}
                <G onPress={() => setSite('KiA')}>
                  <Rect
                    x="157"
                    y="35"
                    width="38"
                    height="42"
                    rx="8"
                    fill={currentSite === 'KiA' ? 'rgba(16, 185, 129, 0.2)' : '#0f172a'}
                    stroke={currentSite === 'KiA' ? '#10b981' : '#334155'}
                    strokeWidth={currentSite === 'KiA' ? '2' : '1'}
                  />
                  <SvgText x="176" y="52" fill={currentSite === 'KiA' ? '#10b981' : '#ffffff'} fontSize="11" fontWeight="bold" textAnchor="middle">
                    KiA
                  </SvgText>
                  <SvgText x="176" y="65" fill="#94a3b8" fontSize="7" textAnchor="middle">
                    Kiri Atas
                  </SvgText>
                </G>

                {/* Kuadran KB (Kanan Bawah) */}
                <G onPress={() => setSite('KB')}>
                  <Rect
                    x="105"
                    y="105"
                    width="38"
                    height="42"
                    rx="8"
                    fill={currentSite === 'KB' ? 'rgba(16, 185, 129, 0.2)' : '#0f172a'}
                    stroke={currentSite === 'KB' ? '#10b981' : '#334155'}
                    strokeWidth={currentSite === 'KB' ? '2' : '1'}
                  />
                  <SvgText x="124" y="122" fill={currentSite === 'KB' ? '#10b981' : '#ffffff'} fontSize="11" fontWeight="bold" textAnchor="middle">
                    KB
                  </SvgText>
                  <SvgText x="124" y="135" fill="#94a3b8" fontSize="7" textAnchor="middle">
                    Kanan Bawah
                  </SvgText>
                </G>

                {/* Kuadran KiB (Kiri Bawah) */}
                <G onPress={() => setSite('KiB')}>
                  <Rect
                    x="157"
                    y="105"
                    width="38"
                    height="42"
                    rx="8"
                    fill={currentSite === 'KiB' ? 'rgba(16, 185, 129, 0.2)' : '#0f172a'}
                    stroke={currentSite === 'KiB' ? '#10b981' : '#334155'}
                    strokeWidth={currentSite === 'KiB' ? '2' : '1'}
                  />
                  <SvgText x="176" y="122" fill={currentSite === 'KiB' ? '#10b981' : '#ffffff'} fontSize="11" fontWeight="bold" textAnchor="middle">
                    KiB
                  </SvgText>
                  <SvgText x="176" y="135" fill="#94a3b8" fontSize="7" textAnchor="middle">
                    Kiri Bawah
                  </SvgText>
                </G>
              </G>
            )}

            {/* Paha / Thighs Zone */}
            {selectedZone === 'paha' && (
              <G>
                <Rect
                  x="70"
                  y="20"
                  width="70"
                  height="140"
                  rx="16"
                  fill={currentSite === 'PKi' ? 'rgba(16, 185, 129, 0.2)' : '#0f172a'}
                  stroke={currentSite === 'PKi' ? '#10b981' : '#334155'}
                  strokeWidth={currentSite === 'PKi' ? '2' : '1'}
                />
                <SvgText x="105" y="80" fill={currentSite === 'PKi' ? '#10b981' : '#ffffff'} fontSize="13" fontWeight="bold" textAnchor="middle">
                  PKi
                </SvgText>
                <SvgText x="105" y="98" fill="#94a3b8" fontSize="9" textAnchor="middle">
                  Paha Kiri Luar
                </SvgText>

                <Rect
                  x="160"
                  y="20"
                  width="70"
                  height="140"
                  rx="16"
                  fill={currentSite === 'PKn' ? 'rgba(16, 185, 129, 0.2)' : '#0f172a'}
                  stroke={currentSite === 'PKn' ? '#10b981' : '#334155'}
                  strokeWidth={currentSite === 'PKn' ? '2' : '1'}
                />
                <SvgText x="195" y="80" fill={currentSite === 'PKn' ? '#10b981' : '#ffffff'} fontSize="13" fontWeight="bold" textAnchor="middle">
                  PKn
                </SvgText>
                <SvgText x="195" y="98" fill="#94a3b8" fontSize="9" textAnchor="middle">
                  Paha Kanan Luar
                </SvgText>
              </G>
            )}

            {/* Lengan / Upper Arms Zone */}
            {selectedZone === 'lengan' && (
              <G>
                <Rect
                  x="75"
                  y="25"
                  width="65"
                  height="130"
                  rx="14"
                  fill={currentSite === 'LKi' ? 'rgba(16, 185, 129, 0.2)' : '#0f172a'}
                  stroke={currentSite === 'LKi' ? '#10b981' : '#334155'}
                  strokeWidth={currentSite === 'LKi' ? '2' : '1'}
                />
                <SvgText x="107" y="80" fill={currentSite === 'LKi' ? '#10b981' : '#ffffff'} fontSize="13" fontWeight="bold" textAnchor="middle">
                  LKi
                </SvgText>
                <SvgText x="107" y="98" fill="#94a3b8" fontSize="8" textAnchor="middle">
                  Lengan Kiri
                </SvgText>

                <Rect
                  x="160"
                  y="25"
                  width="65"
                  height="130"
                  rx="14"
                  fill={currentSite === 'LKn' ? 'rgba(16, 185, 129, 0.2)' : '#0f172a'}
                  stroke={currentSite === 'LKn' ? '#10b981' : '#334155'}
                  strokeWidth={currentSite === 'LKn' ? '2' : '1'}
                />
                <SvgText x="192" y="80" fill={currentSite === 'LKn' ? '#10b981' : '#ffffff'} fontSize="13" fontWeight="bold" textAnchor="middle">
                  LKn
                </SvgText>
                <SvgText x="192" y="98" fill="#94a3b8" fontSize="8" textAnchor="middle">
                  Lengan Kanan
                </SvgText>
              </G>
            )}

            {/* Bokong / Glutes Zone */}
            {selectedZone === 'bokong' && (
              <G>
                <Rect
                  x="70"
                  y="25"
                  width="70"
                  height="130"
                  rx="16"
                  fill={currentSite === 'BKi' ? 'rgba(16, 185, 129, 0.2)' : '#0f172a'}
                  stroke={currentSite === 'BKi' ? '#10b981' : '#334155'}
                  strokeWidth={currentSite === 'BKi' ? '2' : '1'}
                />
                <SvgText x="105" y="80" fill={currentSite === 'BKi' ? '#10b981' : '#ffffff'} fontSize="13" fontWeight="bold" textAnchor="middle">
                  BKi
                </SvgText>
                <SvgText x="105" y="98" fill="#94a3b8" fontSize="9" textAnchor="middle">
                  Bokong Kiri
                </SvgText>

                <Rect
                  x="160"
                  y="25"
                  width="70"
                  height="130"
                  rx="16"
                  fill={currentSite === 'BKn' ? 'rgba(16, 185, 129, 0.2)' : '#0f172a'}
                  stroke={currentSite === 'BKn' ? '#10b981' : '#334155'}
                  strokeWidth={currentSite === 'BKn' ? '2' : '1'}
                />
                <SvgText x="195" y="80" fill={currentSite === 'BKn' ? '#10b981' : '#ffffff'} fontSize="13" fontWeight="bold" textAnchor="middle">
                  BKn
                </SvgText>
                <SvgText x="195" y="98" fill="#94a3b8" fontSize="9" textAnchor="middle">
                  Bokong Kanan
                </SvgText>
              </G>
            )}
          </Svg>
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
    padding: 14,
    gap: 8,
  },
  mapHeaderTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  svgContainer: {
    backgroundColor: '#030712',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
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
