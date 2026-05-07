import {
  View, Text, StyleSheet, Pressable, Image, ActivityIndicator,
  Alert, ScrollView, Dimensions, Platform, TextInput
} from 'react-native';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { uploadInvoice, addManualRecord } from '../src/services/api';
import { registerForPushNotificationsAsync, scheduleWarrantyNotification } from '../src/services/notifications';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../src/context/ThemeContext';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');

type DocType = 'warranty' | 'invoice' | 'mtv' | 'konut' | 'kontrat' | 'kredi' | 'kart';

interface DocTypeConfig {
  id: DocType;
  label: string;
  icon: string;
  colors: [string, string];
  color: string;
  categories?: string[];
  description: string;
  titleLabel: string;
  amountLabel: string;
  dateLabel: string;
}

const DOC_TYPES: DocTypeConfig[] = [
  {
    id: 'warranty', label: 'Garanti Belgesi', icon: 'shield-checkmark', colors: ['#6366f1', '#4338ca'], color: '#6366f1', categories: ['Elektronik', 'Ev Aletleri', 'Giyim', 'Diğer'], description: 'Ürün garanti belgesi',
    titleLabel: 'Ürün Adı / Marka', amountLabel: 'Fatura Tutarı (TL)', dateLabel: 'Satın Alma Tarihi'
  },
  {
    id: 'invoice', label: 'Fatura', icon: 'receipt', colors: ['#0ea5e9', '#0284c7'], color: '#0ea5e9', categories: ['Elektrik', 'Su', 'Doğalgaz', 'İnternet', 'Diğer'], description: 'Fatura & gider belgesi',
    titleLabel: 'Kurum Adı', amountLabel: 'Fatura Tutarı (TL)', dateLabel: 'Son Ödeme Tarihi'
  },
  {
    id: 'mtv', label: 'MTV Vergisi', icon: 'car-sport', colors: ['#f59e0b', '#d97706'], color: '#f59e0b', categories: ['Otomobil', 'Motosiklet', 'Kamyon', 'Diğer'], description: 'Motorlu taşıt vergisi',
    titleLabel: 'Araç Plakası', amountLabel: 'Vergi Tutarı (TL)', dateLabel: 'Son Ödeme Tarihi'
  },
  {
    id: 'konut', label: 'Konut Vergisi', icon: 'home', colors: ['#10b981', '#059669'], color: '#10b981', categories: ['Emlak Vergisi', 'DASK', 'Tapu Harcı', 'Diğer'], description: 'Konut & gayrimenkul vergisi',
    titleLabel: 'İlçe / Belediye', amountLabel: 'Vergi Tutarı (TL)', dateLabel: 'Son Ödeme Tarihi'
  },
  {
    id: 'kontrat', label: 'Kontrat', icon: 'document-text', colors: ['#8b5cf6', '#7c3aed'], color: '#8b5cf6', categories: ['Ev Sahibi', 'Kiracı', 'İş Sözleşmesi', 'Diğer'], description: 'Kira & sözleşme belgesi',
    titleLabel: 'Taraf / Kişi Adı', amountLabel: 'Aylık Bedel (TL)', dateLabel: 'Bitiş Tarihi'
  },
  {
    id: 'kredi', label: 'Borçlarım', icon: 'wallet', colors: ['#ef4444', '#dc2626'], color: '#ef4444', categories: ['Konut Kredisi', 'Taşıt Kredisi', 'İhtiyaç Kredisi', 'KYK Kredisi', 'Elden Borç', 'Diğer'], description: 'Kredi & borç belgesi',
    titleLabel: 'Banka / Kurum Adı', amountLabel: 'Tutar (TL)', dateLabel: 'Son Ödeme Tarihi'
  },
  {
    id: 'kart', label: 'Kartlarım', icon: 'card', colors: ['#ec4899', '#be185d'], color: '#ec4899', categories: ['Kredi Kartı', 'Banka Kartı', 'Sanal Kart', 'Yemek Kartı', 'Diğer'], description: 'Fiziksel ve dijital kartlar',
    titleLabel: 'Banka / Kart Adı', amountLabel: 'Kart Limiti / Bakiye (TL)', dateLabel: 'Son Kullanma Tarihi'
  },
];

export default function AddScreen() {
  const params = useLocalSearchParams();
  const initialType = (params.type as DocType) || 'warranty';
  const initialConfig = DOC_TYPES.find(d => d.id === initialType) || DOC_TYPES[0];

  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<DocTypeConfig>(initialConfig);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialConfig.categories?.[0] || 'Diğer');
  const [warrantyYears, setWarrantyYears] = useState<number>(2);
  const [notifyBefore, setNotifyBefore] = useState<'1_week' | '1_month' | 'both' | 'none'>('1_week');
  const { isDark } = useTheme();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [interestRate, setInterestRate] = useState('');
  const [months, setMonths] = useState('');

  const isDetailedCredit = selectedDocType.id === 'kredi' && ['Konut Kredisi', 'Taşıt Kredisi', 'İhtiyaç Kredisi', 'KYK Kredisi'].includes(selectedCategory);

  const onChangeDate = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };
  const formattedDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;

  const getDynamicTitleLabel = () => {
    if (selectedDocType.id === 'kredi') {
      if (selectedCategory === 'Elden Borç') return 'Kişi Adı / Borçlu';
      if (selectedCategory === 'Kredi Kartı') return 'Banka / Kart Adı';
      if (selectedCategory === 'KYK Kredisi') return 'Öğrenim Kredisi / Kurum';
      return 'Banka Adı';
    }
    if (selectedDocType.id === 'kontrat') {
      if (selectedCategory === 'Ev Sahibi') return 'Ev Sahibi Adı';
      if (selectedCategory === 'Kiracı') return 'Kiracı Adı';
      if (selectedCategory === 'İş Sözleşmesi') return 'Firma / Şirket Adı';
      return 'Taraf / Kişi Adı';
    }
    if (selectedDocType.id === 'kart') return 'Banka veya Kart Adı';
    return selectedDocType.titleLabel;
  };

  const getDynamicAmountLabel = () => {
    if (selectedDocType.id === 'kredi') {
      if (selectedCategory === 'Kredi Kartı') return 'Güncel Borç (TL)';
      if (selectedCategory === 'Elden Borç') return 'Verilen / Alınan Tutar (TL)';
      if (selectedCategory === 'KYK Kredisi') return 'Aylık Ödeme Tutarı (TL)';
      return 'Aylık Taksit Tutarı (TL)';
    }
    if (selectedDocType.id === 'kontrat') {
      if (selectedCategory === 'İş Sözleşmesi') return 'Maaş / Ücret (TL)';
      return 'Aylık Bedel (TL)';
    }
    if (selectedDocType.id === 'kart') return 'Kart Limiti (TL)';
    return selectedDocType.amountLabel;
  };

  const getDynamicDateLabel = () => {
    if (selectedDocType.id === 'kredi') {
      if (selectedCategory === 'Elden Borç') return 'Geri Ödeme Tarihi';
      if (selectedCategory === 'Kredi Kartı') return 'Son Ödeme Tarihi';
      return 'Taksit Ödeme Günü';
    }
    if (selectedDocType.id === 'kart') return 'Son Kullanma Tarihi';
    return selectedDocType.dateLabel;
  };

  const pickImage = async () => {
    let res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.8 });
    if (!res.canceled) { setImage(res.assets[0].uri); setResult(null); }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Hata', 'Kamera izni gerekiyor.'); return; }
    let res = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
    if (!res.canceled) { setImage(res.assets[0].uri); setResult(null); }
  };

  const handleSave = async () => {
    if (!title || !amount) {
      Alert.alert('Eksik Bilgi', `Lütfen ${getDynamicTitleLabel()} ve Tutar alanlarını doldurun.`);
      return;
    }
    setLoading(true);
    try {
      let additionalText = `Tutar: ${amount} TL\n${getDynamicDateLabel()}: ${formattedDate}`;
      
      if (isDetailedCredit) {
         if (months) additionalText += `\nVade: ${months} Ay`;
         if (interestRate) additionalText += `\nFaiz Oranı: %${interestRate}`;
      }

      if (image) {
        const filename = title ? `${title}` : (image.split('/').pop() || 'belge.jpg');
        const response = await uploadInvoice(image, filename, 'image/jpeg', selectedCategory, selectedDocType.id, additionalText);
        setResult(response.data.text);
        
        if (selectedDocType.id === 'warranty' && notifyBefore !== 'none' && Platform.OS !== 'web') {
           try {
             await registerForPushNotificationsAsync();
             const expirationDate = new Date(date);
             expirationDate.setFullYear(expirationDate.getFullYear() + warrantyYears);
             await scheduleWarrantyNotification(filename, expirationDate, notifyBefore);
           } catch (e) {}
        }
        Alert.alert('Başarılı', 'Belge AI ile okundu ve kaydedildi!', [{ text: 'Tamam', onPress: () => router.push('/') }]);
      } else {
        await addManualRecord(title, amount, formattedDate, selectedCategory, selectedDocType.id, additionalText);
        Alert.alert('Başarılı', 'Kayıt başarıyla eklendi!', [{ text: 'Tamam', onPress: () => router.push('/') }]);
      }
    } catch (error: any) {
      Alert.alert('İşlem Başarısız', error.message || 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDocType = (cfg: DocTypeConfig) => {
    setSelectedDocType(cfg);
    setSelectedCategory(cfg.categories?.[0] || 'Diğer');
    setTitle('');
    setAmount('');
  };

  const bg = isDark ? ['#050505' as const, '#0a0a1a' as const] : ['#f8fafc' as const, '#f1f5f9' as const];

  return (
    <LinearGradient colors={bg} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.pageHeader}>
          <LinearGradient colors={selectedDocType.colors} style={styles.iconCircle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name={selectedDocType.icon as any} size={30} color="#fff" />
          </LinearGradient>
          <Text style={[styles.pageTitle, { color: isDark ? '#ffffff' : '#09090b' }]}>Yeni Kayıt Ekle</Text>
          <Text style={styles.pageDescription}>
            Manuel olarak girebilir veya yapay zeka ile fotoğraf taratabilirsiniz.
          </Text>
        </View>

        {/* Belge Türü Seçimi */}
        <Text style={styles.sectionTitle}>Belge Türü</Text>
        <View style={styles.docTypeGrid}>
          {DOC_TYPES.map(cfg => {
            const isActive = selectedDocType.id === cfg.id;
            return (
              <Pressable key={cfg.id} onPress={() => handleSelectDocType(cfg)} style={({pressed}) => [{ width: '48%', transform: [{ scale: pressed ? 0.95 : 1 }] }]}>
                {isActive ? (
                   <LinearGradient
                     colors={cfg.colors}
                     style={[styles.docTypeCardActive, { shadowColor: cfg.color }]}
                     start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                   >
                     <View style={styles.iconCircleWhite}>
                        <Ionicons name={cfg.icon as any} size={24} color={cfg.color} />
                     </View>
                     <Text style={styles.docTypeLabelActive}>{cfg.label}</Text>
                     <Text style={styles.docTypeDescActive}>{cfg.description}</Text>
                   </LinearGradient>
                ) : (
                   <BlurView intensity={isDark ? 20 : 50} tint={isDark ? "dark" : "light"} style={styles.docTypeCardInactiveBlur}>
                     <View style={[styles.docTypeCardInactiveInner, { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                        <View style={[styles.iconCircleDark, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                           <Ionicons name={cfg.icon as any} size={24} color={isDark ? '#a1a1aa' : '#71717a'} />
                        </View>
                        <Text style={[styles.docTypeLabelInactive, { color: isDark ? '#d4d4d8' : '#3f3f46' }]}>{cfg.label}</Text>
                        <Text style={[styles.docTypeDescInactive, { color: isDark ? '#71717a' : '#a1a1aa' }]}>{cfg.description}</Text>
                     </View>
                   </BlurView>
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.inputLabel}>{getDynamicTitleLabel()}</Text>
          <View style={[styles.inputWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
            <Ionicons name="text-outline" size={20} color={isDark ? '#a1a1aa' : '#71717a'} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: isDark ? '#ffffff' : '#000000' }]}
              placeholder="..."
              placeholderTextColor={isDark ? '#71717a' : '#a1a1aa'}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <Text style={styles.inputLabel}>{getDynamicAmountLabel()}</Text>
          <View style={[styles.inputWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
            <Ionicons name="cash-outline" size={20} color={isDark ? '#a1a1aa' : '#71717a'} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: isDark ? '#ffffff' : '#000000' }]}
              placeholder="0.00"
              placeholderTextColor={isDark ? '#71717a' : '#a1a1aa'}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          <Text style={styles.inputLabel}>{getDynamicDateLabel()}</Text>
          <Pressable 
            onPress={() => setShowDatePicker(true)}
            style={[styles.inputWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
          >
            <Ionicons name="calendar-outline" size={20} color={isDark ? '#a1a1aa' : '#71717a'} style={styles.inputIcon} />
            <Text style={[styles.input, { color: isDark ? '#ffffff' : '#000000', lineHeight: 54 }]}>
              {formattedDate}
            </Text>
          </Pressable>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onChangeDate}
              themeVariant={isDark ? "dark" : "light"}
            />
          )}

          {isDetailedCredit && (
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Vade (Ay)</Text>
                <View style={[styles.inputWrapper, { marginBottom: 0, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
                  <Ionicons name="time-outline" size={20} color={isDark ? '#a1a1aa' : '#71717a'} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: isDark ? '#ffffff' : '#000000' }]}
                    placeholder="36"
                    placeholderTextColor={isDark ? '#71717a' : '#a1a1aa'}
                    keyboardType="numeric"
                    value={months}
                    onChangeText={setMonths}
                  />
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Faiz (%)</Text>
                <View style={[styles.inputWrapper, { marginBottom: 0, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
                  <Ionicons name="stats-chart-outline" size={20} color={isDark ? '#a1a1aa' : '#71717a'} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: isDark ? '#ffffff' : '#000000' }]}
                    placeholder="1.99"
                    placeholderTextColor={isDark ? '#71717a' : '#a1a1aa'}
                    keyboardType="numeric"
                    value={interestRate}
                    onChangeText={setInterestRate}
                  />
                </View>
              </View>
            </View>
          )}

          {/* Kategori */}
          {selectedDocType.categories && (
            <>
              <Text style={styles.sectionTitle}>Kategori</Text>
              <View style={styles.categoryContainer}>
                {selectedDocType.categories.map(cat => {
                  const isActive = selectedCategory === cat;
                  return (
                    <Pressable key={cat} onPress={() => setSelectedCategory(cat)} style={({pressed}) => [{ transform: [{ scale: pressed ? 0.95 : 1 }] }]}>
                      {isActive ? (
                        <LinearGradient
                          colors={selectedDocType.colors}
                          style={[styles.categoryBadgeActive, { shadowColor: selectedDocType.color }]}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        >
                          <Text style={styles.categoryTextActive}>{cat}</Text>
                        </LinearGradient>
                      ) : (
                        <BlurView intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} style={styles.categoryBadgeInactiveBlur}>
                          <View style={[styles.categoryBadgeInactiveInner, { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                            <Text style={[styles.categoryTextInactive, { color: isDark ? '#a1a1aa' : '#52525b' }]}>{cat}</Text>
                          </View>
                        </BlurView>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          {/* Garanti süre & bildirim (sadece garanti belgeleri) */}
          {selectedDocType.id === 'warranty' && (
            <>
              <Text style={styles.sectionTitle}>Garanti Süresi</Text>
              <View style={styles.categoryContainer}>
                {[1, 2, 3].map(year => {
                  const isActive = warrantyYears === year;
                  return (
                    <Pressable key={year} onPress={() => setWarrantyYears(year)} style={({pressed}) => [{ transform: [{ scale: pressed ? 0.95 : 1 }] }]}>
                      {isActive ? (
                        <LinearGradient
                          colors={selectedDocType.colors}
                          style={[styles.categoryBadgeActive, { shadowColor: selectedDocType.color }]}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        >
                          <Text style={styles.categoryTextActive}>{year} Yıl</Text>
                        </LinearGradient>
                      ) : (
                        <BlurView intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} style={styles.categoryBadgeInactiveBlur}>
                          <View style={[styles.categoryBadgeInactiveInner, { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                            <Text style={[styles.categoryTextInactive, { color: isDark ? '#a1a1aa' : '#52525b' }]}>{year} Yıl</Text>
                          </View>
                        </BlurView>
                      )}
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.sectionTitle}>Bildirim Tercihi</Text>
              <View style={styles.categoryContainer}>
                {[
                  { id: '1_week', label: '1 Hafta Kala' },
                  { id: '1_month', label: '1 Ay Kala' },
                  { id: 'both', label: 'İkisi de' },
                  { id: 'none', label: 'İstemiyorum' }
                ].map(opt => {
                  const isActive = notifyBefore === opt.id;
                  return (
                    <Pressable key={opt.id} onPress={() => setNotifyBefore(opt.id as any)} style={({pressed}) => [{ transform: [{ scale: pressed ? 0.95 : 1 }] }]}>
                      {isActive ? (
                        <LinearGradient
                          colors={selectedDocType.colors}
                          style={[styles.categoryBadgeActive, { shadowColor: selectedDocType.color }]}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        >
                          <Text style={styles.categoryTextActive}>{opt.label}</Text>
                        </LinearGradient>
                      ) : (
                        <BlurView intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} style={styles.categoryBadgeInactiveBlur}>
                          <View style={[styles.categoryBadgeInactiveInner, { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                            <Text style={[styles.categoryTextInactive, { color: isDark ? '#a1a1aa' : '#52525b' }]}>{opt.label}</Text>
                          </View>
                        </BlurView>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          {/* Belge Fotoğrafı Ekleme */}
          <Text style={styles.sectionTitle}>Belge Fotoğrafı (İsteğe Bağlı)</Text>
          
          {!image ? (
            <View style={styles.buttonContainer}>
              <Pressable onPress={pickImage} style={{ flex: 1 }}>
                 <BlurView intensity={isDark ? 30 : 60} tint={isDark ? "dark" : "light"} style={[styles.blurButtonContainer, { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                    <LinearGradient colors={isDark ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)'] : ['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.4)']} style={styles.actionButtonSecondary}>
                      <Ionicons name="images" size={24} color={isDark ? "#ffffff" : selectedDocType.color} style={{ marginRight: 12 }} />
                      <Text style={[styles.buttonSubtitleSecondary, { color: isDark ? '#fff' : '#000', fontWeight: '700' }]}>Galeriden Seç</Text>
                    </LinearGradient>
                 </BlurView>
              </Pressable>
              
              <Pressable onPress={takePhoto} style={{ flex: 1, marginLeft: 12 }}>
                <LinearGradient colors={selectedDocType.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionButton}>
                  <Ionicons name="camera" size={24} color="#fff" style={{ marginRight: 12 }} />
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Kamera</Text>
                </LinearGradient>
              </Pressable>
            </View>
          ) : (
            <View style={[styles.imageWrapper, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
              <Image source={{ uri: image }} style={styles.image} />
              <Pressable style={styles.editImageBtn} onPress={() => setImage(null)}>
                <Ionicons name="close" size={20} color="#fff" />
              </Pressable>
            </View>
          )}

          {/* OCR Result */}
          {result && (
            <BlurView intensity={isDark ? 20 : 50} tint={isDark ? "dark" : "light"} style={styles.resultBoxWrapper}>
              <LinearGradient
                colors={isDark
                  ? ['rgba(99, 102, 241, 0.15)', 'rgba(67, 56, 202, 0.05)']
                  : ['rgba(99, 102, 241, 0.08)', 'rgba(67, 56, 202, 0.02)']}
                style={styles.resultBox}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}>
                  <Ionicons name="sparkles" size={16} color="#6366f1" />
                  <Text style={styles.resultTitle}>Yapay Zeka Analizi</Text>
                </View>
                <Text style={[styles.resultText, { color: isDark ? '#e4e4e7' : '#18181b' }]}>{result}</Text>
              </LinearGradient>
            </BlurView>
          )}

          {/* Save Button */}
          <View style={styles.actionRow}>
            <Pressable style={styles.saveButton} onPress={handleSave} disabled={loading}>
              <LinearGradient
                colors={loading ? (isDark ? ['#3f3f46', '#27272a'] : ['#d4d4d8', '#a1a1aa']) : selectedDocType.colors}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={[styles.saveButtonGradient, loading && styles.saveButtonDisabled]}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={24} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.saveButtonText}>Kaydet</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, paddingTop: 40, paddingBottom: 100 },
  pageHeader: { marginBottom: 36, alignItems: 'center' },
  iconCircle: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  pageTitle: { fontSize: 28, fontWeight: '900', marginBottom: 12, letterSpacing: -0.5 },
  pageDescription: { color: '#a1a1aa', fontSize: 16, fontWeight: '500', lineHeight: 24, textAlign: 'center', paddingHorizontal: 20 },
  formContainer: { flex: 1, width: '100%' },
  inputLabel: { color: '#a1a1aa', fontSize: 13, marginBottom: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, height: 56, marginBottom: 24 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, fontWeight: '500', height: '100%' },
  buttonContainer: { flexDirection: 'row', width: '100%', marginBottom: 32 },
  blurButtonContainer: { borderRadius: 24, overflow: 'hidden', borderWidth: 1 },
  actionButton: { padding: 18, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 12 },
  actionButtonSecondary: { padding: 18, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  buttonSubtitleSecondary: { color: '#a1a1aa', fontSize: 14, fontWeight: '500' },
  imageWrapper: { width: '100%', borderRadius: 32, padding: 6, borderWidth: 1, marginBottom: 32, backgroundColor: 'rgba(0,0,0,0.02)', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
  image: { width: '100%', height: 320, borderRadius: 26 },
  editImageBtn: { position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  sectionTitle: { color: '#a1a1aa', fontSize: 13, marginBottom: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  // Doc type cards (grid)
  docTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', marginBottom: 32 },
  docTypeCardActive: { padding: 20, borderRadius: 28, alignItems: 'center', width: '100%', gap: 10, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16 },
  iconCircleWhite: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  docTypeLabelActive: { fontSize: 14, fontWeight: '900', textAlign: 'center', color: '#ffffff', letterSpacing: -0.3 },
  docTypeDescActive: { fontSize: 11, fontWeight: '600', textAlign: 'center', color: 'rgba(255,255,255,0.8)', lineHeight: 16 },
  docTypeCardInactiveBlur: { borderRadius: 28, overflow: 'hidden', width: '100%' },
  docTypeCardInactiveInner: { padding: 20, borderRadius: 28, alignItems: 'center', width: '100%', gap: 10, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.02)' },
  iconCircleDark: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  docTypeLabelInactive: { fontSize: 14, fontWeight: '800', textAlign: 'center', letterSpacing: -0.3 },
  docTypeDescInactive: { fontSize: 11, fontWeight: '500', textAlign: 'center', lineHeight: 16 },
  // Category chips
  categoryContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 36 },
  categoryBadgeActive: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 20, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  categoryTextActive: { fontWeight: '800', fontSize: 14, color: '#ffffff' },
  categoryBadgeInactiveBlur: { borderRadius: 20, overflow: 'hidden' },
  categoryBadgeInactiveInner: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.02)' },
  categoryTextInactive: { fontWeight: '600', fontSize: 14 },
  // Action
  actionRow: { width: '100%', marginTop: 'auto', paddingTop: 20 },
  saveButton: { width: '100%', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 16, borderRadius: 24, backgroundColor: 'transparent' },
  saveButtonGradient: { flexDirection: 'row', padding: 22, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  saveButtonDisabled: { opacity: 0.7, shadowOpacity: 0 },
  saveButtonText: { color: '#ffffff', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
  // Result box
  resultBoxWrapper: { width: '100%', borderRadius: 24, overflow: 'hidden', marginBottom: 32, borderWidth: 1, borderColor: 'rgba(99, 102, 241, 0.3)' },
  resultBox: { width: '100%', padding: 24 },
  resultTitle: { color: '#6366f1', fontWeight: '900', letterSpacing: 0.5, fontSize: 14, textTransform: 'uppercase' },
  resultText: { fontSize: 15, lineHeight: 26, fontWeight: '500' }
});
