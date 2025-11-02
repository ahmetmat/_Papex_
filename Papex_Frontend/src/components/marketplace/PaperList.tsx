import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from '../../lib/router';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card.tsx';
import { Button } from '../ui/button.tsx';
import { Alert, AlertDescription } from '../ui/alert.tsx';
import { Input } from '../ui/input.tsx';
import { Badge } from '../ui/badge.tsx';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs.tsx';
import {
  FileText,
  Loader2,
  Search,
  Star,
  TrendingUp,
  Users,
  BarChart3,
  Coins,
  Grid3X3,
  List,
  Filter,
  SlidersHorizontal,
  ChevronDown,
  Eye,
  Heart,
  Share2,
  ExternalLink,
  BookOpen,
  Flame,
  Clock,
  Trophy,
  Zap,
  Globe,
  TrendingDown,
  ArrowUpRight,
  ShoppingCart,
  Wallet,
  Award,
  Crown,
  Sparkles,
  Activity,
  Package,
  Hash,
  DollarSign,
  LineChart,
  RefreshCw,
  ArrowRight,
  X,
  ChevronRight,
  Info,
  Tag,
  CheckCircle,
  Verified,
  Target,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useArtica, ChainPaper } from '../../context/ArticaContext';
import { getPinataGatewayUrl, listPinnedFiles, formatIPFSUri } from '../../config/pinata';

const CATEGORIES = {
  ALL: 'All',
  AI: 'AI & Machine Learning',
  BLOCKCHAIN: 'Blockchain',
  BIOTECH: 'Biotechnology',
  PHYSICS: 'Physics',
  CHEMISTRY: 'Chemistry',
  COMPUTER_SCIENCE: 'Computer Science',
  MEDICINE: 'Medicine',
  FINANCE: 'Finance & Economics',
};

const SORT_OPTIONS = [
  { value: 'newest', label: 'Recently Added', icon: Clock },
  { value: 'trending', label: 'Trending', icon: TrendingUp },
  { value: 'impact', label: 'Impact Score', icon: Target },
  { value: 'tokenized', label: 'Tokenized First', icon: Coins },
];

// Generate mock impact score
const generateImpactScore = (id: number | string): number => {
  const seed = typeof id === 'string' ? id.charCodeAt(0) : id;
  return Math.floor(65 + ((seed * 293847) % 35)); // Range 65-99
};

// Get impact score color
const getImpactColor = (score: number): string => {
  if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
  if (score >= 80) return 'text-blue-600 bg-blue-50 border-blue-200';
  if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-gray-600 bg-gray-50 border-gray-200';
};

const getImpactScoreColor = (score: number): string => {
  if (score >= 90) return 'bg-emerald-500 text-white';
  if (score >= 80) return 'bg-blue-500 text-white';
  if (score >= 70) return 'bg-indigo-500 text-white';
  return 'bg-slate-400 text-white';
};

// Typewriter Effect Hook
const useTypewriter = (
  words: string[],
  speed = 150,
  deleteSpeed = 100,
  pauseTime = 2000
): string => {
  const [displayText, setDisplayText] = useState('');
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const word = words[wordIndex];

    const timer = setTimeout(() => {
      if (!isDeleting) {
        // Typing
        if (displayText.length < word.length) {
          setDisplayText(word.substring(0, displayText.length + 1));
        } else {
          // Pause before deleting
          setTimeout(() => setIsDeleting(true), pauseTime);
        }
      } else {
        // Deleting
        if (displayText.length > 0) {
          setDisplayText(word.substring(0, displayText.length - 1));
        } else {
          setIsDeleting(false);
          setWordIndex((prev) => (prev + 1) % words.length);
        }
      }
    }, isDeleting ? deleteSpeed : speed);

    return () => clearTimeout(timer);
  }, [displayText, wordIndex, isDeleting, words, speed, deleteSpeed, pauseTime]);

  return displayText;
};

// Filter Sidebar Component
const FilterSidebar = ({
  isOpen,
  onClose,
  filters,
  setFilters,
  onClearFilters,
}: {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  setFilters: (f: any) => void;
  onClearFilters: () => void;
}) => {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 lg:w-56 bg-white border-r border-gray-100 transition-transform duration-300 z-50 lg:z-auto overflow-y-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Filters</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-[#083466] hover:bg-[#083466]/10 rounded-2xl"
              >
                Clear all
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="lg:hidden rounded-2xl"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search papers..."
                value={filters.search}
                onChange={(e) => setFilters((prev: any) => ({ ...prev, search: e.target.value }))}
                className="pl-10 border-gray-200 focus:border-[#083466] focus:ring-[#083466]/20 rounded-2xl"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Category</label>
            <div className="space-y-2">
              {Object.entries(CATEGORIES).map(([key, value]) => (
                <label
                  key={key}
                  className="flex items-center cursor-pointer group p-2 rounded-2xl hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name="category"
                    checked={filters.category === key}
                    onChange={() => setFilters((prev: any) => ({ ...prev, category: key }))}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded-full border-2 mr-3 transition-all ${
                      filters.category === key
                        ? 'border-[#083466] bg-[#083466]'
                        : 'border-gray-300 group-hover:border-[#083466]'
                    }`}
                  >
                    {filters.category === key && (
                      <div className="w-full h-full rounded-full bg-white scale-50" />
                    )}
                  </div>
                  <span
                    className={`text-sm ${
                      filters.category === key ? 'text-[#083466] font-medium' : 'text-gray-700'
                    }`}
                  >
                    {value}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Features</label>
            <div className="space-y-2">
              {[
                { key: 'hasToken', label: 'Has Token', icon: Coins },
                { key: 'isVerified', label: 'Verified Author', icon: Award },
              ].map(({ key, label, icon: Icon }) => (
                <label
                  key={key}
                  className="flex items-center cursor-pointer group p-2 rounded-2xl hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={filters[key] || false}
                    onChange={(e) =>
                      setFilters((prev: any) => ({ ...prev, [key]: e.target.checked }))
                    }
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded border-2 mr-3 transition-all ${
                      filters[key]
                        ? 'border-[#083466] bg-[#083466]'
                        : 'border-gray-300 group-hover:border-[#083466]'
                    }`}
                  >
                    {filters[key] && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-sm" />
                      </div>
                    )}
                  </div>
                  <Icon className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Active Filters */}
          {(filters.category !== 'ALL' ||
            filters.search ||
            filters.hasToken ||
            filters.isVerified) && (
            <div className="border-t border-gray-100 pt-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Active Filters</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFilters}
                  className="text-xs text-[#083466] rounded-2xl"
                >
                  Clear all
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {filters.category !== 'ALL' && (
                  <Badge className="bg-[#083466] text-white rounded-2xl">
                    {CATEGORIES[filters.category as keyof typeof CATEGORIES]}
                  </Badge>
                )}
                {filters.search && (
                  <Badge className="bg-[#083466] text-white rounded-2xl">
                    Search: {filters.search}
                  </Badge>
                )}
                {filters.hasToken && (
                  <Badge className="bg-[#083466] text-white rounded-2xl">Has Token</Badge>
                )}
                {filters.isVerified && (
                  <Badge className="bg-[#083466] text-white rounded-2xl">Verified</Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

interface PaperMetadataFromIPFS {
  name?: string;
  description?: string;
  properties?: {
    authors?: string[];
    keywords?: string[];
    doi?: string;
    title?: string;
    abstract?: string;
    pdfUrl?: string;
  };
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
}

// Modern Paper Card Component
const PaperCard = ({
  paper,
  metadata,
  isLoadingMeta,
  onNavigate,
}: {
  paper: ChainPaper;
  metadata?: PaperMetadataFromIPFS;
  isLoadingMeta: boolean;
  onNavigate: (path: string) => void;
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const priceChange = Math.random() * 20 - 10;
  const volume = Math.floor(Math.random() * 10000);
  const holders = Math.floor(Math.random() * 200);
  const impactScore = generateImpactScore(paper.id);
  const title = metadata?.name || metadata?.properties?.title || `Paper #${paper.id}`;
  const description = metadata?.description || metadata?.properties?.abstract || '';
  const authors = metadata?.properties?.authors || [];
  const pdfUrl =
    metadata?.properties?.pdfUrl ||
    (paper.metadataUri ? getPinataGatewayUrl(paper.metadataUri) : '');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100"
    >
      {/* Header Image */}
      <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-50">
        {paper.metadataUri && paper.metadataUri.startsWith('ipfs://') ? (
          <img
            src={pdfUrl || '/api/placeholder/400/200'}
            alt={title}
            className="w-full h-full object-cover opacity-50"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/api/placeholder/400/200';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className="w-12 h-12 text-gray-300" />
          </div>
        )}

        {/* Category badge and like button */}
        <div className="absolute top-2 left-2">
          <Badge className="bg-[#083466] text-white text-xs px-2 py-0.5">
            {paper.token ? 'Tokenized' : 'Pending'}
          </Badge>
        </div>

        <div className="absolute top-2 right-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsLiked(!isLiked);
            }}
            className="w-6 h-6 bg-white/80 backdrop-blur rounded-full flex items-center justify-center"
          >
            <Heart
              className={`w-3 h-3 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-500'}`}
            />
          </button>
        </div>

        {/* Title on image */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/60 to-transparent">
          <h3 className="text-white font-semibold text-sm line-clamp-2 leading-tight">{title}</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Author */}
        {authors.length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-xs font-bold text-gray-600">{authors[0]?.charAt(0) || 'A'}</span>
            </div>
            <span className="text-xs text-gray-600">{authors[0] || 'Unknown Author'}</span>
            <span className="text-xs text-gray-400 ml-auto">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        )}

        {/* Description */}
        {description && (
          <p className="text-xs text-gray-600 mb-3 line-clamp-2">{description}</p>
        )}

        {/* Price and Impact Row */}
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-xs text-gray-500">Status</p>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-gray-900">
                {paper.token ? 'Active' : 'Pending'}
              </span>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">Impact Score</p>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-medium ${
                  priceChange > 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {priceChange > 0 ? '+' : ''}
                {priceChange.toFixed(1)}%
              </span>
              <div
                className={`${getImpactScoreColor(impactScore)} rounded-lg px-2 py-0.5 text-xs font-bold`}
              >
                {impactScore}
              </div>
            </div>
          </div>
        </div>

        {/* Mini Stats */}
        <div className="flex justify-between text-xs text-gray-500 mb-3">
          <span>
            ${volume} <span className="text-gray-400">24h Volume</span>
          </span>
          <span>
            {holders} <span className="text-gray-400">Holders</span>
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {pdfUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                window.open(pdfUrl, '_blank');
              }}
              className="flex-1 border-gray-200 text-gray-700 rounded-lg h-8"
            >
              <FileText className="w-3 h-3 mr-1" />
              Read
            </Button>
          )}
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              if (paper.token) {
                onNavigate(`/token-trading/${paper.id}`);
              } else {
                onNavigate(`/token-creation/${paper.id}`);
              }
            }}
            className="flex-1 bg-[#083466] hover:bg-[#083466]/90 text-white rounded-lg h-8"
            disabled={!paper.token && !paper.id}
          >
            <ArrowUpRight className="w-3 h-3 mr-1" />
            {paper.token ? 'Trade' : 'Create Token'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// Main PaperList Component
const PaperList: React.FC = () => {
  const navigate = useNavigate();
  const { listPapers } = useArtica();
  const [papers, setPapers] = useState<ChainPaper[]>([]);
  const [papersFromPinata, setPapersFromPinata] = useState<Array<{
    ipfsHash: string;
    metadataUri: string;
    metadata?: PaperMetadataFromIPFS;
    isOnChain: boolean;
    chainPaper?: ChainPaper;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usePinataSource, setUsePinataSource] = useState(true); // Toggle between Pinata and blockchain
  const [metadataCache, setMetadataCache] = useState<Record<string, PaperMetadataFromIPFS>>({});
  const [loadingMetadata, setLoadingMetadata] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortOption, setSortOption] = useState('newest');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Typewriter effect for hero section
  const typewriterWords = ['Science', 'Physics', 'Space', 'AI', 'Biology', 'Chemistry', 'Innovation'];
  const typewriterText = useTypewriter(typewriterWords, 120, 80, 1500);

  const [filters, setFilters] = useState({
    search: '',
    category: 'ALL',
    hasToken: false,
    isVerified: false,
  });

  const fetchMetadata = useCallback(
    async (metadataUri: string, paperId: number) => {
      if (!metadataUri || metadataCache[metadataUri]) return;

      setLoadingMetadata((prev) => ({ ...prev, [paperId]: true }));

      try {
        // Get Pinata gateway URL
        const gatewayUrl = getPinataGatewayUrl(metadataUri);
        console.log(`Fetching metadata for paper ${paperId} from:`, gatewayUrl);

        const response = await fetch(gatewayUrl);
        if (!response.ok) {
          console.error(`Failed to fetch metadata: ${response.status} ${response.statusText}`);
          throw new Error(`Failed to fetch metadata: ${response.status}`);
        }

        const metadata: PaperMetadataFromIPFS = await response.json();
        console.log(`Metadata fetched for paper ${paperId}:`, metadata);
        setMetadataCache((prev) => ({ ...prev, [metadataUri]: metadata }));
      } catch (err) {
        console.error(`Failed to fetch metadata for paper ${paperId}:`, err);
        // Don't throw, just log the error - papers can still be displayed without metadata
      } finally {
        setLoadingMetadata((prev) => ({ ...prev, [paperId]: false }));
      }
    },
    [metadataCache]
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let blockchainPapers: ChainPaper[] = [];
        let pinnedFiles: Array<{
          ipfsHash: string;
          metadataUri: string;
          metadata?: PaperMetadataFromIPFS;
          isOnChain: boolean;
          chainPaper?: ChainPaper;
        }> = [];

        // Option 1: Load from Pinata directly (faster, shows all uploaded papers)
        if (usePinataSource) {
          console.log('Loading papers from Pinata...');
          const pins = await listPinnedFiles(100);
          
          // Filter for metadata JSON files (papers have metadata JSON)
          const metadataPins = pins.filter((pin) => {
            // Check if it's likely a metadata JSON (has name, or ends with .json in name)
            return pin.name?.endsWith('.json') || pin.name?.includes('metadata');
          });

          // Create a map of blockchain papers by metadataUri for quick lookup
          try {
            blockchainPapers = await listPapers();
          } catch (blockchainErr) {
            console.warn('Failed to load from blockchain, continuing with Pinata only:', blockchainErr);
          }

          const blockchainMap = new Map<string, ChainPaper>();
          blockchainPapers.forEach((paper) => {
            if (paper.metadataUri) {
              const normalizedUri = formatIPFSUri(paper.metadataUri);
              blockchainMap.set(normalizedUri, paper);
            }
          });

          // Combine Pinata pins with blockchain data
          pinnedFiles = metadataPins.map((pin) => {
            const normalizedUri = formatIPFSUri(pin.metadataUri);
            const chainPaper = blockchainMap.get(normalizedUri);
            
            return {
              ipfsHash: pin.ipfsHash,
              metadataUri: normalizedUri,
              isOnChain: !!chainPaper,
              chainPaper,
            };
          });

          // Fetch metadata for all Pinata papers
          for (const pinFile of pinnedFiles) {
            await fetchMetadata(pinFile.metadataUri, pinFile.chainPaper?.id || 0);
          }

          setPapersFromPinata(pinnedFiles);
          setPapers(blockchainPapers); // Keep for reference
        } else {
          // Option 2: Load from blockchain (original approach)
          console.log('Loading papers from blockchain...');
          blockchainPapers = await listPapers();
          setPapers(blockchainPapers);

          // Check if contract is configured
          if (blockchainPapers.length === 0) {
            const hasConfiguredContract = await checkContractConfiguration();
            if (!hasConfiguredContract) {
              setError(
                'Contract ID is not configured. Please update src/config/stellar.ts with your deployed contract IDs.'
              );
            }
          }

          // Fetch metadata for each paper
          blockchainPapers.forEach((paper) => {
            if (paper.metadataUri && paper.metadataUri.startsWith('ipfs://')) {
              void fetchMetadata(paper.metadataUri, paper.id);
            }
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load papers');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [listPapers, fetchMetadata, usePinataSource]);

  const checkContractConfiguration = async (): Promise<boolean> => {
    try {
      // Import config dynamically to check
      const { STELLAR_CONFIG } = await import('../../config/stellar');
      return (
        STELLAR_CONFIG.registryContractId &&
        !STELLAR_CONFIG.registryContractId.startsWith('<') &&
        !STELLAR_CONFIG.registryContractId.endsWith('>')
      );
    } catch {
      return false;
    }
  };

  // Filter data - use Pinata source if enabled, otherwise use blockchain
  const papersToFilter = usePinataSource
    ? papersFromPinata.map((pinFile) => {
        const metadata = metadataCache[pinFile.metadataUri];
        // Create a ChainPaper-like object for filtering
        return {
          id: pinFile.chainPaper?.id || 0,
          owner: pinFile.chainPaper?.owner || '',
          metadataUri: pinFile.metadataUri,
          doi: pinFile.chainPaper?.doi || null,
          token: pinFile.chainPaper?.token || null,
          status: pinFile.chainPaper?.status || 'pending',
          registeredAt: pinFile.chainPaper?.registeredAt || 0,
          isOnChain: pinFile.isOnChain,
          metadata,
        };
      })
    : papers;

  const filteredPapers = papersToFilter.filter((paper: any) => {
    const metadata = paper.metadata || metadataCache[paper.metadataUri];
    const title = metadata?.name || metadata?.properties?.title || `Paper ${paper.id || 'Unregistered'}`;
    const authors = metadata?.properties?.authors || [];

    const matchesSearch =
      !filters.search ||
      title.toLowerCase().includes(filters.search.toLowerCase()) ||
      authors.some((author: string) => author.toLowerCase().includes(filters.search.toLowerCase()));

    const matchesTokenFilter = !filters.hasToken || !!paper.token;

    return matchesSearch && matchesTokenFilter;
  });

  // Sort data
  const sortedPapers = [...filteredPapers].sort((a: any, b: any) => {
    if (sortOption === 'newest') {
      return (b.registeredAt || 0) - (a.registeredAt || 0);
    }
    if (sortOption === 'impact') {
      return generateImpactScore(b.id || b.ipfsHash || '') - generateImpactScore(a.id || a.ipfsHash || '');
    }
    if (sortOption === 'tokenized') {
      if (a.token && !b.token) return -1;
      if (!a.token && b.token) return 1;
      return 0;
    }
    return 0;
  });

  const clearFilters = () => {
    setFilters({
      search: '',
      category: 'ALL',
      hasToken: false,
      isVerified: false,
    });
  };

  if (loading && papers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#083466] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xl text-gray-600">Loading Research Marketplace...</p>
          <p className="text-sm text-gray-500 mt-2">Discovering groundbreaking research</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 -mx-4 sm:-mx-6 lg:-mx-8">
      {/* Enhanced Hero Section with Typewriter Effect */}
      <div className="bg-gradient-to-br from-[#083466] via-[#0a4080] to-[#0c4d99] text-white relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-br from-cyan-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse" />
        </div>

        <div className="w-full px-6 py-20 relative z-10">
          <div className="w-full text-center">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-6xl font-bold mb-6"
            >
              Invest in{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-cyan-200 min-h-[1.2em] inline-block">
                {typewriterText}
                <span className="animate-pulse">|</span>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto"
            >
              Explore tokenized research papers, invest in breakthrough discoveries, and trade
              academic insights on the world's first research marketplace.
            </motion.p>

            {/* Enhanced Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative max-w-2xl mx-auto"
            >
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
              <Input
                type="text"
                placeholder="Search for research papers, authors, or topics..."
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                className="pl-16 pr-6 py-6 text-lg bg-white/15 backdrop-blur-sm border-white/20 text-white placeholder-white/70 focus:bg-white/25 focus:border-white/40 rounded-3xl shadow-lg"
              />
            </motion.div>

            {/* Enhanced Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-4xl mx-auto"
            >
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20">
                <div className="text-4xl font-bold text-white mb-2">
                  {usePinataSource ? papersFromPinata.length : papers.length}
                </div>
                <div className="text-blue-200 text-sm font-medium">Research Papers</div>
              </div>
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20">
                <div className="text-4xl font-bold text-white mb-2">
                  {usePinataSource
                    ? papersFromPinata.filter((p) => p.chainPaper?.token).length
                    : papers.filter((p) => p.token).length}
                </div>
                <div className="text-blue-200 text-sm font-medium">Tokenized Papers</div>
              </div>
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20">
                <div className="text-4xl font-bold text-white mb-2">
                  {usePinataSource
                    ? papersFromPinata.filter((p) => p.isOnChain).length
                    : papers.length}
                </div>
                <div className="text-blue-200 text-sm font-medium">On-Chain Verified</div>
              </div>
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20">
                <div className="text-4xl font-bold text-white mb-2">1.2K</div>
                <div className="text-blue-200 text-sm font-medium">Active Traders</div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <FilterSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          filters={filters}
          setFilters={setFilters}
          onClearFilters={clearFilters}
        />

        {/* Main Content */}
        <div className="flex-1">
          {/* Top Bar */}
          <div className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
            <div className="w-full px-6 py-4">
              <div className="flex items-center justify-between">
                {/* View Switcher */}
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden rounded-2xl"
                  >
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </div>

                {/* Sort and View Options */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Source:</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUsePinataSource(!usePinataSource)}
                      className="text-xs rounded-2xl"
                    >
                      {usePinataSource ? '📦 Pinata' : '⛓️ Blockchain'}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Sort by:</span>
                    <select
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value)}
                      className="text-sm border border-gray-200 rounded-2xl px-3 py-1 focus:outline-none focus:border-[#083466]"
                    >
                      {SORT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center bg-gray-100 rounded-2xl p-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewMode('grid')}
                      className={`w-8 h-8 rounded-xl ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewMode('list')}
                      className={`w-8 h-8 rounded-xl ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="w-full px-6 py-8">
            {/* Results Count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                <span className="font-semibold text-gray-900">{sortedPapers.length}</span> results
                found
              </p>

              {(filters.search || filters.category !== 'ALL' || filters.hasToken) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="text-[#083466] border-[#083466]/20 hover:bg-[#083466]/10 rounded-2xl"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear filters
                </Button>
              )}
            </div>

            {/* Error */}
            {error && (
              <Alert className="mb-8 border-red-200 bg-red-50 rounded-2xl">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            {/* Grid */}
            <AnimatePresence mode="wait">
              <motion.div
                key={viewMode}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-6'
                    : 'space-y-4'
                }
              >
                {sortedPapers.map((paper: any, index: number) => {
                  // Handle both ChainPaper and Pinata paper formats
                  const paperId = paper.id || index;
                  const paperData: ChainPaper = paper.chainPaper || {
                    id: paperId,
                    owner: paper.owner || '',
                    metadataUri: paper.metadataUri,
                    doi: paper.doi || null,
                    token: paper.token || null,
                    status: paper.status || 'pending',
                    registeredAt: paper.registeredAt || 0,
                  };
                  
                  return (
                    <PaperCard
                      key={paper.metadataUri || paperId}
                      paper={paperData}
                      metadata={paper.metadata || metadataCache[paper.metadataUri]}
                      isLoadingMeta={!!loadingMetadata[paperId]}
                      onNavigate={(path) => navigate(path)}
                    />
                  );
                })}
              </motion.div>
            </AnimatePresence>

            {/* Empty State */}
            {sortedPapers.length === 0 && !loading && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No results found</h3>
                <p className="text-gray-500 mb-6">
                  Try adjusting your search or filter criteria
                </p>
                <Button
                  onClick={clearFilters}
                  className="bg-[#083466] hover:bg-[#083466]/90 text-white rounded-2xl"
                >
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaperList;
