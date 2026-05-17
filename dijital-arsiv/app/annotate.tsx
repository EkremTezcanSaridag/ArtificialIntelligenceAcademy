import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Dimensions, Platform, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import Svg, { Path, G } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../src/services/api';

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

interface Point {
  x: number;
  y: number;
}

interface DrawingPath {
  points: Point[];
  color: string;
  width: number;
  opacity: number;
}

export default function AnnotateScreen() {
  const { imageUrl, invoiceId, existingAnnotations } = useLocalSearchParams<{ imageUrl: string; invoiceId: string; existingAnnotations: string }>();
  const [paths, setPaths] = useState<DrawingPath[]>(existingAnnotations ? JSON.parse(existingAnnotations) : []);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [currentColor, setCurrentColor] = useState('#facc15'); // Sarı fosforlu kalem
  const [saving, setSaving] = useState(false);
  const [imgLayout, setImgLayout] = useState({ width: 0, height: 0, x: 0, y: 0 });

  const handleTouchStart = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    setCurrentPath([{ x: locationX, y: locationY }]);
  };

  const handleTouchMove = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    setCurrentPath((prev) => [...prev, { x: locationX, y: locationY }]);
  };

  const handleTouchEnd = () => {
    if (currentPath.length > 0) {
      setPaths((prev) => [...prev, { 
        points: currentPath, 
        color: currentColor, 
        width: 12, 
        opacity: 0.5 
      }]);
      setCurrentPath([]);
    }
  };

  const handleSave = async () => {
    if (paths.length === 0) {
      router.back();
      return;
    }

    setSaving(true);
    try {
      // Annotations'ları faturanın raw_text alanına veya yeni bir alana kaydedeceğiz.
      // Mevcut yapıda yeni bir kolon açamadığımız için raw_text sonuna ekliyoruz.
      const { data: record } = await supabase
        .from('invoices')
        .select('raw_text')
        .eq('id', invoiceId)
        .single();

      let baseText = record?.raw_text || '';
      // Eğer zaten annotation varsa temizle (regex ile)
      baseText = baseText.replace(/\[MARKUP_DATA\][\s\S]*$/, '');
      
      const updatedText = `${baseText.trim()}\n\n[MARKUP_DATA]${JSON.stringify(paths)}`;

      const { error } = await supabase
        .from('invoices')
        .update({ raw_text: updatedText })
        .eq('id', invoiceId);

      if (error) throw error;
      
      Alert.alert('Başarılı', 'İşaretlemeler kaydedildi.');
      router.back();
    } catch (error: any) {
      Alert.alert('Hata', 'Kaydedilemedi: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUndo = () => {
    setPaths((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPaths([]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
          <View style={styles.actionGroup}>
            <Pressable onPress={handleUndo} style={styles.toolbarBtn}>
              <Ionicons name="arrow-undo" size={20} color="#fff" />
            </Pressable>
            <Pressable onPress={handleClear} style={styles.toolbarBtn}>
              <Ionicons name="trash-outline" size={20} color="#fff" />
            </Pressable>
          </View>
        </View>
        
        <View style={styles.colorPickerHeader}>
          {['#facc15', '#4ade80', '#60a5fa', '#f87171'].map((color) => (
            <Pressable 
              key={color}
              onPress={() => setCurrentColor(color)}
              style={[
                styles.colorCircleSmall, 
                { backgroundColor: color },
                currentColor === color && styles.colorCircleActiveSmall
              ]}
            />
          ))}
        </View>

        <Pressable onPress={handleSave} disabled={saving} style={styles.saveBtn}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Kaydet</Text>}
        </Pressable>
      </View>

      {/* Canvas Area */}
      <View style={styles.canvasContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.backgroundImage}
          resizeMode="contain"
          onLayout={(e) => setImgLayout(e.nativeEvent.layout)}
        />
        
        <View 
          style={styles.svgOverlay}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={handleTouchStart}
          onResponderMove={handleTouchMove}
          onResponderRelease={handleTouchEnd}
        >
          <Svg width="100%" height="100%">
            <G>
              {paths.map((path, index) => (
                <Path
                  key={index}
                  d={`M ${path.points.map(p => `${p.x} ${p.y}`).join(' L ')}`}
                  stroke={path.color}
                  strokeWidth={path.width}
                  strokeOpacity={path.opacity}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
              {currentPath.length > 0 && (
                <Path
                  d={`M ${currentPath.map(p => `${p.x} ${p.y}`).join(' L ')}`}
                  stroke={currentColor}
                  strokeWidth={12}
                  strokeOpacity={0.5}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </G>
          </Svg>
        </View>
      </View>
    </View>
  );
}

// StatusBar importu yukarı taşındı.

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 20, backgroundColor: 'rgba(0,0,0,0.8)' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  saveBtn: { backgroundColor: '#6366f1', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  saveBtnText: { color: '#fff', fontWeight: '800' },
  colorPickerHeader: { flexDirection: 'row', gap: 12 },
  colorCircleSmall: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  colorCircleActiveSmall: { borderColor: '#fff', transform: [{ scale: 1.2 }] },
  canvasContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backgroundImage: { width: '100%', height: '100%' },
  svgOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  actionGroup: { flexDirection: 'row', gap: 8 },
  toolbarBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' }
});
