import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle,
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
import { Alert, AlertDescription } from '../ui/alert.tsx';
import { Input } from '../ui/input.tsx';
import { Badge } from '../ui/badge.tsx';
import { useNavigate } from '../../lib/router';
import {
  ChainPaper,
  TokenSummary,
  useArtica,
} from '../../context/ArticaContext';
import { formatDecimal } from '../../utils/stellarNumber';

interface TokenCreationProps {
  paperId: number;
  onSuccess?: (tokenInfo: { paperId: number; tokenAddress: string }) => void;
}

const TokenCreation: React.FC<TokenCreationProps> = ({ paperId, onSuccess }) => {
  const {
    walletAddress,
    connectWallet,
    getPaper,
    getTokenSummary,
    associateToken,
    registerListing,
  } = useArtica();
  const navigate = useNavigate();

  const [paper, setPaper] = useState<ChainPaper | null>(null);
  const [summary, setSummary] = useState<TokenSummary | null>(null);
  const [tokenContractId, setTokenContractId] = useState('');
  const [metadataUri, setMetadataUri] = useState('');

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPaperState = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const chainPaper = await getPaper(paperId);
      setPaper(chainPaper);
      if (chainPaper?.token) {
        setTokenContractId(chainPaper.token);
        const tokenSummary = await getTokenSummary(chainPaper.token);
        setSummary(tokenSummary);
      } else {
        setSummary(null);
      }
      if (chainPaper?.metadataUri) {
        setMetadataUri(chainPaper.metadataUri);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [getPaper, getTokenSummary, paperId]);

  useEffect(() => {
    loadPaperState();
  }, [loadPaperState]);

  const handleAssociateToken = async () => {
    if (!tokenContractId) {
      setError('Provide a token contract ID.');
      return;
    }
    setLoading(true);
    setError(null);
    setFeedback(null);
    try {
      const hash = await associateToken(paperId, tokenContractId);
      setFeedback(
        hash
          ? `Token contract linked to paper. Transaction hash: ${hash}`
          : 'Token contract linked to paper.',
      );
      if (onSuccess) {
        onSuccess({ paperId, tokenAddress: tokenContractId });
      }
      await loadPaperState();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterListing = async () => {
    if (!tokenContractId) {
      setError('Associate a token contract before registering a listing.');
      return;
    }
    if (!metadataUri) {
      setError('Metadata URI is required to register a marketplace listing.');
      return;
    }
    setLoading(true);
    setError(null);
    setFeedback(null);
    try {
      const hash = await registerListing(paperId, tokenContractId, metadataUri);
      setFeedback(
        hash
          ? `Marketplace listing created. Transaction hash: ${hash}`
          : 'Marketplace listing created.',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Tokenize Paper #{paperId}</h2>
          <p className="text-sm text-muted-foreground">
            Link a deployed Soroban PapexToken contract and list it on the marketplace.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {walletAddress ? (
            <Badge variant="outline">
              <Wallet className="mr-2 h-3 w-3" />
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </Badge>
          ) : (
            <Button variant="outline" onClick={connectWallet}>
              Connect Freighter
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={loadPaperState}>
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {feedback && (
        <Alert>
          <AlertDescription>{feedback}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Token Contract</CardTitle>
          <CardDescription>
            Deploy the <code>papex_papertoken</code> Soroban contract and paste
            the resulting contract ID below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs uppercase text-muted-foreground">Token Contract ID</p>
            <Input
              placeholder="CABC... (Soroban contract ID)"
              value={tokenContractId}
              onChange={(event) => setTokenContractId(event.target.value)}
            />
          </div>
          <Button onClick={handleAssociateToken} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Link Contract to Paper
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Marketplace Listing</CardTitle>
          <CardDescription>
            Provide the metadata URI used for discovery (e.g. IPFS hash or backend endpoint).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs uppercase text-muted-foreground">Metadata URI</p>
            <Input
              placeholder="ipfs://..."
              value={metadataUri}
              onChange={(event) => setMetadataUri(event.target.value)}
            />
          </div>
          <Button onClick={handleRegisterListing} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="mr-2 h-4 w-4" />
            )}
            Register Marketplace Listing
          </Button>
        </CardContent>
      </Card>

      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>{summary.name} Overview</CardTitle>
            <CardDescription>Live configuration pulled from the token contract.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Symbol</p>
              <p className="text-lg font-semibold">{summary.symbol}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Total Supply</p>
              <p className="text-lg font-semibold">
                {formatDecimal(summary.totalSupply)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Liquidity Pool</p>
              <p className="text-lg font-semibold">
                {formatDecimal(summary.liquidity)}
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              onClick={() => navigate(`/token-trading/${paperId}`)}
            >
              Go to Trading Interface
            </Button>
          </CardFooter>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Deployment Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            1. Compile the <code>papex_papertoken</code> contract and upload its WASM to the network.
          </p>
          <p>
            2. Deploy a contract instance for this paper. Record the resulting contract ID.
          </p>
          <p>
            3. Use the buttons above to link the contract in the registry and register a marketplace listing.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TokenCreation;
