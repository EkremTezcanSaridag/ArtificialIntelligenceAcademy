import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  RefreshControl, Animated, Pressable, Dimensions, Platform, ScrollView
} from 'react-native';
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

type TabType = 'warranty' | 'invoice' | 'mtv' | 'konut' | 'kontrat' | 'kredi';

interface TabConfig {
  id: TabType;
  label: string;
  icon: string;
  color: string;
  colors: [string, string];
}

const TABS: TabConfig[] = [
  { id: 'warranty',  label: 'Garantiler',     icon: 'shield-checkmark', color: '#6366f1', colors: ['#6366f1', '#4338ca'] },
  { id: 'invoice',   label: 'Faturalar',      icon: 'receipt',          color: '#0ea5e9', colors: ['#0ea5e9', '#0284c7'] },
  { id: 'mtv',       label: 'MTV',            icon: 'car-sport',        color: '#f59e0b', colors: ['#f59e0b', '#d97706'] },
  { id: 'konut',     label: 'Konut Vergisi',  icon: 'home',             color: '#10b981', colors: ['#10b981', '#059669'] },
  { id: 'kontrat',   label: 'Kontratlar',     icon: 'document-text',    color: '#8b5cf6', colors: ['#8b5cf6', '#7c3aed'] },
  { id: 'kredi',     label: 'Borçlarım',      icon: 'card',             color: '#ef4444', colors: ['#ef4444', '#dc2626'] },
];

export default function HomeScreen() {
  const [warranties, setWarranties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('warranty');
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

  const filteredData = warranties.filter(item => {
    if (activeTab === 'warranty') return item.type === 'warranty' || !item.type;
    return item.type === activeTab;
  });

  const activeTabConfig = TABS.find(t => t.id === activeTab) || TABS[0];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Elektronik': return 'hardware-chip-outline';
      case 'Ev Aletleri': return 'home-outline';
      case 'Giyim': return 'shirt-outline';
      case 'Faturalar': return 'receipt-outline';
      case 'MTV': return 'car-sport-outline';
      case 'Konut Vergisi': return 'home-outline';
      case 'Ev Sahibi Kontratı': return 'key-outline';
      case 'Kiracı Kontratı': return 'person-outline';
      case 'Kredi': return 'card-outline';
      default: return 'cube-outline';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
  };

  const getSubtitle = (item: any) => {
    if (item.type === 'mtv') return 'Motorlu Taşıt Vergisi';
    if (item.type === 'konut') return 'Konut Vergisi';
    if (item.type === 'kontrat') return item.category || 'Kontrat';
    if (item.type === 'kredi') return 'Borç Kaydı';
    return item.category || 'Diğer';
  };

  const renderItem = ({ item }: { item: any }) => {
    const tabCfg = TABS.find(t => t.id === (item.type || 'warranty')) || TABS[0];
    return (
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <Pressable
          style={({ pressed }) => [
            styles.cardContainer,
            { 
               backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
               borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
               transform: [{ scale: pressed ? 0.98 : 1 }] 
            }
          ]}
        >
          <View style={[styles.cardIndicator, { backgroundColor: tabCfg.color }]} />

          <View style={styles.cardContent}>
             <View style={[styles.iconContainer, { backgroundColor: tabCfg.color + '1a' }]}>
                <Ionicons name={getCategoryIcon(item.category) as any} size={24} color={tabCfg.color} />
             </View>

             <View style={styles.cardTextContainer}>
                <Text style={[styles.productName, { color: isDark ? '#ffffff' : '#09090b' }]} numberOfLines={1}>{item.filename}</Text>
                <View style={styles.badgeRow}>
                   <Text style={[styles.categoryBadgeText, { color: tabCfg.color }]}>{getSubtitle(item)}</Text>
                   <View style={styles.dot} />
                   <Text style={[styles.dateValue, { color: isDark ? '#71717a' : '#a1a1aa' }]}>{formatDate(item.created_at)}</Text>
                </View>
             </View>

             <Pressable
                style={({ pressed }) => [styles.deleteBtn, { opacity: pressed ? 0.5 : 1 }]}
                onPress={() => handleDelete(item.id)}
                hitSlop={15}
             >
                <View style={[styles.deleteIconBg, { backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.08)' }]}>
                   <Ionicons name="trash" size={18} color="#ef4444" />
                </View>
             </Pressable>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  if (loading && !refreshing) {
    return (
      <LinearGradient colors={isDark ? ['#050505', '#0a0a1a'] : ['#f8fafc', '#f1f5f9']} style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#6366f1" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={isDark ? ['#050505', '#0a0a1a'] : ['#f8fafc', '#f1f5f9']} style={styles.container}>
      <Animated.View style={[styles.ambientLight, { transform: [{ scale: pulseAnim }], backgroundColor: activeTabConfig.color + '26' }]} />

      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.pageHeader}>
          <Text style={[styles.pageTitle, { color: activeTabConfig.color }]}>Dijital Arşiv</Text>
          <Text style={styles.pageDescription}>Belgeleriniz yapay zeka güvencesiyle saklanıyor.</Text>
        </View>
      </Animated.View>

      <View style={styles.tabWrapper}>
        <View style={styles.tabGridContent}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <Pressable key={tab.id} onPress={() => setActiveTab(tab.id)} style={({pressed}) => [styles.tabPill, { transform: [{ scale: pressed ? 0.95 : 1 }] }]}>
                {isActive ? (
                  <LinearGradient
                    colors={tab.colors}
                    style={[styles.tabGradientActive, { shadowColor: tab.color }]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name={tab.icon as any} size={16} color="#fff" />
                    <Text style={styles.tabTextActive}>{tab.label}</Text>
                  </LinearGradient>
                ) : (
                  <BlurView intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} style={styles.tabInactiveBlur}>
                    <View style={[styles.tabGradientInactive, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                      <Ionicons name={tab.icon as any} size={16} color={isDark ? '#71717a' : '#a1a1aa'} />
                      <Text style={[styles.tabTextInactive, { color: isDark ? '#71717a' : '#a1a1aa' }]}>{tab.label}</Text>
                    </View>
                  </BlurView>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Count badge */}
      <View style={styles.countRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={[styles.countText, { color: isDark ? '#71717a' : '#a1a1aa' }]}>
            {filteredData.length} kayıt bulundu
          </Text>
          <View style={[styles.countDot, { backgroundColor: activeTabConfig.color }]} />
        </View>
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={activeTabConfig.color} />}
        ListEmptyComponent={
          <Animated.View style={[styles.emptyState, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.emptyIconContainer}>
              <LinearGradient colors={[activeTabConfig.color + '33', 'transparent']} style={styles.emptyIconBg} />
              <Ionicons name={activeTabConfig.icon as any} size={72} color={activeTabConfig.color} style={styles.emptyIcon} />
            </View>
            <Text style={[styles.emptyTitle, { color: isDark ? '#ffffff' : '#09090b' }]}>
              {activeTabConfig.label} Boş
            </Text>
            <Text style={styles.emptyText}>
              Henüz bir {activeTabConfig.label.toLowerCase()} kaydı bulunmuyor.{'\n'}Hemen sağ alttaki butondan ekleyin.
            </Text>
          </Animated.View>
        }
      />

      {/* Floating Action Button (FAB) */}
      <Pressable 
        style={({pressed}) => [styles.fab, { transform: [{ scale: pressed ? 0.95 : 1 }] }]} 
        onPress={() => router.push(`/add?type=${activeTab}`)}
      >
        <LinearGradient colors={activeTabConfig.colors} style={styles.fabGradient} start={{x:0, y:0}} end={{x:1, y:1}}>
          <Ionicons name="add" size={30} color="#fff" />
        </LinearGradient>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  ambientLight: { position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: 150, blurRadius: 50 },
  pageHeader: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 16, zIndex: 10 },
  pageTitle: { fontSize: 36, fontWeight: '900', marginBottom: 8, letterSpacing: -1 },
  pageDescription: { color: '#a1a1aa', fontSize: 16, fontWeight: '500', lineHeight: 24 },
  tabWrapper: { paddingHorizontal: 24, zIndex: 10, marginBottom: 16 },
  tabGridContent: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tabPill: { borderRadius: 24, overflow: 'hidden' },
  tabGradientActive: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 24, gap: 8, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  tabTextActive: { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  tabInactiveBlur: { borderRadius: 24, overflow: 'hidden' },
  tabGradientInactive: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 24, gap: 8, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.02)' },
  tabTextInactive: { fontSize: 15, fontWeight: '600', letterSpacing: 0.3 },
  countRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 24, marginBottom: 8 },
  countText: { fontSize: 13, fontWeight: '600' },
  countDot: { width: 6, height: 6, borderRadius: 3 },
  list: { padding: 20, paddingTop: 6, paddingBottom: 120 },
  cardContainer: {
    marginBottom: 14,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    flexDirection: 'row',
  },
  cardIndicator: { width: 4, height: '100%' },
  cardContent: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  iconContainer: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  cardTextContainer: { flex: 1, justifyContent: 'center' },
  productName: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3, marginBottom: 4 },
  badgeRow: { flexDirection: 'row', alignItems: 'center' },
  categoryBadgeText: { fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#a1a1aa', marginHorizontal: 8 },
  dateValue: { fontSize: 12, fontWeight: '600' },
  deleteBtn: { justifyContent: 'center', alignItems: 'center' },
  deleteIconBg: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyIconContainer: { position: 'relative', width: 160, height: 160, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyIconBg: { position: 'absolute', width: 160, height: 160, borderRadius: 80 },
  emptyIcon: { zIndex: 1 },
  emptyTitle: { fontSize: 24, fontWeight: '900', marginBottom: 12, letterSpacing: -0.5 },
  emptyText: { color: '#71717a', textAlign: 'center', fontSize: 16, fontWeight: '500', lineHeight: 24, marginBottom: 12 },
  fab: { position: 'absolute', bottom: 100, right: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10 },
  fabGradient: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' }
});
