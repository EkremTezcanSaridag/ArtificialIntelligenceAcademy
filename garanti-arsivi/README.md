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
- **Kartlarım** — Kredi kartı, banka kartı, sanal kart ve yemek kartlarınızı yönetin

### 🤖 Yapay Zeka ile OCR
- Fotoğraf çekerek veya galeriden seçerek belgeleri otomatik taratma
- OCR ile metin çıkarma ve yapılandırılmış veri oluşturma
- FastAPI + Pytesseract tabanlı backend

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

### 💳 Kart Yönetimi
- Harcama ekleme ve geçmişi görüntüleme
- Kart limiti ve toplam borç takibi
- Son kullanma tarihi bildirimleri

### 📊 Borç & Taksit Takibi
- Detaylı kredi bilgileri (vade, faiz oranı)
- Otomatik ödeme planı oluşturma
- Taksit bazlı takip modalı

## 🛠️ Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| **Frontend** | React Native + Expo |
| **Navigasyon** | Expo Router (file-based routing) |
| **UI** | expo-linear-gradient, expo-blur, Ionicons |
| **Backend** | FastAPI + Pytesseract (OCR) |
| **Veritabanı** | Supabase |
| **Bildirimler** | expo-notifications |
| **State** | React useState + Context API (tema) |

## 🚀 Kurulum

### 1. Bağımlılıkları Yükleyin

```bash
npm install
```

### 2. Backend'i Başlatın

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 3. Uygulamayı Başlatın

```bash
npx expo start
```

Expo Go uygulaması ile QR kodu tarayarak mobil cihazınızda test edebilirsiniz.

## 📁 Proje Yapısı

```
garanti-arsivi/
├── app/
│   ├── _layout.tsx        # Tab navigasyonu & tema ayarları
│   ├── index.tsx          # Ana sayfa (tüm sekmeler & belgeler)
│   ├── add.tsx            # Yeni kayıt ekleme (OCR & manuel)
│   └── cards.tsx          # Kart yönetim sayfası
├── src/
│   ├── context/
│   │   └── ThemeContext.tsx  # Karanlık/aydınlık tema yönetimi
│   └── services/
│       ├── api.ts           # Supabase API servisleri
│       └── notifications.ts # Bildirim zamanlama sistemi
├── backend/
│   └── main.py            # FastAPI + OCR backend
└── assets/                # Uygulama ikonları ve görselleri
```

## 👥 Katkıda Bulunanlar

Bu proje **Artificial Intelligence Academy** kapsamında geliştirilmektedir.

## 📄 Lisans

Bu proje eğitim amaçlı geliştirilmiştir.
