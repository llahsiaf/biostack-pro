import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Ellipse, Path, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { INJECTION_SITES } from '../database/injectionSites';
import { useBioStackStore } from '../store/useBioStackStore';

export const BodyMapRotation: React.FC = () => {
  const { currentSite } = useBioStackStore();

  const getSiteLabel = (siteId: string) => {
    const labels: Record<string, string> = {
      KA: 'Kanan Atas', KiA: 'Kiri Atas', KB: 'Kanan Bawah', KiB: 'Kiri Bawah',
      PKi: 'Paha Kiri', PKn: 'Paha Kanan',
      LKi: 'Lengan Kiri', LKn: 'Lengan Kanan',
      BKi: 'Bokong Kiri', BKn: 'Bokong Kanan',
    };
    return labels[siteId] || siteId;
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>Peta Anatomi Rotasi Injeksi</Text>
        <Text style={styles.headerSub}>
          Titik aktif: <Text style={styles.headerHighlight}>{getSiteLabel(currentSite)}</Text>
        </Text>
      </View>

      <View style={styles.svgCard}>
        <Svg height="300" width="320" viewBox="0 0 320 300">
          <Defs>
            <LinearGradient id="torsoGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#1e293b" stopOpacity="1" />
              <Stop offset="1" stopColor="#0f172a" stopOpacity="1" />
            </LinearGradient>
            <LinearGradient id="activeGlow" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#10b981" stopOpacity="0.4" />
              <Stop offset="1" stopColor="#06b6d4" stopOpacity="0.4" />
            </LinearGradient>
          </Defs>

          {/* Torso Base */}
          <G>
            <Ellipse cx="160" cy="85" rx="55" ry="65" fill="url(#torsoGrad)" stroke="#334155" strokeWidth="2" />
            <Path d="M 105 85 Q 160 160 215 85" fill="none" stroke="#334155" strokeWidth="1.5" />
            <Path d="M 160 20 L 160 150" fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="4,4" />
            
            {/* Navel */}
            <Circle cx="160" cy="85" r="4" fill="#334155" />
            <Circle cx="160" cy="85" r="2" fill="#0f172a" />
          </G>

          {/* Injection Sites */}
          {INJECTION_SITES.map((site: any) => (
            <G key={site.id}>
              {site.id === currentSite && (
                <Circle cx={site.cx} cy={site.cy} r={14} fill="url(#activeGlow)" />
              )}
              <Circle
                cx={site.cx}
                cy={site.cy}
                r={site.id === currentSite ? 10 : 6}
                fill={site.id === currentSite ? '#10b981' : '#1e293b'}
                stroke={site.id === currentSite ? '#34d399' : '#475569'}
                strokeWidth={site.id === currentSite ? 3 : 2}
              />
              <SvgText
                x={site.cx}
                y={site.cy + (site.id === currentSite ? 24 : 18)}
                fill={site.id === currentSite ? '#10b981' : '#64748b'}
                fontSize={site.id === currentSite ? 11 : 9}
                fontWeight={site.id === currentSite ? 'bold' : 'normal'}
                textAnchor="middle"
              >
                {site.code}
              </SvgText>
            </G>
          ))}
        </Svg>
      </View>

      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
          <Text style={styles.legendText}>Titik Aktif ({getSiteLabel(currentSite)})</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#1e293b', borderColor: '#475569', borderWidth: 2 }]} />
          <Text style={styles.legendText}>Tersedia untuk Rotasi</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 14, gap: 12 },
  headerCard: { backgroundColor: '#090d16', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', padding: 14, gap: 4 },
  headerTitle: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  headerSub: { fontSize: 11, color: '#94a3b8' },
  headerHighlight: { color: '#10b981', fontWeight: '800' },
  svgCard: { backgroundColor: '#090d16', borderRadius: 14, borderWidth: 1, borderColor: '#1e293b', alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  legendContainer: { flexDirection: 'row', gap: 16, justifyContent: 'center', marginTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },
});
