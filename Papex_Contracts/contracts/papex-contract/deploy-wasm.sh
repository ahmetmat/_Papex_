#!/bin/bash
# Papex Token Contract - Manuel WASM Deployment Script
# Bu script'i çalıştırarak WASM hash'ini alıp config'e yapıştırabilirsiniz

set -e

echo "🚀 Papex Token Contract WASM Deployment"
echo "========================================"
echo ""

# Renkler
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Adım 1: Identity kontrol
echo -e "${BLUE}📝 Adım 1: Soroban Identity Kontrol${NC}"
echo ""

if ! soroban keys address default >/dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  'default' identity bulunamadı.${NC}"
  echo ""
  echo "Mevcut identities:"
  soroban keys ls
  echo ""
  read -p "Kullanmak istediğiniz identity adını girin (veya Enter'a basıp yeni oluşturun): " IDENTITY
  
  if [ -z "$IDENTITY" ]; then
    echo ""
    echo "Yeni identity oluşturuluyor..."
    soroban keys generate default --network testnet
    IDENTITY="default"
    echo -e "${GREEN}✅ 'default' identity oluşturuldu!${NC}"
  fi
else
  IDENTITY="default"
  echo -e "${GREEN}✅ '$IDENTITY' identity bulundu!${NC}"
fi

echo ""
ADDRESS=$(soroban keys address $IDENTITY)
echo -e "${GREEN}Address: $ADDRESS${NC}"
echo ""

# Adım 2: WASM dosyası kontrol
echo -e "${BLUE}📦 Adım 2: WASM Dosyası Kontrol${NC}"
echo ""

WASM_PATH="target/wasm32v1-none/release/papex_papertoken.wasm"

if [ ! -f "$WASM_PATH" ]; then
  echo -e "${YELLOW}⚠️  WASM dosyası bulunamadı. Build ediliyor...${NC}"
  soroban contract build
fi

if [ -f "$WASM_PATH" ]; then
  WASM_SIZE=$(ls -lh "$WASM_PATH" | awk '{print $5}')
  echo -e "${GREEN}✅ WASM dosyası hazır: $WASM_SIZE${NC}"
else
  echo "❌ WASM dosyası bulunamadı!"
  exit 1
fi

echo ""

# Adım 3: WASM Upload
echo -e "${BLUE}☁️  Adım 3: WASM Upload (Testnet)${NC}"
echo ""
echo "WASM dosyası Stellar testnet'e yükleniyor..."
echo "(Bu işlem 1-2 dakika sürebilir...)"
echo ""

WASM_HASH=$(soroban contract install \
  --wasm "$WASM_PATH" \
  --network testnet \
  --source "$IDENTITY" 2>&1)

if [ $? -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✅ WASM başarıyla yüklendi!${NC}"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo -e "${GREEN}📋 WASM HASH:${NC}"
  echo ""
  echo -e "${YELLOW}$WASM_HASH${NC}"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  
  # Config dosyasına yaz
  CONFIG_FILE="../../Papex_Frontend/src/config/stellar.ts"
  
  echo -e "${BLUE}📝 Config dosyasına yazılıyor...${NC}"
  echo ""
  
  if [ -f "$CONFIG_FILE" ]; then
    # Backup al
    cp "$CONFIG_FILE" "$CONFIG_FILE.backup"
    
    # Hash'i config'e yaz (sed ile)
    sed -i.bak "s/preDeployedWasmHash: null/preDeployedWasmHash: '$WASM_HASH'/g" "$CONFIG_FILE"
    rm "$CONFIG_FILE.bak"
    
    echo -e "${GREEN}✅ Config dosyası güncellendi!${NC}"
    echo "   Dosya: $CONFIG_FILE"
  else
    echo -e "${YELLOW}⚠️  Config dosyası bulunamadı.${NC}"
    echo ""
    echo "Manuel olarak ekleyin:"
    echo ""
    echo "Dosya: Papex_Frontend/src/config/stellar.ts"
    echo ""
    echo "Şu satırı bulun:"
    echo "  preDeployedWasmHash: null,"
    echo ""
    echo "Şununla değiştirin:"
    echo "  preDeployedWasmHash: '$WASM_HASH',"
  fi
  
  echo ""
  echo -e "${GREEN}🎉 Tamamlandı!${NC}"
  echo ""
  echo "Artık tüm token deployment'ları sadece 10 saniye sürecek!"
  echo ""
  
else
  echo ""
  echo -e "❌ WASM upload başarısız oldu:"
  echo "$WASM_HASH"
  exit 1
fi

