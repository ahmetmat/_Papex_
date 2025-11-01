# Papex Frontend · Soroban Edition

Papex is a research paper marketplace that now targets the **Stellar Soroban** smart-contract stack.  
This frontend integrates with the Soroban contracts contained in `Papex_Contracts` and assumes Freighter as the end-user wallet.

## Prerequisites

- Node.js 18+ / npm 9+
- [Freighter](https://www.freighter.app/) browser wallet (Futurenet enabled)
- Soroban CLI (`cargo install --locked soroban-cli`)
- Deployed Soroban contracts:
  - `papex_registry`
  - `papex_marketplace`
  - At least one `papex_papertoken` instance per paper

> 💡 The contract WASM files are produced from the `Papex_Contracts` workspace.  
> Deploy them to Futurenet (or your chosen network) and note the resulting contract IDs.

## Install dependencies

```bash
cd Papex_Frontend
npm install
```

If npm cannot reach the registry from your environment, mirror the dependencies manually and re-run `npm install`.

## Configure Stellar endpoints

Edit `src/config/stellar.ts` and set:

- `registryContractId`
- `marketplaceContractId`
- Optionally replace `readOnlyAccount`, `rpcUrl`, and `networkPassphrase` if you target a network other than Futurenet.

## Run the development server

```bash
npm run dev
```

Visit the printed URL (default `http://localhost:5173`). Freighter will prompt for permissions when blockchain actions are performed.

## On-chain workflow

1. **Upload/prepare a paper** using your existing backend (the context stub throws by default—replace it with your API client).
2. **Deploy** a `papex_papertoken` contract for the paper (supply name, symbol, pricing parameters during `init`).
3. **Link** the token to the registry via the *Token Creation* UI (calls `registry.set_token`).
4. **Create a marketplace listing** (calls `marketplace.register_listing` with your metadata URI).
5. Trade tokens through the *Token Trading* screen (quotes + buy/sell use Soroban RPC).

## Soroban utilities

Helper functions live in `src/lib/soroban.ts` and wrap:

- `invokeView` – simulation calls.
- `invokeTransaction` – signed transactions via Freighter.

Numbers are scaled to 7 decimals (Soroban default) using helpers in `src/utils/stellarNumber.ts`.

## Testing & linting

```bash
npm run lint    # ESLint (React 19 configuration)
```

End-to-end and contract integration tests are not yet wired in this repo.  
When the network is available, add custom checks or hook into the Soroban CLI workflows.
