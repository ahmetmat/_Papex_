import React, {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { getUserInfo } from '@stellar/freighter-api';
import { Address, nativeToScVal } from '@stellar/stellar-sdk';
import { STELLAR_CONFIG } from '../config/stellar.ts';
import {
  invokeTransaction,
  invokeView,
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

  /** ✅ Önce assertContractId: tüm callback’lerde kullanılacak */
  const assertContractId = useCallback((contractId: string) => {
    if (!contractId || contractId.startsWith('<')) {
      throw new Error('Contract ID is not configured. Update src/config/stellar.ts.');
    }
  }, []);

  /* ---- Cüzdan ---- */
  const connectWallet = useCallback(async () => {
    const info = await getUserInfo();
    if (!info || !info.publicKey) {
      throw new Error('Unable to connect Freighter wallet.');
    }
    setWalletAddress(info.publicKey);
    return info.publicKey;
  }, []);

  const disconnectWallet = useCallback(() => {
    setWalletAddress(null);
  }, []);

  const ensureWallet = useCallback(async () => {
    if (walletAddress) return walletAddress;
    return connectWallet();
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

      const args = [
        toAddress(caller).toScVal(),
        nativeToScVal(trimmedUri, { type: 'string' }),
        nativeToScVal(doiValue, { type: 'option', inner: { type: 'string' } }),
      ];

      const result = await invokeTransaction(
        caller,
        STELLAR_CONFIG.registryContractId,
        'register_paper',
        args,
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
      assertContractId(STELLAR_CONFIG.registryContractId);
      const result = await invokeView(
        STELLAR_CONFIG.registryContractId,
        'list_papers',
        [toU32(limit)],
      );
      if (!result || !Array.isArray(result)) return [];
      return result
        .map((item) => normalizePaper(item))
        .filter((item): item is ChainPaper => Boolean(item));
    },
    [assertContractId],
  );

  /* ---- Token summary & quotes ---- */
  const getTokenSummary = useCallback(async (contractId: string) => {
    assertContractId(contractId);
    const result = await invokeView(contractId, 'summary', []);
    return normalizeSummary(result);
  }, [assertContractId]);

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

      let maxToSpend = maxPayment
        ? decimalToI128(maxPayment, STELLAR_CONFIG.decimals)
        : amountI128;

      if (!maxPayment) {
        try {
          const quote = await quoteBuy(contractId, amount);
          if (quote) {
            maxToSpend = decimalToI128(quote.cost, STELLAR_CONFIG.decimals);
          }
        } catch {
          // quote alınamazsa default ile devam
        }
      }

      const args = [toAddress(buyer).toScVal(), toI128(amountI128), toI128(maxToSpend)];
      const result = await invokeTransaction(buyer, contractId, 'buy', args);
      return result.hash ?? null;
    },
    [assertContractId, ensureWallet, quoteBuy],
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
      const result = await invokeTransaction(seller, contractId, 'sell', args);
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
      const args = [
        toAddress(caller).toScVal(),
        toU32(paperId),
        new Address(tokenContractId).toScVal(),
      ];
      const result = await invokeTransaction(
        caller,
        STELLAR_CONFIG.registryContractId,
        'set_token',
        args,
      );
      return result.hash ?? null;
    },
    [assertContractId, ensureWallet],
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
      const result = await invokeTransaction(
        caller,
        STELLAR_CONFIG.marketplaceContractId,
        'register_listing',
        args,
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
      getTokenSummary,
      quoteBuy,
      quoteSell,
      executeBuy,
      executeSell,
      loadTrades,
      listListings,
      associateToken,
      registerListing,
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