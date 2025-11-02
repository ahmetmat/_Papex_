import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2,
  RefreshCcw,
  Wallet,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  Share2,
  AlertCircle,
  Info,
  Plus,
  Minus,
  Activity,
  FileText,
  ExternalLink,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card.tsx';
import { Button } from '../ui/button.tsx';
import { Input } from '../ui/input.tsx';
import { Alert, AlertDescription } from '../ui/alert.tsx';
import { Badge } from '../ui/badge.tsx';
import { Slider } from '../ui/slider.tsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs.tsx';
import { motion, AnimatePresence } from 'framer-motion';
import TradeHistory from './TradeHistory.tsx';
import TradingViewChart from './TradingViewChart.tsx';
import OrderBook from './OrderBook.tsx';
import MarketStats from './MarketStats.tsx';
import LiquidityPool from './LiquidityPool.tsx';
import SocialFeed from './SocialFeed.tsx';
import TradePositions from './TradePositions.tsx';
import Analytics from './Analytics.tsx';
import { useTokenAnalytics } from '../../hooks/useTokenAnalytics';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog.tsx';
import { Sparkles } from 'lucide-react';
import CitationNetwork from '../analytics/CitationNetwork.tsx';
import ImpactTimeSeries from '../analytics/ImpactTimeSeries.tsx';
import GeographicDistribution from '../analytics/GeographicDistribution.tsx';
import AcademicMetricsPanel from '../analytics/AcademicMetricsPanel.tsx';
import PredictiveMetrics from '../analytics/PredictiveMetrics.tsx';
import {
  ChainPaper,
  Quote,
  TokenSummary,
  TradeRecord,
  useArtica,
} from '../../context/ArticaContext';
import { formatDecimal } from '../../utils/stellarNumber';

interface TokenTradingProps {
  paperId: number;
  paperTitle?: string;
}

const TokenTrading: React.FC<TokenTradingProps> = ({ paperId, paperTitle }) => {
  const {
    walletAddress,
    connectWallet,
    getPaper,
    getTokenSummary,
    quoteBuy,
    quoteSell,
    executeBuy,
    executeSell,
    loadTrades,
  } = useArtica();

  const [paper, setPaper] = useState<ChainPaper | null>(null);
  const [summary, setSummary] = useState<TokenSummary | null>(null);
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState<'buy' | 'sell' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Trade panel states
  const [activeTab, setActiveTab] = useState<'trade' | 'liquidity'>('trade');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [amount, setAmount] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [slippage, setSlippage] = useState(1);
  
  // Detail tabs (OrderBook, TradeHistory, etc.)
  const [tradeDetailTab, setTradeDetailTab] = useState<'orderbook' | 'trades' | 'positions' | 'social' | 'analytics'>('orderbook');
  
  // Paper details
  const [showPaperDetails, setShowPaperDetails] = useState(false);
  const [metricsTab, setMetricsTab] = useState<'research' | 'metrics' | 'citation'>('research');
  
  // AI Analytics modal
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  const [buyQuote, setBuyQuote] = useState<Quote | null>(null);
  const [sellQuote, setSellQuote] = useState<Quote | null>(null);
  const [expectedOutput, setExpectedOutput] = useState({
    price: '0',
    total: '0',
    priceImpact: 0,
  });

  // Manual token contract ID input (for when token is not linked to paper)
  const [manualTokenContractId, setManualTokenContractId] = useState('');
  const [useManualToken, setUseManualToken] = useState(false);

  // Get token contract ID from localStorage (set by TokenCreation)
  useEffect(() => {
    const savedTokenId = localStorage.getItem(`papex_token_contract_${paperId}`);
    if (savedTokenId && !paper?.token) {
      console.log('📝 Found saved token contract ID from localStorage:', savedTokenId);
      setManualTokenContractId(savedTokenId);
      setUseManualToken(true);
    }
  }, [paperId, paper?.token]);

  // Get active token contract ID (from paper or manual input)
  const getActiveTokenContractId = useCallback((): string | null => {
    if (useManualToken && manualTokenContractId.trim()) {
      return manualTokenContractId.trim();
    }
    return paper?.token || null;
  }, [paper?.token, useManualToken, manualTokenContractId]);

  // Analytics hook
  const analytics = useTokenAnalytics({
    tokenContractId: getActiveTokenContractId(),
    summary,
    trades,
  });

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    setLoading(true);
    setError(null);
    try {
      const chainPaper = await getPaper(paperId);
      setPaper(chainPaper);

      const tokenContractId = getActiveTokenContractId();

      if (tokenContractId) {
        try {
        const [summaryResult, tradeResult] = await Promise.all([
            getTokenSummary(tokenContractId),
          loadTrades(paperId),
        ]);
        setSummary(summaryResult);
        setTrades(tradeResult);
        } catch (tokenErr) {
          console.error('Failed to load token data:', tokenErr);
          setError(`Failed to load token: ${tokenErr instanceof Error ? tokenErr.message : String(tokenErr)}`);
          setSummary(null);
          setTrades([]);
        }
      } else {
        setSummary(null);
        setTrades([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getPaper, getTokenSummary, loadTrades, paperId, getActiveTokenContractId]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Auto-refresh quotes when amount changes
  useEffect(() => {
    const tokenContractId = getActiveTokenContractId();
    if (!tokenContractId || !amount || parseFloat(amount) <= 0) {
      setExpectedOutput({ price: '0', total: '0', priceImpact: 0 });
      return;
    }

    const updateQuote = async () => {
      try {
        const quote = tradeType === 'buy' 
          ? await quoteBuy(tokenContractId, amount)
          : await quoteSell(tokenContractId, amount);
        
        if (quote) {
          if (tradeType === 'buy') {
            setBuyQuote(quote);
          } else {
      setSellQuote(quote);
          }
          
          const avgPrice = (parseFloat(quote.priceBefore) + parseFloat(quote.priceAfter)) / 2;
          const total = avgPrice * parseFloat(amount);
          const priceImpact = summary?.basePrice 
            ? Math.abs((avgPrice - parseFloat(summary.basePrice)) / parseFloat(summary.basePrice) * 100)
            : 0;
          
          setExpectedOutput({
            price: avgPrice.toFixed(8),
            total: total.toFixed(8),
            priceImpact,
          });
        }
    } catch (err) {
        console.error('Failed to get quote:', err);
      }
    };

    const timeoutId = setTimeout(updateQuote, 500);
    return () => clearTimeout(timeoutId);
  }, [amount, tradeType, getActiveTokenContractId, quoteBuy, quoteSell, summary]);

  const handleBuy = useCallback(async () => {
    const tokenContractId = getActiveTokenContractId();
    if (!tokenContractId) {
      setError('No token contract ID available. Please provide one.');
      return;
    }
    setSubmitting('buy');
    setError(null);
    setInfo(null);
    try {
      // Calculate max payment with slippage buffer
      let maxPayment: string | undefined;
      
      if (orderType === 'limit' && limitPrice) {
        // For limit orders, use limitPrice * amount
        maxPayment = (parseFloat(limitPrice) * parseFloat(amount)).toString();
      } else if (buyQuote?.cost) {
        // For market orders, use quote cost + slippage buffer (5%)
        const quoteCost = parseFloat(buyQuote.cost);
        const slippageMultiplier = 1 + (slippage / 100);
        maxPayment = (quoteCost * slippageMultiplier).toString();
      } else {
        // Fallback: get fresh quote
        try {
          const freshQuote = await quoteBuy(tokenContractId, amount);
          if (freshQuote?.cost) {
            const quoteCost = parseFloat(freshQuote.cost);
            const slippageMultiplier = 1 + (slippage / 100);
            maxPayment = (quoteCost * slippageMultiplier).toString();
          }
        } catch (quoteErr) {
          console.error('Failed to get quote:', quoteErr);
          throw new Error('Failed to calculate payment amount. Please try again.');
        }
      }
      
      if (!maxPayment) {
        throw new Error('Could not determine payment amount. Please try getting a quote first.');
      }
      
      console.log('💰 Buy parameters:', {
        amount,
        maxPayment,
        quoteCost: buyQuote?.cost,
        slippage: `${slippage}%`,
      });
      
      const hash = await executeBuy(tokenContractId, amount, maxPayment);
      setInfo(
        hash
          ? `Buy transaction submitted. Hash: ${hash}`
          : 'Buy transaction submitted.',
      );
      setAmount('');
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(null);
    }
  }, [
    getActiveTokenContractId,
    amount,
    buyQuote,
    executeBuy,
    refreshData,
    orderType,
    limitPrice,
    slippage,
    quoteBuy,
  ]);

  const handleSell = useCallback(async () => {
    const tokenContractId = getActiveTokenContractId();
    if (!tokenContractId) {
      setError('No token contract ID available. Please provide one.');
      return;
    }
    setSubmitting('sell');
    setError(null);
    setInfo(null);
    try {
      const minPayment = orderType === 'limit' && limitPrice
        ? (parseFloat(limitPrice) * parseFloat(amount)).toString()
        : sellQuote?.cost;
      
      const hash = await executeSell(tokenContractId, amount, minPayment);
      setInfo(
        hash
          ? `Sell transaction submitted. Hash: ${hash}`
          : 'Sell transaction submitted.',
      );
      setAmount('');
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(null);
    }
  }, [
    getActiveTokenContractId,
    amount,
    sellQuote,
    executeSell,
    refreshData,
    orderType,
    limitPrice,
  ]);

  const setMaxAmount = () => {
    // TODO: Get actual wallet balance
    if (tradeType === 'buy') {
      setAmount('1000'); // Placeholder
    } else {
      // Get token balance from summary or contract
      setAmount(summary?.totalSupply || '0');
    }
  };

  const canExecuteTrade = () => {
    if (submitting || !amount || parseFloat(amount) <= 0) return false;
    if (orderType === 'limit' && (!limitPrice || parseFloat(limitPrice) <= 0)) return false;
    return true;
  };

  const getValidationError = () => {
    if (!amount || parseFloat(amount) <= 0) return null;
    if (tradeType === 'sell') {
      const availableTokens = parseFloat(summary?.totalSupply || '0');
      if (parseFloat(amount) > availableTokens) {
        return `Insufficient ${summary?.symbol || 'token'} balance.`;
      }
    }
    return null;
  };

  // Generate order book data
  const generateOrderBook = () => {
    const currentPrice = parseFloat(summary?.basePrice || '0.01');
    const bids = Array(10).fill(0).map((_, i) => ({
      price: (currentPrice * (1 - (i + 1) * 0.005)).toFixed(8),
      amount: (Math.random() * 100 + 10).toFixed(4),
      total: (currentPrice * (1 - (i + 1) * 0.005) * (Math.random() * 100 + 10)).toFixed(8)
    }));
    
    const asks = Array(10).fill(0).map((_, i) => ({
      price: (currentPrice * (1 + (i + 1) * 0.005)).toFixed(8),
      amount: (Math.random() * 100 + 10).toFixed(4),
      total: (currentPrice * (1 + (i + 1) * 0.005) * (Math.random() * 100 + 10)).toFixed(8)
    }));
    
    const spreadAmount = (parseFloat(asks[0].price) - parseFloat(bids[0].price)).toFixed(8);
    const spreadPercentage = (parseFloat(spreadAmount) / currentPrice * 100).toFixed(2);
    
    return { bids, asks, spreadAmount, spreadPercentage };
  };

  const orderBookData = generateOrderBook();
  const tokenContractId = getActiveTokenContractId();

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-screen-2xl animate-in fade-in duration-500">
        
        {/* HERO SECTION */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 rounded-3xl border border-white/20 bg-white/60 p-6 shadow-2xl backdrop-blur-xl"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                  {paperTitle || `Paper #${paperId}`}
                </h1>
                {summary && (
                  <Badge className="backdrop-blur-sm bg-white/60 text-blue-600 ring-1 ring-inset ring-blue-500/20 shadow-sm">
                    {summary.symbol}
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600 shadow-lg"
                  onClick={() => setShowAnalyticsModal(true)}
                >
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  AI Analytics
                </Button>
              </div>
              <div className="flex items-center mt-2 -ml-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-slate-600 hover:text-slate-900 hover:bg-slate-100/50" 
                  onClick={() => setShowPaperDetails(!showPaperDetails)}
                >
                  <FileText className="w-4 h-4 mr-1.5" />
                  {showPaperDetails ? "Hide Paper Details" : "View Paper Details"}
                </Button>
                {paper?.metadataUri && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
                    onClick={() => {
                      const ipfsUrl = paper.metadataUri.startsWith('ipfs://')
                        ? `https://gateway.pinata.cloud/ipfs/${paper.metadataUri.replace('ipfs://', '')}`
                        : paper.metadataUri;
                      window.open(ipfsUrl, '_blank');
                    }}
                  >
                    <ExternalLink className="w-4 h-4 mr-1.5" />
                    View Paper
                  </Button>
                )}
              </div>
            </div>
            <div className="flex w-full md:w-auto flex-row-reverse md:flex-col items-center justify-between md:items-end gap-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-slate-800">
                  {formatDecimal(summary?.basePrice || '0.01', 6)} XLM
                </span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full text-slate-500 hover:bg-slate-100/50" 
                  onClick={refreshData}
                >
                  {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                </Button>
        </div>
              <span className="text-sm text-slate-500 mt-1">
                ≈ ${(parseFloat(summary?.basePrice || '0.01') * 0.1).toFixed(2)} USD
              </span>
          {walletAddress ? (
                <Badge variant="outline" className="mt-2 bg-emerald-100/80 text-emerald-800 border-emerald-200/50">
              <Wallet className="mr-2 h-3 w-3" />
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </Badge>
          ) : (
                <Button 
                  variant="outline" 
                  className="mt-2 w-full bg-white/50 border-slate-300 hover:bg-white/80"
                  onClick={connectWallet}
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect Wallet
            </Button>
          )}
            </div>
          </div>
        </motion.div>

        {/* PAPER DETAILS SECTION */}
        <AnimatePresence>
          {showPaperDetails && paper && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="mb-6 overflow-hidden"
            >
              <div className="rounded-3xl border border-white/20 bg-white/60 p-6 shadow-2xl backdrop-blur-xl">
                <nav className="mb-6 flex justify-start">
                  <ul className="flex items-center space-x-2 rounded-full bg-slate-100/80 p-1.5 shadow-inner ring-1 ring-black/5">
                    {[
                      {id: 'research', label: 'Research Details'},
                      {id: 'metrics', label: 'Academic Metrics'},
                      {id: 'citation', label: 'Citation Analysis'},
                    ].map((item) => (
                      <li 
                        key={item.id} 
                        onClick={() => setMetricsTab(item.id as any)} 
                        className="relative rounded-full cursor-pointer"
                      >
                        <div className={`relative z-10 font-medium transition-colors px-4 py-2 ${metricsTab === item.id ? 'text-white' : 'text-slate-700'}`}>
                          {item.label}
                        </div>
                        {metricsTab === item.id && (
                          <motion.div 
                            layoutId="paper-details-pill" 
                            className="absolute inset-0 z-0 rounded-full bg-slate-800 shadow" 
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }} 
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                </nav>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={metricsTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {metricsTab === 'research' && (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800">Paper #{paperId}</h3>
                          <p className="text-sm text-slate-600 mt-2">
                            Owner: {paper.owner.slice(0, 8)}...{paper.owner.slice(-4)}
                          </p>
                        </div>
                        {paper.metadataUri && (
                          <div className="pt-2">
                            <Button 
                              variant="outline" 
                              className="bg-white/50 border-slate-300 hover:bg-white/80"
                              onClick={() => {
                                const ipfsUrl = paper.metadataUri.startsWith('ipfs://')
                                  ? `https://gateway.pinata.cloud/ipfs/${paper.metadataUri.replace('ipfs://', '')}`
                                  : paper.metadataUri;
                                window.open(ipfsUrl, '_blank');
                              }}
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View Paper on IPFS
          </Button>
        </div>
                        )}
                      </div>
                    )}
                    {metricsTab === 'metrics' && (
                      <div className="text-center py-4 text-slate-600">
                        Academic metrics coming soon
                      </div>
                    )}
                    {metricsTab === 'citation' && (
                      <div className="text-center py-4 text-slate-600">
                        Citation analysis coming soon
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
      </div>
            </motion.div>
          )}
        </AnimatePresence>

      {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {info && (
          <Alert className="mb-6">
          <AlertDescription>{info}</AlertDescription>
        </Alert>
      )}

        {!tokenContractId && (
          <Alert className="mb-6">
            <AlertDescription className="space-y-3">
              <p>This paper is not tokenized yet. Enter a token contract ID to start trading.</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Token Contract ID (C...)"
                  value={manualTokenContractId}
                  onChange={(e) => setManualTokenContractId(e.target.value)}
                  className="font-mono text-sm"
                />
                <Button
                  onClick={() => {
                    if (manualTokenContractId.trim()) {
                      setUseManualToken(true);
                      localStorage.setItem(`papex_token_contract_${paperId}`, manualTokenContractId.trim());
                      refreshData();
                    }
                  }}
                  disabled={!manualTokenContractId.trim()}
                >
                  Use Token
                </Button>
              </div>
          </AlertDescription>
        </Alert>
      )}

        {summary && tokenContractId && (
          <>
            {/* MAIN GRID */}
            <div className="grid grid-cols-12 gap-6">
              {/* LEFT COLUMN */}
              <div className="col-span-12 lg:col-span-8 space-y-6">
                <div className="h-[500px]">
                  <TradingViewChart 
                    tokenContractId={tokenContractId} 
                    paperTitle={summary.symbol || 'TOKEN'} 
                    paperId={paperId}
                    isDarkMode={false} 
                  />
                </div>
                
                <div className="rounded-3xl border border-white/20 bg-white/60 p-6 shadow-2xl backdrop-blur-xl">
                  <nav className="mb-6 flex justify-start">
                    <ul className="flex items-center space-x-2 rounded-full bg-slate-100/80 p-1.5 shadow-inner ring-1 ring-black/5">
                      {[
                        {id: 'orderbook', label: 'Order Book', icon: <BarChart3/>},
                        {id: 'trades', label: 'Trade History', icon: <Activity/>},
                        {id: 'positions', label: 'Your Positions', icon: <Users/>},
                        {id: 'analytics', label: 'Analytics', icon: <TrendingUp/>},
                        {id: 'social', label: 'Social Feed', icon: <Share2/>},
                      ].map((item) => (
                        <li 
                          key={item.id} 
                          onClick={() => setTradeDetailTab(item.id as any)} 
                          className="relative rounded-full cursor-pointer"
                        >
                          <div className={`relative z-10 flex items-center font-medium transition-colors px-4 py-2 ${tradeDetailTab === item.id ? 'text-white' : 'text-slate-700'}`}>
                            {React.cloneElement(item.icon, { className: 'w-4 h-4 mr-2' })} 
                            {item.label}
                          </div>
                          {tradeDetailTab === item.id && (
                            <motion.div 
                              layoutId="trade-info-pill" 
                              className="absolute inset-0 z-0 rounded-full bg-slate-800 shadow" 
                              transition={{ type: 'spring', stiffness: 300, damping: 25 }} 
                            />
                          )}
                        </li>
                      ))}
                    </ul>
                  </nav>
              <div>
                    {tradeDetailTab === 'orderbook' && (
                      <OrderBook 
                        data={orderBookData} 
                        tokenSymbol={summary.symbol || 'TOKEN'} 
                        onSelectPrice={(price) => { 
                          setLimitPrice(price); 
                          setOrderType('limit'); 
                        }} 
                      />
                    )}
                    {tradeDetailTab === 'trades' && (
                      <TradeHistory 
                        data={trades} 
                        tokenSymbol={summary.symbol || 'TOKEN'} 
                      />
                    )}
                    {tradeDetailTab === 'positions' && (
                      <TradePositions 
                        tokenSymbol={summary.symbol || 'TOKEN'} 
                        data={[]} 
                      />
                    )}
                    {tradeDetailTab === 'analytics' && (
                      <Analytics 
                        analytics={analytics}
                        tokenSymbol={summary.symbol || 'TOKEN'}
                      />
                    )}
                    {tradeDetailTab === 'social' && (
                      <SocialFeed 
                        paperId={paperId} 
                        tokenSymbol={summary.symbol || 'TOKEN'} 
                        tokenContractId={tokenContractId}
                      />
                    )}
                  </div>
              </div>
              </div>
              
              {/* RIGHT COLUMN */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                {/* TRADE PANEL */}
                <div className="bg-white/60 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-6 space-y-6">
              <div>
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-slate-800">Trade {summary.symbol || 'TOKEN'}</h2>
                      <div className="relative flex items-center">
                        <Badge className={`relative z-10 ${summary.trading ? 'bg-emerald-500' : 'bg-gray-500'} text-white border-0 shadow-lg`}>
                          {summary.trading ? 'Trading' : 'Paused'}
                </Badge>
                        {summary.trading && (
                          <div className="absolute inset-0 bg-emerald-400 blur-md animate-pulse" />
                        )}
                      </div>
              </div>
                    <p className="text-sm text-slate-500 mt-1">
                      Market Price: {formatDecimal(summary.basePrice, 8)} XLM
                    </p>
                  </div>
                  
                  <nav>
                    <ul className="flex items-center space-x-2 rounded-full bg-slate-100/80 p-1.5 shadow-inner ring-1 ring-black/5">
                      {[
                        {id: 'trade', label: 'Trade'},
                        {id: 'liquidity', label: 'Provide Liquidity'}
                      ].map((item) => (
                        <li 
                          key={item.id} 
                          onClick={() => setActiveTab(item.id as any)} 
                          className="relative w-full rounded-full cursor-pointer"
                        >
                          <div className={`relative z-10 flex items-center justify-center font-medium transition-colors px-4 py-2.5 ${activeTab === item.id ? 'text-white' : 'text-slate-700'}`}>
                            {item.id === 'trade' ? (
                              <TrendingUp size={16} className="mr-2"/>
                            ) : (
                              <DollarSign size={16} className="mr-2"/>
                            )}
                            <span>{item.label}</span>
                          </div>
                          {activeTab === item.id && (
                            <motion.div 
                              layoutId="trade-panel-pill" 
                              className="absolute inset-0 z-0 rounded-full bg-gradient-to-r from-[#083466] to-[#1a6ab3] shadow-md" 
                              transition={{ type: 'spring', stiffness: 300, damping: 25 }} 
                            />
                          )}
                        </li>
                      ))}
                    </ul>
                  </nav>
                  
                  {activeTab === 'trade' && (
                    <div className="space-y-5">
                      {/* Buy/Sell Toggle */}
                      <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100/80 p-1 shadow-inner ring-1 ring-black/5">
                        <div 
                          onClick={() => setTradeType('buy')} 
                          className="relative rounded-lg cursor-pointer py-2 text-center"
                        >
                          <span className={`relative z-10 font-medium transition-colors ${tradeType === 'buy' ? 'text-white' : 'text-slate-600'}`}>
                            Buy
                          </span>
                          {tradeType === 'buy' && (
                            <motion.div 
                              layoutId="buy-sell-toggle" 
                              className="absolute inset-0 z-0 rounded-lg bg-emerald-500 shadow" 
                              transition={{ type: 'spring', stiffness: 300, damping: 25 }} 
                            />
                          )}
                        </div>
                        <div 
                          onClick={() => setTradeType('sell')} 
                          className="relative rounded-lg cursor-pointer py-2 text-center"
                        >
                          <span className={`relative z-10 font-medium transition-colors ${tradeType === 'sell' ? 'text-white' : 'text-slate-600'}`}>
                            Sell
                          </span>
                          {tradeType === 'sell' && (
                            <motion.div 
                              layoutId="buy-sell-toggle" 
                              className="absolute inset-0 z-0 rounded-lg bg-rose-500 shadow" 
                              transition={{ type: 'spring', stiffness: 300, damping: 25 }} 
                            />
                          )}
                        </div>
                      </div>
                      
                      {/* Market/Limit Toggle */}
                      <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100/80 p-1 shadow-inner ring-1 ring-black/5">
                        <div 
                          onClick={() => setOrderType('market')} 
                          className="relative rounded-lg cursor-pointer py-2 text-center"
                        >
                          <span className={`relative z-10 font-medium transition-colors ${orderType === 'market' ? 'text-white' : 'text-slate-600'}`}>
                            Market
                          </span>
                          {orderType === 'market' && (
                            <motion.div 
                              layoutId="order-type-toggle" 
                              className="absolute inset-0 z-0 rounded-lg bg-slate-800 shadow" 
                              transition={{ type: 'spring', stiffness: 300, damping: 25 }} 
                            />
                          )}
                        </div>
                        <div 
                          onClick={() => setOrderType('limit')} 
                          className="relative rounded-lg cursor-pointer py-2 text-center"
                        >
                          <span className={`relative z-10 font-medium transition-colors ${orderType === 'limit' ? 'text-white' : 'text-slate-600'}`}>
                            Limit
                          </span>
                          {orderType === 'limit' && (
                            <motion.div 
                              layoutId="order-type-toggle" 
                              className="absolute inset-0 z-0 rounded-lg bg-slate-800 shadow" 
                              transition={{ type: 'spring', stiffness: 300, damping: 25 }} 
                            />
                          )}
                        </div>
                      </div>
                      
                      {/* Amount Input */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-slate-700">Amount</label>
                          <button 
                            onClick={setMaxAmount} 
                            className="text-xs font-semibold text-[#083466] hover:underline"
                          >
                            Max
                          </button>
                        </div>
                        <div className="relative">
                          <Input 
                            type="text" 
                            value={amount} 
                            onChange={(e) => { 
                              const value = e.target.value; 
                              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                setAmount(value);
                              }
                            }} 
                            placeholder="0.00" 
                            className="h-14 text-lg pr-20 bg-white/50 border-slate-200/50 focus:bg-white/80 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl" 
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-800 text-lg font-bold">
                            {summary.symbol || 'TOKEN'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-500 px-1">
                          <span>
                            Available: {tradeType === 'buy' ? 'XLM' : `${formatDecimal(summary.totalSupply, 4)} ${summary.symbol}`}
                          </span>
                          <span>≈ ${(parseFloat(amount || '0') * parseFloat(summary.basePrice) * 0.1).toFixed(2)}</span>
                        </div>
                      </div>
                      
                      {/* Limit Price or Slippage */}
                      <AnimatePresence>
                        {orderType === 'limit' && (
                          <motion.div 
                            key="limit-price" 
                            initial={{ opacity: 0, height: 0 }} 
                            animate={{ opacity: 1, height: 'auto' }} 
                            exit={{ opacity: 0, height: 0 }} 
                            className="space-y-2 overflow-hidden"
                          >
                            <label className="text-sm font-medium text-slate-700">Limit Price</label>
                            <div className="relative">
                              <Input 
                                type="text" 
                                value={limitPrice} 
                                onChange={(e) => { 
                                  if (e.target.value === '' || /^\d*\.?\d*$/.test(e.target.value)) {
                                    setLimitPrice(e.target.value);
                                  }
                                }} 
                                placeholder="0.00" 
                                className="h-12 pr-16 bg-white/50 border-slate-200/50 rounded-xl" 
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">XLM</span>
                            </div>
                          </motion.div>
                        )}
                        {orderType === 'market' && (
                          <motion.div 
                            key="slippage" 
                            initial={{ opacity: 0, height: 0 }} 
                            animate={{ opacity: 1, height: 'auto' }} 
                            exit={{ opacity: 0, height: 0 }} 
                            className="space-y-3 overflow-hidden"
                          >
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium text-slate-700">Slippage Tolerance</label>
                              <span className="text-sm font-mono font-medium text-slate-800">{slippage.toFixed(1)}%</span>
                            </div>
                            <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                                size="icon" 
                                className="h-9 w-9 rounded-full bg-white/50 border-slate-300" 
                                onClick={() => setSlippage(Math.max(0.1, slippage - 0.1))}
                >
                                <Minus className="h-4 w-4" />
                </Button>
                              <Slider 
                                value={[slippage]} 
                                min={0.1} 
                                max={5} 
                                step={0.1} 
                                onValueChange={(v) => setSlippage(v[0])} 
                                className="flex-1" 
                              />
                <Button
                                variant="outline" 
                                size="icon" 
                                className="h-9 w-9 rounded-full bg-white/50 border-slate-300" 
                                onClick={() => setSlippage(Math.min(5, slippage + 0.1))}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                  
                  {activeTab === 'liquidity' && (
                    <LiquidityPool 
                      paperSymbol={summary.symbol || 'TOKEN'} 
                      tokenContractId={tokenContractId}
                      tokenInfo={summary} 
                      onLiquidityChange={refreshData}
                    />
                  )}
                  
                  {/* Trade Summary */}
                  <div className="bg-slate-100/50 backdrop-blur-sm border border-slate-200/50 rounded-xl p-4 space-y-3">
                    <h3 className="flex items-center text-base font-semibold text-slate-800">
                      <Info size={16} className="mr-2 text-slate-500" />
                      Trade Summary
                    </h3>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Price</span>
                      <span className="font-mono text-slate-700">
                        {parseFloat(expectedOutput.price).toFixed(8)} XLM
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Total {tradeType === 'buy' ? 'Cost' : 'Receive'}</span>
                      <span className="font-mono text-slate-700">
                        {formatDecimal(expectedOutput.total, 8)} XLM
                      </span>
                    </div>
                    {orderType === 'market' && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Price Impact</span>
                        <span className={`font-medium ${expectedOutput.priceImpact > 5 ? 'text-amber-600' : 'text-slate-800'}`}>
                          {expectedOutput.priceImpact.toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {getValidationError() && (
                    <Alert variant="destructive" className="mt-2 bg-rose-50/80 border-rose-200/50 text-rose-800">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">{getValidationError()}</AlertDescription>
                    </Alert>
                  )}
                  
                  <Button 
                    size="lg" 
                    onClick={tradeType === 'buy' ? handleBuy : handleSell}
                    disabled={!canExecuteTrade() || submitting !== null || !walletAddress}
                    className={`w-full h-14 text-base font-semibold rounded-xl text-white shadow-lg transition-all duration-300 ${
                      tradeType === 'buy' 
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90' 
                        : 'bg-gradient-to-r from-rose-500 to-red-500 hover:opacity-90'
                    }`}
                  >
                    {submitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin"/>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <>
                        {tradeType === 'buy' ? (
                          <>
                            <ArrowUpCircle className="w-5 h-5 mr-2"/>
                            Buy {summary.symbol}
                          </>
                        ) : (
                          <>
                            <ArrowDownCircle className="w-5 h-5 mr-2"/>
                            Sell {summary.symbol}
                          </>
                        )}
                      </>
                    )}
                </Button>
                </div>
                
                {/* MARKET STATS */}
                <div className="rounded-3xl border border-white/20 bg-white/60 p-6 shadow-2xl backdrop-blur-xl">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Market Stats</h3>
                  <MarketStats tokenInfo={summary} paperSymbol={summary.symbol || 'TOKEN'} />
          </div>

                {/* WALLET INFO */}
                <div className="rounded-3xl border border-white/20 bg-white/60 p-6 shadow-2xl backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-slate-800">Wallet Info</h3>
                    <Badge variant="outline" className={`${walletAddress ? 'bg-emerald-100/80 text-emerald-800 border-emerald-200/50' : 'bg-gray-100/80 text-gray-800 border-gray-200/50'}`}>
                      {walletAddress ? 'Connected' : 'Not Connected'}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm text-slate-800">
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200/50">
                      <span className="text-slate-500">Address</span>
                      <span className="font-mono">
                        {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200/50">
                      <span className="text-slate-500">XLM Balance</span>
                      <span className="font-mono">--- XLM</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-slate-500">{summary.symbol} Balance</span>
                      <span className="font-mono">---</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        </>
      )}

      {/* AI Analytics Modal */}
      <Dialog open={showAnalyticsModal} onOpenChange={setShowAnalyticsModal}>
        <DialogContent className="w-[95vw] max-w-[95vw] h-[95vh] max-h-[95vh] overflow-y-auto p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="w-6 h-6 text-purple-500" />
              AI Analytics Dashboard
            </DialogTitle>
          </DialogHeader>
          <div className="p-8 overflow-y-auto" style={{ maxHeight: 'calc(95vh - 80px)' }}>
            <AnalyticsDashboardWrapper paperId={paperId} />
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

// Analytics Dashboard Modal Component
const AnalyticsDashboardWrapper: React.FC<{ paperId: number }> = ({ paperId }) => {
  const [paperData, setPaperData] = useState<any>(null);
  const [tokenData, setTokenData] = useState<any>(null);
  const [academicMetrics, setAcademicMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('impact');
  const { getPaper, getTokenSummary } = useArtica();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch paper from chain
        const chainPaper = await getPaper(paperId);
        if (chainPaper) {
          setPaperData({
            id: chainPaper.id,
            title: `Paper #${paperId}`, // ChainPaper doesn't have title, use paperId
            doi: chainPaper.doi,
            metadataUri: chainPaper.metadataUri,
          });

          // Fetch token data if available
          if (chainPaper.token) {
            try {
              const summary = await getTokenSummary(chainPaper.token);
              if (summary) {
                setTokenData({
                  tokenAddress: chainPaper.token,
                  symbol: summary.symbol,
                  currentPrice: summary.basePrice,
                });
              }
            } catch (err) {
              console.error('Failed to fetch token summary:', err);
            }
          }
        }

        // Use mock academic metrics (since backend API may not be available)
        setAcademicMetrics({
          citations: 45,
          downloads: 1234,
          views: 5678,
          altmetric: 12.5,
          hIndex: 8,
          impactFactor: 4.2,
          // Add predictive metrics
          predictedCitations: {
            sixMonths: 65,
            oneYear: 120,
            twoYears: 280,
          },
          predictedAltmetric: {
            sixMonths: 18,
            oneYear: 32,
            twoYears: 58,
          },
          predictedTokenPrice: {
            sixMonths: 0.015,
            oneYear: 0.028,
            twoYears: 0.052,
          },
        });

        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch analytics data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
        setLoading(false);
      }
    };

    fetchData();
  }, [paperId, getPaper, getTokenSummary]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !paperData) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error || "Failed to load paper details"}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">{paperData.title}</h2>
          <p className="text-lg text-gray-500 mt-1">
            {paperData.doi ? `DOI: ${paperData.doi}` : `Paper ID: ${paperData.id}`}
          </p>
        </div>
        {tokenData && (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-700">
              {tokenData.symbol}: {tokenData.currentPrice ? parseFloat(tokenData.currentPrice).toFixed(6) : 'N/A'} XLM
            </span>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-12">
          <TabsTrigger value="impact" className="text-base font-medium">Impact</TabsTrigger>
          <TabsTrigger value="citations" className="text-base font-medium">Citations</TabsTrigger>
          <TabsTrigger value="geography" className="text-base font-medium">Geography</TabsTrigger>
          <TabsTrigger value="metrics" className="text-base font-medium">Metrics</TabsTrigger>
          <TabsTrigger value="predictive" className="text-base font-medium">Predictive</TabsTrigger>
        </TabsList>

        <TabsContent value="impact" className="mt-8 min-h-[600px]">
          <ImpactTimeSeries 
            paperData={paperData} 
            tokenData={tokenData}
            metrics={academicMetrics}
          />
        </TabsContent>

        <TabsContent value="citations" className="mt-8 min-h-[600px]">
          <CitationNetwork 
            doi={paperData.doi || undefined}
          />
        </TabsContent>

        <TabsContent value="geography" className="mt-8 min-h-[600px]">
          <GeographicDistribution 
            paperId={paperData.id?.toString() || paperId.toString()}
            tokenAddress={tokenData?.tokenAddress}
          />
        </TabsContent>

        <TabsContent value="metrics" className="mt-8 min-h-[600px]">
          <AcademicMetricsPanel metrics={academicMetrics} />
        </TabsContent>

        <TabsContent value="predictive" className="mt-8 min-h-[600px]">
          <PredictiveMetrics 
            paperData={paperData}
            metrics={academicMetrics}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TokenTrading;
