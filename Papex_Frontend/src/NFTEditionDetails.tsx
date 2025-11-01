import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from './lib/router';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.tsx';
import { Button } from './ui/button.tsx';
import { Badge } from './ui/badge.tsx';
import { Progress } from './ui/progress.tsx';
import { Alert, AlertDescription } from './ui/alert.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs.tsx';
import {
    ArrowLeft, Crown, Users, Activity, DollarSign, TrendingUp, Package, Loader2, ExternalLink,
    Eye, Calendar, Star, Award, BookOpen, Link2, Globe, Twitter, Github, Linkedin, Mail,
    Copy, BarChart3, TrendingDown, Sparkles, History, User, UserCheck, Quote, Archive,
    Layers, Filter, Search, SortAsc, SortDesc, ChevronDown, ChevronUp, Info, FileText,
    Flame, Shield, Target, Zap, Clock, Tag, RefreshCw, Heart, MessageCircle, Share2,
    Download, Bookmark, Bell, Settings, CheckCircle, XCircle, AlertTriangle, PieChart,
    LineChart, BarChart, Wallet, CreditCard, Banknote, Coins,
    Calculator, Database, Network, Server, Code, Terminal, Cpu, HardDrive, Wifi, ShoppingCart,
    Play, Pause, Volume2, VolumeX, Maximize, MoreHorizontal, Grid3X3, List, Plus, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ethers } from "ethers";

// Mock contract configurations
const MARKETPLACE_ADDRESS = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";
const PAPEX_EDITIONS_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";

// Enhanced Stats Card Component
const StatsCard = ({ title, value, subtitle, icon: Icon, trend, color = "blue" }) => {
    const colorClasses = {
        blue: "from-blue-500 to-blue-600",
        green: "from-green-500 to-green-600", 
        purple: "from-purple-500 to-purple-600",
        orange: "from-orange-500 to-orange-600",
        indigo: "from-indigo-500 to-indigo-600"
    };

    return (
        <Card className="relative overflow-hidden bg-white border-gray-100 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-1">{title}</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
                            {trend && (
                                <span className={`text-sm font-medium flex items-center gap-1 ${
                                    trend > 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    {Math.abs(trend).toFixed(1)}%
                                </span>
                            )}
                        </div>
                        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
                    </div>
                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${colorClasses[color]} shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

// Modern Listing Card Component
const ListingCard = ({ listing, onBuy }) => {
    const [timeLeft, setTimeLeft] = useState('');
    
    useEffect(() => {
        const updateTimeLeft = () => {
            if (listing.expirationTime === 0) {
                setTimeLeft('No expiration');
                return;
            }
            
            const now = Math.floor(Date.now() / 1000);
            const diff = listing.expirationTime - now;
            
            if (diff <= 0) {
                setTimeLeft('Expired');
                return;
            }
            
            const days = Math.floor(diff / 86400);
            const hours = Math.floor((diff % 86400) / 3600);
            const minutes = Math.floor((diff % 3600) / 60);
            
            if (days > 0) setTimeLeft(`${days}d ${hours}h`);
            else if (hours > 0) setTimeLeft(`${hours}h ${minutes}m`);
            else setTimeLeft(`${minutes}m`);
        };
        
        updateTimeLeft();
        const interval = setInterval(updateTimeLeft, 60000);
        return () => clearInterval(interval);
    }, [listing.expirationTime]);

    return (
        <Card className="group hover:shadow-xl transition-all duration-300 border-gray-100 hover:border-[#083466]/20">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#083466] to-[#083466]/70 flex items-center justify-center text-white font-bold">
                            {listing.seller.slice(2, 4).toUpperCase()}
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">
                                {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
                            </p>
                            <p className="text-sm text-gray-500">Seller</p>
                        </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                        Available
                    </Badge>
                </div>
                
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Price per item</span>
                        <div className="text-right">
                            <div className="font-bold text-lg text-gray-900">
                                {parseFloat(ethers.formatEther(listing.pricePerItem)).toFixed(4)} ETH
                            </div>
                            <div className="text-sm text-gray-500">
                                ≈ ${(parseFloat(ethers.formatEther(listing.pricePerItem)) * 2400).toFixed(2)}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Quantity</span>
                        <span className="font-semibold text-gray-900">{Number(listing.amount)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Expires</span>
                        <span className={`text-sm font-medium ${
                            timeLeft === 'Expired' ? 'text-red-600' : 'text-gray-900'
                        }`}>
                            {timeLeft}
                        </span>
                    </div>
                </div>
                
                <Button 
                    onClick={() => onBuy(listing.listingId, 1, listing.pricePerItem)}
                    className="w-full mt-4 bg-[#083466] hover:bg-[#083466]/90 text-white group-hover:shadow-lg transition-all duration-300"
                    disabled={timeLeft === 'Expired'}
                >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {timeLeft === 'Expired' ? 'Expired' : 'Buy Now'}
                </Button>
            </CardContent>
        </Card>
    );
};

// Price History Chart Component
const PriceChart = ({ data }) => {
    const [timeframe, setTimeframe] = useState('7d');
    
    if (!data || data.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                    <LineChart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No price history available</p>
                </div>
            </div>
        );
    }
    
    const maxPrice = Math.max(...data.map(p => p.price));
    const minPrice = Math.min(...data.map(p => p.price));
    
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Price History</h3>
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                    {['24h', '7d', '30d', 'All'].map((period) => (
                        <button
                            key={period}
                            onClick={() => setTimeframe(period)}
                            className={`px-3 py-1 text-sm rounded-md transition-all ${
                                timeframe === period 
                                    ? 'bg-[#083466] text-white shadow-sm' 
                                    : 'text-gray-600 hover:text-[#083466]'
                            }`}
                        >
                            {period}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="h-64 relative">
                <svg className="w-full h-full">
                    <defs>
                        <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#083466" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#083466" stopOpacity="0.05" />
                        </linearGradient>
                    </defs>
                    
                    {/* Grid lines */}
                    {[0, 25, 50, 75, 100].map((y) => (
                        <line
                            key={y}
                            x1="0"
                            y1={`${y}%`}
                            x2="100%"
                            y2={`${y}%`}
                            stroke="#f3f4f6"
                            strokeWidth="1"
                        />
                    ))}
                    
                    {/* Price line */}
                    <polyline
                        fill="none"
                        stroke="#083466"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={data.map((point, index) => {
                            const x = (index / (data.length - 1)) * 100;
                            const y = 100 - ((point.price - minPrice) / (maxPrice - minPrice)) * 100;
                            return `${x},${y}`;
                        }).join(' ')}
                    />
                    
                    {/* Fill area */}
                    <polygon
                        fill="url(#priceGradient)"
                        points={`
                            ${data.map((point, index) => {
                                const x = (index / (data.length - 1)) * 100;
                                const y = 100 - ((point.price - minPrice) / (maxPrice - minPrice)) * 100;
                                return `${x},${y}`;
                            }).join(' ')}
                            100,100 0,100
                        `}
                    />
                </svg>
                
                {/* Price labels */}
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 -ml-12">
                    <span>{maxPrice.toFixed(4)}</span>
                    <span>{((maxPrice + minPrice) / 2).toFixed(4)}</span>
                    <span>{minPrice.toFixed(4)}</span>
                </div>
            </div>
        </div>
    );
};

// Activity Feed Component
const ActivityFeed = ({ activities }) => {
    const getActivityIcon = (type) => {
        switch (type) {
            case 'sale': return <ShoppingCart className="w-4 h-4 text-green-600" />;
            case 'listing': return <Tag className="w-4 h-4 text-blue-600" />;
            case 'offer': return <DollarSign className="w-4 h-4 text-purple-600" />;
            case 'transfer': return <ArrowRight className="w-4 h-4 text-gray-600" />;
            default: return <Activity className="w-4 h-4 text-gray-600" />;
        }
    };
    
    const getActivityColor = (type) => {
        switch (type) {
            case 'sale': return 'bg-green-100';
            case 'listing': return 'bg-blue-100';
            case 'offer': return 'bg-purple-100';
            case 'transfer': return 'bg-gray-100';
            default: return 'bg-gray-100';
        }
    };

    if (!activities || activities.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No recent activity</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {activities.map((activity, index) => (
                <div key={index} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                        {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900 capitalize">{activity.type}</p>
                                <p className="text-sm text-gray-600">
                                    by {activity.user?.slice(0, 6)}...{activity.user?.slice(-4)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-gray-900">
                                    {activity.price} ETH
                                </p>
                                <p className="text-sm text-gray-500">
                                    {new Date(activity.timestamp * 1000).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// Main NFT Collection Details Component
const NFTEditionDetails = () => {
    const { editionId } = useParams();
    const navigate = useNavigate();

    // State management
    const [edition, setEdition] = useState(null);
    const [metadata, setMetadata] = useState(null);
    const [listings, setListings] = useState([]);
    const [priceHistory, setPriceHistory] = useState([]);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [isLiked, setIsLiked] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [userBalance, setUserBalance] = useState(0);
    const [currentAccount, setCurrentAccount] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    // Mock data for demonstration
    useEffect(() => {
        const loadMockData = async () => {
            setLoading(true);
            
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Mock edition data
            setEdition({
                creator: "0x1234567890123456789012345678901234567890",
                maxSupply: 1000,
                priceInWei: ethers.parseEther("0.1"),
                metadataURI: "ipfs://QmExample",
                isDynamic: false,
                totalMinted: 750
            });
            
            // Mock metadata
            setMetadata({
                name: `Research NFT Collection #${editionId}`,
                description: "A groundbreaking research paper tokenized as an NFT collection. This collection represents ownership and access rights to premium research content in the field of artificial intelligence and machine learning.",
                image: "/api/placeholder/600/600",
                attributes: [
                    { trait_type: "Research Field", value: "Artificial Intelligence" },
                    { trait_type: "Publication Year", value: "2024" },
                    { trait_type: "Impact Factor", value: "High" },
                    { trait_type: "Access Level", value: "Premium" },
                    { trait_type: "Peer Reviewed", value: "Yes" }
                ]
            });
            
            // Mock listings
            setListings([
                {
                    listingId: 1,
                    seller: "0xABCD1234567890123456789012345678901234ABCD",
                    pricePerItem: ethers.parseEther("0.15"),
                    amount: 5,
                    expirationTime: Math.floor(Date.now() / 1000) + 86400 * 7,
                    isActive: true
                },
                {
                    listingId: 2,
                    seller: "0xEFGH1234567890123456789012345678901234EFGH",
                    pricePerItem: ethers.parseEther("0.12"),
                    amount: 3,
                    expirationTime: Math.floor(Date.now() / 1000) + 86400 * 3,
                    isActive: true
                }
            ]);
            
            // Mock price history
            const mockPriceHistory = Array.from({ length: 30 }, (_, i) => ({
                date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
                price: 0.1 + (Math.random() - 0.5) * 0.02,
                volume: Math.floor(Math.random() * 50) + 10
            }));
            setPriceHistory(mockPriceHistory);
            
            // Mock activities
            setActivities([
                {
                    type: 'sale',
                    user: '0x1234567890123456789012345678901234567890',
                    price: '0.145',
                    timestamp: Math.floor(Date.now() / 1000) - 3600
                },
                {
                    type: 'listing',
                    user: '0xABCD1234567890123456789012345678901234ABCD',
                    price: '0.150',
                    timestamp: Math.floor(Date.now() / 1000) - 7200
                },
                {
                    type: 'offer',
                    user: '0xEFGH1234567890123456789012345678901234EFGH',
                    price: '0.140',
                    timestamp: Math.floor(Date.now() / 1000) - 10800
                }
            ]);
            
            setLoading(false);
        };
        
        loadMockData();
    }, [editionId]);

    // Calculate derived analytics
    const analytics = useMemo(() => {
        if (!edition || !priceHistory.length) return null;

        const mintedPercentage = (edition.totalMinted / edition.maxSupply) * 100;
        const floorPrice = listings.length > 0 
            ? Math.min(...listings.map(l => parseFloat(ethers.formatEther(l.pricePerItem))))
            : 0;
        
        const volume24h = priceHistory.slice(-1)[0]?.volume || 0;
        const volumeTotal = priceHistory.reduce((sum, item) => sum + item.volume, 0);
        
        return {
            mintedPercentage,
            floorPrice,
            volume24h,
            volumeTotal,
            averagePrice: priceHistory.reduce((sum, item) => sum + item.price, 0) / priceHistory.length,
            uniqueOwners: Math.floor(edition.totalMinted * 0.7), // Mock calculation
            totalValue: floorPrice * edition.totalMinted
        };
    }, [edition, listings, priceHistory]);

    const handleBuy = async (listingId, amount, pricePerItem) => {
        try {
            console.log('Purchasing:', { listingId, amount, pricePerItem });
            // Mock purchase logic
            alert('Purchase functionality would be implemented here');
        } catch (err) {
            console.error('Purchase error:', err);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        // Simulate refresh
        setTimeout(() => setRefreshing(false), 1000);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[#083466] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-xl text-gray-600">Loading NFT Collection...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Alert className="max-w-md">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        Error loading collection: {error}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-br from-[#083466] via-[#0a4080] to-[#0c4d99] text-white">
                <div className="container mx-auto px-6 py-8">
                    <div className="flex items-center gap-4 mb-6">
                        <Button
                            variant="ghost"
                            onClick={() => navigate(-1)}
                            className="text-white hover:bg-white/10 p-2"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold">
                                    {metadata?.name || `Collection #${editionId}`}
                                </h1>
                                <Badge className="bg-white/20 text-white border-white/30">
                                    Edition #{editionId}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-blue-100">
                                <span>by {edition?.creator.slice(0, 6)}...{edition?.creator.slice(-4)}</span>
                                <span>•</span>
                                <span>{edition?.totalMinted} / {edition?.maxSupply} minted</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsLiked(!isLiked)}
                                className="text-white hover:bg-white/10"
                            >
                                <Heart className={`w-5 h-5 ${isLiked ? 'fill-white' : ''}`} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsBookmarked(!isBookmarked)}
                                className="text-white hover:bg-white/10"
                            >
                                <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-white' : ''}`} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-white hover:bg-white/10"
                            >
                                <Share2 className="w-5 h-5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleRefresh}
                                className="text-white hover:bg-white/10"
                            >
                                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-white">
                                {analytics?.floorPrice.toFixed(4) || '0.0000'}
                            </div>
                            <div className="text-blue-200 text-sm">Floor Price (ETH)</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-white">
                                {analytics?.volumeTotal.toFixed(0) || '0'}
                            </div>
                            <div className="text-blue-200 text-sm">Total Volume</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-white">
                                {analytics?.uniqueOwners || '0'}
                            </div>
                            <div className="text-blue-200 text-sm">Owners</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-white">
                                {analytics?.mintedPercentage.toFixed(1) || '0'}%
                            </div>
                            <div className="text-blue-200 text-sm">Minted</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* NFT Preview */}
                        <Card className="overflow-hidden">
                            <CardContent className="p-0">
                                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                    {metadata?.image ? (
                                        <img
                                            src={metadata.image}
                                            alt={metadata.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="text-center">
                                            <Package className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                                            <p className="text-gray-500">Collection #{editionId}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tabs */}
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="grid w-full grid-cols-4 bg-white border border-gray-200">
                                <TabsTrigger value="overview" className="data-[state=active]:bg-[#083466] data-[state=active]:text-white">
                                    Overview
                                </TabsTrigger>
                                <TabsTrigger value="listings" className="data-[state=active]:bg-[#083466] data-[state=active]:text-white">
                                    Listings ({listings.length})
                                </TabsTrigger>
                                <TabsTrigger value="activity" className="data-[state=active]:bg-[#083466] data-[state=active]:text-white">
                                    Activity
                                </TabsTrigger>
                                <TabsTrigger value="analytics" className="data-[state=active]:bg-[#083466] data-[state=active]:text-white">
                                    Analytics
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="overview" className="space-y-6">
                                {/* Description */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-[#083466]" />
                                            Description
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-gray-700 leading-relaxed">
                                            {metadata?.description || 'No description available.'}
                                        </p>
                                    </CardContent>
                                </Card>

                                {/* Attributes */}
                                {metadata?.attributes && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Tag className="w-5 h-5 text-[#083466]" />
                                                Properties
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {metadata.attributes.map((attr, index) => (
                                                    <div key={index} className="p-4 bg-gray-50 rounded-xl text-center">
                                                        <div className="text-sm text-gray-600 mb-1">
                                                            {attr.trait_type}
                                                        </div>
                                                        <div className="font-semibold text-gray-900">
                                                            {attr.value}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Collection Stats */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <BarChart3 className="w-5 h-5 text-[#083466]" />
                                                Collection Stats
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Total Supply</span>
                                                <span className="font-semibold">{edition?.maxSupply}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Total Minted</span>
                                                <span className="font-semibold">{edition?.totalMinted}</span>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span>Minting Progress</span>
                                                    <span>{analytics?.mintedPercentage.toFixed(1)}%</span>
                                                </div>
                                                <Progress value={analytics?.mintedPercentage || 0} className="h-2" />
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Unique Owners</span>
                                                <span className="font-semibold">{analytics?.uniqueOwners}</span>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <DollarSign className="w-5 h-5 text-[#083466]" />
                                                Price Info
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Floor Price</span>
                                                <span className="font-semibold">
                                                    {analytics?.floorPrice.toFixed(4)} ETH
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Average Price</span>
                                                <span className="font-semibold">
                                                    {analytics?.averagePrice.toFixed(4)} ETH
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Total Value</span>
                                                <span className="font-semibold">
                                                    {analytics?.totalValue.toFixed(2)} ETH
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">24h Volume</span>
                                                <span className="font-semibold">
                                                    {analytics?.volume24h} items
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            <TabsContent value="listings" className="space-y-6">
                                {listings.length > 0 ? (
                                    <div className="grid md:grid-cols-2 gap-6">
                                        {listings.map((listing) => (
                                            <ListingCard
                                                key={listing.listingId}
                                                listing={listing}
                                                onBuy={handleBuy}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <Card>
                                        <CardContent className="p-12 text-center">
                                            <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                                No active listings
                                            </h3>
                                            <p className="text-gray-500">
                                                There are currently no items listed for sale in this collection.
                                            </p>
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>

                            <TabsContent value="activity" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Activity className="w-5 h-5 text-[#083466]" />
                                            Recent Activity
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ActivityFeed activities={activities} />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="analytics" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <LineChart className="w-5 h-5 text-[#083466]" />
                                            Price Analytics
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <PriceChart data={priceHistory} />
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Buy */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ShoppingCart className="w-5 h-5 text-[#083466]" />
                                    Quick Buy
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {listings.length > 0 ? (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-gray-50 rounded-xl">
                                            <div className="text-sm text-gray-600 mb-1">Best Price</div>
                                            <div className="text-2xl font-bold text-gray-900">
                                                {analytics?.floorPrice.toFixed(4)} ETH
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                ≈ ${(analytics?.floorPrice * 2400).toFixed(2)} USD
                                            </div>
                                        </div>
                                        <Button 
                                            className="w-full bg-[#083466] hover:bg-[#083466]/90 text-white"
                                            onClick={() => handleBuy(listings[0].listingId, 1, listings[0].pricePerItem)}
                                        >
                                            <ShoppingCart className="w-4 h-4 mr-2" />
                                            Buy Now
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <ShoppingCart className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                        <p className="text-gray-500">No items for sale</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Collection Stats */}
                        <div className="grid gap-4">
                            <StatsCard
                                title="Floor Price"
                                value={`${analytics?.floorPrice.toFixed(4) || '0.0000'} ETH`}
                                subtitle="Last 24h"
                                icon={DollarSign}
                                trend={5.2}
                                color="green"
                            />
                            <StatsCard
                                title="Volume"
                                value={analytics?.volumeTotal.toFixed(0) || '0'}
                                subtitle="All time"
                                icon={BarChart3}
                                color="blue"
                            />
                            <StatsCard
                                title="Owners"
                                value={analytics?.uniqueOwners || '0'}
                                subtitle={`${((analytics?.uniqueOwners / edition?.totalMinted) * 100).toFixed(1)}% unique`}
                                icon={Users}
                                color="purple"
                            />
                            <StatsCard
                                title="Minted"
                                value={`${edition?.totalMinted}/${edition?.maxSupply}`}
                                subtitle={`${analytics?.mintedPercentage.toFixed(1)}% complete`}
                                icon={Package}
                                color="orange"
                            />
                        </div>

                        {/* Creator Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="w-5 h-5 text-[#083466]" />
                                    Creator
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-[#083466] to-[#083466]/70 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                        {edition?.creator?.slice(2, 4).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-900">
                                            {edition?.creator?.slice(0, 6)}...{edition?.creator?.slice(-4)}
                                        </div>
                                        <div className="text-sm text-gray-500">Collection Creator</div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => window.open(`https://etherscan.io/address/${edition?.creator}`, '_blank')}
                                    >
                                        <ExternalLink className="w-4 h-4 mr-1" />
                                        View
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => navigator.clipboard.writeText(edition?.creator || '')}
                                    >
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Contract Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Code className="w-5 h-5 text-[#083466]" />
                                    Contract Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Contract Address</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-mono">
                                            {PAPEX_EDITIONS_ADDRESS.slice(0, 6)}...{PAPEX_EDITIONS_ADDRESS.slice(-4)}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => navigator.clipboard.writeText(PAPEX_EDITIONS_ADDRESS)}
                                        >
                                            <Copy className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Token Standard</span>
                                    <span className="text-sm font-medium">ERC-1155</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Blockchain</span>
                                    <span className="text-sm font-medium">Ethereum</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Metadata</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => window.open(edition?.metadataURI?.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/'), '_blank')}
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NFTEditionDetails;
