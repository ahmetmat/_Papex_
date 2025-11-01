import React, { useMemo } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { TradeRecord } from '../../context/ArticaContext';
import { formatDecimal } from '../../utils/stellarNumber';

interface TradeHistoryProps {
  data: TradeRecord[];
  tokenSymbol: string;
}

const TradeHistory: React.FC<TradeHistoryProps> = ({ data, tokenSymbol }) => {
  const rows = useMemo(() => data.slice().sort((a, b) => b.timestamp - a.timestamp), [data]);

  if (rows.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        No trades recorded yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="grid grid-cols-4 bg-muted/50 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <span>Direction</span>
        <span className="text-right">Amount ({tokenSymbol})</span>
        <span className="text-right">Base Paid</span>
        <span className="text-right">Timestamp</span>
      </div>
      <div className="max-h-80 overflow-y-auto text-sm">
        {rows.map((trade, index) => (
          <div
            key={`${trade.timestamp}-${index}`}
            className="grid grid-cols-4 items-center border-t px-4 py-2 text-sm"
          >
            <span
              className={`flex items-center gap-2 font-medium ${
                trade.isBuy ? 'text-green-600' : 'text-red-500'
              }`}
            >
              {trade.isBuy ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {trade.isBuy ? 'Buy' : 'Sell'}
            </span>
            <span className="text-right">
              {formatDecimal(trade.amount, 5)}
            </span>
            <span className="text-right">
              {formatDecimal(trade.cost, 5)}
            </span>
            <span className="text-right text-muted-foreground">
              {new Date(trade.timestamp).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TradeHistory;
