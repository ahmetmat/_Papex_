<div align="center">

# 🔬 Papex

### **Decentralized Research Paper Tokenization Platform**

> Democratizing access to academic research funding through blockchain technology

![Stellar](https://img.shields.io/badge/Stellar-Soroban-7D00FF?style=for-the-badge&logo=stellar)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Rust](https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white)
![IPFS](https://img.shields.io/badge/IPFS-65C2CB?style=for-the-badge&logo=ipfs&logoColor=white)

[Quick Start](#-quick-start) • [Documentation](#-documentation) • [Architecture](#️-architecture) • [Smart Contracts](#-smart-contracts) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

**Papex** is a revolutionary blockchain-based platform that enables researchers to tokenize their academic papers, allowing investors to directly support scientific research through a decentralized marketplace. Built on Stellar's Soroban smart contract platform, Papex combines the power of blockchain technology with innovative bonding curve mechanics to create liquid markets for academic research.

### ✨ Key Features

- 🔐 **On-Chain Paper Registry** - Immutable storage of research papers with IPFS integration
- 💰 **Automated Market Making** - Bonding curve pricing ensures instant liquidity
- 📊 **Real-Time Trading** - Buy and sell research tokens instantly
- 📈 **Advanced Analytics** - Comprehensive metrics and predictive insights
- 🌍 **IPFS Storage** - Decentralized file storage for PDFs and metadata
- 🎨 **Modern UI/UX** - Beautiful, responsive interface built with React
- 🔍 **Citation Network Visualization** - Interactive graphs showing research connections
- 🤖 **AI-Powered Analytics** - Predictive metrics and impact forecasting

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18.x
- **Soroban CLI** ([Install Guide](https://soroban.stellar.org/docs/getting-started/setup))
- **Freighter Wallet** ([Download](https://www.freighter.app/))
- **Rust** ≥ 1.70 (for contract development)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd _Papex_

# Install frontend dependencies
cd Papex_Frontend
npm install

# Build contracts
cd ../Papex_Contracts/contracts/papex-contract
soroban contract build
```

### Run Locally

```bash
# Start development server
cd Papex_Frontend
npm run dev
```

Visit `http://localhost:5173` to access the platform.

---

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + TypeScript)            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Paper UI   │  │  Trading UI  │  │  Analytics   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Soroban Smart Contracts (Stellar)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Registry   │  │  Marketplace │  │ Paper Token │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   IPFS (Pinata Gateway)                     │
│            PDF Storage & Metadata Distribution               │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Framer Motion |
| **Blockchain** | Stellar Soroban, Stellar SDK |
| **Smart Contracts** | Rust (Soroban Framework) |
| **Storage** | IPFS via Pinata |
| **Wallet** | Freighter API |
| **Charts** | Lightweight Charts, Recharts, D3.js |
| **PDF Processing** | PDF.js |

---

## 🔐 Smart Contracts

### Deployed Contracts (Testnet)

#### 📝 Registry Contract
The registry contract manages paper registrations, metadata storage, and token associations.

- **Contract ID:** `CBCONDDFUWZ2Q3226JDQ5ZXPD7V6S2NCQ76A47K7IPVTB6ZAKIHI5D2M`
- **Network:** Stellar Testnet
- **Explorer:** [Stellar Expert](https://stellar.expert/explorer/testnet/contract/CBCONDDFUWZ2Q3226JDQ5ZXPD7V6S2NCQ76A47K7IPVTB6ZAKIHI5D2M)
- **Deployment Transaction:** `[https://stellar.expert/explorer/testnet/contract/CAUDPMIKVMBZNEULOD5N47EUXFJSPPXMWK2OYDISFFAUAAB447THYZAP]`
- **Deployment Date:** `[TO BE ADDED]`

**Key Functions:**
- `register_paper(metadata_uri, doi)` - Register a new research paper
- `set_token(paper_id, token_address)` - Associate a token with a paper
- `get_paper(paper_id)` - Retrieve paper information
- `list_papers(limit, offset)` - List all registered papers

---

#### 🏪 Marketplace Contract
The marketplace contract handles listings, order management, and trade history.

- **Contract ID:** `CABADC5GSAYX6KG2ESKV4REU743ZYIQCSTMYCKU4ATZOJ6JTLBRCOFZ6`
- **Network:** Stellar Testnet
- **Explorer:** [Stellar Expert](https://stellar.expert/explorer/testnet/contract/CABADC5GSAYX6KG2ESKV4REU743ZYIQCSTMYCKU4ATZOJ6JTLBRCOFZ6)
- **Deployment Transaction:** `[TO BE ADDED]`
- **Deployment Date:** `[TO BE ADDED]`

**Key Functions:**
- `list_paper(paper_id, price)` - Create a marketplace listing
- `trade(paper_id, buyer, amount)` - Execute a trade
- `get_listing(paper_id)` - Get listing details
- `get_trade_history(paper_id)` - Retrieve trade history

---

#### 🪙 Paper Token Contract
Individual bonding curve token contract for each research paper. Each paper gets its own token instance.

- **WASM Hash:** `10b0e6f74ff81174300a836c4f52c6fc2dcee6185c44447bf93b0080dc1bf58e`
- **Network:** Stellar Testnet
- **WASM Upload Transaction:** `[TO BE ADDED]`
- **Upload Date:** `[TO BE ADDED]`

**Note:** Each paper token is deployed as a separate contract instance. The WASM hash above is reused for all token deployments to save gas costs.

**Key Functions:**
- `init(name, symbol, max_supply, base_price, slope, initial_supply, initial_liquidity, payment_token)` - Initialize token
- `buy(buyer, amount, max_payment)` - Buy tokens via bonding curve
- `sell(seller, amount, min_received)` - Sell tokens via bonding curve
- `quote_buy(amount)` - Get buy price quote
- `quote_sell(amount)` - Get sell price quote
- `get_summary()` - Get token summary (price, supply, liquidity)
- `set_trading(caller, is_on)` - Enable/disable trading

### Contract Deployment Transactions

| Contract | Transaction Hash | Status | Explorer Link |
|----------|-----------------|--------|---------------|
| Registry | `[5910403280289792#5910403280289793]` | ✅ Deployed | [View](https://stellar.expert/explorer/testnet/tx/5910403280289792#5910403280289793) |
| Marketplace | `[5910450524925952#5910450524925953]` | ✅ Deployed | [View](https://stellar.expert/explorer/testnet/tx/5910450524925952#5910450524925953) |
| Token WASM | `[10b0e6f74ff81174300a836c4f52c6fc2dcee6185c44447bf93b0080dc1bf58e]` | ✅ Uploaded | [View](https://stellar.expert/explorer/testnet/tx/5910480589697024#5910480589697025) |

> 💡 **Note:** Replace `[TO BE ADDED]` with actual transaction hashes from your deployments.

---

## 💎 Token Economics

### Bonding Curve Mechanism

Papex uses an **automated bonding curve** for price discovery, eliminating the need for traditional order books.

#### Pricing Formula

```
price = basePrice + (slope × currentSupply)
```

#### Example Pricing

| Supply | Price (XLM) | Calculation |
|--------|-------------|-------------|
| 0 tokens | 0.01 XLM | Base price |
| 100 tokens | 0.02 XLM | 0.01 + (0.0001 × 100) |
| 1,000 tokens | 0.11 XLM | 0.01 + (0.0001 × 1000) |
| 10,000 tokens | 1.01 XLM | 0.01 + (0.0001 × 10000) |

#### Benefits

- ✅ **Instant Liquidity** - No waiting for matching orders
- ✅ **Transparent Pricing** - Price is always determinable
- ✅ **No Slippage** (for small trades) - Predictable execution
- ✅ **Automated Market Making** - Continuous price discovery

---

## 📋 User Flow

### 1. Paper Registration (1-2 minutes)

```
Researcher → Upload PDF → Extract Metadata → Upload to IPFS → Register on Blockchain
```

**Steps:**
1. Connect Freighter wallet
2. Upload research paper PDF
3. System extracts metadata (title, authors, abstract)
4. PDF and metadata uploaded to IPFS
5. Paper registered on-chain with IPFS hash

### 2. Token Creation (~10 seconds)

```
Paper Owner → Enter Token Name → Enter Investment Amount → Auto-Deploy Contract → Initialize Token
```

**Steps:**
1. Navigate to token creation page
2. Enter token name and investment amount
3. System automatically:
   - Deploys new token contract instance (or uses cached WASM)
   - Initializes token with bonding curve parameters
   - Associates token with paper in registry

### 3. Trading (Instant)

```
Investor → View Paper → Get Price Quote → Buy/Sell Tokens → Execute Trade
```

**Steps:**
1. Browse research papers
2. View token price and metrics
3. Get quote for buy/sell amount
4. Execute trade via bonding curve
5. Receive tokens instantly

---

## 🔧 Development

### Contract Development

```bash
cd Papex_Contracts/contracts/papex-contract

# Build all contracts
soroban contract build

# Build specific contract
cd papex_registry
soroban contract build

# Run tests
cargo test

# Deploy WASM (one-time)
./deploy-wasm.sh
```

### Frontend Development

```bash
cd Papex_Frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Environment Variables

Create a `.env` file in `Papex_Frontend/`:

```env
VITE_REGISTRY_CONTRACT_ID=CBCONDDFUWZ2Q3226JDQ5ZXPD7V6S2NCQ76A47K7IPVTB6ZAKIHI5D2M
VITE_MARKETPLACE_CONTRACT_ID=CABADC5GSAYX6KG2ESKV4REU743ZYIQCSTMYCKU4ATZOJ6JTLBRCOFZ6
VITE_PINATA_JWT=your_pinata_jwt_here
```

---

## 📚 Documentation

### Core Documentation

- **[Contract Deployment Guide](./Papex_Contracts/contracts/papex-contract/DEPLOYMENT.md)** - Detailed deployment instructions
- **[Frontend README](./Papex_Frontend/README.md)** - Frontend setup and architecture
- **[Contracts README](./Papex_Contracts/README.md)** - Smart contract development guide

### Technical Guides

- **[XDR Error Solutions](./Papex_Frontend/XDR_ERROR_SOLUTION.md)** - Troubleshooting XDR parsing issues
- **[Soroban RPC Issues](./SOROBAN_RPC_DOWN.md)** - Handling RPC downtime
- **[Quick Hash Setup](./Papex_Frontend/QUICK_HASH_SETUP.md)** - WASM hash configuration

---

## 🚀 Deployment

### Network Configuration

#### Testnet (Current)

```typescript
// Papex_Frontend/src/config/stellar.ts
export const STELLAR_CONFIG = {
  rpcUrl: 'https://soroban-testnet.stellar.org:443',
  horizonUrl: 'https://horizon-testnet.stellar.org',
  networkPassphrase: 'Test SDF Network ; September 2015',
  registryContractId: 'CBCONDDFUWZ2Q3226JDQ5ZXPD7V6S2NCQ76A47K7IPVTB6ZAKIHI5D2M',
  marketplaceContractId: 'CABADC5GSAYX6KG2ESKV4REU743ZYIQCSTMYCKU4ATZOJ6JTLBRCOFZ6',
  preDeployedWasmHash: '10b0e6f74ff81174300a836c4f52c6fc2dcee6185c44447bf93b0080dc1bf58e',
};
```

#### Mainnet (Future)

```typescript
export const STELLAR_CONFIG = {
  rpcUrl: 'https://soroban-mainnet.stellar.org',
  horizonUrl: 'https://horizon.stellar.org',
  networkPassphrase: 'Public Global Stellar Network ; September 2015',
  // ... contract IDs to be updated
};
```

### Production Build

```bash
cd Papex_Frontend
npm run build
```

The `dist/` folder contains the production-ready build.

---

## 🐛 Troubleshooting

### Common Issues

#### "WASM hash not found"

```bash
cd Papex_Contracts/contracts/papex-contract
./deploy-wasm.sh
```

#### "Contract ID not configured"

Update contract IDs in `Papex_Frontend/src/config/stellar.ts` or set environment variables.

#### "Freighter not connected"

1. Install [Freighter wallet](https://www.freighter.app/)
2. Create or import an account
3. Ensure account is funded with XLM (testnet faucet: [Stellar Laboratory](https://laboratory.stellar.org/#account-creator?network=test))

#### "RPC endpoint unreachable"

If Soroban RPC is down:
1. Wait for RPC to come back online
2. Use alternative RPC endpoint (if available)
3. Deploy contracts via Soroban CLI instead of frontend

#### "Transaction timeout"

- Increase timeout in transaction polling
- Check transaction status manually on [Stellar Expert](https://stellar.expert/explorer/testnet)
- Verify network connectivity

---

## 🧪 Testing

### Contract Tests

```bash
cd Papex_Contracts/contracts/papex-contract
cargo test
```

### Frontend Tests

```bash
cd Papex_Frontend
npm test
```

---

## 📊 Project Structure

```
_Papex_/
├── Papex_Contracts/              # Smart contracts workspace
│   └── contracts/
│       └── papex-contract/
│           ├── papex_registry/    # Paper registry contract
│           ├── papex_marketplace/ # Marketplace contract
│           ├── papex_papertoken/  # Token contract (bonding curve)
│           └── deploy-wasm.sh    # WASM deployment script
│
├── Papex_Frontend/                # React frontend
│   ├── src/
│   │   ├── components/           # React components
│   │   │   ├── analytics/        # Analytics dashboard
│   │   │   ├── marketplace/      # Paper listing
│   │   │   ├── tokenization/     # Paper upload & token creation
│   │   │   └── trading/          # Trading interface
│   │   ├── context/              # React contexts
│   │   ├── lib/                  # Core libraries
│   │   │   └── soroban.ts        # Soroban integration
│   │   └── config/               # Configuration files
│   └── public/
│       └── contracts/            # Deployed WASM files
│
└── README.md                     # This file
```

---

## 🎯 Roadmap

### Completed ✅

- [x] Paper registry on-chain
- [x] Bonding curve token implementation
- [x] IPFS integration (Pinata)
- [x] Automated contract deployment
- [x] Trading interface with real-time charts
- [x] Advanced analytics dashboard
- [x] Citation network visualization
- [x] Predictive metrics

### In Progress 🚧

- [ ] TradingView integration
- [ ] Enhanced order book
- [ ] Liquidity pool management
- [ ] Governance features

### Planned 📅

- [ ] Multi-chain support
- [ ] Mobile app
- [ ] Social trading features
- [ ] Advanced filtering and search
- [ ] Research impact scoring
- [ ] Automated citation tracking

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Test thoroughly**
5. **Commit your changes** (`git commit -m 'Add some amazing feature'`)
6. **Push to the branch** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Follow the existing code style
- Ensure all tests pass before submitting

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Stellar Development Foundation** - For the Soroban platform
- **Pinata** - For IPFS infrastructure
- **Freighter** - For wallet integration
- **Open Source Community** - For amazing libraries and tools

---

## 📞 Support & Contact

### Resources

- 📖 [Documentation](./Papex_Contracts/contracts/papex-contract/DEPLOYMENT.md)
- 🐛 [Report Issues](https://github.com/[your-repo]/issues)
- 💬 [Discussions](https://github.com/[your-repo]/discussions)
- 📧 Email: `[your-email]`

### Community

- 🌐 Website: `[your-website]`
- 🐦 Twitter: `[@your-handle]`
- 💼 LinkedIn: `[your-profile]`

---

<div align="center">

**Built with ❤️ for researchers and investors**

*Democratizing access to academic research funding through blockchain technology*

[⬆ Back to Top](#-papex)

</div>
