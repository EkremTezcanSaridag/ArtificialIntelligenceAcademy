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


### 🤖 Yapay Zeka ile OCR & Analiz
- **Groq Llama 4 Scout Integration** — En güncel çok modlu (multimodal) yapay zeka modeli ile yüksek doğrulukta belge tarama
- Fotoğraf çekerek veya galeriden seçerek belgeleri otomatik taratma
- OCR ile metin çıkarma ve yapılandırılmış veri oluşturma (Başlık, Tutar, Tarih, Para Birimi)
- Akıllı hata ayıklama ve JSON veri işleme mekanizması

### 📊 Gelişmiş Finansal İstatistikler & Animasyonlar
- **Özel SVG Animasyon Motoru** — `react-native-svg` ve `reanimated` kullanılarak sıfırdan geliştirilen, statik grafiklerin ötesinde bir görsel deneyim.
- **Sıfırdan Çizilme Efekti (Clockwise Draw)** — Grafik dilimlerinin saat yönünde dinamik olarak dolması (`strokeDashoffset` animasyonu).
- **Dinamik Rotasyon** — Verilerin 360 derecelik bir dönüş ve `scale` efektiyle ekrana gelmesi.
- **Mikro-Animasyonlar** — Sayfa geçişlerinde ve etkileşimlerde kullanılan yumuşak `Fade`, `Spring` ve `Layout` animasyonları.
- **Çoklu Para Birimi Dönüşümü** — Anlık döviz kurlarıyla TRY, USD, EUR ve GBP desteği.

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


### 📊 Borç & Taksit Takibi
- Detaylı kredi bilgileri (vade, faiz oranı)
- Otomatik ödeme planı oluşturma
- Taksit bazlı takip modalı

## 🛠️ Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| **Frontend** | React Native + Expo |
| **Navigasyon** | Expo Router (file-based routing) |
| **UI** | Lucide Icons, Ionicons, SVG Animations |
| **Yapay Zeka** | Groq Cloud API (Llama 4 Scout 17B) |
| **Veritabanı** | Supabase (PostgreSQL + Storage) |
| **Döviz Kurları** | Exchange Rate API |
| **Animasyonlar** | React Native Reanimated (Keyframes & Layout Animations) |
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
