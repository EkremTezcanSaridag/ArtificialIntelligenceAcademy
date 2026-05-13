import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator, Platform, Pressable } from 'react-native';
import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import Animated, { 
  FadeIn, 
  Keyframe, 
  useSharedValue, 
  useAnimatedProps, 
  withTiming, 
  withDelay,
  Easing
} from 'react-native-reanimated';
import Svg, { G, Path, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { fetchInvoices, fetchExchangeRates } from '../src/services/api';
import { useTheme } from '../src/context/ThemeContext';
import { LineChart } from 'react-native-chart-kit';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const CustomAnimatedPie = ({ data, size, isDark }: { data: any[], size: number, isDark: boolean }) => {
  const radius = size / 2.5;
  const strokeWidth = 35;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  
  const progress = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      progress.value = 0;
      progress.value = withTiming(1, { 
        duration: 1500, 
        easing: Easing.out(Easing.exp) 
      });
    }, [])
  );

  let currentAngle = 0;
  const total = data.reduce((acc, item) => acc + item.population, 0);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G rotation="-90" origin={`${center}, ${center}`}>
          {data.map((item, index) => {
            const percentage = item.population / total;
            const strokeDasharray = circumference;
            
            const AnimatedSector = ({ percentage, color, delayAngle }: any) => {
              const animatedProps = useAnimatedProps(() => {
                const dashOffset = circumference - (circumference * percentage * progress.value);
                return {
                  strokeDashoffset: dashOffset
                };
              });

              return (
                <AnimatedPath
                  d={`M ${center} ${center} m 0 -${radius} a ${radius} ${radius} 0 1 1 0 ${2 * radius} a ${radius} ${radius} 0 1 1 0 -${2 * radius}`}
                  fill="none"
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${circumference} ${circumference}`}
                  animatedProps={animatedProps}
                  rotation={delayAngle}
                  origin={`${center}, ${center}`}
                  strokeLinecap="butt"
                />
              );
            };

            const sector = (
              <AnimatedSector 
                key={index} 
                percentage={percentage} 
                color={item.color} 
                delayAngle={currentAngle} 
              />
            );
            currentAngle += percentage * 360;
            return sector;
          })}
        </G>
      </Svg>
    </View>
  );
};

const { width } = Dimensions.get('window');
const CONTENT_WIDTH = width - 40;

const CATEGORY_COLORS: Record<string, string> = {
  'Elektronik': '#818cf8',
  'Mutfak': '#fbbf24',
  'Giyim': '#f472b6',
  'Vergi': '#34d399',
  'Fatura': '#38bdf8',
  'Borç': '#fb7185',
  'Abonelik': '#ec4899',
  'Market': '#f97316',
  'Eğlence': '#8b5cf6',
  'Sağlık': '#10b981',
  'Diğer': '#a1a1aa'
};

const FALLBACK_COLORS = ['#ec4899', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444'];

const CURRENCIES = [
  { id: 'TRY', symbol: '₺' },
  { id: 'USD', symbol: '$' },
  { id: 'EUR', symbol: '€' },
  { id: 'GBP', symbol: '£' }
];

export default function StatsScreen() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rates, setRates] = useState<any>(null);
  const [displayCurrency, setDisplayCurrency] = useState('TRY');
  const { isDark } = useTheme();
  const router = useRouter();

  const loadStats = async () => {
    try {
      const [invoices, exchangeRates] = await Promise.all([
        fetchInvoices(),
        fetchExchangeRates()
      ]);
      setRates(exchangeRates);
      setData(invoices || []);
    } catch (error) {
      console.error("İstatistikler yüklenemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => {
    loadStats();
  }, []));

  const stats = useMemo(() => {
    if (data.length === 0 || !rates) return null;

    // Tüm verileri seçilen displayCurrency birimine dönüştür
    const processedData = data.map(item => {
      // Para birimini normalize et (TL -> TRY, vs)
      const rawCurrency = (item.currency || 'TRY').toUpperCase();
      const itemCurrency = rawCurrency === 'TL' ? 'TRY' : rawCurrency;
      const targetCurrency = displayCurrency.toUpperCase();

      let amountInTarget = Number(item.amount) || 0;

      // Eğer kur verisi yoksa veya para birimleri aynıysa çevirme yapma
      if (!rates || itemCurrency === targetCurrency) {
        return { ...item, amountInTarget };
      }

      try {
        // 1. Önce veriyi TRY'ye çevir
        let amountTRY = Number(item.amount) || 0;
        if (itemCurrency !== 'TRY') {
          const rateToTRY = rates[itemCurrency]; // 1 TRY = X Currency
          if (rateToTRY && rateToTRY > 0) {
            amountTRY = amountTRY / rateToTRY;
          }
        }

        // 2. TRY'den hedef para birimine çevir
        if (targetCurrency === 'TRY') {
          amountInTarget = amountTRY;
        } else {
          const rateFromTRY = rates[targetCurrency];
          if (rateFromTRY && rateFromTRY > 0) {
            amountInTarget = amountTRY * rateFromTRY;
          }
        }
      } catch (e) {
        console.error("Çevrim hatası:", e);
      }

      return { ...item, amountInTarget };
    });

    const total = processedData.reduce((sum, item) => sum + (item.amountInTarget || 0), 0);
    const max = [...processedData].sort((a, b) => b.amountInTarget - a.amountInTarget)[0];
    const activeSymbol = CURRENCIES.find(c => c.id === displayCurrency)?.symbol || '';

    // Kategori Dağılımı
    const categoryTotals: Record<string, number> = {};
    processedData.forEach(item => {
      const cat = item.category || 'Diğer';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (item.amountInTarget || 0);
    });

    const pieData = Object.keys(categoryTotals).map((cat, idx) => ({
      name: cat,
      population: categoryTotals[cat],
      color: CATEGORY_COLORS[cat] || FALLBACK_COLORS[idx % FALLBACK_COLORS.length],
      legendFontColor: 'transparent'
    })).sort((a, b) => b.population - a.population);

    // Aylık Trend
    const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    const monthlyTotals: Record<string, number> = {};
    processedData.forEach(item => {
      const date = new Date(item.created_at);
      const monthKey = monthNames[date.getMonth()];
      monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + (item.amountInTarget || 0);
    });

    const last6Months = [];
    const currentMonth = new Date().getMonth();
    for (let i = 5; i >= 0; i--) {
      let m = currentMonth - i;
      if (m < 0) m += 12;
      last6Months.push(monthNames[m]);
    }

    const lineData = {
      labels: last6Months,
      datasets: [{
        data: last6Months.map(m => monthlyTotals[m] || 0),
        strokeWidth: 4
      }]
    };

    return { total, max, pieData, lineData, activeSymbol };
  }, [data, rates, displayCurrency]);

  const rotatingEntry = new Keyframe({
    0: {
      transform: [{ rotate: '0deg' }, { scale: 0 }],
      opacity: 0,
    },
    100: {
      transform: [{ rotate: '360deg' }, { scale: 1 }],
      opacity: 1,
    },
  }).duration(1000);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#f8fafc', justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#f8fafc' }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header Section */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Pressable
              onPress={() => router.push('/')}
              style={[styles.headerIcon, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}
            >
              <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
            </Pressable>
            <View>
              <Text style={[styles.pageTitle, { color: isDark ? '#fff' : '#000' }]}>Analiz</Text>
              <Text style={styles.pageSubtitle}>Harcama birimini yönetin</Text>
            </View>
          </View>

          <View style={styles.currencySelectorContainer}>
            <View style={styles.currencySelector}>
              {CURRENCIES.map(curr => (
                <Pressable
                  key={curr.id}
                  onPress={() => setDisplayCurrency(curr.id)}
                  style={[
                    styles.currencyBtn,
                    { backgroundColor: displayCurrency === curr.id ? '#6366f1' : (isDark ? '#111' : '#fff') }
                  ]}
                >
                  <Text style={[
                    styles.currencyBtnText,
                    { color: displayCurrency === curr.id ? '#fff' : (isDark ? '#71717a' : '#a1a1aa') }
                  ]}>
                    {curr.id}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {!stats ? (
          <View style={{ marginTop: 60, alignItems: 'center' }}>
            <Ionicons name="analytics" size={60} color="#6366f130" />
            <Text style={{ color: '#71717a', marginTop: 12 }}>Analiz için yeterli veri yok.</Text>
          </View>
        ) : (
          <>
            {/* Hero Card */}
            <LinearGradient
              colors={['#6366f1', '#4338ca']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.heroCard}
            >
              <View>
                <Text style={styles.heroLabel}>TOPLAM HARCAMA ({displayCurrency})</Text>
                <Text style={styles.heroValue}>
                  {stats.total.toLocaleString('tr-TR', { minimumFractionDigits: 0 })} {stats.activeSymbol}
                </Text>
              </View>
              <View style={styles.heroIconBox}>
                <Ionicons name="stats-chart" size={24} color="#fff" />
              </View>
            </LinearGradient>

            {/* Line Chart */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Harcama Trendi</Text>
              <View style={[styles.chartContainer, { backgroundColor: isDark ? '#111' : '#fff' }]}>
                <LineChart
                  data={stats.lineData}
                  width={CONTENT_WIDTH}
                  height={180}
                  chartConfig={{
                    backgroundColor: 'transparent',
                    backgroundGradientFrom: isDark ? '#111' : '#fff',
                    backgroundGradientTo: isDark ? '#111' : '#fff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                    labelColor: () => isDark ? '#71717a' : '#a1a1aa',
                    propsForDots: { r: "4", strokeWidth: "2", stroke: "#6366f1" }
                  }}
                  bezier
                  fromZero={true}
                  style={{ paddingRight: 40, paddingTop: 10, borderRadius: 20 }}
                />
              </View>
            </View>

            {/* Pie Chart & Legend */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Kategori Dağılımı</Text>
              <View style={[styles.chartContainer, { backgroundColor: isDark ? '#111' : '#fff', paddingVertical: 20 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 200, paddingHorizontal: 5 }}>
                  <View style={{ flex: 1.2, alignItems: 'center', justifyContent: 'center' }}>
                    <CustomAnimatedPie 
                      data={stats.pieData} 
                      size={width * 0.45} 
                      isDark={isDark} 
                    />
                  </View>
                  <View style={{ flex: 1, paddingLeft: 10, gap: 8 }}>
                    {stats.pieData.slice(0, 6).map((item, index) => (
                      <View
                        key={index}
                        style={[
                          styles.categoryCard,
                          {
                            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                            borderLeftWidth: 4,
                            borderLeftColor: item.color
                          }
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: isDark ? '#fff' : '#000', fontSize: 12, fontWeight: '800' }} numberOfLines={1}>
                            {item.name}
                          </Text>
                          <Text style={{ color: '#71717a', fontSize: 10, fontWeight: '600' }}>
                            {item.population.toLocaleString('tr-TR')} {stats.activeSymbol}
                          </Text>
                        </View>
                        <Text style={[styles.categoryPercent, { color: item.color }]}>
                          %{Math.round((item.population / stats.total) * 100)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </View>

            {/* Alert Card */}
            <View style={[styles.alertCard, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : '#fff1f2' }]}>
              <View style={styles.alertIconBg}>
                <Ionicons name="flash" size={18} color="#ef4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.alertHeader}>EN YÜKSEK</Text>
                <Text style={[styles.alertText, { color: isDark ? '#fff' : '#000' }]} numberOfLines={1}>{stats.max?.filename}</Text>
              </View>
              <Text style={styles.alertAmount}>{stats.max?.amountInTarget?.toLocaleString('tr-TR')} {stats.activeSymbol}</Text>
            </View>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  header: { marginBottom: 28 },
  headerIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  pageTitle: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  pageSubtitle: { fontSize: 13, color: '#71717a', fontWeight: '500', marginTop: 1 },
  currencySelectorContainer: { width: '100%', alignItems: 'flex-start' },
  currencySelector: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: 'rgba(113,113,122,0.08)',
    padding: 4,
    borderRadius: 14,
    alignItems: 'center'
  },
  currencyBtn: {
    width: 45,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  currencyBtnText: {
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center'
  },
  heroCard: { width: '100%', padding: 24, borderRadius: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  heroLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  heroValue: { color: '#fff', fontSize: 32, fontWeight: '900', marginTop: 4 },
  heroIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginBottom: 12, marginLeft: 2 },
  chartContainer: { borderRadius: 24, paddingVertical: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
  alertCard: { padding: 16, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.1)', elevation: 2 },
  alertIconBg: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(239, 68, 68, 0.1)', justifyContent: 'center', alignItems: 'center' },
  alertHeader: { fontSize: 9, color: '#ef4444', fontWeight: '800', letterSpacing: 0.5 },
  alertText: { fontSize: 14, fontWeight: '700', marginTop: 1 },
  alertAmount: { fontSize: 16, fontWeight: '900', color: '#ef4444' },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8
  },
  categoryPercent: {
    fontSize: 12,
    fontWeight: '900',
    opacity: 0.9
  }
});
