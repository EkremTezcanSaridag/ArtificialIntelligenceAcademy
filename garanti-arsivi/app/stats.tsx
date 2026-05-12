import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { fetchInvoices, fetchExchangeRates } from '../src/services/api';
import { useTheme } from '../src/context/ThemeContext';

const { width } = Dimensions.get('window');

const CATEGORY_COLORS: Record<string, string> = {
  'Elektronik': '#6366f1',
  'Mutfak': '#f59e0b',
  'Giyim': '#ec4899',
  'Vergi': '#10b981',
  'Fatura': '#0ea5e9',
  'Borç': '#ef4444',
  'Diğer': '#71717a'
};

export default function StatsScreen() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();

  const loadStats = async () => {
    try {
      const [invoices, rates] = await Promise.all([
        fetchInvoices(),
        fetchExchangeRates()
      ]);
      
      // Verileri TRY cinsine dönüştür
      const processedData = (invoices || []).map(item => {
        let amountTRY = item.amount || 0;
        if (item.currency && item.currency !== 'TRY' && rates) {
          // rate = TRY per 1 unit of currency? No, fetchExchangeRates returns rates relative to TRY.
          // TRY is 1.0, USD might be 0.03? 
          // Actually, exchangerate-api.com/v4/latest/TRY returns: "USD": 0.030, "EUR": 0.028
          // So TRY = Amount / rate
          const rate = rates[item.currency];
          if (rate) amountTRY = amountTRY / rate;
        }
        return { ...item, amountTRY };
      });
      
      setData(processedData);
    } catch (error) {
      console.error("İstatistikler yüklenemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => {
    loadStats();
  }, []));

  if (loading) {
    return (
      <LinearGradient colors={isDark ? ['#050505', '#0a0a1a'] : ['#f8fafc', '#f1f5f9']} style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#6366f1" />
      </LinearGradient>
    );
  }

  if (data.length === 0) {
    return (
      <LinearGradient colors={isDark ? ['#050505', '#0a0a1a'] : ['#f8fafc', '#f1f5f9']} style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 40 }]}>
        <Ionicons name="stats-chart-outline" size={80} color="#6366f1" style={{ marginBottom: 20, opacity: 0.5 }} />
        <Text style={{ color: isDark ? '#fff' : '#000', fontSize: 18, fontWeight: '800', textAlign: 'center' }}>Henüz Veri Yok</Text>
        <Text style={{ color: '#71717a', fontSize: 14, textAlign: 'center', marginTop: 8 }}>İstatistiklerin oluşması için birkaç belge eklemelisiniz.</Text>
      </LinearGradient>
    );
  }

  const totalSpent = data.reduce((sum, item) => sum + (item.amountTRY || 0), 0);
  
  // Kategori Dağılımı
  const categoryTotals: Record<string, number> = {};
  data.forEach(item => {
    const cat = item.category || 'Diğer';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + (item.amountTRY || 0);
  });

  const pieData = Object.keys(categoryTotals).map(cat => ({
    name: cat,
    amount: categoryTotals[cat],
    color: CATEGORY_COLORS[cat] || '#71717a',
    percent: totalSpent > 0 ? (categoryTotals[cat] / totalSpent) : 0
  })).sort((a, b) => b.amount - a.amount);

  // Aylık Trend
  const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  const monthlyTotals: Record<string, number> = {};
  data.forEach(item => {
    const date = new Date(item.created_at);
    const monthKey = monthNames[date.getMonth()];
    monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + (item.amountTRY || 0);
  });

  const last6Months = [];
  const currentMonth = new Date().getMonth();
  for (let i = 5; i >= 0; i--) {
    let m = currentMonth - i;
    if (m < 0) m += 12;
    last6Months.push(monthNames[m]);
  }

  const maxMonthValue = Math.max(...last6Months.map(m => monthlyTotals[m] || 0), 1);

  return (
    <LinearGradient colors={isDark ? ['#050505', '#0a0a1a'] : ['#f8fafc', '#f1f5f9']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Toplam Harcama Kartı */}
        <View style={[styles.headerCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}>
           <Text style={styles.headerLabel}>Toplam Harcama</Text>
           <Text style={[styles.headerValue, { color: isDark ? '#fff' : '#000' }]}>
             {totalSpent.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
           </Text>
           <View style={styles.headerStatsRow}>
              <View style={styles.statItem}>
                 <Ionicons name="document-text-outline" size={16} color="#6366f1" />
                 <Text style={styles.statText}>{data.length} Belge</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statItem}>
                 <Ionicons name="trending-up-outline" size={16} color="#10b981" />
                 <Text style={styles.statText}>Bu Ay: {(monthlyTotals[monthNames[currentMonth]] || 0).toLocaleString('tr-TR')} TL</Text>
              </View>
           </View>
        </View>

        {/* Aylık Trend (Bar Chart) */}
        <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Harcama Trendi</Text>
        <View style={[styles.chartCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff' }]}>
          <View style={styles.barContainer}>
            {last6Months.map((month, idx) => {
              const val = monthlyTotals[month] || 0;
              const height = (val / maxMonthValue) * 150;
              return (
                <View key={idx} style={styles.barCol}>
                  <View style={[styles.bar, { height: Math.max(height, 4), backgroundColor: '#6366f1' }]} />
                  <Text style={[styles.barLabel, { color: isDark ? '#a1a1aa' : '#71717a' }]}>{month}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Kategori Dağılımı (Progress Bars) */}
        <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Kategori Dağılımı</Text>
        <View style={[styles.chartCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', padding: 20 }]}>
          {pieData.map((item, index) => (
            <View key={index} style={{ marginBottom: 16, width: '100%' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ color: isDark ? '#e4e4e7' : '#3f3f46', fontWeight: '600' }}>{item.name}</Text>
                <Text style={{ color: isDark ? '#fff' : '#000', fontWeight: '800' }}>%{Math.round(item.percent * 100)}</Text>
              </View>
              <View style={{ height: 8, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                <View style={{ width: `${item.percent * 100}%`, height: '100%', backgroundColor: item.color }} />
              </View>
              <Text style={{ color: '#71717a', fontSize: 12, marginTop: 4 }}>{item.amount.toLocaleString('tr-TR')} TL</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingTop: 60 },
  headerCard: {
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5
  },
  headerLabel: { fontSize: 14, color: '#a1a1aa', fontWeight: '600', marginBottom: 8 },
  headerValue: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  headerStatsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, gap: 15 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: 13, color: '#71717a', fontWeight: '600' },
  divider: { width: 1, height: 12, backgroundColor: 'rgba(113,113,122,0.2)' },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16, marginTop: 8 },
  chartCard: {
    borderRadius: 24,
    padding: 16,
    marginBottom: 32,
    alignItems: 'center',
  },
  barContainer: { flexDirection: 'row', height: 200, alignItems: 'flex-end', justifyContent: 'space-around', width: '100%', paddingBottom: 20 },
  barCol: { alignItems: 'center', width: 40 },
  bar: { width: 12, borderRadius: 6 },
  barLabel: { fontSize: 10, marginTop: 8, fontWeight: '700' }
});
