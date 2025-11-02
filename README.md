# 🚀 Papex - Decentralized Research Paper Tokenization Platform

Papex is a blockchain-based platform for tokenizing academic research papers using Soroban smart contracts on Stellar.

## 📁 Project Structure

```
_Papex_/
├── Papex_Contracts/          # Soroban smart contracts
│   └── contracts/
│       └── papex-contract/
│           ├── papex_registry/      # Paper registry contract
│           ├── papex_papertoken/    # Token contract (bonding curve)
│           ├── papex_marketplace/   # Trading marketplace
│           └── deploy-wasm.sh       # 🎯 WASM deployment script
│
└── Papex_Frontend/           # React frontend application
    ├── src/
    │   ├── components/
    │   ├── context/
    │   ├── lib/
    │   └── config/
    └── public/
        └── contracts/        # Deployed WASM files
```

## 🎯 Quick Start (5 Minutes)

### Step 1: Deploy WASM (One-Time Setup)

```bash
cd Papex_Contracts/contracts/papex-contract
./deploy-wasm.sh
```

This script will:
- ✅ Upload token contract WASM to Stellar testnet
- ✅ Get the WASM hash
- ✅ Automatically update frontend config

**Time:** ~2 minutes (only needed once)

### Step 2: Start Frontend

```bash
cd Papex_Frontend
npm install  # First time only
npm run dev
```

**Frontend:** http://localhost:5173

### Step 3: Create Your First Token

1. Connect Freighter wallet
2. Upload a research paper PDF
3. Create a token (takes ~10 seconds)
4. Start trading! 📈

---

## 📋 Prerequisites

### Required:
- [Node.js](https://nodejs.org/) (v18+)
- [Soroban CLI](https://soroban.stellar.org/docs/getting-started/setup)
- [Freighter Wallet](https://www.freighter.app/)

### Optional (for contract development):
- [Rust](https://www.rust-lang.org/)
- Stellar testnet account with XLM

---

## 🏗️ Architecture

### Smart Contracts

1. **Registry Contract** (`papex_registry`)
   - Stores paper metadata
   - Links papers to tokens
   - Manages paper listings

2. **Paper Token Contract** (`papex_papertoken`)
   - Bonding curve pricing
   - Automated market maker (AMM)
   - Buy/sell functionality

3. **Marketplace Contract** (`papex_marketplace`)
   - Order book
   - Trading features

### Frontend

- **React** + **TypeScript**
- **Stellar SDK** for blockchain interaction
- **Freighter API** for wallet integration
- **Pinata** for IPFS storage
- **PDF.js** for PDF processing

---

## 🔧 Development

### Contract Development

```bash
cd Papex_Contracts/contracts/papex-contract

# Build contracts
soroban contract build

# Run tests
cargo test

# Deploy WASM
./deploy-wasm.sh
```

### Frontend Development

```bash
cd Papex_Frontend

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

---

## 📖 User Flow

```
1. Paper Upload (1 minute)
   └─ Upload PDF → Extract metadata → Register on blockchain

2. Token Creation (10 seconds)
   └─ Enter token name + investment amount → Auto-deploy → Initialize

3. Trading (Instant)
   └─ Buy/sell tokens via bonding curve pricing
```

### First Token Creation

- **Time:** ~2-3 minutes (WASM upload + deployment)
- **User Action:** Enter token name + investment
- **System:** Auto-deploy contract + initialize token

### Subsequent Token Creations

- **Time:** ~10 seconds (cached WASM)
- **User Action:** Enter token name + investment
- **System:** Create new instance + initialize token

---

## 💎 Token Economics (Bonding Curve)

Papex uses an automated bonding curve for price discovery:

```javascript
price = basePrice + (slope × currentSupply)

Example:
  • 0 tokens    → 0.01 XLM
  • 100 tokens  → 0.02 XLM
  • 1000 tokens → 0.11 XLM
```

**Benefits:**
- ✅ Instant liquidity
- ✅ Transparent pricing
- ✅ No order books needed
- ✅ Automatic price discovery

---

## 🔐 Security

- Smart contracts deployed on Stellar Soroban
- Wallet integration via Freighter (non-custodial)
- All transactions signed by user
- Open-source and auditable

---

## 🚀 Deployment

### Testnet (Current)

- **Network:** Stellar Testnet
- **RPC:** https://soroban-testnet.stellar.org
- **Horizon:** https://horizon-testnet.stellar.org

### Mainnet (Future)

Update `Papex_Frontend/src/config/stellar.ts`:

```typescript
networkPassphrase: Networks.PUBLIC,
rpcUrl: 'https://soroban-mainnet.stellar.org',
```

---

## 📚 Documentation

- [Contract Deployment Guide](./Papex_Contracts/contracts/papex-contract/DEPLOYMENT.md)
- [Frontend Setup](./Papex_Frontend/README.md)
- [Contract Development](./Papex_Contracts/README.md)

---

## 🐛 Troubleshooting

### "WASM hash not found"

```bash
cd Papex_Contracts/contracts/papex-contract
./deploy-wasm.sh
```

### "Contract ID not configured"

Update `Papex_Frontend/src/config/stellar.ts` with deployed contract IDs.

### "Freighter not connected"

Install [Freighter wallet](https://www.freighter.app/) and create/import an account.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🎯 Roadmap

- [x] Paper registry on-chain
- [x] Token bonding curve
- [x] IPFS integration
- [x] Automated deployment
- [ ] TradingView integration
- [ ] Advanced analytics
- [ ] Multi-chain support
- [ ] Governance features

---

## 📞 Support

For questions and support:
- Open an issue on GitHub
- Check the documentation
- Review troubleshooting guide

---

**Built with ❤️ for researchers and investors**

*Democratizing access to academic research funding through blockchain technology*

