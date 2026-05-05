import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator, Alert, ScrollView, Animated, Dimensions, Platform } from 'react-native';
import { useState, useRef } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { uploadInvoice } from '../src/services/api';
import { registerForPushNotificationsAsync, scheduleWarrantyNotification } from '../src/services/notifications';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../src/context/ThemeContext';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');
const CATEGORIES = ['Elektronik', 'Ev Aletleri', 'Giyim', 'Faturalar', 'Diğer'];

export default function AddScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Elektronik');
  const [documentType, setDocumentType] = useState<'warranty' | 'invoice'>('warranty');
  const [warrantyYears, setWarrantyYears] = useState<number>(2);
  const [notifyBefore, setNotifyBefore] = useState<'1_week' | '1_month' | 'both' | 'none'>('1_week');
  const { isDark } = useTheme();

  const scaleAnim1 = useRef(new Animated.Value(1)).current;
  const scaleAnim2 = useRef(new Animated.Value(1)).current;

  const animatePressIn = (anim: Animated.Value) => {
    Animated.spring(anim, { toValue: 0.95, useNativeDriver: true }).start();
  };
  const animatePressOut = (anim: Animated.Value) => {
    Animated.spring(anim, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }).start();
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.8 });
    if (!result.canceled) { 
      setImage(result.assets[0].uri); 
      setResult(null); 
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Hata', 'Kamera izni gerekiyor.'); return; }
    let result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
    if (!result.canceled) { 
      setImage(result.assets[0].uri); 
      setResult(null); 
    }
  };

  const handleUpload = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const filename = image.split('/').pop() || 'belge.jpg';
      const response = await uploadInvoice(image, filename, 'image/jpeg', selectedCategory, documentType);
      setResult(response.data.text);

      // Sadece garanti belgeleri için bildirim kur (Sadece mobilde)
      if (documentType === 'warranty' && notifyBefore !== 'none' && Platform.OS !== 'web') {
        try {
          await registerForPushNotificationsAsync();
          const expirationDate = new Date();
          expirationDate.setFullYear(expirationDate.getFullYear() + warrantyYears);
          await scheduleWarrantyNotification(filename, expirationDate, notifyBefore);
        } catch (notifErr) {
          console.log("Bildirim planlanamadı (Muhtemelen Web veya İzin yok):", notifErr);
        }
      }

      Alert.alert('Başarılı', 'Belge başarıyla okundu ve kaydedildi!', [{ text: 'Tamam', onPress: () => router.push('/') }]);
    } catch (error: any) {
      console.error("Upload handler error:", error);
      Alert.alert('İşlem Başarısız', error.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={isDark ? ['#050505', '#0a0a1a'] : ['#f8fafc', '#f1f5f9']} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        <View style={styles.pageHeader}>
          <View style={styles.iconCircle}>
            <Ionicons name="document-text-outline" size={32} color="#6366f1" />
          </View>
          <Text style={[styles.pageTitle, { color: isDark ? '#ffffff' : '#09090b' }]}>Yeni Belge</Text>
          <Text style={styles.pageDescription}>Yapay zeka ile anında tarayın ve dijital arşivinize güvenle kaydedin.</Text>
        </View>

        {!image ? (
          <View style={styles.buttonContainer}>
            <Animated.View style={{ width: '100%', marginBottom: 20, transform: [{ scale: scaleAnim1 }] }}>
              <Pressable onPressIn={() => animatePressIn(scaleAnim1)} onPressOut={() => animatePressOut(scaleAnim1)} onPress={takePhoto}>
                <LinearGradient colors={['#6366f1', '#4338ca']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionButton}>
                  <View style={styles.actionIconWrapper}>
                    <Ionicons name="camera" size={28} color="#6366f1" />
                  </View>
                  <View style={styles.actionTextWrapper}>
                    <Text style={styles.buttonTitle}>Kamera ile Tara</Text>
                    <Text style={styles.buttonSubtitle}>Belgenin fotoğrafını çek</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.5)" />
                </LinearGradient>
              </Pressable>
            </Animated.View>
            
            <Animated.View style={{ width: '100%', transform: [{ scale: scaleAnim2 }] }}>
              <Pressable onPressIn={() => animatePressIn(scaleAnim2)} onPressOut={() => animatePressOut(scaleAnim2)} onPress={pickImage}>
                <BlurView intensity={isDark ? 30 : 60} tint={isDark ? "dark" : "light"} style={[styles.blurButtonContainer, { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                  <LinearGradient colors={isDark ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)'] : ['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.4)']} style={styles.actionButtonSecondary}>
                    <View style={[styles.actionIconWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(99, 102, 241, 0.1)' }]}>
                      <Ionicons name="images" size={28} color={isDark ? "#ffffff" : "#6366f1"} />
                    </View>
                    <View style={styles.actionTextWrapper}>
                      <Text style={[styles.buttonTitle, { color: isDark ? '#ffffff' : '#09090b' }]}>Galeriden Seç</Text>
                      <Text style={styles.buttonSubtitleSecondary}>Cihazındaki fotoğrafı yükle</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"} />
                  </LinearGradient>
                </BlurView>
              </Pressable>
            </Animated.View>
          </View>
        ) : (
          <View style={styles.previewContainer}>
            <View style={[styles.imageWrapper, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
              <Image source={{ uri: image }} style={styles.image} />
              <Pressable style={styles.editImageBtn} onPress={() => setImage(null)}>
                 <Ionicons name="close" size={20} color="#fff" />
              </Pressable>
            </View>

            <Text style={styles.sectionTitle}>Belge Türü</Text>
            <View style={styles.categoryContainer}>
              {[
                { id: 'warranty', label: 'Garanti Belgesi', icon: 'shield-checkmark' },
                { id: 'invoice', label: 'Fatura', icon: 'receipt' }
              ].map(type => {
                const isActive = documentType === type.id;
                return (
                  <Pressable key={type.id} onPress={() => {
                    setDocumentType(type.id as any);
                    if (type.id === 'invoice') setSelectedCategory('Faturalar');
                  }}>
                    <LinearGradient
                      colors={isActive ? ['#6366f1', '#4338ca'] : (isDark ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)'] : ['rgba(0,0,0,0.03)', 'rgba(0,0,0,0.01)'])}
                      style={[styles.categoryBadge, !isActive && { borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
                      start={{x:0, y:0}} end={{x:1, y:1}}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name={type.icon as any} size={16} color={isActive ? '#fff' : (isDark ? '#71717a' : '#a1a1aa')} />
                        <Text style={[styles.categoryText, { color: isActive ? '#ffffff' : (isDark ? '#a1a1aa' : '#52525b') }, isActive && styles.categoryTextActive]}>{type.label}</Text>
                      </View>
                    </LinearGradient>
                  </Pressable>
                );
              })}
            </View>
            
            <Text style={styles.sectionTitle}>Kategori</Text>
            <View style={styles.categoryContainer}>
              {CATEGORIES.map(cat => {
                const isActive = selectedCategory === cat;
                return (
                  <Pressable key={cat} onPress={() => setSelectedCategory(cat)}>
                    <LinearGradient
                      colors={isActive ? ['#6366f1', '#4338ca'] : (isDark ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)'] : ['rgba(0,0,0,0.03)', 'rgba(0,0,0,0.01)'])}
                      style={[styles.categoryBadge, !isActive && { borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
                      start={{x:0, y:0}} end={{x:1, y:1}}
                    >
                      <Text style={[styles.categoryText, { color: isActive ? '#ffffff' : (isDark ? '#a1a1aa' : '#52525b') }, isActive && styles.categoryTextActive]}>{cat}</Text>
                    </LinearGradient>
                  </Pressable>
                );
              })}
            </View>

            {documentType === 'warranty' && (
              <>
                <Text style={styles.sectionTitle}>Garanti Süresi</Text>
                <View style={styles.categoryContainer}>
                  {[1, 2, 3].map(year => {
                    const isActive = warrantyYears === year;
                    return (
                      <Pressable key={year} onPress={() => setWarrantyYears(year)}>
                        <LinearGradient
                          colors={isActive ? ['#6366f1', '#4338ca'] : (isDark ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)'] : ['rgba(0,0,0,0.03)', 'rgba(0,0,0,0.01)'])}
                          style={[styles.categoryBadge, !isActive && { borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
                          start={{x:0, y:0}} end={{x:1, y:1}}
                        >
                          <Text style={[styles.categoryText, { color: isActive ? '#ffffff' : (isDark ? '#a1a1aa' : '#52525b') }, isActive && styles.categoryTextActive]}>{year} Yıl</Text>
                        </LinearGradient>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.sectionTitle}>Bildirim Tercihi</Text>
                <View style={styles.categoryContainer}>
                  {[
                    { id: '1_week', label: '1 Hafta Kala' },
                    { id: '1_month', label: '1 Ay Kala' },
                    { id: 'both', label: 'İkisi de' },
                    { id: 'none', label: 'İstemiyorum' }
                  ].map(opt => {
                    const isActive = notifyBefore === opt.id;
                    return (
                      <Pressable key={opt.id} onPress={() => setNotifyBefore(opt.id as any)}>
                        <LinearGradient
                          colors={isActive ? ['#6366f1', '#4338ca'] : (isDark ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)'] : ['rgba(0,0,0,0.03)', 'rgba(0,0,0,0.01)'])}
                          style={[styles.categoryBadge, !isActive && { borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
                          start={{x:0, y:0}} end={{x:1, y:1}}
                        >
                          <Text style={[styles.categoryText, { color: isActive ? '#ffffff' : (isDark ? '#a1a1aa' : '#52525b') }, isActive && styles.categoryTextActive]}>{opt.label}</Text>
                        </LinearGradient>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            {result && (
              <BlurView intensity={isDark ? 20 : 50} tint={isDark ? "dark" : "light"} style={styles.resultBoxWrapper}>
                <LinearGradient colors={isDark ? ['rgba(99, 102, 241, 0.15)', 'rgba(67, 56, 202, 0.05)'] : ['rgba(99, 102, 241, 0.08)', 'rgba(67, 56, 202, 0.02)']} style={styles.resultBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}>
                    <Ionicons name="sparkles" size={16} color="#6366f1" />
                    <Text style={styles.resultTitle}>Yapay Zeka Analizi</Text>
                  </View>
                  <Text style={[styles.resultText, { color: isDark ? '#e4e4e7' : '#18181b' }]}>{result}</Text>
                </LinearGradient>
              </BlurView>
            )}

            <View style={styles.actionRow}>
              <Pressable style={styles.saveButton} onPress={handleUpload} disabled={loading}>
                <LinearGradient 
                  colors={loading ? (isDark ? ['#3f3f46', '#27272a'] : ['#d4d4d8', '#a1a1aa']) : ['#6366f1', '#4338ca']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={[styles.saveButtonGradient, loading && styles.saveButtonDisabled]}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={24} color="#fff" style={{marginRight: 8}} />
                      <Text style={styles.saveButtonText}>Analiz Et & Kaydet</Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, paddingTop: 40, paddingBottom: 100 },
  pageHeader: { marginBottom: 40, alignItems: 'center' },
  iconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(99, 102, 241, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(99, 102, 241, 0.2)' },
  pageTitle: { fontSize: 28, fontWeight: '900', marginBottom: 12, letterSpacing: -0.5 },
  pageDescription: { color: '#a1a1aa', fontSize: 16, fontWeight: '500', lineHeight: 24, textAlign: 'center', paddingHorizontal: 20 },
  buttonContainer: { width: '100%', gap: 0 },
  blurButtonContainer: { borderRadius: 28, overflow: 'hidden', borderWidth: 1 },
  actionButton: { width: '100%', padding: 24, borderRadius: 28, flexDirection: 'row', alignItems: 'center', shadowColor: '#6366f1', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 12 },
  actionButtonSecondary: { width: '100%', padding: 24, borderRadius: 28, flexDirection: 'row', alignItems: 'center' },
  actionIconWrapper: { width: 56, height: 56, borderRadius: 20, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', marginRight: 20 },
  actionTextWrapper: { flex: 1, justifyContent: 'center' },
  buttonTitle: { color: '#ffffff', fontSize: 18, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  buttonSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500' },
  buttonSubtitleSecondary: { color: '#a1a1aa', fontSize: 14, fontWeight: '500' },
  previewContainer: { flex: 1, width: '100%' },
  imageWrapper: { width: '100%', borderRadius: 32, padding: 6, borderWidth: 1, marginBottom: 32, backgroundColor: 'rgba(0,0,0,0.02)', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  image: { width: '100%', height: 380, borderRadius: 26 },
  editImageBtn: { position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  sectionTitle: { color: '#a1a1aa', fontSize: 14, marginBottom: 16, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  categoryContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 40 },
  categoryBadge: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 20 },
  categoryText: { fontWeight: '700', fontSize: 15 },
  categoryTextActive: { fontWeight: '800' },
  actionRow: { width: '100%', marginTop: 'auto', paddingTop: 20 },
  saveButton: { width: '100%', shadowColor: '#6366f1', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 },
  saveButtonGradient: { flexDirection: 'row', padding: 24, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  saveButtonDisabled: { opacity: 0.7, shadowOpacity: 0 },
  saveButtonText: { color: '#ffffff', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  resultBoxWrapper: { width: '100%', borderRadius: 24, overflow: 'hidden', marginBottom: 32, borderWidth: 1, borderColor: 'rgba(99, 102, 241, 0.3)' },
  resultBox: { width: '100%', padding: 24 },
  resultTitle: { color: '#6366f1', fontWeight: '900', letterSpacing: 0.5, fontSize: 14, textTransform: 'uppercase' },
  resultText: { fontSize: 16, lineHeight: 26, fontWeight: '500' }
});
