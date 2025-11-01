import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card.tsx';
import { Button } from '../ui/button.tsx';
import { Input } from '../ui/input.tsx';
import { Textarea } from '../ui/textarea.tsx';
import { Alert, AlertDescription } from '../ui/alert.tsx';
import { useArtica } from '../../context/ArticaContext';
import { Loader2, Link as LinkIcon, FileText, Hash, CheckCircle } from 'lucide-react';

const PaperUpload: React.FC = () => {
  const { walletAddress, connectWallet, registerPaper } = useArtica();
  const [metadataUri, setMetadataUri] = useState('');
  const [doi, setDoi] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [registeredId, setRegisteredId] = useState<number | null>(null);

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!metadataUri.trim()) {
      setError('Metadata URI is required');
      return;
    }

    try {
      setSubmitting(true);
      const paperId = await registerPaper(metadataUri.trim(), doi.trim() || null);
      setRegisteredId(paperId);
      setSuccess(paperId !== null ? `Paper registered on-chain with ID #${paperId}` : 'Paper registration transaction submitted');
      setNotes('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register paper');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Register Research Paper</CardTitle>
          <CardDescription>
            Store a reference to your paper on Soroban by submitting its metadata URI (e.g. IPFS hash) and optional DOI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!walletAddress && (
            <Alert className="mb-4">
              <AlertDescription>
                Connect your Freighter wallet to continue. You will be asked to approve the registration transaction on Soroban Futurenet.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4">
              <AlertDescription className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                {success}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Metadata URI
              </label>
              <Input
                value={metadataUri}
                onChange={(event) => setMetadataUri(event.target.value)}
                placeholder="ipfs://..."
              />
              <p className="text-xs text-muted-foreground">
                Provide the URI that hosts the paper metadata (IPFS, HTTPS, etc.).
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Hash className="h-4 w-4" />
                DOI (optional)
              </label>
              <Input
                value={doi}
                onChange={(event) => setDoi(event.target.value)}
                placeholder="10.xxxx/xxxxx"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Notes (off-chain)
              </label>
              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional notes for your reference"
                rows={4}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="text-xs text-muted-foreground">
                {registeredId !== null && `Last registered paper ID: ${registeredId}`}
              </div>
              <div className="flex gap-2">
                {!walletAddress && (
                  <Button type="button" variant="outline" onClick={handleConnect}>
                    Connect Freighter
                  </Button>
                )}
                <Button type="submit" disabled={submitting || !walletAddress}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Register Paper'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaperUpload;
