import React, { useEffect, useState } from 'react';
import { useNavigate } from '../../lib/router';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card.tsx';
import { Button } from '../ui/button.tsx';
import { Alert, AlertDescription } from '../ui/alert.tsx';
import { Badge } from '../ui/badge.tsx';
import { Loader2, ArrowRight, ExternalLink } from 'lucide-react';
import { useArtica, ChainPaper } from '../../context/ArticaContext';

const PaperList: React.FC = () => {
  const navigate = useNavigate();
  const { listPapers } = useArtica();
  const [papers, setPapers] = useState<ChainPaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const items = await listPapers();
        setPapers(items);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load papers');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [listPapers]);

  if (loading && papers.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Registered Papers</h1>
          <p className="text-sm text-muted-foreground">
            Browse research papers that have been registered on the Soroban registry contract.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/upload')}>
          Register new paper
        </Button>
      </div>

      {error && (
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {papers.length === 0 && !loading ? (
        <Alert>
          <AlertDescription>No papers have been registered yet.</AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {papers.map((paper) => (
            <Card key={paper.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">Paper #{paper.id}</CardTitle>
                  <p className="text-xs text-muted-foreground break-all">{paper.metadataUri}</p>
                </div>
                <Badge variant={paper.token ? 'default' : 'outline'}>
                  {paper.token ? 'Tokenized' : 'Pending'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground space-y-1">
                  <p className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Owner: <span className="font-mono text-xs">{paper.owner}</span>
                  </p>
                  {paper.doi && (
                    <p className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4" />
                      DOI: {paper.doi}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => navigate(`/token-creation/${paper.id}`)}>
                    Link token
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/token-trading/${paper.id}`)}
                    disabled={!paper.token}
                  >
                    Trade tokens
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/nft-creation/${paper.id}`)}>
                    Create NFT listing
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaperList;
