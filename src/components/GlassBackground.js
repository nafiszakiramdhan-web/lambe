import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function GlassBackground({ children, style }) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.bgBase }, style]}>
      {/* Ambient Glow Top Left */}
      <View pointerEvents="none" style={styles.glowTopContainer}>
        <LinearGradient
          colors={[theme.glow, 'transparent']}
          style={styles.glowCircleTop}
          start={{ x: 0.2, y: 0.2 }}
          end={{ x: 1, y: 1 }}
        />
      </View>

      {/* Ambient Glow Bottom Right */}
      <View pointerEvents="none" style={styles.glowBottomContainer}>
        <LinearGradient
          colors={[theme.glow, 'transparent']}
          style={styles.glowCircleBottom}
          start={{ x: 0.3, y: 0.3 }}
          end={{ x: 0, y: 0 }}
        />
      </View>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  glowTopContainer: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 340,
    height: 340,
    borderRadius: 170,
    overflow: 'hidden',
  },
  glowCircleTop: {
    width: '100%',
    height: '100%',
    borderRadius: 170,
  },
  glowBottomContainer: {
    position: 'absolute',
    bottom: -120,
    right: -100,
    width: 360,
    height: 360,
    borderRadius: 180,
    overflow: 'hidden',
  },
  glowCircleBottom: {
    width: '100%',
    height: '100%',
    borderRadius: 180,
  },
});
