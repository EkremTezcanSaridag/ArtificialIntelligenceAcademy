import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Arka plandaki dekoratif daireler
function FloatingCircle({
  size,
  top,
  left,
  delay,
  color,
}: {
  size: number;
  top: number;
  left: number;
  delay: number;
  color: string;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0.18,
            duration: 1800,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 1800,
            delay,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.3,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top,
        left,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
        transform: [{ scale }],
      }}
    />
  );
}

// Alt kısımdaki 3 noktalı yükleme animasyonu
function LoadingDots() {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
          Animated.timing(dot, {
            toValue: -10,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.delay(600 - i * 200),
        ])
      )
    );
    Animated.parallel(animations).start();
  }, []);

  return (
    <View style={styles.dotsContainer}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            { transform: [{ translateY: dot }] },
          ]}
        />
      ))}
    </View>
  );
}

export default function CustomSplash() {
  // Ana logo animasyonları
  const logoScale = useRef(new Animated.Value(0.4)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(30)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Logo açılışı
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // Başlık gelişi
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      // Alt yazı gelişi
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Glow pulse döngüsü
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowScale, {
          toValue: 1.3,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(glowScale, {
          toValue: 0.8,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <LinearGradient
      colors={['#0f0c29', '#302b63', '#24243e']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Arka plan dekoratif daireler */}
      <FloatingCircle size={260} top={-60}  left={-80}  delay={0}    color="#6366f1" />
      <FloatingCircle size={180} top={120}  left={width - 120} delay={400}  color="#818cf8" />
      <FloatingCircle size={220} top={height - 180} left={30} delay={800} color="#4f46e5" />
      <FloatingCircle size={140} top={height / 2} left={width - 80} delay={200} color="#a78bfa" />

      {/* Merkez içerik */}
      <View style={styles.center}>
        {/* Glow halkası */}
        <Animated.View
          style={[
            styles.glow,
            { transform: [{ scale: glowScale }] },
          ]}
        />

        {/* Logo kutusu */}
        <Animated.View
          style={[
            styles.logoBox,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Text style={styles.logoIcon}>🛡️</Text>
        </Animated.View>

        {/* Başlık */}
        <Animated.Text
          style={[
            styles.title,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
        >
          Garanti Arşivi
        </Animated.Text>

        {/* Alt başlık */}
        <Animated.Text
          style={[styles.subtitle, { opacity: subtitleOpacity }]}
        >
          Belgeleriniz güvende
        </Animated.Text>

        {/* Yükleme noktaları */}
        <Animated.View style={{ opacity: subtitleOpacity }}>
          <LoadingDots />
        </Animated.View>
      </View>

      {/* Alt versiyon yazısı */}
      <Animated.Text style={[styles.version, { opacity: subtitleOpacity }]}>
        v1.0.0
      </Animated.Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
  },
  logoBox: {
    width: 110,
    height: 110,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 24,
    elevation: 20,
  },
  logoIcon: {
    fontSize: 52,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1,
    marginBottom: 10,
    textShadowColor: 'rgba(99,102,241,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 40,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-end',
    height: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6366f1',
  },
  version: {
    position: 'absolute',
    bottom: 48,
    fontSize: 13,
    color: 'rgba(255,255,255,0.25)',
    fontWeight: '600',
    letterSpacing: 1,
  },
});
