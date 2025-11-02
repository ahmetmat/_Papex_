import React, {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  isConnected,
  requestAccess,
  getAddress,
  WatchWalletChanges,
} from '@stellar/freighter-api';
import { Address, nativeToScVal, xdr } from '@stellar/stellar-sdk';
import { STELLAR_CONFIG } from '../config/stellar.ts';
import {
  invokeTransaction,
  invokeView,
  deployContract,
  toAddress,
  toI128,
  toU32,
} from '../lib/soroban';
import {
  decimalToI128,
  formatDecimal,
  i128ToDecimal,
} from '../utils/stellarNumber';

/* -------------------- Tipler -------------------- */
type ChainStatus = 'pending' | 'tokenized' | 'archived';

export interface ChainPaper {
  id: number;
  owner: string;
  metadataUri: string;
  doi?: string | null;
  token?: string | null;
  status: ChainStatus;
  registeredAt: number;
}

export interface TokenSummary {
  name: string;
  symbol: string;
  owner: string;
  maxSupply: string;
  totalSupply: string;
  basePrice: string;
  slope: string;
  liquidity: string;
  trading: boolean;
  paymentToken?: string | null;
}

export interface Quote {
  cost: string;
  priceBefore: string;
  priceAfter: string;
}

export interface TradeRecord {
  trader: string;
  amount: string;
  cost: string;
  isBuy: boolean;
  timestamp: number;
}

export interface MarketplaceListing {
  id: number;
  paperId: number;
  token: string;
  metadataUri: string;
  owner: string;
  isActive: boolean;
  createdAt: number;
}

interface ArticaContextValue {
  walletAddress: string | null;
  connectWallet: () => Promise<string>;
  disconnectWallet: () => void;
  ensureWallet: () => Promise<string>;
  registerPaper: (metadataUri: string, doi?: string | null) => Promise<number | null>;
  getPaper: (paperId: number) => Promise<ChainPaper | null>;
  listPapers: (limit?: number) => Promise<ChainPaper[]>;
  deployTokenContract: () => Promise<string | null>;
  createToken: (
    tokenContractId: string,
    name: string,
    symbol: string,
    maxSupply: string,
    basePrice: string,
    slope: string,
    initialSupply: string,
    initialLiquidity: string,
    paymentToken?: string | null,
  ) => Promise<string | null>;
  getTokenSummary: (contractId: string) => Promise<TokenSummary | null>;
  quoteBuy: (contractId: string, amount: string) => Promise<Quote | null>;
  quoteSell: (contractId: string, amount: string) => Promise<Quote | null>;
  executeBuy: (contractId: string, amount: string, maxPayment?: string) => Promise<string | null>;
  executeSell: (contractId: string, amount: string, minPayment?: string) => Promise<string | null>;
  loadTrades: (paperId: number) => Promise<TradeRecord[]>;
  listListings: (limit?: number, onlyActive?: boolean) => Promise<MarketplaceListing[]>;
  associateToken: (paperId: number, tokenContractId: string) => Promise<string | null>;
  registerListing: (
    paperId: number,
    tokenContractId: string,
    metadataUri: string,
  ) => Promise<string | null>;
  setTrading: (contractId: string, isEnabled: boolean) => Promise<string | null>;
}

/* -------------------- Context -------------------- */
const ArticaContext = createContext<ArticaContextValue | undefined>(undefined);

/* -------------------- Yardımcılar -------------------- */
const toBigInt = (value: unknown): bigint => {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(Math.trunc(value));
  if (typeof value === 'string' && value.trim() !== '') return BigInt(value);
  return 0n;
};

const normalizeStatus = (status: unknown): ChainStatus => {
  const numeric = typeof status === 'number' ? status : Number(status ?? 0);
  if (numeric === 1) return 'tokenized';
  if (numeric === 2) return 'archived';
  return 'pending';
};

const normalizePaper = (record: any): ChainPaper | null => {
  if (!record || typeof record !== 'object') return null;
  const id = Number(record.id ?? record.paper_id ?? 0);
  const data = record.data ?? record.paper ?? {};
  return {
    id,
    owner: data.owner ?? '',
    metadataUri: data.metadata_uri ?? '',
    doi: data.doi ?? null,
    token: data.token ?? null,
    status: normalizeStatus(data.status),
    registeredAt: Number(data.registered_at ?? 0),
  };
};

const normalizeSummary = (raw: any): TokenSummary | null => {
  if (!raw) return null;
  const paymentToken = raw.payment_token ?? raw.paymentToken ?? null;
  const maxSupply = i128ToDecimal(toBigInt(raw.max_supply ?? raw.maxSupply ?? 0n));
  const totalSupply = i128ToDecimal(toBigInt(raw.total_supply ?? raw.totalSupply ?? 0n));
  const basePrice = i128ToDecimal(toBigInt(raw.base_price ?? raw.basePrice ?? 0n));
  const slope = i128ToDecimal(toBigInt(raw.slope ?? 0n));
  const liquidity = i128ToDecimal(toBigInt(raw.liquidity ?? 0n));

  return {
    name: raw.name ?? '',
    symbol: raw.symbol ?? '',
    owner: raw.owner ?? '',
    maxSupply,
    totalSupply,
    basePrice,
    slope,
    liquidity,
    trading: Boolean(raw.trading),
    paymentToken,
  };
};

const normalizeQuote = (raw: any): Quote | null => {
  if (!raw) return null;
  return {
    cost: i128ToDecimal(toBigInt(raw.cost ?? 0n)),
    priceBefore: i128ToDecimal(toBigInt(raw.price_before ?? raw.priceBefore ?? 0n)),
    priceAfter: i128ToDecimal(toBigInt(raw.price_after ?? raw.priceAfter ?? 0n)),
  };
};

const normalizeTrade = (raw: any): TradeRecord | null => {
  if (!raw) return null;
  return {
    trader: raw.trader ?? '',
    amount: i128ToDecimal(toBigInt(raw.amount ?? 0n)),
    cost: i128ToDecimal(toBigInt(raw.cost ?? 0n)),
    isBuy: Boolean(raw.is_buy ?? raw.isBuy),
    timestamp: Number(raw.timestamp ?? Date.now()),
  };
};

const normalizeListing = (record: any): MarketplaceListing | null => {
  if (!record || typeof record !== 'object') return null;
  const id = Number(record.id ?? 0);
  const data = record.data ?? {};
  return {
    id,
    paperId: Number(data.paper_id ?? data.paperId ?? id),
    token: data.token ?? '',
    metadataUri: data.metadata_uri ?? '',
    owner: data.owner ?? '',
    isActive: Boolean(data.is_active ?? data.isActive ?? true),
    createdAt: Number(data.created_at ?? Date.now()),
  };
};

/* -------------------- Provider -------------------- */
export const ArticaProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const walletWatcherRef = useRef<WatchWalletChanges | null>(null);

  /** ✅ Önce assertContractId: tüm callback'lerde kullanılacak */
  const assertContractId = useCallback((contractId: string) => {
    if (!contractId || contractId.startsWith('<') || contractId.endsWith('>')) {
      throw new Error('Contract ID is not configured. Update src/config/stellar.ts.');
    }
  }, []);

  /* ---- Wallet Auto-Detection on Page Load ---- */
  useEffect(() => {
    const checkWalletConnection = async () => {
      try {
        // Check if Freighter is connected
        const connectionStatus = await isConnected();
        
        if (connectionStatus.isConnected && !connectionStatus.error) {
          // Try to get address without requesting access (if already authorized)
          const addressResult = await getAddress();
          
          if (addressResult.address && !addressResult.error) {
            setWalletAddress(addressResult.address);
            
            // Start watching for wallet changes
            if (!walletWatcherRef.current) {
              walletWatcherRef.current = new WatchWalletChanges(1000);
              walletWatcherRef.current.watch((results) => {
                if (results.address) {
                  setWalletAddress(results.address);
                } else {
                  // Wallet disconnected
                  setWalletAddress(null);
                }
              });
            }
          }
        }
      } catch (error) {
        // Silently fail - user will need to connect manually
        console.debug('Wallet auto-detection failed:', error);
      }
    };

    // Only run in browser environment
    if (typeof window !== 'undefined') {
      void checkWalletConnection();
    }

    // Cleanup watcher on unmount
    return () => {
      if (walletWatcherRef.current) {
        walletWatcherRef.current.stop();
        walletWatcherRef.current = null;
      }
    };
  }, []);

  /* ---- Cüzdan ---- */
  const connectWallet = useCallback(async () => {
    try {
      // Check if Freighter is installed and available
      const connectionStatus = await isConnected();
      
      if (connectionStatus.error || !connectionStatus.isConnected) {
        throw new Error(
          connectionStatus.error || 
          'Freighter wallet not found. Please install Freighter extension.'
        );
      }

      // Request access from user
      const accessResult = await requestAccess();
      
      if (accessResult.error) {
        throw new Error(accessResult.error);
      }

      if (!accessResult.address) {
        throw new Error('Unable to retrieve wallet address.');
      }

      setWalletAddress(accessResult.address);

      // Start watching for wallet changes if not already watching
      if (!walletWatcherRef.current) {
        walletWatcherRef.current = new WatchWalletChanges(1000);
        walletWatcherRef.current.watch((results) => {
          if (results.address) {
            setWalletAddress(results.address);
          } else {
            // Wallet disconnected
            setWalletAddress(null);
          }
        });
      }

      return accessResult.address;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unable to connect Freighter wallet.';
      console.error('Wallet connection error:', errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    // Stop watching for changes
    if (walletWatcherRef.current) {
      walletWatcherRef.current.stop();
      walletWatcherRef.current = null;
    }
    
    setWalletAddress(null);
  }, []);

  const ensureWallet = useCallback(async () => {
    console.log('🔍 ensureWallet called, current walletAddress:', walletAddress ? `${walletAddress.substring(0, 8)}...` : 'null');
    
    if (walletAddress) {
      const trimmed = walletAddress.trim();
      if (!trimmed || trimmed.length < 10) {
        console.error('❌ Invalid walletAddress in state:', walletAddress);
        throw new Error('Invalid wallet address in state. Please reconnect your wallet.');
      }
      if (!trimmed.startsWith('G') || trimmed.length !== 56) {
        console.error('❌ Invalid walletAddress format:', trimmed);
        throw new Error(
          `Invalid wallet address format in state: "${trimmed.substring(0, 10)}...". ` +
          'Please reconnect your wallet.'
        );
      }
      console.log('✅ Using existing walletAddress:', trimmed.substring(0, 8) + '...');
      return trimmed;
    }
    
    // Try to connect wallet
    console.log('🔄 walletAddress is null, attempting to connect...');
    let connectedAddress: string;
    try {
      connectedAddress = await connectWallet();
      console.log('✅ connectWallet returned:', connectedAddress ? `${connectedAddress.substring(0, 8)}...` : 'EMPTY');
    } catch (connectError) {
      console.error('❌ connectWallet failed:', connectError);
      throw new Error(
        'Wallet connection failed. Please make sure Freighter wallet is installed and unlocked. ' +
        'Try refreshing the page and connecting again. ' +
        `Error: ${connectError instanceof Error ? connectError.message : String(connectError)}`
      );
    }
    
    if (!connectedAddress || !connectedAddress.trim()) {
      console.error('❌ connectWallet returned empty address');
      throw new Error(
        'Wallet connection failed - no address returned. ' +
        'Please make sure Freighter wallet is installed and unlocked. ' +
        'Try refreshing the page and connecting again.'
      );
    }
    
    const trimmedAddress = connectedAddress.trim();
    if (!trimmedAddress.startsWith('G') || trimmedAddress.length !== 56) {
      console.error('❌ Invalid address format from connectWallet:', trimmedAddress);
      throw new Error(
        `Invalid wallet address format: "${trimmedAddress.substring(0, 10)}...". ` +
        'Expected 56-character address starting with "G". Please reconnect your wallet.'
      );
    }
    
    console.log('✅ Connected wallet address:', trimmedAddress.substring(0, 8) + '...');
    return trimmedAddress;
  }, [walletAddress, connectWallet]);

  /* ---- Paper: register/get/list ---- */
  const registerPaper = useCallback(
    async (metadataUri: string, doi?: string | null) => {
      assertContractId(STELLAR_CONFIG.registryContractId);

      const trimmedUri = metadataUri.trim();
      if (!trimmedUri) {
        throw new Error('Metadata URI is required');
      }

      const caller = await ensureWallet();
      const doiValue = doi && doi.trim() !== '' ? doi.trim() : null;

      // Create Option<String> ScVal for Soroban
      // Based on test snapshots, Option<String> is passed as direct string (not wrapped)
      // The contract expects Option<String> but test snapshots show plain string
      // This suggests Soroban SDK handles the conversion automatically
      // For Some: pass string directly
      // For None: need to check the correct None representation
      let doiScVal: xdr.ScVal;
      if (doiValue) {
        // Some(value) - Based on test snapshot, pass as direct string
        // The SDK/contract should handle Option wrapping
        doiScVal = nativeToScVal(doiValue, { type: 'string' });
      } else {
        // None - Use Option type with null
        // This creates scvVoid which represents Option::None
        doiScVal = nativeToScVal(null, { type: 'option', inner: { type: 'string' } });
      }

      const args = [
        toAddress(caller).toScVal(),
        nativeToScVal(trimmedUri, { type: 'string' }),
        doiScVal,
      ];

      const { signTransaction: freighterSignTransaction } = await import('@stellar/freighter-api');
      
      const result = await invokeTransaction(
        STELLAR_CONFIG.registryContractId,
        'register_paper',
        args,
        freighterSignTransaction,
        caller,
      );

      // result.result number/bigint/serialized olabilir; normalize et
      if (typeof result.result === 'number') return result.result;
      if (typeof result.result === 'bigint') return Number(result.result);
      if (result.result !== null && result.result !== undefined) {
        const parsed = Number(result.result);
        if (!Number.isNaN(parsed)) return parsed;
      }
      return null;
    },
    [assertContractId, ensureWallet],
  );

  const getPaper = useCallback(
    async (paperId: number) => {
      assertContractId(STELLAR_CONFIG.registryContractId);
      const result = await invokeView(
        STELLAR_CONFIG.registryContractId,
        'get_paper',
        [toU32(paperId)],
      );
      if (!result) return null;
      return normalizePaper(result);
    },
    [assertContractId],
  );

  const listPapers = useCallback(
    async (limit = 50) => {
      try {
        console.log('listPapers called with limit:', limit);
        console.log('Registry contract ID:', STELLAR_CONFIG.registryContractId);
        
        assertContractId(STELLAR_CONFIG.registryContractId);
        
        console.log('Calling invokeView for list_papers...');
        const result = await invokeView(
          STELLAR_CONFIG.registryContractId,
          'list_papers',
          [toU32(limit)],
        );
        
        console.log('list_papers raw result:', result);
        
        if (!result || !Array.isArray(result)) {
          console.log('Result is not an array, returning empty array');
          return [];
        }
        
        const papers = result
          .map((item) => normalizePaper(item))
          .filter((item): item is ChainPaper => Boolean(item));
        
        console.log('Normalized papers:', papers);
        return papers;
      } catch (error) {
        console.error('listPapers error:', error);
        // If contract ID is not configured, return empty array instead of throwing
        if (error instanceof Error && error.message.includes('Contract ID is not configured')) {
          console.warn('Contract ID not configured. Please update src/config/stellar.ts');
          return [];
        }
        throw error;
      }
    },
    [assertContractId],
  );

  /* ---- Token deployment & creation ---- */
  const deployTokenContract = useCallback(
    async () => {
      console.log('🔍 deployTokenContract: Getting wallet address...');
      console.log('Current walletAddress state:', walletAddress);
      
      let caller: string;
      try {
        caller = await ensureWallet();
        console.log('✅ ensureWallet returned:', caller ? `${caller.substring(0, 8)}...` : 'EMPTY');
      } catch (walletError) {
        const walletErrorMsg = walletError instanceof Error ? walletError.message : String(walletError);
        console.error('❌ ensureWallet failed:', walletErrorMsg);
        throw new Error(`Wallet connection failed: ${walletErrorMsg}`);
      }
      
      // Validate caller before proceeding
      if (!caller || typeof caller !== 'string' || caller.trim() === '') {
        console.error('❌ Invalid caller from ensureWallet:', caller);
        throw new Error(
          'Wallet address is invalid. Please reconnect your wallet. ' +
          `Current address: ${caller || 'undefined'}`
        );
      }
      
      if (!caller.startsWith('G') || caller.length !== 56) {
        console.error('❌ Invalid caller format:', caller);
        throw new Error(
          `Invalid wallet address format: "${caller.substring(0, 10)}...". ` +
          'Expected 56-character address starting with "G". Please reconnect your wallet.'
        );
      }
      
      console.log('🚀 deployTokenContract: Calling deployContract with address:', caller.substring(0, 8) + '...');
      
      try {
        const contractId = await deployContract(caller.trim());
        console.log('✅ deployContract succeeded, contract ID:', contractId);
        return contractId;
      } catch (error) {
        console.error('❌ Token contract deployment error:', error);
        throw error;
      }
    },
    [ensureWallet, walletAddress],
  );

  const createToken = useCallback(
    async (
      tokenContractId: string,
      name: string,
      symbol: string,
      maxSupply: string,
      basePrice: string,
      slope: string,
      initialSupply: string,
      initialLiquidity: string,
      paymentToken?: string | null,
    ) => {
      assertContractId(tokenContractId);
      const owner = await ensureWallet();

      // Convert decimal strings to i128 (bigint)
      const maxSupplyI128 = decimalToI128(maxSupply, STELLAR_CONFIG.decimals);
      const basePriceI128 = decimalToI128(basePrice, STELLAR_CONFIG.decimals);
      const slopeI128 = decimalToI128(slope, STELLAR_CONFIG.decimals);
      const initialSupplyI128 = decimalToI128(initialSupply, STELLAR_CONFIG.decimals);
      const initialLiquidityI128 = decimalToI128(initialLiquidity, STELLAR_CONFIG.decimals);

      // Validate inputs
      if (maxSupplyI128 <= 0n) throw new Error('Max supply must be positive');
      if (basePriceI128 <= 0n) throw new Error('Base price must be positive');
      if (slopeI128 < 0n) throw new Error('Slope must be non-negative');
      if (initialSupplyI128 < 0n) throw new Error('Initial supply must be non-negative');
      if (initialLiquidityI128 < 0n) throw new Error('Initial liquidity must be non-negative');
      if (initialSupplyI128 > maxSupplyI128) {
        throw new Error('Initial supply cannot exceed max supply');
      }

      // Create payment token Option<Address>
      // For Option<Address>, use nativeToScVal with option type (same as Option<String> pattern)
      let paymentTokenScVal: xdr.ScVal;
      if (paymentToken && paymentToken.trim() !== '') {
        // Some(value) - Option::Some(Address)
        // Use nativeToScVal with option type and the address value
        paymentTokenScVal = nativeToScVal(paymentToken.trim(), { 
          type: 'option', 
          inner: { type: 'address' } 
        });
      } else {
        // None - Option::None representation
        // Use nativeToScVal with null for Option::None
        paymentTokenScVal = nativeToScVal(null, { 
          type: 'option', 
          inner: { type: 'address' } 
        });
      }

      const args = [
        toAddress(owner).toScVal(),
        nativeToScVal(name.trim(), { type: 'string' }),
        nativeToScVal(symbol.trim().toUpperCase(), { type: 'string' }),
        toI128(maxSupplyI128),
        toI128(basePriceI128),
        toI128(slopeI128),
        paymentTokenScVal,
        toI128(initialSupplyI128),
        toI128(initialLiquidityI128),
      ];

      // Check if contract is already initialized
      // NOTE: RPC çalışmıyorsa bu kontrol de başarısız olabilir, ama devam edelim
      console.log('🔍 Checking if contract is already initialized...');
      let finalContractId = tokenContractId;
      
      try {
        const existingConfig = await invokeView(tokenContractId, 'config', []);
        // If config exists and has properties, contract is initialized
        if (existingConfig && (existingConfig.name || existingConfig.owner)) {
          throw new Error(
            `❌ Contract ${tokenContractId.substring(0, 8)}... zaten initialize edilmiş! ` +
            `Her contract instance sadece bir kez initialize edilebilir. ` +
            `Yeni bir token için yeni bir contract deploy etmeniz gerekiyor. ` +
            `Soroban CLI ile: stellar contract deploy --wasm <wasm-path> --source <key> --network testnet`
          );
        } else {
          console.log('✅ Contract is not initialized, proceeding with init...');
        }
      } catch (checkError: any) {
        const errorMsg = String(checkError?.message || '');
        
        // If it's our custom "already initialized" error, re-throw it
        if (errorMsg.includes('zaten initialize edilmiş') || errorMsg.includes('already initialized')) {
          throw checkError;
        }
        
        // If config view fails with "not initialized" or "token not initialized", that's fine
        if (errorMsg.includes('not initialized') || 
            errorMsg.includes('token not initialized')) {
          console.log('✅ Contract is not initialized (config view returned error), proceeding...');
        } else {
          // RPC hatası olabilir, ama devam edelim - init çağrısı zaten hata verecek
          console.warn('⚠️ Could not check contract initialization status (RPC may be down):', errorMsg);
          console.warn('⚠️ Proceeding with init - if contract is already initialized, you will see an error.');
        }
      }

      // Import signTransaction from freighter-api
      const { signTransaction: freighterSignTransaction } = await import('@stellar/freighter-api');
      
      console.log('🚀 createToken: Calling invokeTransaction with owner:', owner.substring(0, 8) + '...');
      
      try {
        const result = await invokeTransaction(
          finalContractId,
          'init',
          args,
          freighterSignTransaction,
          owner,
        );
        
        return result.hash ?? null;
      } catch (initError: any) {
        const initErrorMsg = String(initError?.message || '');
        
        // If initialization fails because contract is already initialized, show helpful error
        if (initErrorMsg.includes('already initialized') || 
            initErrorMsg.includes('Contract may already be initialized') ||
            initErrorMsg.includes('CONTRACT_ALREADY_INITIALIZED') ||
            initErrorMsg.includes('UnreachableCodeReached')) {
          
          throw new Error(
            `❌ Contract ${finalContractId.substring(0, 8)}... zaten initialize edilmiş! ` +
            `Her contract instance sadece bir kez initialize edilebilir. ` +
            `\n\nYeni bir token için:\n` +
            `1. Soroban CLI ile yeni contract deploy edin:\n` +
            `   stellar contract deploy --wasm target/wasm32v1-none/release/papex_papertoken.wasm --source <wallet-key> --network testnet\n` +
            `2. Yeni Contract ID'yi Token Creation sayfasındaki input'a girin.\n` +
            `3. Token oluşturmayı tekrar deneyin.`
          );
        }
        
        // Re-throw other errors
        throw initError;
      }
    },
    [assertContractId, ensureWallet, deployTokenContract],
  );

  const getTokenSummary = useCallback(async (contractId: string) => {
    assertContractId(contractId);
    const result = await invokeView(contractId, 'summary', []);
    return normalizeSummary(result);
  }, [assertContractId]);

  const setTrading = useCallback(
    async (contractId: string, isEnabled: boolean) => {
      assertContractId(contractId);
      const caller = await ensureWallet();
      const args = [
        toAddress(caller).toScVal(),
        nativeToScVal(isEnabled, { type: 'bool' }),
      ];
      
      const { signTransaction: freighterSignTransaction } = await import('@stellar/freighter-api');
      
      const result = await invokeTransaction(
        contractId,
        'set_trading',
        args,
        freighterSignTransaction,
        caller,
      );
      
      return result.hash ?? null;
    },
    [assertContractId, ensureWallet],
  );

  const quoteBuy = useCallback(async (contractId: string, amount: string) => {
    assertContractId(contractId);
    const amountI128 = decimalToI128(amount, STELLAR_CONFIG.decimals);
    if (amountI128 <= 0n) throw new Error('Amount must be positive');
    const result = await invokeView(contractId, 'quote_buy', [toI128(amountI128)]);
    return normalizeQuote(result);
  }, [assertContractId]);

  const quoteSell = useCallback(async (contractId: string, amount: string) => {
    assertContractId(contractId);
    const amountI128 = decimalToI128(amount, STELLAR_CONFIG.decimals);
    if (amountI128 <= 0n) throw new Error('Amount must be positive');
    const result = await invokeView(contractId, 'quote_sell', [toI128(amountI128)]);
    return normalizeQuote(result);
  }, [assertContractId]);

  /* ---- Execute trades ---- */
  const executeBuy = useCallback(
    async (contractId: string, amount: string, maxPayment?: string) => {
      assertContractId(contractId);
      const buyer = await ensureWallet();

      const amountI128 = decimalToI128(amount, STELLAR_CONFIG.decimals);
      if (amountI128 <= 0n) throw new Error('Amount must be positive');

      let maxToSpend: bigint;
      
      if (maxPayment) {
        maxToSpend = decimalToI128(maxPayment, STELLAR_CONFIG.decimals);
      } else {
        // If no maxPayment provided, get quote and add 10% buffer for safety
        try {
          const quote = await quoteBuy(contractId, amount);
          if (quote && quote.cost) {
            const quoteCost = decimalToI128(quote.cost, STELLAR_CONFIG.decimals);
            // Add 10% buffer to prevent "insufficient payment" errors
            maxToSpend = (quoteCost * 110n) / 100n;
          } else {
            throw new Error('Could not get quote for buy operation');
          }
        } catch (quoteErr) {
          console.error('Failed to get quote:', quoteErr);
          throw new Error(
            `Could not calculate payment amount: ${quoteErr instanceof Error ? quoteErr.message : String(quoteErr)}`
          );
        }
      }
      
      console.log('📊 Buy parameters:', {
        amount: amountI128.toString(),
        maxToSpend: maxToSpend.toString(),
        maxPayment: maxPayment || 'auto (from quote + 10% buffer)',
      });

      // Check if trading is enabled, if not, try to enable it
      let summary = await getTokenSummary(contractId);
      if (summary && !summary.trading) {
        console.log('⚠️ Trading is disabled. Attempting to enable trading...');
        try {
          const owner = await ensureWallet();
          // Check if caller is owner
          if (summary.owner.toLowerCase() === owner.toLowerCase()) {
            await setTrading(contractId, true);
            console.log('✅ Trading enabled successfully');
            // Refresh summary
            summary = await getTokenSummary(contractId);
          } else {
            throw new Error(
              'Trading is disabled. Only the token owner can enable trading. ' +
              `Owner: ${summary.owner.substring(0, 8)}... ` +
              `Your address: ${owner.substring(0, 8)}...`
            );
          }
        } catch (enableErr) {
          const errorMsg = enableErr instanceof Error ? enableErr.message : String(enableErr);
          throw new Error(
            `Cannot execute buy: Trading is disabled. ${errorMsg}`
          );
        }
      }

      const args = [toAddress(buyer).toScVal(), toI128(amountI128), toI128(maxToSpend)];
      
      const { signTransaction: freighterSignTransaction } = await import('@stellar/freighter-api');
      
      const result = await invokeTransaction(
        contractId,
        'buy',
        args,
        freighterSignTransaction,
        buyer,
      );
      
      return result.hash ?? null;
    },
    [assertContractId, ensureWallet, quoteBuy, getTokenSummary, setTrading],
  );

  const executeSell = useCallback(
    async (contractId: string, amount: string, minPayment?: string) => {
      assertContractId(contractId);
      const seller = await ensureWallet();

      const amountI128 = decimalToI128(amount, STELLAR_CONFIG.decimals);
      if (amountI128 <= 0n) throw new Error('Amount must be positive');

      let minToReceive = minPayment
        ? decimalToI128(minPayment, STELLAR_CONFIG.decimals)
        : 0n;

      if (!minPayment) {
        try {
          const quote = await quoteSell(contractId, amount);
          if (quote) {
            minToReceive = decimalToI128(quote.cost, STELLAR_CONFIG.decimals);
          }
        } catch {
          // quote alınamazsa min=0 ile devam
        }
      }

      const args = [toAddress(seller).toScVal(), toI128(amountI128), toI128(minToReceive)];
      
      const { signTransaction: freighterSignTransaction } = await import('@stellar/freighter-api');
      
      const result = await invokeTransaction(
        contractId,
        'sell',
        args,
        freighterSignTransaction,
        seller,
      );
      
      return result.hash ?? null;
    },
    [assertContractId, ensureWallet, quoteSell],
  );

  /* ---- Marketplace ---- */
  const loadTrades = useCallback(
    async (paperId: number) => {
      assertContractId(STELLAR_CONFIG.marketplaceContractId);
      const result = await invokeView(
        STELLAR_CONFIG.marketplaceContractId,
        'get_trades',
        [toU32(paperId)],
      );
      if (!result || !Array.isArray(result)) return [];
      return result
        .map((record) => normalizeTrade(record))
        .filter((item): item is TradeRecord => Boolean(item));
    },
    [assertContractId],
  );

  const listListings = useCallback(
    async (limit = 50, onlyActive = true) => {
      assertContractId(STELLAR_CONFIG.marketplaceContractId);
      const result = await invokeView(
        STELLAR_CONFIG.marketplaceContractId,
        'list_listings',
        [toU32(limit), nativeToScVal(onlyActive, { type: 'bool' })],
      );
      if (!result || !Array.isArray(result)) return [];
      return result
        .map((item) => normalizeListing(item))
        .filter((entry): entry is MarketplaceListing => Boolean(entry));
    },
    [assertContractId],
  );

  const associateToken = useCallback(
    async (paperId: number, tokenContractId: string) => {
      assertContractId(STELLAR_CONFIG.registryContractId);
      const caller = await ensureWallet();
      
      // First, verify paper exists and caller has permission
      console.log(`🔍 Verifying paper ID ${paperId} exists and caller has permission...`);
      const paper = await getPaper(paperId);
      
      if (!paper) {
        throw new Error(
          `Paper ID ${paperId} not found in registry. ` +
          `Please ensure the paper is registered before associating a token.`
        );
      }
      
      // Check if caller is owner or admin
      const isOwner = paper.owner.toLowerCase() === caller.toLowerCase();
      
      // Try to get admin to check if caller is admin (optional check)
      let isAdmin = false;
      try {
        const admin = await invokeView(
          STELLAR_CONFIG.registryContractId,
          'admin',
          [],
        );
        if (admin && typeof admin === 'string') {
          isAdmin = admin.toLowerCase() === caller.toLowerCase();
        }
      } catch (adminErr) {
        console.warn('Could not check admin status:', adminErr);
        // Continue - if caller is owner, that's enough
      }
      
      if (!isOwner && !isAdmin) {
        throw new Error(
          `Not authorized to associate token to paper ID ${paperId}. ` +
          `Paper owner: ${paper.owner.substring(0, 8)}... ` +
          `Your address: ${caller.substring(0, 8)}... ` +
          `Only the paper owner or admin can associate tokens.`
        );
      }
      
      console.log(`✅ Permission verified. Associating token to paper ID ${paperId}...`);
      
      const args = [
        toAddress(caller).toScVal(),
        toU32(paperId),
        new Address(tokenContractId).toScVal(),
      ];
      
      const { signTransaction: freighterSignTransaction } = await import('@stellar/freighter-api');
      
      const result = await invokeTransaction(
        STELLAR_CONFIG.registryContractId,
        'set_token',
        args,
        freighterSignTransaction,
        caller,
      );
      
      return result.hash ?? null;
    },
    [assertContractId, ensureWallet, getPaper],
  );

  const registerListing = useCallback(
    async (paperId: number, tokenContractId: string, metadataUri: string) => {
      assertContractId(STELLAR_CONFIG.marketplaceContractId);
      const caller = await ensureWallet();
      const args = [
        toAddress(caller).toScVal(),
        toU32(paperId),
        new Address(tokenContractId).toScVal(),
        nativeToScVal(metadataUri, { type: 'string' }),
      ];
      const { signTransaction: freighterSignTransaction } = await import('@stellar/freighter-api');
      
      const result = await invokeTransaction(
        STELLAR_CONFIG.marketplaceContractId,
        'register_listing',
        args,
        freighterSignTransaction,
        caller,
      );
      return result.hash ?? null;
    },
    [assertContractId, ensureWallet],
  );

  /* ---- Context Value ---- */
  const value: ArticaContextValue = useMemo(
    () => ({
      walletAddress,
      connectWallet,
      disconnectWallet,
      ensureWallet,
      registerPaper,
      getPaper,
      listPapers,
      deployTokenContract,
      createToken,
      getTokenSummary,
      quoteBuy,
      quoteSell,
      executeBuy,
      executeSell,
      loadTrades,
      listListings,
      associateToken,
      registerListing,
    }),
    [
      walletAddress,
      connectWallet,
      disconnectWallet,
      ensureWallet,
      registerPaper,
      getPaper,
      listPapers,
      deployTokenContract,
      createToken,
      getTokenSummary,
      quoteBuy,
      quoteSell,
      executeBuy,
      executeSell,
      loadTrades,
      listListings,
      associateToken,
      registerListing,
      setTrading,
    ],
  );

  return <ArticaContext.Provider value={value}>{children}</ArticaContext.Provider>;
};

/* -------------------- Hooks -------------------- */
export const useArtica = (): ArticaContextValue => {
  const context = useContext(ArticaContext);
  if (!context) {
    throw new Error('useArtica must be used within an ArticaProvider');
  }
  return context;
};

export const useFormattedQuote = (quote: Quote | null) => {
  if (!quote) return null;
  return {
    cost: formatDecimal(quote.cost),
    priceBefore: formatDecimal(quote.priceBefore),
    priceAfter: formatDecimal(quote.priceAfter),
  };
};