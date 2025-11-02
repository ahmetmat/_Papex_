# ⚡ Papex Quick Start Guide

Bu rehber size 5 dakikada Papex'i çalıştıracak!

## ✅ Ön Hazırlık (Sadece İlk Kurulum)

### 1. Gerekli Yazılımlar

```bash
# Node.js yüklü mü kontrol et
node --version  # v18+ olmalı

# Soroban CLI yüklü mü kontrol et
soroban --version  # 21.0.0+

# Freighter Wallet kurulu mu kontrol et
# Chrome/Firefox extension: https://www.freighter.app/
```

### 2. Testnet Hesap Hazırla

1. Freighter wallet aç
2. Yeni hesap oluştur veya import et
3. Network'ü **Testnet** olarak ayarla
4. [Friendbot](https://laboratory.stellar.org/#account-creator?network=test)'tan XLM al

---

## 🚀 Adım 1: WASM Deployment (Tek Sefer - 2 Dakika)

```bash
# Contracts klasörüne git
cd Papex_Contracts/contracts/papex-contract

# Deployment script'ini çalıştır
./deploy-wasm.sh
```

**Ne olacak?**
```
🚀 Papex Token Contract WASM Deployment
========================================

📝 Adım 1: Soroban Identity Kontrol
✅ 'papex-admin' identity bulundu!
Address: GCABC...XYZ

📦 Adım 2: WASM Dosyası Kontrol
✅ WASM dosyası hazır: 30KB

☁️  Adım 3: WASM Upload (Testnet)
WASM dosyası Stellar testnet'e yükleniyor...
(Bu işlem 1-2 dakika sürebilir...)

✅ WASM başarıyla yüklendi!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 WASM HASH:
a1b2c3d4e5f6789abcdef...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 Config dosyasına yazılıyor...
✅ Config dosyası güncellendi!

🎉 Tamamlandı!

Artık tüm token deployment'ları sadece 10 saniye sürecek!
```

**Hata aldıysanız:** [DEPLOYMENT.md](./Papex_Contracts/contracts/papex-contract/DEPLOYMENT.md) dosyasındaki troubleshooting bölümüne bakın.

---

## 🌐 Adım 2: Frontend'i Başlat (1 Dakika)

```bash
# Frontend klasörüne git
cd ../../Papex_Frontend  # veya: cd /Users/ahmettahirmat/_Papex_/Papex_Frontend

# Bağımlılıkları yükle (ilk seferde)
npm install

# Development server'ı başlat
npm run dev
```

**Çıktı:**
```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

**Tarayıcıda aç:** http://localhost:5173

---

## 💎 Adım 3: İlk Token'ı Oluştur (3 Dakika)

### 1. Cüzdan Bağla

```
Sağ üstte "Connect Wallet" butonuna tıkla
↓
Freighter pop-up açılır
↓
"Approve" → tıkla
↓
✅ Cüzdan bağlandı!
```

### 2. Paper Upload

```
"Upload Paper" sayfasına git
↓
PDF dosyası seç (örnek: research_paper.pdf)
↓
Başlık gir: "Quantum Entanglement in Neural Networks"
Yazarlar: "Dr. Alice, Dr. Bob"
↓
"Upload & Register" → tıkla
↓
Freighter'da işlemi onayla
↓
✅ Paper blockchain'e kaydedildi (#1)
↓
Otomatik redirect → Token Creation sayfası
```

### 3. Token Oluştur

```
Token İsmi: Quantum Research Token
              ↓
        Symbol: QRT (otomatik)

Yatırım Miktarı: 1000 XLM
              ↓

Otomatik Parametreler:
  • Max Supply: 1,000,000
  • Base Price: 0.01 XLM
  • Slope: 0.0001
  • Payment Token: Native (XLM)

↓
"Token Oluştur" → tıkla
↓
Freighter'da 2 işlemi onayla:
  1. Contract deployment
  2. Token initialization
↓
⏳ Bekleme: 10 saniye
↓
✅ Token oluşturuldu!
Contract ID: CCABC123...XYZ
↓
"Trading Sayfasına Git" → tıkla
```

### 4. Trading

```
📈 Quantum Research Token (QRT)

💰 Mevcut Fiyat: 0.01 XLM
📊 Toplam Supply: 0 / 1,000,000
💧 Likidite: 1,000 XLM

🔥 AL
  Miktar: 100 QRT
  Fiyat: ~1.5 XLM
  → [Token Al 💰]

💸 SAT
  Miktar: 50 QRT
  Fiyat: ~0.7 XLM
  → [Token Sat 💵]
```

---

## 🎉 Başardınız!

Artık:
- ✅ WASM cache'lendi (sonraki tokenlar 10 saniyede)
- ✅ Paper blockchain'de
- ✅ Token oluşturuldu
- ✅ Trading yapabilirsiniz

---

## 🚀 Sonraki Tokenlar (10 Saniye)

İkinci, üçüncü, N'inci token oluşturmak için:

```
1. Yeni paper upload et (veya mevcut paper kullan)
   ↓
2. Token Creation sayfası
   ↓
3. Token ismi + miktar gir
   ↓
4. "Token Oluştur" → tıkla
   ↓
5. ⏳ 10 saniye bekle
   ↓
6. ✅ Hazır!
```

**Çok daha hızlı!** Çünkü WASM zaten cache'lendi.

---

## 📊 Performans Tablosu

| Token | WASM Upload | Contract Deploy | Token Init | Toplam |
|-------|-------------|-----------------|------------|--------|
| 1. Token | ✅ CACHED | 5s | 5s | **~10s** |
| 2. Token | ✅ CACHED | 5s | 5s | **~10s** |
| 3. Token | ✅ CACHED | 5s | 5s | **~10s** |
| N. Token | ✅ CACHED | 5s | 5s | **~10s** |

---

## 🐛 Sorun mu Yaşıyorsunuz?

### "WASM hash bulunamadı"
```bash
cd Papex_Contracts/contracts/papex-contract
./deploy-wasm.sh
```

### "Freighter bağlanamadı"
- Freighter extension'ı yüklü mü kontrol edin
- Network'ün Testnet olduğundan emin olun
- Sayfayı yenileyin

### "Transaction failed"
- XLM bakiyeniz var mı kontrol edin
- Testnet yavaş olabilir, tekrar deneyin
- Console'da detaylı hata mesajını kontrol edin

### Frontend açılmıyor
```bash
# Port zaten kullanımda olabilir
lsof -ti:5173 | xargs kill -9
npm run dev
```

---

## 📚 Daha Fazla Bilgi

- [Detaylı Deployment Rehberi](./Papex_Contracts/contracts/papex-contract/DEPLOYMENT.md)
- [Ana Dokümantasyon](./README.md)
- [Troubleshooting Guide](./README.md#-troubleshooting)

---

**🎯 5 Dakikada Hazır! Şimdi token oluşturma zamanı!** 🚀

