# Garanti Arşivi

Kullanıcıların aldıkları ürünlerin faturalarını fotoğraflayıp saklayabilecekleri, kategori bazlı garanti sürelerini takip edebilecekleri ve OCR ile faturadan otomatik veri çekebilecekleri modern bir arşiv uygulaması.

## 🚀 Özellikler
- 📱 Modern ve şık arayüz (Karanlık tema, kategori filtreleri, ikonlar).
- 📸 Navigasyon çubuğu ile kolay erişilebilir Kamera ve Galeri entegrasyonu.
- 🔍 PyTesseract ile fatura üzerinden otomatik metin okuma (OCR).
- 🌐 Hızlı ve asenkron FastAPI arka plan servisi.

## 📂 Klasör Yapısı
Proje iki ana dizine ayrılmıştır:
1. `backend/`: FastAPI (Python) tabanlı OCR servisinin ve veritabanı kayıt işlemlerinin bulunduğu klasör.
2. `garanti-arsivi/`: React Native (Expo) tabanlı, hem mobilde (Android/iOS) hem de web'de çalışan görsel arayüzün (Frontend) bulunduğu klasör.

---

## 🛠️ Kurulum ve Çalıştırma

Uygulamanın çalışması için **iki terminal** kullanmanız gerekmektedir (Biri sunucu, diğeri arayüz için).

### 1. Adım: Backend'i Başlatmak (Terminal 1)

Önkoşul: Bilgisayarınızda Python ve **Tesseract-OCR** uygulamasının kurulu olduğundan emin olun.

```bash
# 1. Proje ana dizininden backend klasörüne girin:
cd backend

# 2. Sanal ortamı aktif edin ve paketleri kurun (Windows için):
.\venv\Scripts\python.exe -m pip install -r requirements.txt

# 3. Sunucuyu başlatın:
.\venv\Scripts\python.exe -m uvicorn main:app --reload
```
Bu işlem sonunda FastAPI sunucunuz `http://127.0.0.1:8000` adresinde arka planda çalışmaya başlayacaktır.

### 2. Adım: Frontend'i Başlatmak (Terminal 2)

```bash
# 1. Proje ana dizininden garanti-arsivi klasörüne girin:
cd garanti-arsivi

# 2. Bağımlılıkların yüklü olduğundan emin olun:
npm install

# 3. Uygulamayı çalıştırın (Web üzerinde açmak için):
npx expo start --web

# VEYA Mobil cihazda test etmek için:
npx expo start
```
*Not: Sadece `npx expo start` yazarsanız terminalde bir QR kod belirecektir. Telefonunuza **Expo Go** uygulamasını indirip bu QR kodu okutarak uygulamayı doğrudan telefon kameranızla test edebilirsiniz.*

---

## 📌 Kategoriler ve OCR Akışı
1. Kullanıcı alt bardan (Tab bar) "Kamera / OCR" sekmesine tıklar.
2. Fotoğraf çekilir veya seçilir.
3. Ekranda faturanın hangi kategoriye ait olduğu (Örn: Elektronik, Ev Aletleri) seçilir.
4. "OCR & Sisteme Kaydet" butonuna basıldığında görsel arka planda FastAPI'ye iletilir.
5. FastAPI görseli okur ve metinleri ön yüze geri yollar, kullanıcıya işlemin başarıyla bittiği mesajı verilir.
