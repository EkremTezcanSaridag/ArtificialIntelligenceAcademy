import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Animated, Pressable, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback, useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, router } from 'expo-router';
import { fetchInvoices, deleteInvoice } from '../src/services/api';
import { BlurView } from 'expo-blur';
import { useTheme } from '../src/context/ThemeContext';
import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [warranties, setWarranties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'warranty' | 'invoice'>('warranty');
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
      setWarranties(data || []);
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
        setWarranties(prev => prev.filter(item => item.id !== id));
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
      if (window.confirm('Bu belgeyi arşivden kalıcı olarak silmek istediğinize emin misiniz?')) {
        await performDelete();
      }
    } else {
      Alert.alert(
        'Belgeyi Sil',
        'Bu belgeyi arşivden kalıcı olarak silmek istediğinize emin misiniz?',
        [
          { text: 'Vazgeç', style: 'cancel' },
          { text: 'Sil', style: 'destructive', onPress: performDelete }
        ]
      );
    }
  };

  const filteredData = activeTab === 'warranty' 
    ? warranties.filter(item => item.type === 'warranty' || !item.type)
    : warranties.filter(item => item.type === 'invoice');

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Elektronik': return 'hardware-chip-outline';
      case 'Ev Aletleri': return 'home-outline';
      case 'Giyim': return 'shirt-outline';
      case 'Faturalar': return 'receipt-outline';
      default: return 'cube-outline';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => {
    return (
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <Pressable 
          style={({ pressed }) => [
            styles.cardContainer,
            { transform: [{ scale: pressed ? 0.98 : 1 }] }
          ]}
        >
          <BlurView intensity={isDark ? 30 : 60} tint={isDark ? "dark" : "light"} style={[styles.cardBlur, { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
            <LinearGradient 
              colors={isDark ? ['rgba(99, 102, 241, 0.1)', 'rgba(255, 255, 255, 0.02)'] : ['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.6)']} 
              style={styles.card}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                  <LinearGradient colors={['#6366f1', '#4338ca']} style={styles.iconGradient} start={{x:0, y:0}} end={{x:1, y:1}}>
                    <Ionicons name={getCategoryIcon(item.category) as any} size={20} color="#fff" />
                  </LinearGradient>
                </View>
                <View style={styles.headerTextContainer}>
                  <Text style={[styles.productName, { color: isDark ? '#ffffff' : '#09090b' }]} numberOfLines={1}>{item.filename}</Text>
                  <Text style={styles.categoryBadgeText}>{item.category || 'Diğer'}</Text>
                </View>
                <Pressable 
                  style={({ pressed }) => [styles.deleteBtn, { opacity: pressed ? 0.5 : 1 }]} 
                  onPress={() => handleDelete(item.id)}
                >
                   <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </Pressable>
              </View>
              
              <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} />

              <View style={styles.cardFooter}>
                <View style={styles.dateBox}>
                  <Ionicons name="calendar-outline" size={14} color="#a1a1aa" style={{marginRight: 6}} />
                  <Text style={[styles.dateValue, { color: isDark ? '#e4e4e7' : '#18181b' }]}>{formatDate(item.created_at)}</Text>
                </View>
                <Text style={styles.ocrText}>
                  <Ionicons name="scan-outline" size={14} /> Yapay Zeka Onaylı
                </Text>
              </View>
            </LinearGradient>
          </BlurView>
        </Pressable>
      </Animated.View>
    );
  };

  if (loading && !refreshing) {
    return (
        <LinearGradient colors={isDark ? ['#050505', '#0a0a1a'] : ['#f8fafc', '#f1f5f9']} style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color="#6366f1" />
        </LinearGradient>
    )
  }

  return (
    <LinearGradient colors={isDark ? ['#050505', '#0a0a1a'] : ['#f8fafc', '#f1f5f9']} style={styles.container}>
      {/* Background ambient light */}
      <Animated.View style={[styles.ambientLight, { transform: [{ scale: pulseAnim }] }]} />

      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Dijital Arşiv</Text>
          <Text style={styles.pageDescription}>Belgeleriniz yapay zeka güvencesiyle saklanıyor.</Text>
        </View>
      </Animated.View>

      {/* Modern Tab Switcher */}
      <View style={styles.tabWrapper}>
        <BlurView intensity={isDark ? 20 : 50} tint={isDark ? "dark" : "light"} style={[styles.tabContainer, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
          <Pressable onPress={() => setActiveTab('warranty')} style={styles.tab}>
            <LinearGradient
              colors={activeTab === 'warranty' ? ['#6366f1', '#4338ca'] : ['transparent', 'transparent']}
              style={[styles.tabGradient, activeTab === 'warranty' && styles.activeTabShadow]}
              start={{x:0, y:0}} end={{x:1, y:0}}
            >
              <Ionicons name="shield-checkmark" size={16} color={activeTab === 'warranty' ? '#fff' : (isDark ? '#71717a' : '#a1a1aa')} />
              <Text style={[styles.tabText, activeTab === 'warranty' && styles.activeTabText]}>Garantiler</Text>
            </LinearGradient>
          </Pressable>
          
          <Pressable onPress={() => setActiveTab('invoice')} style={styles.tab}>
            <LinearGradient
              colors={activeTab === 'invoice' ? ['#6366f1', '#4338ca'] : ['transparent', 'transparent']}
              style={[styles.tabGradient, activeTab === 'invoice' && styles.activeTabShadow]}
              start={{x:0, y:0}} end={{x:1, y:0}}
            >
              <Ionicons name="receipt" size={16} color={activeTab === 'invoice' ? '#fff' : (isDark ? '#71717a' : '#a1a1aa')} />
              <Text style={[styles.tabText, activeTab === 'invoice' && styles.activeTabText]}>Faturalar</Text>
            </LinearGradient>
          </Pressable>
        </BlurView>
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
        ListEmptyComponent={
          <Animated.View style={[styles.emptyState, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
             <View style={styles.emptyIconContainer}>
               <LinearGradient colors={['rgba(99, 102, 241, 0.2)', 'transparent']} style={styles.emptyIconBg} />
               <Ionicons name="planet-outline" size={80} color="#6366f1" style={styles.emptyIcon} />
             </View>
             <Text style={[styles.emptyTitle, { color: isDark ? '#ffffff' : '#09090b' }]}>Arşiv Boş</Text>
             <Text style={styles.emptyText}>Henüz bir kayıt bulunmuyor.{'\n'}Hemen yeni bir belge taratarak güvence altına alın.</Text>
             
             <Pressable style={styles.emptyAddButton} onPress={() => router.push('/add')}>
               <LinearGradient colors={['#6366f1', '#4338ca']} style={styles.emptyAddGradient} start={{x:0, y:0}} end={{x:1, y:1}}>
                 <Ionicons name="add" size={24} color="#fff" />
                 <Text style={styles.emptyAddText}>Belge Ekle</Text>
               </LinearGradient>
             </Pressable>
          </Animated.View>
        }
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  ambientLight: { position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(99, 102, 241, 0.15)', blurRadius: 50 },
  pageHeader: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 24, zIndex: 10 },
  pageTitle: { fontSize: 36, fontWeight: '900', color: '#6366f1', marginBottom: 8, letterSpacing: -1 },
  pageDescription: { color: '#a1a1aa', fontSize: 16, fontWeight: '500', lineHeight: 24 },
  tabWrapper: { paddingHorizontal: 24, zIndex: 10, marginBottom: 20 },
  tabContainer: { flexDirection: 'row', borderRadius: 20, borderWidth: 1, padding: 6, backgroundColor: 'rgba(0,0,0,0.02)', overflow: 'hidden' },
  tab: { flex: 1 },
  tabGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 16, gap: 8 },
  activeTabShadow: { shadowColor: '#6366f1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  tabText: { fontSize: 15, fontWeight: '700', color: '#a1a1aa', letterSpacing: 0.5 },
  activeTabText: { color: '#ffffff' },
  list: { padding: 24, paddingTop: 10, paddingBottom: 120 },
  cardContainer: { marginBottom: 20, borderRadius: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 8 },
  cardBlur: { borderRadius: 28, overflow: 'hidden', borderWidth: 1 },
  card: { padding: 20 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconContainer: { width: 48, height: 48, borderRadius: 16, overflow: 'hidden', marginRight: 16 },
  iconGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTextContainer: { flex: 1 },
  productName: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  categoryBadgeText: { color: '#a1a1aa', fontSize: 13, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  deleteBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(239, 68, 68, 0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)', zIndex: 10 },
  divider: { height: 1, width: '100%', marginBottom: 16 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(99, 102, 241, 0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  dateValue: { fontSize: 14, fontWeight: '700' },
  ocrText: { color: '#6366f1', fontSize: 13, fontWeight: '700' },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyIconContainer: { position: 'relative', width: 160, height: 160, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyIconBg: { position: 'absolute', width: 160, height: 160, borderRadius: 80 },
  emptyIcon: { zIndex: 1 },
  emptyTitle: { fontSize: 24, fontWeight: '900', marginBottom: 12, letterSpacing: -0.5 },
  emptyText: { color: '#71717a', textAlign: 'center', fontSize: 16, fontWeight: '500', lineHeight: 24, marginBottom: 32 },
  emptyAddButton: { shadowColor: '#6366f1', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  emptyAddGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 24, gap: 12 },
  emptyAddText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 }
});
