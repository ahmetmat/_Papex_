export const STELLAR_CONFIG = {
  /**
   * Soroban Futurenet RPC endpoint.
   * Replace with your preferred network endpoint when deploying.
   */
  rpcUrl: 'https://soroban-testnet.stellar.org',
  /**
   * Futurenet network passphrase. Use the appropriate passphrase when targeting
   * another network (e.g. `Public Global Stellar Network ; September 2015`).
   */
  networkPassphrase: 'Test SDF Network ; September 2015',
  /**
   * Optional read-only account used to simulate contract calls when a wallet
   * connection is not yet available. This can be any funded account.
   */
  readOnlyAccount: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
  /**
   * Update with the deployed Soroban contract IDs once available.
   */
  registryContractId: '<CBCONDDFUWZ2Q3226JDQ5ZXPD7V6S2NCQ76A47K7IPVTB6ZAKIHI5D2M>',
  marketplaceContractId: '<CABADC5GSAYX6KG2ESKV4REU743ZYIQCSTMYCKU4ATZOJ6JTLBRCOFZ6>',
  /**
   * Default decimal precision (Soroban tokens commonly use 7 decimals).
   */
  decimals: 7,
};

export type NetworkConfig = typeof STELLAR_CONFIG;
