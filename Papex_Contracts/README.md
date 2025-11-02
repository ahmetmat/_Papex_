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

⚠️ **IMPORTANT**: Contracts must be built using `soroban contract build` to ensure compatibility with Soroban. Using `cargo build --target wasm32-unknown-unknown` will produce WASM files with reference types enabled, which Soroban does not support.

### Build all contracts:
```bash
cd Papex_Contracts/contracts/papex-contract
soroban contract build
```

### Build a specific contract:
```bash
cd Papex_Contracts/contracts/papex-contract/papex_papertoken
soroban contract build
```

### Run tests:
```bash
cd Papex_Contracts/contracts/papex-contract
cargo test
```

> ⚠️ Building/tests may download new crates. If your environment lacks network access, mirror the crates ahead of time or run the commands on a networked machine.

The resulting WASM files are under `target/wasm32v1-none/release/`. These are Soroban-compatible WASM files that can be deployed.

### Copy WASM to frontend:
After building, copy the WASM files to the frontend's public folder:
```bash
cp target/wasm32v1-none/release/papex_papertoken.wasm /path/to/Papex_Frontend/public/contracts/
```

## Deployment tips

1. **Upload WASM**: `soroban contract deploy --wasm target/.../papex_papertoken.wasm --source <key> --network futurenet`
2. **Initialize** each contract with the desired parameters (owner address, pricing curve, etc.).
3. **Link tokens** via `papex_registry.set_token` and register the listing through `papex_marketplace.register_listing`.

The frontend (`Papex_Frontend`) uses Soroban RPC calls (`@stellar/stellar-sdk`) to interact with these contracts. Update the config file with the deployed contract IDs to complete the integration.
