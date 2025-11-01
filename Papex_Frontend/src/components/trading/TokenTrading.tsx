import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2,
  RefreshCcw,
  Wallet,
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
import TradeHistory from './TradeHistory.tsx';
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
  const [submitting, setSubmitting] = useState<'buy' | 'sell' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [buyAmount, setBuyAmount] = useState('1');
  const [sellAmount, setSellAmount] = useState('1');
  const [buyQuote, setBuyQuote] = useState<Quote | null>(null);
  const [sellQuote, setSellQuote] = useState<Quote | null>(null);

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const chainPaper = await getPaper(paperId);
      setPaper(chainPaper);
      if (chainPaper?.token) {
        const [summaryResult, tradeResult] = await Promise.all([
          getTokenSummary(chainPaper.token),
          loadTrades(paperId),
        ]);
        setSummary(summaryResult);
        setTrades(tradeResult);
      } else {
        setSummary(null);
        setTrades([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [getPaper, getTokenSummary, loadTrades, paperId]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleQuoteBuy = useCallback(async () => {
    if (!paper?.token) return;
    setError(null);
    try {
      const quote = await quoteBuy(paper.token, buyAmount);
      setBuyQuote(quote);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [paper, buyAmount, quoteBuy]);

  const handleQuoteSell = useCallback(async () => {
    if (!paper?.token) return;
    setError(null);
    try {
      const quote = await quoteSell(paper.token, sellAmount);
      setSellQuote(quote);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [paper, sellAmount, quoteSell]);

  const handleBuy = useCallback(async () => {
    if (!paper?.token) return;
    setSubmitting('buy');
    setError(null);
    setInfo(null);
    try {
      const hash = await executeBuy(paper.token, buyAmount, buyQuote?.cost);
      setInfo(
        hash
          ? `Buy transaction submitted. Hash: ${hash}`
          : 'Buy transaction submitted.',
      );
      await refreshData();
      await handleQuoteBuy();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(null);
    }
  }, [
    paper,
    buyAmount,
    buyQuote,
    executeBuy,
    refreshData,
    handleQuoteBuy,
  ]);

  const handleSell = useCallback(async () => {
    if (!paper?.token) return;
    setSubmitting('sell');
    setError(null);
    setInfo(null);
    try {
      const hash = await executeSell(paper.token, sellAmount, sellQuote?.cost);
      setInfo(
        hash
          ? `Sell transaction submitted. Hash: ${hash}`
          : 'Sell transaction submitted.',
      );
      await refreshData();
      await handleQuoteSell();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(null);
    }
  }, [
    paper,
    sellAmount,
    sellQuote,
    executeSell,
    refreshData,
    handleQuoteSell,
  ]);

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {paperTitle ?? 'Paper Token Trading'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Paper ID #{paperId}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {walletAddress ? (
            <Badge variant="outline">
              <Wallet className="mr-2 h-3 w-3" />
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </Badge>
          ) : (
            <Button onClick={connectWallet} variant="outline">
              Connect Freighter
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={refreshData}>
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {info && (
        <Alert>
          <AlertDescription>{info}</AlertDescription>
        </Alert>
      )}

      {!paper?.token && (
        <Alert>
          <AlertDescription>
            This paper is not tokenized yet. Deploy a PapexToken contract and
            associate it using the registry before trading.
          </AlertDescription>
        </Alert>
      )}

      {summary && paper?.token && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>
                {summary.name} ({summary.symbol})
              </CardTitle>
              <CardDescription>
                Owner: {summary.owner} · Max supply {formatDecimal(summary.maxSupply)}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Total Supply</p>
                <p className="text-lg font-semibold">
                  {formatDecimal(summary.totalSupply)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Liquidity (base asset)</p>
                <p className="text-lg font-semibold">
                  {formatDecimal(summary.liquidity)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Trading Status</p>
                <Badge variant={summary.trading ? 'default' : 'secondary'}>
                  {summary.trading ? 'Enabled' : 'Paused'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUpCircle className="h-5 w-5 text-green-500" />
                  Buy Tokens
                </CardTitle>
                <CardDescription>
                  Enter the amount of tokens you want to purchase and request a
                  quote before submitting the transaction.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  value={buyAmount}
                  onChange={(event) => setBuyAmount(event.target.value)}
                  placeholder="Amount to buy"
                />
                {buyQuote && (
                  <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                    <p>Estimated cost: {formatDecimal(buyQuote.cost)} base units</p>
                    <p>
                      Price range: {formatDecimal(buyQuote.priceBefore)} →{' '}
                      {formatDecimal(buyQuote.priceAfter)}
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleQuoteBuy}
                  disabled={submitting === 'buy'}
                >
                  Quote
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleBuy}
                  disabled={submitting !== null}
                >
                  {submitting === 'buy' && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Buy
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowDownCircle className="h-5 w-5 text-red-500" />
                  Sell Tokens
                </CardTitle>
                <CardDescription>
                  Provide the amount you wish to sell. Quotes show the minimum
                  amount you should expect to receive.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  value={sellAmount}
                  onChange={(event) => setSellAmount(event.target.value)}
                  placeholder="Amount to sell"
                />
                {sellQuote && (
                  <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                    <p>
                      Estimated proceeds: {formatDecimal(sellQuote.cost)} base
                      units
                    </p>
                    <p>
                      Price range: {formatDecimal(sellQuote.priceBefore)} →{' '}
                      {formatDecimal(sellQuote.priceAfter)}
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleQuoteSell}
                  disabled={submitting === 'sell'}
                >
                  Quote
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSell}
                  disabled={submitting !== null}
                >
                  {submitting === 'sell' && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Sell
                </Button>
              </CardFooter>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Trades</CardTitle>
              <CardDescription>
                On-chain trade events recorded by the marketplace contract.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TradeHistory data={trades} tokenSymbol={summary.symbol ?? 'PAPER'} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default TokenTrading;
