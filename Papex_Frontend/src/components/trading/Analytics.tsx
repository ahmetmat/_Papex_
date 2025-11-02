import React from 'react';
import { TrendingUp, TrendingDown, BarChart3, Users, DollarSign, Activity, ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card.tsx';
import { Badge } from '../ui/badge.tsx';
import { TokenAnalytics } from '../../hooks/useTokenAnalytics';
import { formatDecimal } from '../../utils/stellarNumber';

interface AnalyticsProps {
  analytics: TokenAnalytics | null;
  tokenSymbol: string;
}

const Analytics: React.FC<AnalyticsProps> = ({ analytics, tokenSymbol }) => {
  if (!analytics) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Loading analytics...</p>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Price Analytics */}
      <Card className="border-white/20 bg-white/60 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            24h Price Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-600">High</p>
              <p className="text-lg font-semibold">{formatCurrency(analytics.price24h.high)} XLM</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Low</p>
              <p className="text-lg font-semibold">{formatCurrency(analytics.price24h.low)} XLM</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Open</p>
              <p className="text-lg font-semibold">{formatCurrency(analytics.price24h.open)} XLM</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Close</p>
              <p className="text-lg font-semibold">{formatCurrency(analytics.price24h.close)} XLM</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              {analytics.price24h.change >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
              <span className={`text-xl font-bold ${analytics.price24h.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {analytics.price24h.change >= 0 ? '+' : ''}{formatCurrency(analytics.price24h.change)} XLM
              </span>
              <Badge variant={analytics.price24h.changePercent >= 0 ? 'default' : 'destructive'}>
                {analytics.price24h.changePercent >= 0 ? '+' : ''}{analytics.price24h.changePercent.toFixed(2)}%
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Volume Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-white/20 bg-white/60 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">24h Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(analytics.volume24h)} XLM</p>
          </CardContent>
        </Card>
        <Card className="border-white/20 bg-white/60 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">7d Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(analytics.volume7d)} XLM</p>
          </CardContent>
        </Card>
        <Card className="border-white/20 bg-white/60 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">30d Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(analytics.volume30d)} XLM</p>
          </CardContent>
        </Card>
        <Card className="border-white/20 bg-white/60 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Trade Size</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(analytics.averageTradeSize)} XLM</p>
          </CardContent>
        </Card>
      </div>

      {/* Trading Analytics */}
      <Card className="border-white/20 bg-white/60 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Trading Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Total Trades</p>
              <p className="text-xl font-semibold">{analytics.totalTrades}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">24h Trades</p>
              <p className="text-xl font-semibold">{analytics.trades24h}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">7d Trades</p>
              <p className="text-xl font-semibold">{analytics.trades7d}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Volatility</p>
              <p className="text-xl font-semibold">{analytics.priceVolatility.toFixed(2)}%</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Buy vs Sell (24h)</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Buy</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{analytics.buyTrades24h} trades</p>
                    <p className="text-xs text-gray-500">{formatCurrency(analytics.buyVolume24h)} XLM</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowDown className="w-4 h-4 text-red-500" />
                    <span className="text-sm">Sell</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{analytics.sellTrades24h} trades</p>
                    <p className="text-xs text-gray-500">{formatCurrency(analytics.sellVolume24h)} XLM</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Trading Activity</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Unique Traders (24h)</span>
                  <p className="text-sm font-semibold">{analytics.uniqueTraders}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">New Traders (24h)</span>
                  <Badge variant="secondary">{analytics.newTraders24h} new</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Traders */}
      <Card className="border-white/20 bg-white/60 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Top Traders (24h)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.topTraders.map((trader, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-600">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{trader.address}</p>
                    <p className="text-xs text-gray-500">{trader.trades} trades</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(trader.volume)} XLM</p>
                  <p className="text-xs text-gray-500">Volume</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Market Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-white/20 bg-white/60 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Market Cap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(analytics.marketCap)} XLM</p>
          </CardContent>
        </Card>
        <Card className="border-white/20 bg-white/60 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Liquidity Pool</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(analytics.liquidity)} XLM</p>
          </CardContent>
        </Card>
        <Card className="border-white/20 bg-white/60 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Token Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Top 10</span>
              <span className="text-sm font-semibold">{analytics.distribution.top10Holders.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Top 25</span>
              <span className="text-sm font-semibold">{analytics.distribution.top25Holders.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Top 50</span>
              <span className="text-sm font-semibold">{analytics.distribution.top50Holders.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;

