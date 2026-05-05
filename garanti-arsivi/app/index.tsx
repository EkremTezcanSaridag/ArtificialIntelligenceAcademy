import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback, useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { fetchInvoices } from '../src/services/api';
import { BlurView } from 'expo-blur';
import { useTheme } from '../src/context/ThemeContext';

export default function HomeScreen() {
  const [warranties, setWarranties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { isDark } = useTheme();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const startAnimations = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  };

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

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Elektronik': return 'laptop-outline';
      case 'Ev Aletleri': return 'home-outline';
      case 'Giyim': return 'shirt-outline';
      default: return 'cube-outline';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => {
    return (
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <BlurView intensity={isDark ? 20 : 60} tint={isDark ? "dark" : "light"} style={[styles.cardContainer, { borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
          <LinearGradient 
            colors={isDark ? ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)'] : ['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.6)']} 
            style={styles.card}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.productName, { color: isDark ? '#ffffff' : '#09090b' }]}>{item.filename}</Text>
              <LinearGradient 
                 colors={['#10b981', '#047857']} 
                 style={styles.categoryBadge}
                 start={{ x: 0, y: 0 }}
                 end={{ x: 1, y: 0 }}
              >
                  <Ionicons name={getCategoryIcon(item.category) as any} size={14} color="#fff" />
                  <Text style={styles.categoryBadgeText}>{item.category || 'Diğer'}</Text>
              </LinearGradient>
            </View>
            <Text style={styles.storeName} numberOfLines={2}>
              <Ionicons name="document-text-outline" size={14} /> OCR Okuması Mevcut
            </Text>
            
            <View style={[styles.dateWrapper, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(244, 244, 245, 0.6)', borderColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)' }]}>
              <View style={styles.dateBox}>
                <Text style={styles.dateLabel}>KAYIT TARİHİ</Text>
                <Text style={[styles.dateValue, { color: isDark ? '#e4e4e7' : '#18181b' }]}>{formatDate(item.created_at)}</Text>
              </View>
              <View style={styles.premiumIndicator}>
                 <Ionicons name="shield-checkmark" size={20} color="#10b981" />
              </View>
            </View>
          </LinearGradient>
        </BlurView>
      </Animated.View>
    );
  };

  if (loading && !refreshing) {
    return (
        <LinearGradient colors={isDark ? ['#0f1016', '#000000'] : ['#f8fafc', '#f1f5f9']} style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color="#10b981" />
        </LinearGradient>
    )
  }

  return (
    <LinearGradient colors={isDark ? ['#0f1016', '#000000'] : ['#f8fafc', '#f1f5f9']} style={styles.container}>
      
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageDescription}>Garanti belgeleriniz ve faturalarınız bu alanda listelenmektedir.</Text>
        </View>
      </Animated.View>

      <FlatList
        data={warranties}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
        }
        ListEmptyComponent={
          <Animated.View style={[styles.emptyState, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
             <LinearGradient colors={['rgba(16, 185, 129, 0.1)', 'transparent']} style={styles.emptyIconBg}>
                <Ionicons name="folder-open-outline" size={80} color="#10b981" />
             </LinearGradient>
             <Text style={[styles.emptyTitle, { color: isDark ? '#e4e4e7' : '#18181b' }]}>Kayıt Bulunamadı</Text>
             <Text style={styles.emptyText}>Henüz bir garanti belgesi veya fatura yüklemediniz.{'\n'}Alt menüden "Belge Ekle" sekmesine giderek yükleyebilirsiniz.</Text>
          </Animated.View>
        }
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pageHeader: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  pageDescription: { color: '#a1a1aa', fontSize: 14, fontWeight: '500', lineHeight: 22 },
  list: { padding: 20, paddingTop: 10, paddingBottom: 100 },
  cardContainer: { borderRadius: 24, marginBottom: 20, overflow: 'hidden', borderWidth: 1 },
  card: { padding: 24 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  productName: { fontSize: 20, fontWeight: '800', flex: 1, marginRight: 10, letterSpacing: 0.3 },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 6 },
  categoryBadgeText: { color: '#ffffff', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  storeName: { color: '#a1a1aa', fontSize: 13, marginBottom: 24, fontWeight: '500' },
  dateWrapper: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 16, padding: 16, borderWidth: 1 },
  dateBox: { flex: 1 },
  dateLabel: { color: '#71717a', fontSize: 11, letterSpacing: 1, marginBottom: 4, fontWeight: '800' },
  dateValue: { fontSize: 15, fontWeight: '600' },
  premiumIndicator: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(16, 185, 129, 0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  emptyIconBg: { width: 160, height: 160, borderRadius: 80, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 22, fontWeight: '800', marginBottom: 8, letterSpacing: 0.5 },
  emptyText: { color: '#71717a', textAlign: 'center', fontSize: 15, fontWeight: '500', lineHeight: 22 }
});
