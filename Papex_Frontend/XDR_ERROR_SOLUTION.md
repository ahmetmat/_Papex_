# ⚠️ XDR Parsing Error Çözümü

## Sorun

Frontend'de token oluştururken şu hata alıyorsunuz:
```
XDR Read Error: unknown SorobanAuthorizedFunctionType member for value 2
```

Bu hata, **Stellar SDK versiyonu** ile **network protocol versiyonu** arasında uyumsuzluk olduğunda oluşur.

---

## ✅ ÇÖZÜM 1: Soroban CLI ile Deploy (TAVSİYE EDİLEN)

Frontend yerine **Soroban CLI** kullanın - bu hata olmaz:

```bash
cd /Users/ahmettahirmat/_Papex_/Papex_Contracts/contracts/papex-contract

# Contract instance oluştur
stellar contract deploy \
  --wasm target/wasm32v1-none/release/papex_papertoken.wasm \
  --network testnet \
  --source papex-admin
```

Çıkan **contract ID**'yi kopyalayın ve frontend'de manuel girin.

---

## ✅ ÇÖZÜM 2: SDK'yı Güncelle

```bash
cd Papex_Frontend
npm install @stellar/stellar-sdk@latest
npm run dev
```

Sonra tekrar deneyin.

---

## ✅ ÇÖZÜM 3: Transaction'ı Kontrol Et

Hata alsanız bile **transaction başarılı olmuş olabilir**:

1. **Freighter wallet**'ı açın
2. Transaction history'e bakın
3. Son transaction'ı açın
4. Transaction hash'i kopyalayın
5. **Stellar Expert**'e gidin: `https://stellar.expert/explorer/testnet/tx/YOUR_HASH`
6. Contract ID'yi bulun

---

## 📋 Contract ID'yi Manuel Ekleme

Contract ID'yi bulduktan sonra:

1. Frontend'de token creation sayfasına gidin
2. "Contract ID" alanına yapıştırın
3. Token oluşturma devam eder

---

## 🔍 Neden Bu Hata Oluyor?

- Stellar SDK eski versiyon (yeni auth type'ları desteklemiyor)
- Network protocol yeni bir auth type eklemiş
- SDK henüz bu yeni type'ı parse edemiyor

**Çözüm:** CLI kullanın (her zaman güncel) veya SDK'yı güncelleyin.

---

## 💡 Gelecek İçin

Frontend deployment yerine **CLI deployment** kullanın:

1. CLI ile contract deploy edin
2. Contract ID'yi alın  
3. Frontend'de sadece `init` çağrısı yapın (bu hata olmaz)

---

**🎯 En Hızlı Çözüm: Soroban CLI kullanın!**

