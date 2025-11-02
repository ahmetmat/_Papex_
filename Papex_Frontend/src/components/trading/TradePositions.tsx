import React, { useState } from 'react';
import { Button } from '../ui/button.tsx';
import { Clock, XCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert.tsx';
import { useToast } from '../../hooks/use-toast.ts';

interface Position {
  id: number;
  type: 'limit' | 'stake';
  action: 'buy' | 'sell';
  amount: string;
  price: string;
  total: string;
  timestamp: number;
  status: 'active' | 'filled' | 'cancelled';
}

interface TradePositionsProps {
  tokenSymbol: string;
  data?: Position[];
  onClose?: () => void;
}

const TradePositions: React.FC<TradePositionsProps> = ({ 
  tokenSymbol, 
  data = [], 
  onClose 
}) => {
  const [loading, setLoading] = useState<{ [key: number]: boolean }>({});
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCancelOrder = async (position: Position) => {
    if (position.type !== 'limit') return;
    
    try {
      setError(null);
      setLoading(prev => ({ ...prev, [position.id]: true }));
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Order cancelled",
        description: `Successfully cancelled ${position.action} order for ${position.amount} ${tokenSymbol}`,
      });
      
      if (onClose) onClose();
    } catch (err: any) {
      console.error('Cancel order error:', err);
      setError(err.message || 'Failed to cancel order');
    } finally {
      setLoading(prev => ({ ...prev, [position.id]: false }));
    }
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-500 mb-2">You don't have any active positions.</p>
        <p className="text-sm text-gray-400">
          Your limit orders and staking positions will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-3">
        {data.map(position => (
          <div 
            key={position.id} 
            className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    position.type === 'limit' 
                      ? position.action === 'buy' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {position.type === 'limit' 
                      ? `${position.action === 'buy' ? 'Buy' : 'Sell'} Limit`
                      : 'Staking'
                    }
                  </span>
                  <span className="text-gray-500 text-xs flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(position.timestamp * 1000).toLocaleString('en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    })}
                  </span>
                </div>
                
                <div className="mt-2 space-y-1">
                  {position.type === 'limit' ? (
                    <>
                      <div className="text-sm">
                        <span className="text-gray-500">Amount:</span>{' '}
                        <span className="font-medium">{parseFloat(position.amount).toFixed(4)} {tokenSymbol}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Price:</span>{' '}
                        <span className="font-medium">{parseFloat(position.price).toFixed(6)} XLM</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Total:</span>{' '}
                        <span className="font-medium">{parseFloat(position.total).toFixed(6)} XLM</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-sm">
                        <span className="text-gray-500">Staked:</span>{' '}
                        <span className="font-medium">{parseFloat(position.amount).toFixed(4)} {tokenSymbol}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Rewards:</span>{' '}
                        <span className="font-medium">{parseFloat(position.total).toFixed(6)} XLM</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => position.type === 'limit' && handleCancelOrder(position)}
                disabled={loading[position.id] || position.type !== 'limit'}
              >
                {loading[position.id] ? (
                  <Clock className="w-4 h-4 animate-spin" />
                ) : (
                  position.type === 'limit' ? (
                    <>
                      <XCircle className="w-4 h-4 mr-1" />
                      Cancel
                    </>
                  ) : (
                    'Claim Rewards'
                  )
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TradePositions;

