import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface SyringeVisualizerProps {
  u100Units: number;
  volMl: number;
}

export const SyringeVisualizer: React.FC<SyringeVisualizerProps> = ({ u100Units, volMl }) => {
  const boundedUnits = Math.max(0, Math.min(100, u100Units));
  const barrelStartX = 40;
  const barrelWidth = 260;
  const barrelHeight = 44;
  const barrelY = 22;

  const fillWidth = (boundedUnits / 100) * barrelWidth;
  const plungerX = barrelStartX + fillWidth;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Simulasi Spuit U-100</Text>
        <Text style={styles.badgeText}>
          {boundedUnits} IU ({volMl.toFixed(3)} mL)
        </Text>
      </View>

      <Svg width="100%" height={95} viewBox="0 0 350 95">
        <Defs>
          <LinearGradient id="liquidGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#10b981" stopOpacity="0.85" />
          </LinearGradient>
          <LinearGradient id="barrelGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#1e293b" stopOpacity="0.6" />
            <Stop offset="100%" stopColor="#0f172a" stopOpacity="0.8" />
          </LinearGradient>
        </Defs>

        {/* Needle Hub & Needle */}
        <Line x1="10" y1={barrelY + barrelHeight / 2} x2="35" y2={barrelY + barrelHeight / 2} stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
        <Rect x="32" y={barrelY + 12} width="8" height="20" rx="2" fill="#64748b" />

        {/* Syringe Barrel */}
        <Rect x={barrelStartX} y={barrelY} width={barrelWidth} height={barrelHeight} rx="6" fill="url(#barrelGrad)" stroke="#334155" strokeWidth="2" />

        {/* Liquid Fill */}
        {fillWidth > 0 && (
          <Rect x={barrelStartX} y={barrelY + 2} width={fillWidth} height={barrelHeight - 4} rx="4" fill="url(#liquidGrad)" />
        )}

        {/* Plunger Stopper */}
        <Rect x={plungerX - 4} y={barrelY + 1} width="8" height={barrelHeight - 2} rx="2" fill="#047857" stroke="#10b981" strokeWidth="1.5" />

        {/* Plunger Shaft & Flange */}
        <Line x1={plungerX + 4} y1={barrelY + barrelHeight / 2} x2="335" y2={barrelY + barrelHeight / 2} stroke="#475569" strokeWidth="5" strokeLinecap="square" />
        <Rect x="330" y={barrelY + 6} width="6" height={barrelHeight - 12} rx="2" fill="#64748b" />

        {/* Tick Marks (0 - 100 IU) */}
        {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((tick) => {
          const x = barrelStartX + (tick / 100) * barrelWidth;
          return (
            <G key={`tick-${tick}`}>
              <Line x1={x} y1={barrelY} x2={x} y2={barrelY + 10} stroke="#94a3b8" strokeWidth="1.5" />
              {tick % 20 === 0 && (
                <SvgText x={x} y={barrelY + 22} fill="#94a3b8" fontSize="8" fontWeight="700" textAnchor="middle">
                  {tick}
                </SvgText>
              )}
            </G>
          );
        })}

        {/* Target Pointer */}
        <G transform={`translate(${plungerX}, ${barrelY + barrelHeight + 4})`}>
          <Line x1="0" y1="0" x2="0" y2="8" stroke="#10b981" strokeWidth="2" />
          <SvgText x="0" y="19" fill="#10b981" fontSize="9" fontWeight="800" textAnchor="middle">
            Garis {boundedUnits} IU
          </SvgText>
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#090d16',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#34d399',
    fontFamily: 'Courier',
  },
});
