import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from './lib/router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/card.tsx';
import { Button } from './components/ui/button.tsx';
import { Alert, AlertDescription } from './components/ui/alert.tsx';
import { Badge } from './components/ui/badge.tsx';
import { Loader2, ArrowRight, BarChart3, Clock, ExternalLink } from 'lucide-react';
import { useArtica, MarketplaceListing, TokenSummary } from './context/ArticaContext';
import { formatDecimal } from './utils/stellarNumber';

interface ListingWithSummary {
  listing: MarketplaceListing;
  summary: TokenSummary | null;
}

const NFTMarketplaceTrading: React.FC = () => {
  const navigate = useNavigate();
  const { listListings, getTokenSummary } = useArtica();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [summaries, setSummaries] = useState<Record<number, TokenSummary | null>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadListings = async () => {
      setLoading(true);
      setError(null);
      try {
        const entries = await listListings(50, true);
        setListings(entries);

        const summaryEntries: Record<number, TokenSummary | null> = {};
        await Promise.all(
          entries
            .filter((entry) => entry.token)
            .map(async (entry) => {
              try {
                summaryEntries[entry.id] = await getTokenSummary(entry.token);
              } catch (err) {
                console.error('Failed to fetch token summary', err);
                summaryEntries[entry.id] = null;
              }
            }),
        );
        setSummaries(summaryEntries);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load listings');
      } finally {
        setLoading(false);
      }
    };

    void loadListings();
  }, [getTokenSummary, listListings]);

  const listingsWithSummary = useMemo<ListingWithSummary[]>(
    () => listings.map((listing) => ({ listing, summary: summaries[listing.id] ?? null })),
    [listings, summaries],
  );

  if (loading && listings.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Marketplace Listings</h1>
          <p className="text-sm text-muted-foreground">
            Active token and NFT listings registered in the Soroban marketplace contract.
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

      {listingsWithSummary.length === 0 && !loading ? (
        <Alert>
          <AlertDescription>No active listings yet. Create one from a paper or token page.</AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {listingsWithSummary.map(({ listing, summary }) => (
            <Card key={listing.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">Listing #{listing.id}</CardTitle>
                  <CardDescription className="break-all">{listing.metadataUri}</CardDescription>
                </div>
                <Badge>{listing.isActive ? 'Active' : 'Inactive'}</Badge>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="space-y-1">
                  <p className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Token ID: {listing.token || 'N/A'}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Created at: {new Date(listing.createdAt * 1000).toLocaleString()}
                  </p>
                </div>

                {summary && (
                  <div className="rounded border bg-muted/40 p-3 text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-3 w-3" />
                      <span className="font-medium">{summary.name}</span> ({summary.symbol})
                    </div>
                    <p>Liquidity: {formatDecimal(summary.liquidity)}</p>
                    <p>Total supply: {formatDecimal(summary.totalSupply)}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => navigate(`/token-trading/${listing.paperId}`)}>
                    Trade token
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => navigate(`/nft-creation/${listing.paperId}`)}>
                    Update listing
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/token-creation/${listing.paperId}`)}>
                    Link token
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

export default NFTMarketplaceTrading;
