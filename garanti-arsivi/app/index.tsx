import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback, useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { fetchInvoices } from '../src/services/api';
import { BlurView } from 'expo-blur';

export default function HomeScreen() {
  const [warranties, setWarranties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
        <BlurView intensity={20} tint="dark" style={styles.cardContainer}>
          <LinearGradient 
            colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']} 
            style={styles.card}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.productName}>{item.filename}</Text>
              <LinearGradient 
                 colors={['#8b5cf6', '#6d28d9']} 
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
            
            <View style={styles.dateWrapper}>
              <View style={styles.dateBox}>
                <Text style={styles.dateLabel}>Kayıt Tarihi</Text>
                <Text style={styles.dateValue}>{formatDate(item.created_at)}</Text>
              </View>
              <View style={styles.premiumIndicator}>
                 <Ionicons name="shield-checkmark" size={20} color="#a78bfa" />
              </View>
            </View>
          </LinearGradient>
        </BlurView>
      </Animated.View>
    );
  };

  if (loading && !refreshing) {
    return (
        <LinearGradient colors={['#0f1016', '#000000']} style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color="#8b5cf6" />
        </LinearGradient>
    )
  }

  return (
    <LinearGradient colors={['#0f1016', '#000000']} style={styles.container}>
      {/* Premium Header Decoration */}
      <View style={styles.headerGlow} />
      
      <FlatList
        data={warranties}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />
        }
        ListEmptyComponent={
          <Animated.View style={[styles.emptyState, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
             <LinearGradient colors={['rgba(139, 92, 246, 0.1)', 'transparent']} style={styles.emptyIconBg}>
                <Ionicons name="cloud-offline-outline" size={80} color="#3f3f46" />
             </LinearGradient>
             <Text style={styles.emptyTitle}>Kayıt Bulunamadı</Text>
             <Text style={styles.emptyText}>Henüz bir garanti belgesi yüklemediniz.{'\n'}Sağ alttaki + butonundan ekleyebilirsiniz.</Text>
          </Animated.View>
        }
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  headerGlow: { position: 'absolute', top: -100, left: -50, width: 300, height: 300, backgroundColor: '#8b5cf6', borderRadius: 150, opacity: 0.15, filter: 'blur(40px)' },
  list: { padding: 20, paddingTop: 30, paddingBottom: 100 },
  cardContainer: { borderRadius: 24, marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  card: { padding: 24 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  productName: { color: '#ffffff', fontSize: 20, fontWeight: '800', flex: 1, marginRight: 10, letterSpacing: 0.3 },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 6 },
  categoryBadgeText: { color: '#ffffff', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  storeName: { color: '#a1a1aa', fontSize: 13, marginBottom: 24, fontWeight: '500' },
  dateWrapper: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  dateBox: { flex: 1 },
  dateLabel: { color: '#71717a', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, fontWeight: '700' },
  dateValue: { color: '#e4e4e7', fontSize: 15, fontWeight: '600' },
  premiumIndicator: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(139, 92, 246, 0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.3)' },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyIconBg: { width: 160, height: 160, borderRadius: 80, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyTitle: { color: '#e4e4e7', fontSize: 22, fontWeight: '800', marginBottom: 8, letterSpacing: 0.5 },
  emptyText: { color: '#71717a', textAlign: 'center', fontSize: 15, fontWeight: '500', lineHeight: 22 }
});
