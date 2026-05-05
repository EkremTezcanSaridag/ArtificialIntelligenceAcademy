import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { fetchInvoices } from '../src/services/api';

export default function HomeScreen() {
  const [warranties, setWarranties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await fetchInvoices();
      setWarranties(data || []);
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

  // Basit bir formatlayıcı
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
  };

  const renderItem = ({ item }: { item: any }) => (
    <LinearGradient 
      colors={['rgba(30, 30, 45, 0.9)', 'rgba(15, 15, 25, 0.95)']} 
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
      <Text style={styles.storeName} numberOfLines={2}><Ionicons name="document-text-outline" size={14} /> OCR Okuması Mevcut</Text>
      
      <View style={styles.dateWrapper}>
        <View style={styles.dateBox}>
          <Text style={styles.dateLabel}>Kayıt Tarihi</Text>
          <Text style={styles.dateValue}>{formatDate(item.created_at)}</Text>
        </View>
      </View>
    </LinearGradient>
  );

  if (loading && !refreshing) {
    return (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
    )
  }

  return (
    <LinearGradient colors={['#0f1016', '#000000']} style={styles.container}>
      <FlatList
        data={warranties}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
             <Ionicons name="cloud-offline-outline" size={64} color="#27272a" />
             <Text style={styles.emptyText}>Supabase'de henüz bir garanti belgesi yok.</Text>
          </View>
        }
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  list: { padding: 20, paddingTop: 30, paddingBottom: 100 },
  card: { 
    borderRadius: 24, 
    padding: 24, 
    marginBottom: 20, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#8b5cf6', 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 20, 
    elevation: 10 
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  productName: { color: '#ffffff', fontSize: 20, fontWeight: '800', flex: 1, marginRight: 10, letterSpacing: 0.3 },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 6 },
  categoryBadgeText: { color: '#ffffff', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  storeName: { color: '#a1a1aa', fontSize: 13, marginBottom: 24, fontWeight: '500' },
  dateWrapper: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  dateBox: { flex: 1 },
  dateLabel: { color: '#71717a', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, fontWeight: '700' },
  dateValue: { color: '#e4e4e7', fontSize: 15, fontWeight: '600' },
  dateValueHighlight: { color: '#a78bfa', fontSize: 15, fontWeight: 'bold' },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { color: '#71717a', textAlign: 'center', marginTop: 16, fontSize: 16, fontWeight: '500' }
});
