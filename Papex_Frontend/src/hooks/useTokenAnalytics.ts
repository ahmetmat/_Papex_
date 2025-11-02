import { useState, useEffect, useMemo } from 'react';
import { TokenSummary, TradeRecord } from '../context/ArticaContext';

export interface TokenAnalytics {
  // Price Analytics
  price24h: {
    high: number;
    low: number;
    open: number;
    close: number;
    change: number;
    changePercent: number;
  };
  
  // Volume Analytics
  volume24h: number;
  volume7d: number;
  volume30d: number;
  averageTradeSize: number;
  
  // Trading Analytics
  totalTrades: number;
  trades24h: number;
  trades7d: number;
  buyTrades24h: number;
  sellTrades24h: number;
  buyVolume24h: number;
  sellVolume24h: number;
  
  // Holder Analytics
  uniqueTraders: number;
  newTraders24h: number;
  topTraders: Array<{
    address: string;
    volume: number;
    trades: number;
  }>;
  
  // Market Metrics
  marketCap: number;
  liquidity: number;
  priceVolatility: number;
  
  // Token Distribution
  distribution: {
    top10Holders: number;
    top25Holders: number;
    top50Holders: number;
  };
}

interface UseTokenAnalyticsProps {
  tokenContractId: string | null;
  summary: TokenSummary | null;
  trades: TradeRecord[];
}

export const useTokenAnalytics = ({
  tokenContractId,
  summary,
  trades,
}: UseTokenAnalyticsProps): TokenAnalytics | null => {
  const [analytics, setAnalytics] = useState<TokenAnalytics | null>(null);

  useEffect(() => {
    if (!tokenContractId || !summary || trades.length === 0) {
      // Use mock data when no real data available
      const mockAnalytics: TokenAnalytics = {
        price24h: {
          high: 0.0125,
          low: 0.0089,
          open: 0.0100,
          close: parseFloat(summary?.basePrice || '0.01'),
          change: 0.0012,
          changePercent: 12.0,
        },
        volume24h: 12500.50,
        volume7d: 89234.25,
        volume30d: 345678.90,
        averageTradeSize: 125.50,
        totalTrades: trades.length || 145,
        trades24h: 87,
        trades7d: 523,
        buyTrades24h: 52,
        sellTrades24h: 35,
        buyVolume24h: 7820.30,
        sellVolume24h: 4680.20,
        uniqueTraders: 23,
        newTraders24h: 5,
        topTraders: [
          { address: 'GABC...XYZ1', volume: 2345.67, trades: 12 },
          { address: 'GDEF...UVW2', volume: 1890.45, trades: 8 },
          { address: 'GHIJ...STU3', volume: 1234.56, trades: 15 },
        ],
        marketCap: parseFloat(summary?.totalSupply || '1000000') * parseFloat(summary?.basePrice || '0.01'),
        liquidity: parseFloat(summary?.liquidityPool || '10000'),
        priceVolatility: 8.5,
        distribution: {
          top10Holders: 45.2,
          top25Holders: 62.8,
          top50Holders: 78.5,
        },
      };
      setAnalytics(mockAnalytics);
      return;
    }

    // Calculate real analytics from trades and summary
    const now = Math.floor(Date.now() / 1000);
    const day24h = 24 * 60 * 60;
    const day7d = 7 * 24 * 60 * 60;
    const day30d = 30 * 24 * 60 * 60;

    // Filter trades by time period
    const trades24h = trades.filter(t => t.timestamp >= now - day24h);
    const trades7d = trades.filter(t => t.timestamp >= now - day7d);
    const trades30d = trades.filter(t => t.timestamp >= now - day30d);

    // Price analytics
    const prices24h = trades24h.map(t => parseFloat(t.cost) / parseFloat(t.amount));
    const price24h = {
      high: prices24h.length > 0 ? Math.max(...prices24h) : parseFloat(summary.basePrice),
      low: prices24h.length > 0 ? Math.min(...prices24h) : parseFloat(summary.basePrice),
      open: prices24h.length > 0 ? prices24h[0] : parseFloat(summary.basePrice),
      close: prices24h.length > 0 ? prices24h[prices24h.length - 1] : parseFloat(summary.basePrice),
      change: 0,
      changePercent: 0,
    };
    price24h.change = price24h.close - price24h.open;
    price24h.changePercent = price24h.open > 0 ? (price24h.change / price24h.open) * 100 : 0;

    // Volume analytics
    const volume24h = trades24h.reduce((sum, t) => sum + parseFloat(t.cost), 0);
    const volume7d = trades7d.reduce((sum, t) => sum + parseFloat(t.cost), 0);
    const volume30d = trades30d.reduce((sum, t) => sum + parseFloat(t.cost), 0);
    const averageTradeSize = trades24h.length > 0 ? volume24h / trades24h.length : 0;

    // Trading analytics
    const buyTrades24h = trades24h.filter(t => t.isBuy || !t.hasOwnProperty('isBuy')).length;
    const sellTrades24h = trades24h.length - buyTrades24h;
    const buyVolume24h = trades24h
      .filter(t => t.isBuy || !t.hasOwnProperty('isBuy'))
      .reduce((sum, t) => sum + parseFloat(t.cost), 0);
    const sellVolume24h = volume24h - buyVolume24h;

    // Unique traders
    const traderAddresses = new Set(trades24h.map(t => t.trader || ''));
    const uniqueTraders = traderAddresses.size;
    const newTraders24h = Math.floor(uniqueTraders * 0.22); // Mock: 22% are new

    // Top traders
    const traderStats: Record<string, { volume: number; trades: number }> = {};
    trades24h.forEach(t => {
      const addr = t.trader || '';
      if (!traderStats[addr]) {
        traderStats[addr] = { volume: 0, trades: 0 };
      }
      traderStats[addr].volume += parseFloat(t.cost);
      traderStats[addr].trades += 1;
    });
    const topTraders = Object.entries(traderStats)
      .map(([address, stats]) => ({
        address: address.length > 10 ? `${address.substring(0, 7)}...${address.substring(address.length - 4)}` : address,
        volume: stats.volume,
        trades: stats.trades,
      }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10);

    // Market metrics
    const marketCap = parseFloat(summary.totalSupply || '0') * parseFloat(summary.basePrice || '0');
    const liquidity = parseFloat(summary.liquidityPool || '0');
    
    // Price volatility (standard deviation of price changes)
    const priceChanges = prices24h.length > 1
      ? prices24h.slice(1).map((p, i) => Math.abs(p - prices24h[i]) / prices24h[i])
      : [];
    const avgChange = priceChanges.length > 0
      ? priceChanges.reduce((sum, c) => sum + c, 0) / priceChanges.length
      : 0;
    const variance = priceChanges.length > 0
      ? priceChanges.reduce((sum, c) => sum + Math.pow(c - avgChange, 2), 0) / priceChanges.length
      : 0;
    const priceVolatility = Math.sqrt(variance) * 100;

    const calculatedAnalytics: TokenAnalytics = {
      price24h,
      volume24h,
      volume7d,
      volume30d,
      averageTradeSize,
      totalTrades: trades.length,
      trades24h: trades24h.length,
      trades7d: trades7d.length,
      buyTrades24h,
      sellTrades24h,
      buyVolume24h,
      sellVolume24h,
      uniqueTraders,
      newTraders24h,
      topTraders,
      marketCap,
      liquidity,
      priceVolatility,
      distribution: {
        top10Holders: 45.2, // Mock data - would need holder distribution from contract
        top25Holders: 62.8,
        top50Holders: 78.5,
      },
    };

    setAnalytics(calculatedAnalytics);
  }, [tokenContractId, summary, trades]);

  return analytics;
};

