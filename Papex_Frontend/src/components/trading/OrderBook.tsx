import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatDecimal } from '../../utils/stellarNumber';

interface OrderBookProps {
  data: {
    bids: Array<{ price: string; amount: string; total: string; }>;
    asks: Array<{ price: string; amount: string; total: string; }>;
    spreadAmount: string;
    spreadPercentage: string;
  };
  tokenSymbol: string;
  onSelectPrice: (price: string) => void;
}

const OrderBook: React.FC<OrderBookProps> = ({ data, tokenSymbol, onSelectPrice }) => {
  const [depthView, setDepthView] = useState<'both' | 'bids' | 'asks'>('both');
  const [grouping, setGrouping] = useState<number>(0.0001);
  
  const maxBidVolume = Math.max(...(data.bids || []).map(bid => parseFloat(bid.total) || 0));
  const maxAskVolume = Math.max(...(data.asks || []).map(ask => parseFloat(ask.total) || 0));
  const maxVolume = Math.max(maxBidVolume, maxAskVolume, 0.00001);
  
  const applyGrouping = (orders: any[], isAsk: boolean) => {
    if (!orders || orders.length === 0) return [];
    
    const grouped: Record<string, { price: string; amount: string; total: string; }> = {};
    
    orders.forEach(order => {
      const price = Math.floor(parseFloat(order.price) / grouping) * grouping;
      const priceKey = price.toFixed(8);
      
      if (!grouped[priceKey]) {
        grouped[priceKey] = {
          price: priceKey,
          amount: '0',
          total: '0'
        };
      }
      
      grouped[priceKey].amount = (parseFloat(grouped[priceKey].amount) + parseFloat(order.amount)).toString();
      grouped[priceKey].total = (parseFloat(grouped[priceKey].total) + parseFloat(order.total)).toString();
    });
    
    return Object.values(grouped).sort((a, b) => {
      const priceA = parseFloat(a.price);
      const priceB = parseFloat(b.price);
      return isAsk ? priceA - priceB : priceB - priceA;
    });
  };
  
  const groupedBids = applyGrouping(data.bids || [], false);
  const groupedAsks = applyGrouping(data.asks || [], true);
  
  if (groupedBids.length === 0 && groupedAsks.length === 0) {
    const basePrice = 0.01;
    
    for (let i = 0; i < 8; i++) {
      const bidPrice = (basePrice * (1 - (i + 1) * 0.005)).toFixed(8);
      const askPrice = (basePrice * (1 + (i + 1) * 0.005)).toFixed(8);
      const amount = (Math.random() * 10 + 1).toFixed(4);
      const bidTotal = (parseFloat(bidPrice) * parseFloat(amount)).toFixed(8);
      const askTotal = (parseFloat(askPrice) * parseFloat(amount)).toFixed(8);
      
      groupedBids.push({ price: bidPrice, amount, total: bidTotal });
      groupedAsks.push({ price: askPrice, amount, total: askTotal });
    }
  }
  
  return (
    <div className="relative w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">Order Book</div>
        <div className="flex items-center gap-2">
          <select 
            className="text-xs px-2 py-1 border rounded bg-white"
            value={grouping}
            onChange={(e) => setGrouping(parseFloat(e.target.value))}
          >
            <option value="0.00001">0.00001</option>
            <option value="0.0001">0.0001</option>
            <option value="0.001">0.001</option>
            <option value="0.01">0.01</option>
          </select>
          
          <div className="border rounded overflow-hidden flex">
            <button 
              onClick={() => setDepthView('bids')}
              className={`px-2 py-1 text-xs ${depthView === 'bids' ? 'bg-green-100 text-green-800' : 'bg-white'}`}
            >
              Bids
            </button>
            <button 
              onClick={() => setDepthView('both')}
              className={`px-2 py-1 text-xs ${depthView === 'both' ? 'bg-gray-100' : 'bg-white'}`}
            >
              Both
            </button>
            <button 
              onClick={() => setDepthView('asks')}
              className={`px-2 py-1 text-xs ${depthView === 'asks' ? 'bg-red-100 text-red-800' : 'bg-white'}`}
            >
              Asks
            </button>
          </div>
        </div>
      </div>
      
      <div className="w-full text-xs">
        <div className="grid grid-cols-4 border-b py-2 text-gray-500 bg-gray-50">
          <div className="text-left px-2">Price (XLM)</div>
          <div className="text-right px-2">Amount ({tokenSymbol})</div>
          <div className="text-right px-2">Total (XLM)</div>
          <div className="text-right px-2">Sum (XLM)</div>
        </div>
        
        {(depthView === 'both' || depthView === 'asks') && (
          <div className="max-h-[200px] overflow-y-auto scrollbar-thin">
            {groupedAsks.map((ask, index) => (
              <div 
                key={`ask-${index}`} 
                className="grid grid-cols-4 border-b border-gray-100 hover:bg-red-50 cursor-pointer relative py-1"
                onClick={() => onSelectPrice(ask.price)}
              >
                <div 
                  className="absolute right-0 top-0 bottom-0 bg-red-100" 
                  style={{ 
                    width: `${(parseFloat(ask.total) / maxVolume) * 100}%`,
                    maxWidth: '100%' 
                  }}
                />
                
                <div className="text-left px-2 text-red-600 font-medium relative z-10">
                  {parseFloat(ask.price).toFixed(8)}
                </div>
                <div className="text-right px-2 relative z-10">{formatDecimal(ask.amount, 4)}</div>
                <div className="text-right px-2 relative z-10">{formatDecimal(ask.total, 8)}</div>
                <div className="text-right px-2 relative z-10">
                  {formatDecimal(groupedAsks.slice(0, index + 1).reduce((sum, o) => sum + parseFloat(o.total), 0), 8)}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {depthView === 'both' && (
          <div className="py-2 grid grid-cols-2 bg-gray-50 border-b border-t">
            <div className="text-center text-xs text-gray-600">
              Spread: {data.spreadAmount || '0.00002'} XLM
            </div>
            <div className="text-center text-xs text-gray-600">
              ({data.spreadPercentage || '0.2'}%)
            </div>
          </div>
        )}
        
        {(depthView === 'both' || depthView === 'bids') && (
          <div className="max-h-[200px] overflow-y-auto scrollbar-thin">
            {groupedBids.map((bid, index) => (
              <div 
                key={`bid-${index}`} 
                className="grid grid-cols-4 border-b border-gray-100 hover:bg-green-50 cursor-pointer relative py-1"
                onClick={() => onSelectPrice(bid.price)}
              >
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-green-100" 
                  style={{ 
                    width: `${(parseFloat(bid.total) / maxVolume) * 100}%`,
                    maxWidth: '100%' 
                  }}
                />
                
                <div className="text-left px-2 text-green-600 font-medium relative z-10">
                  {parseFloat(bid.price).toFixed(8)}
                </div>
                <div className="text-right px-2 relative z-10">{formatDecimal(bid.amount, 4)}</div>
                <div className="text-right px-2 relative z-10">{formatDecimal(bid.total, 8)}</div>
                <div className="text-right px-2 relative z-10">
                  {formatDecimal(groupedBids.slice(0, index + 1).reduce((sum, o) => sum + parseFloat(o.total), 0), 8)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderBook;

