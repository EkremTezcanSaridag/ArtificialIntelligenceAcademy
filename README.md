# Dijital Arşiv 📂

**Dijital Arşiv**, belgelerinizi yapay zeka destekli OCR teknolojisiyle tarayıp dijital ortamda güvenle saklayan, hatırlatma bildirimleriyle son tarihleri asla kaçırmamanızı sağlayan kapsamlı bir mobil uygulamadır.

## ✨ Özellikler

### 📋 Belge Yönetimi
- **Garanti Belgelerim** — Ürün garanti belgelerini saklayın, kategori ve süre bilgisiyle takip edin
- **Faturalar** — Elektrik, su, doğal gaz, internet faturalarınızı arşivleyin
- **MTV (Motorlu Taşıt Vergisi)** — Araç vergilerinizi kayıt altına alın
- **Konut Vergisi** — Emlak vergisi, DASK, tapu harcı belgelerinizi yönetin
- **Kontratlarım** — Kira sözleşmeleri, iş sözleşmeleri ve kontratları saklayın
- **Borçlarım** — Kredi, KYK, elden borç ve taksit takibi yapın (ödeme planı görüntüleme dahil)

### 🎨 Dinamik ve Akıcı Arayüz (Animasyonlar)
- **Özel SVG Animasyonları** — Grafiklerin sıfırdan saat yönünde dolma efekti (`strokeDashoffset`)
- **360° Rotasyonel Giriş** — İstatistiklerin dönerken büyüme (scale) animasyonuyla gelmesi
- **Gelişmiş Mikro-Etkileşimler** — `react-native-reanimated` ile güçlendirilmiş yumuşak sayfa geçişleri
- **Karanlık/Aydınlık Mod** — Temalar arası pürüzsüz görsel geçişler

### 📊 Gelişmiş Finansal İstatistikler
- **Dinamik Harcama Analizi** — Tüm harcamaların kategorize edilmiş görsel sunumu
- **Çoklu Para Birimi Desteği** — TRY, USD, EUR ve GBP arasında anlık döviz kurlarıyla otomatik dönüşüm
- **Harcama Trendleri** — Son 6 aylık harcama değişimlerini gösteren interaktif grafikler

### 🔔 Akıllı Hatırlatma Sistemi
Tüm belge türleri için son tarihlere yaklaşırken bildirim alma:
- **1 Hafta Kala** — Son tarihten 7 gün önce
- **2 Hafta Kala** — Son tarihten 14 gün önce
- **3 Hafta Kala** — Son tarihten 21 gün önce
- **1 Ay Kala** — Son tarihten 30 gün önce
- **2 Ay Kala** — Son tarihten 60 gün önce
- **3 Ay Kala** — Son tarihten 90 gün önce

> Birden fazla hatırlatma seçeneği aynı anda seçilebilir (çoklu seçim).

### 🌗 Karanlık / Aydınlık Mod
- Tek tuşla tema değişimi (sağ üst köşedeki ay/güneş ikonu)
- Tüm sayfalarda tutarlı tema desteği

## 🛠️ Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| **Frontend** | React Native + Expo |
| **Animasyon Motoru** | **React Native Reanimated (v4)** |
| **Vektörel Grafikler** | **React Native SVG (Custom Drawing)** |
| **Navigasyon** | Expo Router (file-based routing) |
| **UI Bileşenleri** | Ionicons, Linear Gradient, Blur View |
| **Yapay Zeka** | Groq Cloud API (Llama 4 Scout 17B) |
| **Veritabanı** | Supabase (PostgreSQL + Storage) |
| **Döviz Kurları** | Exchange Rate API |
| **Bildirimler** | expo-notifications |

## 🚀 Kurulum

### 1. Bağımlılıkları Yükleyin

```bash
cd garanti-arsivi
npm install
```

### 2. Çevresel Değişkenleri Ayarlayın
`.env` dosyasını oluşturun ve aşağıdaki anahtarları ekleyin:
```env
EXPO_PUBLIC_SUPABASE_URL=your_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key
EXPO_PUBLIC_GROQ_API_KEY=your_groq_key
```

### 3. Uygulamayı Başlatın

```bash
cd garanti-arsivi
npx expo start
```

Expo Go uygulaması ile QR kodu tarayarak mobil cihazınızda test edebilirsiniz.

## 📁 Proje Yapısı

```
GarantiArsiviApp/
├── garanti-arsivi/
│   ├── app/
│   │   ├── _layout.tsx      # Tab navigasyonu & tema ayarları
│   │   ├── index.tsx        # Ana sayfa (tüm sekmeler & belgeler)
│   │   ├── add.tsx          # Yeni kayıt ekleme (AI OCR & manuel)
│   │   └── stats.tsx        # Finansal analiz & animasyonlu grafikler
│   ├── src/
│   │   ├── context/
│   │   │   └── ThemeContext.tsx  # Karanlık/aydınlık tema yönetimi
│   │   └── services/
│   │       ├── api.ts           # Supabase & Groq AI servisleri
│   │       └── notifications.ts # Bildirim zamanlama sistemi
│   └── assets/              # Uygulama ikonları ve görselleri
└── README.md
```

## 👥 Katkıda Bulunanlar

Bu proje **Artificial Intelligence Academy** kapsamında geliştirilmektedir.

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır.
