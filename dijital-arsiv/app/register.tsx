import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Animated, Dimensions, Image } from 'react-native';
import { supabase } from '../src/services/api';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { isDark } = useTheme();

  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(20));
  const [pulseAnim] = useState(new Animated.Value(1));
  const successSlideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true })
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true })
      ])
    ).start();
  }, []);

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      const msg = 'Lütfen tüm alanları doldurun.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Hata', msg);
      return;
    }

    if (password !== confirmPassword) {
      const msg = 'Şifreler uyuşmuyor. Lütfen tekrar kontrol edin.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Hata', msg);
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: { full_name: fullName }
      }
    });
    setLoading(false);

    if (error) {
      if (Platform.OS === 'web') {
        window.alert('Kayıt Başarısız: ' + error.message);
      } else {
        Alert.alert('Kayıt Başarısız', error.message);
      }
    } else {
      setShowSuccess(true);
      Animated.spring(successSlideAnim, {
        toValue: Platform.OS === 'ios' ? 60 : 40,
        useNativeDriver: true,
        friction: 8,
        tension: 40
      }).start();

      setTimeout(() => {
        router.back();
      }, 1500);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={isDark ? ['#050505', '#0a0a1a'] : ['#f8fafc', '#e2e8f0']} style={StyleSheet.absoluteFillObject} />
      
      {showSuccess && (
        <Animated.View style={[styles.toastContainer, { transform: [{ translateY: successSlideAnim }] }]}>
          <LinearGradient colors={['#10b981', '#059669']} style={styles.toastGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
            <Text style={styles.toastText}>Kayıt başarılı! Girişe yönlendiriliyorsunuz...</Text>
          </LinearGradient>
        </Animated.View>
      )}

      {/* Background Glowing Orbs */}
      <Animated.View style={[styles.orb1, { transform: [{ scale: pulseAnim }], opacity: isDark ? 0.4 : 0.6 }]} />
      <Animated.View style={[styles.orb2, { transform: [{ scale: pulseAnim }], opacity: isDark ? 0.3 : 0.5 }]} />

      <View style={{ paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingHorizontal: 16, zIndex: 10 }}>
        <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
        </Pressable>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <LinearGradient colors={['#10b981', '#3b82f6']} style={styles.logoGlow} />
              <View style={styles.logoInner}>
                <Image source={require('../assets/images/logo-transparent.png')} style={styles.logo} resizeMode="cover" />
              </View>
            </View>
            <Text style={[styles.title, { color: isDark ? '#ffffff' : '#09090b' }]}>Hesap Oluştur</Text>
            <Text style={styles.subtitle}>Dijital arşivini yaratmak için ücretsiz kayıt ol.</Text>
          </View>

          <BlurView intensity={isDark ? 30 : 60} tint={isDark ? "dark" : "light"} style={styles.formContainer}>
            <View style={styles.form}>
              <View style={[styles.inputGroup, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                <Ionicons name="person-outline" size={20} color={isDark ? '#a1a1aa' : '#71717a'} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: isDark ? '#ffffff' : '#000000' }]}
                  placeholder="Adınız ve Soyadınız"
                  placeholderTextColor={isDark ? '#52525b' : '#a1a1aa'}
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>

              <View style={[styles.inputGroup, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                <Ionicons name="mail-outline" size={20} color={isDark ? '#a1a1aa' : '#71717a'} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: isDark ? '#ffffff' : '#000000' }]}
                  placeholder="E-posta adresiniz"
                  placeholderTextColor={isDark ? '#52525b' : '#a1a1aa'}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={[styles.inputGroup, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                <Ionicons name="lock-closed-outline" size={20} color={isDark ? '#a1a1aa' : '#71717a'} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: isDark ? '#ffffff' : '#000000' }]}
                  placeholder="Şifreniz (En az 6 karakter)"
                  placeholderTextColor={isDark ? '#52525b' : '#a1a1aa'}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={10} style={{ padding: 10 }}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={isDark ? '#a1a1aa' : '#71717a'} />
                </Pressable>
              </View>

              <View style={[styles.inputGroup, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                <Ionicons name="lock-closed-outline" size={20} color={isDark ? '#a1a1aa' : '#71717a'} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: isDark ? '#ffffff' : '#000000' }]}
                  placeholder="Şifrenizi Onaylayın"
                  placeholderTextColor={isDark ? '#52525b' : '#a1a1aa'}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                />
              </View>

              <Pressable 
                style={({ pressed }) => [styles.loginButton, { opacity: pressed || loading ? 0.8 : 1 }]} 
                onPress={handleRegister}
                disabled={loading}
              >
                <LinearGradient colors={['#10b981', '#059669']} style={styles.loginGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginButtonText}>Kayıt Ol</Text>}
                </LinearGradient>
              </Pressable>
            </View>
          </BlurView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  orb1: { position: 'absolute', top: -height * 0.1, left: -width * 0.2, width: width * 0.8, height: width * 0.8, borderRadius: width * 0.4, backgroundColor: '#10b981', filter: 'blur(80px)' },
  orb2: { position: 'absolute', bottom: -height * 0.1, right: -width * 0.2, width: width * 0.8, height: width * 0.8, borderRadius: width * 0.4, backgroundColor: '#3b82f6', filter: 'blur(80px)' },
  keyboardView: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: 24, marginTop: -20, maxWidth: 500, width: '100%', alignSelf: 'center' },
  header: { alignItems: 'center', marginBottom: 32 },
  logoContainer: { width: 90, height: 90, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  logoGlow: { position: 'absolute', width: '100%', height: '100%', borderRadius: 45, opacity: 0.5, filter: 'blur(15px)' },
  logoInner: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', overflow: 'hidden' },
  logo: { width: '100%', height: '100%' },
  title: { fontSize: 32, fontWeight: '900', marginBottom: 8, letterSpacing: 0.5 },
  subtitle: { fontSize: 16, color: '#71717a', lineHeight: 24 },
  formContainer: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  form: { padding: 24, gap: 16 },
  inputGroup: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  inputIcon: { paddingLeft: 16, paddingRight: 8 },
  input: { flex: 1, paddingVertical: 18, fontSize: 16, ...(Platform.OS === 'web' && { outlineStyle: 'none' } as any) },
  loginButton: { borderRadius: 16, overflow: 'hidden', marginTop: 8, shadowColor: '#10b981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  loginGradient: { paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
  loginButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  toastContainer: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', zIndex: 100 },
  toastGradient: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 30, gap: 10, shadowColor: '#10b981', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  toastText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 }
});
