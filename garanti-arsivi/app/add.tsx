import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator, Alert, ScrollView, Animated } from 'react-native';
import { useState, useRef } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { uploadInvoice } from '../src/services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const CATEGORIES = ['Elektronik', 'Ev Aletleri', 'Giyim', 'Diğer'];

export default function AddScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Elektronik');

  const scaleAnim1 = useRef(new Animated.Value(1)).current;
  const scaleAnim2 = useRef(new Animated.Value(1)).current;

  const animatePressIn = (anim: Animated.Value) => {
    Animated.spring(anim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const animatePressOut = (anim: Animated.Value) => {
    Animated.spring(anim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setResult(null);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Hata', 'Kamera izni gerekiyor.');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!image) return;
    
    setLoading(true);
    try {
      const filename = image.split('/').pop() || 'invoice.jpg';
      const type = 'image/jpeg';
      
      const response = await uploadInvoice(image, filename, type, selectedCategory);
      setResult(response.data.text);
      Alert.alert('Başarılı', 'Fatura başarıyla okundu ve ' + selectedCategory + ' kategorisine kaydedildi!');
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Yükleme başarısız.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0f1016', '#000000']} style={{ flex: 1 }}>
      <View style={styles.headerGlow} />
      <ScrollView contentContainerStyle={styles.container}>
        {!image ? (
          <View style={styles.buttonContainer}>
            <Animated.View style={{ width: '100%', marginBottom: 20, transform: [{ scale: scaleAnim1 }] }}>
              <Pressable 
                onPressIn={() => animatePressIn(scaleAnim1)}
                onPressOut={() => animatePressOut(scaleAnim1)}
                onPress={takePhoto} 
                style={{ width: '100%' }}
              >
                <LinearGradient 
                  colors={['#8b5cf6', '#6d28d9']} 
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.actionButton}
                >
                  <Ionicons name="camera" size={32} color="#fff" />
                  <Text style={styles.buttonText}>Fotoğraf Çek ve Tarat</Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
            
            <Animated.View style={{ width: '100%', transform: [{ scale: scaleAnim2 }] }}>
              <Pressable 
                onPressIn={() => animatePressIn(scaleAnim2)}
                onPressOut={() => animatePressOut(scaleAnim2)}
                onPress={pickImage} 
                style={{ width: '100%' }}
              >
                <BlurView intensity={30} tint="dark" style={styles.blurButtonContainer}>
                  <LinearGradient 
                    colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']} 
                    style={[styles.actionButton, { backgroundColor: 'transparent' }]}
                  >
                    <Ionicons name="images" size={32} color="#a1a1aa" />
                    <Text style={[styles.buttonText, { color: '#e4e4e7' }]}>Galeriden Seç</Text>
                  </LinearGradient>
                </BlurView>
              </Pressable>
            </Animated.View>
          </View>
        ) : (
          <View style={styles.previewContainer}>
            <View style={styles.imageWrapper}>
              <Image source={{ uri: image }} style={styles.image} />
            </View>
            
            <Text style={styles.label}>Kategori Seçin</Text>
            <View style={styles.categoryContainer}>
              {CATEGORIES.map(cat => {
                const isActive = selectedCategory === cat;
                return (
                  <Pressable key={cat} onPress={() => setSelectedCategory(cat)}>
                    <LinearGradient
                      colors={isActive ? ['#8b5cf6', '#6d28d9'] : ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
                      style={[styles.categoryBadge, !isActive && { borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }]}
                    >
                      <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>{cat}</Text>
                    </LinearGradient>
                  </Pressable>
                );
              })}
            </View>

            {result && (
              <BlurView intensity={20} tint="dark" style={styles.resultBoxWrapper}>
                <LinearGradient colors={['rgba(139, 92, 246, 0.15)', 'rgba(109, 40, 217, 0.05)']} style={styles.resultBox}>
                  <Text style={styles.resultTitle}>Çıkarılan Metin (OCR Sonucu)</Text>
                  <Text style={styles.resultText}>{result}</Text>
                </LinearGradient>
              </BlurView>
            )}

            <View style={styles.actionRow}>
              <Pressable style={styles.secondaryButton} onPress={() => { setImage(null); setResult(null); }}>
                <Text style={styles.secondaryButtonText}>İptal</Text>
              </Pressable>
              
              <Pressable style={{ flex: 2 }} onPress={handleUpload} disabled={loading}>
                <LinearGradient 
                  colors={loading ? ['#3f3f46', '#27272a'] : ['#8b5cf6', '#6d28d9']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryButtonText}>OCR & Kaydet</Text>
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
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  headerGlow: { position: 'absolute', top: '20%', right: -100, width: 300, height: 300, backgroundColor: '#8b5cf6', borderRadius: 150, opacity: 0.1, filter: 'blur(50px)' },
  buttonContainer: { alignItems: 'center', width: '100%' },
  blurButtonContainer: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  actionButton: { width: '100%', padding: 24, borderRadius: 24, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 16, shadowColor: '#8b5cf6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  buttonText: { color: '#ffffff', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  previewContainer: { flex: 1, alignItems: 'center', marginTop: 10 },
  imageWrapper: { width: '100%', borderRadius: 24, padding: 4, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 28 },
  image: { width: '100%', height: 320, borderRadius: 20 },
  label: { color: '#a1a1aa', fontSize: 13, alignSelf: 'flex-start', marginBottom: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  categoryContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32, width: '100%' },
  categoryBadge: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 16 },
  categoryText: { color: '#a1a1aa', fontWeight: '700', fontSize: 14 },
  categoryTextActive: { color: '#ffffff', fontWeight: '800' },
  actionRow: { flexDirection: 'row', gap: 16, width: '100%', marginTop: 'auto', marginBottom: 20, paddingTop: 10 },
  primaryButton: { padding: 20, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#8b5cf6', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  primaryButtonDisabled: { opacity: 0.8, shadowOpacity: 0 },
  primaryButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  secondaryButton: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', padding: 20, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  secondaryButtonText: { color: '#e4e4e7', fontSize: 16, fontWeight: '700' },
  resultBoxWrapper: { width: '100%', borderRadius: 20, overflow: 'hidden', marginBottom: 28, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.3)' },
  resultBox: { width: '100%', padding: 20 },
  resultTitle: { color: '#a78bfa', fontWeight: '800', marginBottom: 10, letterSpacing: 0.5, fontSize: 13, textTransform: 'uppercase' },
  resultText: { color: '#e4e4e7', fontSize: 15, lineHeight: 24 }
});
