# 🚀 Papex Token Contract Deployment Guide

Bu doküman, Papex token contract'ının WASM'ını Stellar testnet'e deploy etme sürecini açıklar.

## 📋 Ön Koşullar

- [x] Soroban CLI yüklü
- [x] Contract build edilmiş (`soroban contract build`)
- [x] Testnet identity yapılandırılmış

## 🎯 Tek Komutla Deployment (TAVSİYE EDİLEN)

### Adım 1: Script'i Çalıştır

```bash
cd /Users/ahmettahirmat/_Papex_/Papex_Contracts/contracts/papex-contract

./deploy-wasm.sh
```

Bu script **otomatik olarak**:
1. ✅ Soroban identity'yi kontrol eder
2. ✅ WASM dosyasını testnet'e yükler
3. ✅ WASM hash'ini alır
4. ✅ Frontend config dosyasını günceller (`Papex_Frontend/src/config/stellar.ts`)

### Adım 2: Başarılı Deployment

Script başarılı olduysa şunu görmelisiniz:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 WASM HASH:

a1b2c3d4e5f6789...xyz123

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Config dosyası güncellendi!
   Dosya: ../../Papex_Frontend/src/config/stellar.ts

🎉 Tamamlandı!

Artık tüm token deployment'ları sadece 10 saniye sürecek!
```

### Adım 3: Frontend'i Başlat

```bash
cd ../../Papex_Frontend
npm run dev
```

Artık token deployment'ları **10 saniyede** tamamlanacak! 🚀

---

## 🛠️ Manuel Deployment (Alternatif)

Script çalışmazsa manuel olarak yapabilirsiniz:

### 1. WASM Upload

```bash
cd /Users/ahmettahirmat/_Papex_/Papex_Contracts/contracts/papex-contract

soroban contract install \
  --wasm target/wasm32v1-none/release/papex_papertoken.wasm \
  --network testnet \
  --source papex-admin
```

### 2. Hash'i Kopyala

Çıkan hash'i kopyalayın (örnek: `a1b2c3d4e5f6789...xyz123`)

### 3. Config Güncelle

`Papex_Frontend/src/config/stellar.ts` dosyasını açın ve:

```typescript
// ÖNCE:
preDeployedWasmHash: null,

// SONRA:
preDeployedWasmHash: 'a1b2c3d4e5f6789...xyz123',
```

---

## 🔄 WASM'ı Yeniden Deploy Etme

Contract kodunu değiştirdiyseniz:

1. **Rebuild:**
   ```bash
   soroban contract build
   ```

2. **Script'i tekrar çalıştır:**
   ```bash
   ./deploy-wasm.sh
   ```

3. **Config otomatik güncellenecek**

---

## 📊 Deployment Sonrası

### Contract Instance Oluşturma (Otomatik)

Kullanıcı her token oluşturduğunda:

```typescript
// Frontend otomatik olarak yapar:
1. Cached WASM hash'i kullanır
2. Yeni contract instance oluşturur
3. Token'ı initialize eder
4. Paper ile ilişkilendirir

Süre: ~10 saniye
```

### Performans

| Token | WASM Upload | Contract Deploy | Token Init | Toplam |
|-------|-------------|-----------------|------------|--------|
| 1.    | ✅ CACHED   | 5s             | 5s         | ~10s   |
| 2.    | ✅ CACHED   | 5s             | 5s         | ~10s   |
| N.    | ✅ CACHED   | 5s             | 5s         | ~10s   |

---

## 🐛 Troubleshooting

### Hata: "Failed to find config identity"

```bash
# Identity oluştur:
soroban keys generate papex-admin --network testnet

# Veya mevcut identity'leri listele:
soroban keys ls
```

### Hata: "WASM dosyası bulunamadı"

```bash
# Contract'ı build et:
soroban contract build

# WASM'ın varlığını kontrol et:
ls -lh target/wasm32v1-none/release/papex_papertoken.wasm
```

### Hata: "No keychain is available"

macOS keychain sorunu. Çözüm:

```bash
# Bilgisayarınızı yeniden başlatın
# VEYA
# Manuel deployment yöntemini kullanın
```

### Script Çalışmıyor

```bash
# Executable olduğunu kontrol et:
chmod +x deploy-wasm.sh

# Bash ile doğrudan çalıştır:
bash deploy-wasm.sh
```

---

## 📝 Notlar

- **WASM hash** sadece **bir kez** upload edilir
- Sonraki tüm token'lar aynı WASM'ı kullanır
- Her token **kendi contract instance**'ına sahiptir
- Deployment scriptini **contract değiştikçe** çalıştırın

---

## 🎯 Sonraki Adımlar

1. ✅ WASM deployed (bu döküman)
2. 🚀 Frontend'i başlat
3. 📄 Paper upload et
4. 💎 Token oluştur (10 saniye)
5. 📈 Trade et!

**Her şey hazır! Token oluşturma zamanı!** 🎉

