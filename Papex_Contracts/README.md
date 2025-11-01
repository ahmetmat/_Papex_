# Papex Soroban Contracts

This workspace contains the Soroban smart contracts that power the Papex research marketplace. All contracts are Rust crates packaged in a single Cargo workspace.

## Contracts

| Contract | Path | Purpose |
|----------|------|---------|
| `papex_registry` | `contracts/papex-contract/papex_registry` | Stores papers, metadata, token assignments, and status transitions. |
| `papex_marketplace` | `contracts/papex-contract/papex_marketplace` | Maintains marketplace listings and lightweight trade history per paper. |
| `papex_papertoken` | `contracts/papex-contract/papex_papertoken` | Bonding-curve token contract for an individual paper (buy/sell, liquidity tracking). |

Each crate exposes `init` plus a set of admin/user methods documented in the source files. Unit tests (`src/test.rs`) cover the main flows; run them with Cargo.

## Build & test

```bash
cd Papex_Contracts/contracts/papex-contract
cargo build --target wasm32-unknown-unknown --release
cargo test
```

> ⚠️ Building/tests may download new crates. If your environment lacks network access, mirror the crates ahead of time or run the commands on a networked machine.

The resulting WASM files are under `target/wasm32-unknown-unknown/release/`. Upload them with `soroban contract deploy` and note the contract IDs for the frontend configuration (`src/config/stellar.ts`).

## Deployment tips

1. **Upload WASM**: `soroban contract deploy --wasm target/.../papex_papertoken.wasm --source <key> --network futurenet`
2. **Initialize** each contract with the desired parameters (owner address, pricing curve, etc.).
3. **Link tokens** via `papex_registry.set_token` and register the listing through `papex_marketplace.register_listing`.

The frontend (`Papex_Frontend`) uses Soroban RPC calls (`@stellar/stellar-sdk`) to interact with these contracts. Update the config file with the deployed contract IDs to complete the integration.
