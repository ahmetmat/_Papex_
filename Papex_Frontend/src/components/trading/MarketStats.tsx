import React from 'react';
import { TrendingUp, BarChart2, Users, Activity, Wallet, DollarSign } from 'lucide-react';
import { TokenSummary } from '../../context/ArticaContext';
import { formatDecimal } from '../../utils/stellarNumber';

interface MarketStatsProps {
  tokenInfo: TokenSummary | null;
  paperSymbol: string;
}

const MarketStats: React.FC<MarketStatsProps> = ({ tokenInfo, paperSymbol }) => {
  const price = parseFloat(tokenInfo?.basePrice || '0.01');
  const priceChange = 0.0002; // Placeholder
  const priceChangePercentage = 2; // Placeholder
  const volume = 50; // Placeholder
  const liquidity = parseFloat(tokenInfo?.liquidity || '100');
  const marketCap = price * parseFloat(tokenInfo?.totalSupply || '10000');
  const totalSupply = parseFloat(tokenInfo?.totalSupply || '10000');
  const holdersCount = 12; // Placeholder
  
  const formatNumber = (num: number) => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(2) + 'B';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(2) + 'K';
    }
    return num.toFixed(2);
  };
  
  const xlmToUsd = 0.1; // Placeholder rate
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-gray-500" />
          <div>
            <div className="text-sm text-gray-500">Current Price</div>
            <div className="font-medium">{formatDecimal(price.toString(), 8)} XLM</div>
            <div className="text-xs text-gray-500">${(price * xlmToUsd).toFixed(2)}</div>
          </div>
        </div>
        <div className={`flex flex-col items-end ${priceChangePercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          <div className="flex items-center">
            {priceChangePercentage >= 0 ? (
              <TrendingUp className="w-3 h-3 mr-1" />
            ) : (
              <TrendingUp className="w-3 h-3 mr-1 transform rotate-180" />
            )}
            <span className="font-medium">{priceChangePercentage.toFixed(2)}%</span>
          </div>
          <span className="text-xs">{priceChange >= 0 ? '+' : ''}{formatDecimal(priceChange.toString(), 8)} XLM</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-gray-500" />
            <div className="text-sm text-gray-600">24h Volume</div>
          </div>
          <div className="font-medium">{formatNumber(volume)} {paperSymbol}</div>
          <div className="text-xs text-gray-500">${formatNumber(volume * price * xlmToUsd)}</div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-gray-500" />
            <div className="text-sm text-gray-600">Liquidity</div>
          </div>
          <div className="font-medium">{formatDecimal(liquidity.toString(), 2)} XLM</div>
          <div className="text-xs text-gray-500">${formatNumber(liquidity * xlmToUsd)}</div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 className="w-4 h-4 text-gray-500" />
            <div className="text-sm text-gray-600">Market Cap</div>
          </div>
          <div className="font-medium">{formatDecimal(marketCap.toString(), 2)} XLM</div>
          <div className="text-xs text-gray-500">${formatNumber(marketCap * xlmToUsd)}</div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-gray-500" />
            <div className="text-sm text-gray-600">Holders</div>
          </div>
          <div className="font-medium">{holdersCount}</div>
          <div className="text-xs text-gray-500">{formatDecimal(totalSupply.toString(), 0)} {paperSymbol} Total</div>
        </div>
      </div>
      
      <div className="pt-2 border-t">
        <div className="text-sm font-medium mb-2">Token Information</div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Symbol</span>
            <span>{paperSymbol}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Total Supply</span>
            <span>{formatDecimal(totalSupply.toString(), 0)} {paperSymbol}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Trading Status</span>
            <span className={tokenInfo?.trading ? 'text-green-600' : 'text-red-600'}>
              {tokenInfo?.trading ? 'Active' : 'Paused'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketStats;

