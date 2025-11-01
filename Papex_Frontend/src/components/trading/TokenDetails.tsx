import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card.tsx';
import { Alert, AlertDescription } from '../ui/alert.tsx';
import { useArtica, ChainPaper, TokenSummary } from '../../context/ArticaContext';
import { formatDecimal } from '../../utils/stellarNumber';

interface TokenDetailsProps {
  paperId: number;
}

const TokenDetails: React.FC<TokenDetailsProps> = ({ paperId }) => {
  const { getPaper, getTokenSummary } = useArtica();
  const [paper, setPaper] = useState<ChainPaper | null>(null);
  const [summary, setSummary] = useState<TokenSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const chainPaper = await getPaper(paperId);
        setPaper(chainPaper);
        if (chainPaper?.token) {
          const details = await getTokenSummary(chainPaper.token);
          setSummary(details);
        } else {
          setSummary(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [getPaper, getTokenSummary, paperId]);

  if (loading && !paper) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Token Details</CardTitle>
        <CardDescription>
          Current on-chain configuration for paper #{paperId}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!paper?.token && (
          <Alert>
            <AlertDescription>
              This paper has not been linked to a PapexToken contract yet.
            </AlertDescription>
          </Alert>
        )}

        {paper?.token && summary && (
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Token</p>
              <p className="text-sm font-medium">{summary.name}</p>
              <p className="text-xs text-muted-foreground">{summary.symbol}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Total Supply</p>
              <p className="text-sm font-medium">
                {formatDecimal(summary.totalSupply)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Liquidity</p>
              <p className="text-sm font-medium">
                {formatDecimal(summary.liquidity)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TokenDetails;
