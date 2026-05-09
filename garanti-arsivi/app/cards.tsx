import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  RefreshControl, Animated, Pressable, Platform, Modal, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback, useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, router } from 'expo-router';
import { fetchInvoices, deleteInvoice, updateInvoiceText } from '../src/services/api';
import { BlurView } from 'expo-blur';
import { useTheme } from '../src/context/ThemeContext';
import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';

export default function CardsScreen() {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedCardRawText, setSelectedCardRawText] = useState<string>('');
  const [newDebt, setNewDebt] = useState('');
  const [newExpenseDetail, setNewExpenseDetail] = useState('');
  const [updating, setUpdating] = useState(false);
  const [currentExpenses, setCurrentExpenses] = useState<{detail: string, amount: number}[]>([]);

  const { isDark } = useTheme();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const startAnimations = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(40);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true })
    ]).start();
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const loadData = async () => {
    try {
      const data = await fetchInvoices();
      setCards((data || []).filter(item => item.type === 'kart'));
      startAnimations();
    } catch (error) {
      console.error("Veri çekilemedi:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { setLoading(true); loadData(); }, []));

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const handleDelete = async (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    const performDelete = async () => {
      try {
        await deleteInvoice(id);
        setCards(prev => prev.filter(item => item.id !== id));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        if (Platform.OS === 'web') {
          window.alert('Silme işlemi başarısız oldu.');
        } else {
          Alert.alert('Hata', 'Silme işlemi başarısız oldu.');
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Bu kartı silmek istediğinize emin misiniz?')) {
        await performDelete();
      }
    } else {
      Alert.alert(
        'Kartı Sil',
        'Bu kartı kalıcı olarak silmek istediğinize emin misiniz?',
        [
          { text: 'Vazgeç', style: 'cancel' },
          { text: 'Sil', style: 'destructive', onPress: performDelete }
        ]
      );
    }
  };

  const handleUpdateDebt = async () => {
    if (!newDebt || !selectedCardId || !newExpenseDetail) {
      Alert.alert('Eksik Bilgi', 'Lütfen harcama detayını ve tutarı girin.');
      return;
    }
    setUpdating(true);
    try {
      let updatedText = selectedCardRawText;
      // Eski tekil 'Güncel Borç' sistemini temizle
      updatedText = updatedText.replace(/\nGüncel Borç:\s*[\d.,]+\s*TL/g, '');
      
      // Yeni harcamayı ekle
      updatedText += `\nHarcama: ${newExpenseDetail} | ${newDebt}`;

      await updateInvoiceText(selectedCardId, updatedText);
      setUpdateModalVisible(false);
      setNewDebt('');
      setNewExpenseDetail('');
      loadData(); 
    } catch(e) {
      Alert.alert("Hata", "Eklenirken bir sorun oluştu.");
    } finally {
      setUpdating(false);
    }
  };

  const parseExpenses = (rawText: string) => {
    let total = 0;
    const expenses: { detail: string, amount: number }[] = [];
    if (!rawText) return { total, expenses };
    
    const lines = rawText.split('\n');
    for (const line of lines) {
      if (line.startsWith('Harcama:')) {
        const parts = line.replace('Harcama:', '').split('|');
        if (parts.length === 2) {
          const amount = parseFloat(parts[1].trim());
          if (!isNaN(amount)) {
            expenses.push({ detail: parts[0].trim(), amount });
            total += amount;
          }
        }
      }
    }
    
    const oldBorcMatch = rawText.match(/Güncel Borç:\s*([\d.,]+)/);
    if (oldBorcMatch) total += parseFloat(oldBorcMatch[1]);
    
    return { total, expenses };
  };

  const renderItem = ({ item }: { item: any }) => {
    const tutarMatch = item.raw_text?.match(/Tutar:\s*([\d.,]+)/);
    const tarihMatch = item.raw_text?.match(/Tarih:\s*([\d.]+)/);
    const { total: totalDebt, expenses } = parseExpenses(item.raw_text);
    
    return (
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], marginBottom: 16 }}>
        <LinearGradient
          colors={['#ec4899', '#be185d']}
          style={{ padding: 24, borderRadius: 24, shadowColor: '#ec4899', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 10 }}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <Ionicons name="card" size={36} color="rgba(255,255,255,0.9)" />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontWeight: '700', letterSpacing: 1 }}>{item.category}</Text>
              <Pressable onPress={() => handleDelete(item.id)} hitSlop={15}>
                <Ionicons name="trash-outline" size={20} color="rgba(255,255,255,0.8)" />
              </Pressable>
            </View>
          </View>
          
          <Text style={{ color: 'white', fontSize: 24, fontWeight: '900', letterSpacing: 1.5, marginBottom: 8 }} numberOfLines={1}>
            {item.filename}
          </Text>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 }}>
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '800', marginBottom: 4 }}>KART LİMİTİ</Text>
              <Text style={{ color: 'white', fontSize: 18, fontWeight: '800' }}>{tutarMatch ? tutarMatch[1] : '0'} TL</Text>
            </View>
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '800', marginBottom: 4 }}>TOPLAM BORÇ</Text>
              <Text style={{ color: '#fbcfe8', fontSize: 18, fontWeight: '800' }}>{totalDebt} TL</Text>
            </View>
          </View>
          
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
            {expenses.length > 0 && (
              <Pressable 
                onPress={() => {
                  setCurrentExpenses(expenses);
                  setHistoryModalVisible(true);
                }}
                style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 10, borderRadius: 12, alignItems: 'center' }}
              >
                <Text style={{ color: 'white', fontWeight: '800', fontSize: 12, letterSpacing: 0.5 }}>GEÇMİŞ</Text>
              </Pressable>
            )}
            <Pressable 
              onPress={() => {
                setSelectedCardId(item.id);
                setSelectedCardRawText(item.raw_text || '');
                setNewDebt('');
                setNewExpenseDetail('');
                setUpdateModalVisible(true);
              }}
              style={{ flex: expenses.length > 0 ? 2 : 1, backgroundColor: 'rgba(255,255,255,0.25)', paddingVertical: 10, borderRadius: 12, alignItems: 'center' }}
            >
              <Text style={{ color: 'white', fontWeight: '800', fontSize: 12, letterSpacing: 0.5 }}>HARCAMA EKLE</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  if (loading && !refreshing) {
    return (
      <LinearGradient colors={isDark ? ['#050505', '#0a0a1a'] : ['#f8fafc', '#f1f5f9']} style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#ec4899" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={isDark ? ['#050505', '#0a0a1a'] : ['#f8fafc', '#f1f5f9']} style={styles.container}>
      <Animated.View style={[styles.ambientLight, { transform: [{ scale: pulseAnim }] }]} />

      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.pageHeader}>
          <Text style={[styles.pageTitle, { color: '#ec4899' }]}>Kartlarım</Text>
          <Text style={styles.pageDescription}>Dijital ve fiziksel tüm kartlarınız burada.</Text>
        </View>
      </Animated.View>

      <FlatList
        data={cards}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ec4899" />}
        ListEmptyComponent={
          <Animated.View style={[styles.emptyState, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.emptyIconContainer}>
              <View style={[styles.emptyIconBg, { backgroundColor: '#ec4899', opacity: 0.15 }]} />
              <Ionicons name="card" size={72} color="#ec4899" style={styles.emptyIcon} />
            </View>
            <Text style={[styles.emptyTitle, { color: isDark ? '#ffffff' : '#09090b' }]}>
              Kart Bulunamadı
            </Text>
            <Text style={styles.emptyText}>
              Henüz kayıtlı bir kartınız bulunmuyor.{'\n'}Hemen sağ alttaki butondan ekleyin.
            </Text>
          </Animated.View>
        }
      />

      <Pressable 
        style={({pressed}) => [styles.fab, { transform: [{ scale: pressed ? 0.95 : 1 }] }]} 
        onPress={() => router.push('/add?type=kart')}
      >
        <LinearGradient colors={['#ec4899', '#be185d']} style={styles.fabGradient} start={{x:0, y:0}} end={{x:1, y:1}}>
          <Ionicons name="add" size={30} color="#fff" />
        </LinearGradient>
      </Pressable>

      {/* Yeni Harcama Modalı */}
      <Modal visible={updateModalVisible} animationType="fade" transparent={true}>
        <BlurView intensity={isDark ? 50 : 80} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ width: '100%', backgroundColor: isDark ? '#18181b' : '#ffffff', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
            <Text style={{ fontSize: 20, fontWeight: '800', marginBottom: 20, color: isDark ? '#fff' : '#000' }}>Yeni Harcama Ekle</Text>
            
            <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f4f4f5', borderRadius: 12, paddingHorizontal: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="pricetag-outline" size={20} color="#ec4899" />
              <TextInput
                style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 12, color: isDark ? '#fff' : '#000', fontSize: 15, fontWeight: '600' }}
                placeholder="Nereye harcadınız? (Örn: A101)"
                placeholderTextColor={isDark ? '#71717a' : '#a1a1aa'}
                value={newExpenseDetail}
                onChangeText={setNewExpenseDetail}
              />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f4f4f5', borderRadius: 12, paddingHorizontal: 16, marginBottom: 24 }}>
              <Ionicons name="cash-outline" size={20} color="#ec4899" />
              <TextInput
                style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 12, color: isDark ? '#fff' : '#000', fontSize: 16, fontWeight: '600' }}
                placeholder="Örn: 1500"
                placeholderTextColor={isDark ? '#71717a' : '#a1a1aa'}
                keyboardType="numeric"
                value={newDebt}
                onChangeText={setNewDebt}
              />
              <Text style={{ color: isDark ? '#a1a1aa' : '#71717a', fontWeight: '700' }}>TL</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable onPress={() => setUpdateModalVisible(false)} style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', alignItems: 'center' }}>
                <Text style={{ color: isDark ? '#fff' : '#000', fontWeight: '700' }}>İptal</Text>
              </Pressable>
              <Pressable onPress={handleUpdateDebt} style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#ec4899', alignItems: 'center' }}>
                {updating ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Kaydet</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Harcama Geçmişi Modalı */}
      <Modal visible={historyModalVisible} animationType="slide" transparent={true}>
        <BlurView intensity={isDark ? 50 : 80} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <View style={{ height: '70%', backgroundColor: isDark ? '#18181b' : '#ffffff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ fontSize: 24, fontWeight: '900', color: isDark ? '#fff' : '#000' }}>Harcama Geçmişi</Text>
              <Pressable onPress={() => setHistoryModalVisible(false)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="close" size={24} color={isDark ? '#a1a1aa' : '#52525b'} />
              </Pressable>
            </View>
            <FlatList
              data={currentExpenses}
              keyExtractor={(item, index) => index.toString()}
              showsVerticalScrollIndicator={false}
              renderItem={({item}) => (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(236, 72, 153, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="cart-outline" size={20} color="#ec4899" />
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: isDark ? '#fff' : '#000' }}>{item.detail}</Text>
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#ec4899' }}>{item.amount} TL</Text>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  ambientLight: { position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: 150, blurRadius: 50, backgroundColor: 'rgba(236,72,153,0.15)' },
  pageHeader: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 16, zIndex: 10 },
  pageTitle: { fontSize: 36, fontWeight: '900', marginBottom: 8, letterSpacing: -1 },
  pageDescription: { color: '#a1a1aa', fontSize: 16, fontWeight: '500', lineHeight: 24 },
  list: { padding: 20, paddingTop: 6, paddingBottom: 120 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyIconContainer: { position: 'relative', width: 160, height: 160, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyIconBg: { position: 'absolute', width: 160, height: 160, borderRadius: 80 },
  emptyIcon: { zIndex: 1 },
  emptyTitle: { fontSize: 24, fontWeight: '900', marginBottom: 12, letterSpacing: -0.5 },
  emptyText: { color: '#71717a', textAlign: 'center', fontSize: 16, fontWeight: '500', lineHeight: 24, marginBottom: 12 },
  fab: { position: 'absolute', bottom: 100, right: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 16, borderRadius: 32, backgroundColor: 'transparent' },
  fabGradient: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
});
