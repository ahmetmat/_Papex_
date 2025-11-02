import React, { useState } from 'react';
import { Button } from '../ui/button.tsx';
import { Input } from '../ui/input.tsx';
import { Alert, AlertDescription } from '../ui/alert.tsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs.tsx';
import { PlusCircle, MinusCircle, Info } from 'lucide-react';
import { useArtica } from '../../context/ArticaContext';

interface LiquidityPoolProps {
  paperSymbol: string;
  tokenContractId?: string;
  tokenInfo: any;
  onLiquidityChange: () => void;
}

const LiquidityPool: React.FC<LiquidityPoolProps> = ({
  paperSymbol,
  tokenContractId,
  tokenInfo,
  onLiquidityChange
}) => {
  const { walletAddress, connectWallet } = useArtica();
  const [activeTab, setActiveTab] = useState<'add' | 'remove'>('add');
  const [xlmAmount, setXlmAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const totalLiquidity = parseFloat(tokenInfo?.liquidity || '0');
  
  const handleAddLiquidity = async () => {
    if (!tokenContractId || !xlmAmount || parseFloat(xlmAmount) <= 0) {
      setError('Please enter a valid XLM amount');
      return;
    }
    
    if (!walletAddress) {
      try {
        await connectWallet();
      } catch (err) {
        setError('Please connect your wallet first');
        return;
      }
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Implement deposit_liquidity call using Soroban
      // For now, show a placeholder message
      setError('Liquidity pool functionality coming soon. This will use deposit_liquidity contract method.');
      
    } catch (err: any) {
      console.error('Liquidity addition error:', err);
      setError(err.message || 'Failed to add liquidity');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRemoveLiquidity = async () => {
    if (!tokenContractId || !xlmAmount || parseFloat(xlmAmount) <= 0) {
      setError('Please enter a valid XLM amount');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Implement withdraw_liquidity call using Soroban
      setError('Liquidity removal functionality coming soon.');
      
    } catch (err: any) {
      console.error('Liquidity removal error:', err);
      setError(err.message || 'Failed to remove liquidity');
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setXlmAmount(value);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium">Pool Liquidity</h3>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Total pool liquidity:</span>
          <span>{totalLiquidity.toFixed(6)} XLM</span>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'add' | 'remove')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="add">
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Liquidity
          </TabsTrigger>
          <TabsTrigger value="remove">
            <MinusCircle className="w-4 h-4 mr-2" />
            Remove Liquidity
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="add" className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">XLM Amount</label>
            <div className="relative">
              <Input
                type="text"
                value={xlmAmount}
                onChange={handleInputChange}
                placeholder="Enter XLM amount"
                className="pr-16"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                XLM
              </span>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 flex items-start">
            <Info className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              By adding liquidity, you earn a share of trading fees proportional to your contribution to the pool.
            </div>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Button 
            onClick={handleAddLiquidity}
            disabled={!xlmAmount || parseFloat(xlmAmount) <= 0 || loading || !walletAddress}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Processing...' : 'Add Liquidity'}
          </Button>
        </TabsContent>
        
        <TabsContent value="remove" className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">XLM Amount</label>
            <div className="relative">
              <Input
                type="text"
                value={xlmAmount}
                onChange={handleInputChange}
                placeholder="Enter XLM amount"
                className="pr-16"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                XLM
              </span>
            </div>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 flex items-start">
            <Info className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              When you remove liquidity, you'll receive your share of the pool in XLM, including any accumulated trading fees.
            </div>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Button 
            onClick={handleRemoveLiquidity}
            disabled={!xlmAmount || parseFloat(xlmAmount) <= 0 || loading}
            className="w-full bg-amber-600 hover:bg-amber-700"
          >
            {loading ? 'Processing...' : 'Remove Liquidity'}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LiquidityPool;

