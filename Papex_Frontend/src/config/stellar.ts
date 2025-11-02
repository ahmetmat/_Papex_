export const STELLAR_CONFIG = {
  /**
   * Soroban Testnet RPC endpoint.
   * WARNING: If official RPC is down, you'll need to:
   * 1. Use a private RPC node
   * 2. Wait for official RPC to come back online
   * 3. Deploy contracts via Soroban CLI instead of frontend
   */
  rpcUrl: 'https://soroban-testnet.stellar.org:443', // Official Soroban testnet RPC endpoint
  // Horizon API for transaction lookups and fallback (read-only, works!)
  horizonUrl: 'https://horizon-testnet.stellar.org',
  /**
   * Futurenet network passphrase. Use the appropriate passphrase when targeting
   * another network (e.g. `Public Global Stellar Network ; September 2015`).
   */
  networkPassphrase: 'Test SDF Network ; September 2015',
  /**
   * Optional read-only account used to simulate contract calls when a wallet
   * connection is not yet available. For view-only calls, this can be any valid
   * Stellar account format (56 chars starting with G). It doesn't need to be funded.
   */
  readOnlyAccount: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
  /**
   * Update with the deployed Soroban contract IDs once available.
   * Remove the < > brackets and replace with your actual deployed contract IDs.
   * You can also set these via environment variables (VITE_REGISTRY_CONTRACT_ID, VITE_MARKETPLACE_CONTRACT_ID).
   */
  registryContractId: import.meta.env.VITE_REGISTRY_CONTRACT_ID || 'CBCONDDFUWZ2Q3226JDQ5ZXPD7V6S2NCQ76A47K7IPVTB6ZAKIHI5D2M',
  marketplaceContractId: import.meta.env.VITE_MARKETPLACE_CONTRACT_ID || 'CABADC5GSAYX6KG2ESKV4REU743ZYIQCSTMYCKU4ATZOJ6JTLBRCOFZ6',
  /**
   * Default decimal precision (Soroban tokens commonly use 7 decimals).
   */
  decimals: 7,
  /**
   * Pre-deployed WASM hash for papex_papertoken contract.
   * Set this after first successful WASM upload to skip upload step on all future deployments.
   * Leave as null to upload WASM on first deployment.
   */
  preDeployedWasmHash: '10b0e6f74ff81174300a836c4f52c6fc2dcee6185c44447bf93b0080dc1bf58e' as string | null,
};

export type NetworkConfig = typeof STELLAR_CONFIG;
