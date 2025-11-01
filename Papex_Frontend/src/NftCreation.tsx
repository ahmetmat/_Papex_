import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from './lib/router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/card.tsx';
import { Button } from './components/ui/button.tsx';
import { Input } from './components/ui/input.tsx';
import { Textarea } from './components/ui/textarea.tsx';
import { Alert, AlertDescription } from './components/ui/alert.tsx';
import { Loader2, Image as ImageIcon, Hash, Share2 } from 'lucide-react';
import { useArtica, ChainPaper } from './context/ArticaContext';

const NftCreation: React.FC = () => {
  const { paperId } = useParams<{ paperId: string }>();
  const navigate = useNavigate();
  const { getPaper, walletAddress, connectWallet, registerListing } = useArtica();
  const [paper, setPaper] = useState<ChainPaper | null>(null);
  const [metadataUri, setMetadataUri] = useState('');
  const [tokenContractId, setTokenContractId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadPaper = async () => {
      if (!paperId) return;
      try {
        const record = await getPaper(Number(paperId));
        setPaper(record);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load paper details');
      }
    };

    void loadPaper();
  }, [getPaper, paperId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!paperId) {
      setError('Missing paper identifier');
      return;
    }

    if (!metadataUri.trim()) {
      setError('Metadata URI is required');
      return;
    }

    if (!tokenContractId.trim()) {
      setError('Token contract ID is required');
      return;
    }

    try {
      setLoading(true);
      await registerListing(Number(paperId), tokenContractId.trim(), metadataUri.trim());
      setSuccess('NFT listing registered. You can now manage it from the marketplace.');
      setNotes('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>NFT Listing</CardTitle>
          <CardDescription>
            Associate a metadata URI and Soroban token contract with paper #{paperId}. Each listing is stored via the marketplace contract.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {paper ? (
            <div className="rounded border bg-muted/40 p-4 text-sm">
              <p>
                <span className="font-medium">Owner:</span> <span className="font-mono text-xs">{paper.owner}</span>
              </p>
              <p className="truncate">
                <span className="font-medium">Metadata:</span> {paper.metadataUri}
              </p>
              {paper.token && (
                <p className="truncate">
                  <span className="font-medium">Token:</span> {paper.token}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Loading paper information…</p>
          )}

          {!walletAddress && (
            <Alert>
              <AlertDescription>
                Connect your Freighter wallet before creating a listing. The transaction will be signed on Soroban Futurenet.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Metadata URI
              </label>
              <Input
                placeholder="ipfs://..."
                value={metadataUri}
                onChange={(event) => setMetadataUri(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Soroban Token Contract ID
              </label>
              <Input
                placeholder="C..."
                value={tokenContractId}
                onChange={(event) => setTokenContractId(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Notes (optional)
              </label>
              <Textarea
                rows={3}
                placeholder="Any off-chain notes about this listing"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>

            <div className="flex justify-between gap-3">
              <Button type="button" variant="outline" onClick={() => navigate('/nft-marketplace')}>
                Back to marketplace
              </Button>
              <div className="flex gap-2">
                {!walletAddress && (
                  <Button type="button" variant="outline" onClick={() => connectWallet()}>
                    Connect Freighter
                  </Button>
                )}
                <Button type="submit" disabled={loading || !walletAddress}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Register Listing'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NftCreation;
