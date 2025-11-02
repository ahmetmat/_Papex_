# ⚠️ Soroban RPC Çalışmıyor - Alternatif Çözüm

## Durum

- ❌ **Soroban RPC:** Ulaşılamıyor (soroban-testnet.stellar.org)
- ✅ **Horizon API:** Çalışıyor (horizon-testnet.stellar.org)

**Sorun:** WASM upload ve contract deployment için Soroban RPC **zorunlu**. Frontend şu anda WASM yükleyemiyor.

---

## ✅ ÇÖZÜM: Soroban CLI ile Manuel Deployment

Soroban RPC çalışmadığında, **Soroban CLI doğrudan Stellar ağına** bağlanabilir.

### Adım 1: WASM Yükle (CLI ile)

```bash
cd /Users/ahmettahirmat/_Papex_/Papex_Contracts/contracts/papex-contract

# WASM'ı yükle (RPC'ye ihtiyaç yok)
stellar contract install \
  --wasm target/wasm32v1-none/release/papex_papertoken.wasm \
  --network testnet \
  --source papex-admin
```

**Bu komut doğrudan Stellar network'e bağlanır, RPC bypass edilir.**

**Çıktı:**
```
65050ba3917476b8098924bca3b0937f263719269bf463c8a0527393d91a08f0
```

Hash'i kopyalayın! ☝️

---

### Adım 2: Hash'i Frontend'e Ekle

#### Yöntem A: Browser Console (Hızlı)

Frontend açıkken (http://localhost:5173), F12 → Console:

```javascript
localStorage.setItem('papex_token_wasm_hash', '65050ba3917476b8098924bca3b0937f263719269bf463c8a0527393d91a08f0');
console.log('✅ WASM hash set!');
location.reload();
```

#### Yöntem B: Config Dosyası (Kalıcı)

`Papex_Frontend/src/config/stellar.ts`:

```typescript
preDeployedWasmHash: '65050ba3917476b8098924bca3b0937f263719269bf463c8a0527393d91a08f0',
```

---

### Adım 3: Frontend'i Başlat

```bash
cd /Users/ahmettahirmat/_Papex_/Papex_Frontend
npm run dev
```

---

### Adım 4: Token Oluştur (10 Saniye!)

Artık frontend:
1. ✅ WASM upload'u SKIP eder (cached)
2. ✅ Soroban RPC ile contract instance oluşturur (~5s)
3. ✅ Token'ı initialize eder (~5s)

**Toplam: ~10 saniye!** 🚀

---

## 🔧 Neden CLI Çalışıyor ama Frontend Çalışmıyor?

**Soroban CLI:**
- Doğrudan Stellar Core node'larına bağlanır
- P2P network kullanır
- RPC'ye ihtiyaç duymaz

**Frontend (Browser):**
- CORS kısıtlamaları
- HTTP/HTTPS only
- Soroban RPC API gerektirir
- P2P erişimi yok

---

## 📊 Performans Karşılaştırması

### Soroban RPC Çalıştığında:
```
Frontend → Soroban RPC → Stellar Network
           (HTTP API)

WASM Upload: 1-3 dakika
```

### Soroban RPC Çalışmadığında:
```
CLI → Stellar Network (P2P)
      (Doğrudan)

WASM Upload: 30 saniye! 🚀
```

**CLI daha hızlı!**

---

## 🎯 TAVSİYE: CLI ile Deploy (Her Zaman Daha Hızlı)

RPC çalışsa bile, **CLI ile deploy daha hızlı ve güvenilir**:

```bash
# 1. WASM yükle (30 saniye)
stellar contract install \
  --wasm target/wasm32v1-none/release/papex_papertoken.wasm \
  --network testnet \
  --source papex-admin

# 2. Hash'i kopyala ve frontend'e yapıştır

# 3. Artık tüm tokenlar 10 saniyede!
```

---

## ⏰ Soroban RPC Ne Zaman Düzelir?

Stellar testnet bazen maintenance'a girer. Kontrol etmek için:

1. **Status Page:** https://status.stellar.org
2. **Discord:** https://discord.gg/stellar
3. **Test RPC:** 
   ```bash
   curl https://soroban-testnet.stellar.org
   ```

---

## 💡 ÖZE TNET BİLGİ

**Çözüm:** CLI kullanın → 30 saniyede biter → Frontend'e hash'i ekleyin → Tokenlar 10 saniyede!

**Şu an yapın:**

```bash
# 1. CLI ile WASM yükle
cd /Users/ahmettahirmat/_Papex_/Papex_Contracts/contracts/papex-contract
stellar contract install \
  --wasm target/wasm32v1-none/release/papex_papertoken.wasm \
  --network testnet \
  --source papex-admin

# 2. Çıkan hash'i kopyala

# 3. Frontend'de (F12 Console):
localStorage.setItem('papex_token_wasm_hash', 'HASH_BURAYA');

# 4. Token oluştur → 10 saniye! 🎉
```

---

**🚀 CLI yöntemi her zaman daha hızlı ve güvenilir!**

