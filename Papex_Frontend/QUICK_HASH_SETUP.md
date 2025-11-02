# ⚡ Hızlı WASM Hash Kurulumu

Frontend'de token oluşturma yavaş geliyorsa, WASM hash'ini önceden kurabilirsiniz.

## 🚀 Yöntem 1: Terminal ile Hash Al (30 saniye)

### Adım 1: Soroban CLI ile Upload

```bash
cd /Users/ahmettahirmat/_Papex_/Papex_Contracts/contracts/papex-contract

soroban contract install \
  --wasm target/wasm32v1-none/release/papex_papertoken.wasm \
  --network testnet \
  --source papex-admin
```

**Çıktı:**
```
65050ba3917476b8098924bca3b0937f263719269bf463c8a0527393d91a08f0
```

Bu hash'i kopyalayın!

### Adım 2: Browser Console'da Cache'le

Frontend açıkken (http://localhost:5173), browser console'u açın (F12) ve:

```javascript
localStorage.setItem('papex_token_wasm_hash', '65050ba3917476b8098924bca3b0937f263719269bf463c8a0527393d91a08f0');
console.log('✅ WASM hash cached!');
```

### Adım 3: Sayfayı Yenile

Sayfayı yenileyin (F5). Artık token oluşturma **10 saniyede** bitecek!

---

## 🛠️ Yöntem 2: Config Dosyasına Ekle (Kalıcı)

### Adım 1: Hash'i Al (yukarıdaki gibi)

### Adım 2: Config Güncelle

`Papex_Frontend/src/config/stellar.ts` dosyasını açın:

```typescript
export const STELLAR_CONFIG = {
  // ... diğer ayarlar ...
  
  preDeployedWasmHash: '65050ba3917476b8098924bca3b0937f263719269bf463c8a0527393d91a08f0',
  //                    ^^^^^^^^^^^^^^ Buraya hash'inizi yapıştırın
};
```

### Adım 3: Dev Server'ı Yeniden Başlat

```bash
# Ctrl+C ile durdur
# Sonra tekrar başlat:
npm run dev
```

Artık **kalıcı olarak** her token 10 saniyede oluşacak!

---

## 🔍 Hash'inizi Kontrol Edin

Browser console'da:

```javascript
// Cached hash var mı?
console.log(localStorage.getItem('papex_token_wasm_hash'));

// Veya config'den
console.log('Config hash:', import.meta.env.VITE_WASM_HASH);
```

---

## ⚡ Sonuç

**Önce:**
- WASM upload: 2-3 dakika 😴
- Contract deploy: 5 saniye
- Token init: 5 saniye
- **Toplam: ~3 dakika**

**Sonra:**
- WASM upload: ✅ SKIP (cached)
- Contract deploy: 5 saniye
- Token init: 5 saniye
- **Toplam: ~10 saniye** 🚀

---

## 🐛 Sorun Giderme

### "Hash yok" hatası

```bash
# Hash'i tekrar yükleyin
soroban contract install \
  --wasm target/wasm32v1-none/release/papex_papertoken.wasm \
  --network testnet \
  --source papex-admin
```

### "Invalid hash" hatası

Hash'in doğru kopyalandığından emin olun:
- 64 karakter hex string olmalı
- Baş/son boşluk olmamalı

### Hala yavaş

```bash
# Fee'yi artırın (config.ts'de):
fee: String(Number(BASE_FEE) * 5000)
```

---

**🎯 Artık token oluşturma 10 saniyede!**

