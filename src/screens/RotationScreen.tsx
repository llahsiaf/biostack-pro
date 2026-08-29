import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  Target,
  RotateCw,
  ShieldCheck,
  Clock,
  Compass,
} from 'lucide-react-native';
import { useBioStackStore } from '../store/useBioStackStore';
import { BodyMapRotation } from '../components/BodyMapRotation';
import { INJECTION_SITES } from '../database/defaultPeptides';

export const RotationScreen: React.FC = () => {
  const { currentSiteIndex, setSiteIndex, advanceSiteRotation, injectionLogs } = useBioStackStore();
  const currentSite = INJECTION_SITES[currentSiteIndex];

  const getLogsForSite = (code: string) => {
    return injectionLogs.filter((log) => log.locationId === code);
  };

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
        {/* Header Title Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerIconWrap}>
            <Compass size={18} color="#10b981" />
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Protokol Rotasi Anatomi</Text>
            <Text style={styles.headerSubtitle}>
              Mencegah lipohipertrofi & penumpukan jaringan parut subkutan.
            </Text>
          </View>
        </View>

        {/* Current Target Focus Card */}
        <View style={styles.focusCard}>
          <View style={styles.focusTop}>
            <View>
              <Text style={styles.focusLabel}>Target Titik Berikutnya</Text>
              <Text style={styles.focusSiteName}>{currentSite.name}</Text>
            </View>
            <View style={styles.focusBadge}>
              <Text style={styles.focusBadgeText}>{currentSite.code}</Text>
            </View>
          </View>

          <Text style={styles.focusDesc}>{currentSite.desc}</Text>

          <TouchableOpacity onPress={advanceSiteRotation} style={styles.rotateBtn}>
            <RotateCw size={14} color="#022c22" />
            <Text style={styles.rotateBtnText}>Putar ke Kuadran Selanjutnya</Text>
          </TouchableOpacity>
        </View>

        {/* SVG Interactive Anatomical Body Map */}
        <BodyMapRotation
          currentSiteIndex={currentSiteIndex}
          onSelectSite={(idx) => setSiteIndex(idx)}
        />

        {/* Quadrant Quick Selection Grid */}
        <Text style={styles.sectionHeading}>Pilih Titik Manual</Text>
        <View style={styles.gridContainer}>
          {INJECTION_SITES.map((site, idx) => {
            const isSelected = idx === currentSiteIndex;
            const siteLogs = getLogsForSite(site.code);
            const lastLog = siteLogs.length > 0 ? siteLogs[0] : null;

            return (
              <TouchableOpacity
                key={site.id}
                onPress={() => setSiteIndex(idx)}
                style={[styles.siteCard, isSelected && styles.siteCardActive]}
              >
                <View style={styles.siteCardHeader}>
                  <Text style={[styles.siteCode, isSelected && styles.siteCodeActive]}>
                    {site.code}
                  </Text>
                  {isSelected ? (
                    <Target size={14} color="#34d399" />
                  ) : (
                    <Clock size={12} color="#64748b" />
                  )}
                </View>

                <Text style={[styles.siteName, isSelected && styles.siteNameActive]}>
                  {site.name}
                </Text>

                <View style={styles.logSummaryRow}>
                  <Text style={styles.logSummaryText}>
                    {lastLog ? `Terakhir: ${lastLog.dateStr}` : 'Belum ada log'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Clinical Safe Practice Banner */}
        <View style={styles.infoBanner}>
          <ShieldCheck size={16} color="#06b6d4" />
          <Text style={styles.infoBannerText}>
            Beri jarak minimal 2.5 cm dari bekas tusukan sebelumnya dan jangan menyuntik langsung pada lingkaran pusar.
          </Text>
        </View>
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#090d16',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
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
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  focusCard: {
    backgroundColor: '#090d16',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    gap: 10,
  },
  focusTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  focusLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#10b981',
    textTransform: 'uppercase',
  },
  focusSiteName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 2,
  },
  focusBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  focusBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#34d399',
    fontFamily: 'Courier',
  },
  focusDesc: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
  },
  rotateBtn: {
    backgroundColor: '#10b981',
    borderRadius: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  rotateBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#022c22',
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  siteCard: {
    width: '48.5%',
    backgroundColor: '#090d16',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 4,
  },
  siteCardActive: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  siteCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  siteCode: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    fontFamily: 'Courier',
  },
  siteCodeActive: {
    color: '#34d399',
  },
  siteName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  siteNameActive: {
    color: '#ffffff',
  },
  logSummaryRow: {
    marginTop: 4,
  },
  logSummaryText: {
    fontSize: 9,
    color: '#64748b',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.2)',
    marginTop: 4,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 10,
    color: '#cbd5e1',
    lineHeight: 14,
  },
});
