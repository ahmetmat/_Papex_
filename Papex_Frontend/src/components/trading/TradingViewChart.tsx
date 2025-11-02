import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  UTCTimestamp,
  DeepPartial,
  ChartOptions,
  LineData,
  CrosshairMode,
  AreaSeries,
} from 'lightweight-charts';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { useArtica } from '../../context/ArticaContext';
import { formatDecimal } from '../../utils/stellarNumber';

interface TradingViewChartProps {
  tokenContractId: string;
  paperTitle: string;
  paperId?: number;
  isDarkMode?: boolean;
}

const formatEthPrice = (value: string | number, precision: number = 6) => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return `${numValue.toFixed(precision)} XLM`;
};

const TradingViewChart: React.FC<TradingViewChartProps> = ({
  tokenContractId,
  paperTitle,
  paperId,
  isDarkMode = false,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null); // Type stays the same for v5
  const resizeObserver = useRef<ResizeObserver | null>(null);
  const { getTokenSummary, loadTrades } = useArtica();

  const [isLoading, setIsLoading] = useState(false); // Start with false - show mock data immediately
  const [error, setError] = useState<string | null>(null);
  const [isPlaceholder, setIsPlaceholder] = useState(true); // Start with placeholder
  const [currentPrice, setCurrentPrice] = useState<number>(0.01);
  const [priceChange, setPriceChange] = useState({ value: 0, percentage: 0 });
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '3M'>('1D');
  const xlmToUsdRate = 0.1; // Placeholder rate

  const chartOptions: DeepPartial<ChartOptions> = useMemo(() => ({
    layout: {
      background: { color: 'transparent' },
      textColor: isDarkMode ? '#D1D5DB' : '#374151',
      fontSize: 12,
      fontFamily: '"Inter", sans-serif',
    },
    grid: {
      vertLines: { visible: false },
      horzLines: { color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)', style: 2 },
    },
    crosshair: { mode: CrosshairMode.Normal, vertLine: { style: 2 }, horzLine: { style: 2 } },
    rightPriceScale: { borderVisible: false },
    timeScale: { borderVisible: false, timeVisible: true },
    handleScroll: { mouseWheel: true, pressedMouseMove: true },
    handleScale: { pinch: true, axisPressedMouseMove: true },
  }), [isDarkMode]);
  
  const generatePlaceholderData = useCallback((basePrice = 0.01) => {
    const data: LineData[] = [];
    let value = basePrice;
    const now = Math.floor(Date.now() / 1000);
    const timeUnits = { '1D': 24*4, '1W': 168, '1M': 720, '3M': 2160 }[timeframe];
    const intervalInSeconds = { '1D': 900, '1W': 3600, '1M': 3600, '3M': 3600 }[timeframe];

    for (let i = 0; i < timeUnits; i++) {
        const time = (now - (timeUnits - i) * intervalInSeconds) as UTCTimestamp;
        value *= (1 + (Math.random() - 0.495) * 0.01);
        data.push({ time, value });
    }
    // Ensure data is sorted by time (ascending) for lightweight-charts v5
    return data.sort((a, b) => a.time - b.time);
  }, [timeframe]);

  const fetchTradeData = useCallback(async (showLoading = false) => {
    if (!tokenContractId) {
      setIsPlaceholder(true);
      return generatePlaceholderData();
    }
    
    if (showLoading) {
      setIsLoading(true);
    }
    
    try {
      const [summary, trades] = await Promise.all([
        getTokenSummary(tokenContractId).catch(() => null),
        paperId ? loadTrades(paperId).catch(() => []) : Promise.resolve([]),
      ]);
      
      if (summary) {
        const price = parseFloat(summary.basePrice || '0.01');
        setCurrentPrice(price);
      }
      
      if (!trades || trades.length === 0) {
        setIsPlaceholder(true);
        setPriceChange({ value: 0, percentage: 0 });
        setIsLoading(false);
        return generatePlaceholderData(currentPrice || 0.01);
      }

      setIsPlaceholder(false);
      let formattedData = trades
        .filter(trade => trade.amount && parseFloat(trade.amount) > 0)
        .map(trade => ({
            time: (trade.timestamp * 1000) as UTCTimestamp, // Convert to milliseconds
            value: parseFloat(trade.cost) / parseFloat(trade.amount), // Price per token
        }))
        .sort((a, b) => a.time - b.time) // Ensure ascending order by time
        .filter((item, index, arr) => {
          // Remove duplicate timestamps (keep first occurrence)
          return index === 0 || arr[index - 1].time !== item.time;
        });
      
      if (formattedData.length === 1) {
          const singlePoint = formattedData[0];
          formattedData = [
              { ...singlePoint, time: (singlePoint.time - 3600 * 1000) as UTCTimestamp },
              singlePoint
          ];
          setPriceChange({ value: 0, percentage: 0 });
      } else if (formattedData.length > 1) {
          const firstPrice = formattedData[0].value;
          const lastPrice = formattedData[formattedData.length - 1].value;
          const changeValue = lastPrice - firstPrice;
          const changePercentage = firstPrice > 0 ? (changeValue / firstPrice) * 100 : 0;
          setPriceChange({ value: changeValue, percentage: changePercentage });
      }
      
      setIsLoading(false);
      return formattedData;
    } catch (err) {
      console.error("Failed to fetch trade data:", err);
      setError("Failed to load token financial data.");
      setIsPlaceholder(true);
      setIsLoading(false);
      return generatePlaceholderData();
    }
  }, [tokenContractId, paperId, generatePlaceholderData, getTokenSummary, loadTrades, currentPrice]);

  // Initialize chart with mock data first (only once on mount)
  useEffect(() => {
    if (!chartContainerRef.current) return;
    if (chartRef.current) return; // Chart already exists, don't recreate
    
    console.log('📊 Initializing chart with mock data...');
    
    // Show mock data immediately
    const mockData = generatePlaceholderData(0.01);
    
    const chart = createChart(chartContainerRef.current, {
      ...chartOptions,
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });
    chartRef.current = chart;
    
    // Use new v5 API: addSeries with AreaSeries class
    const series = chart.addSeries(AreaSeries, {
      lineColor: isDarkMode ? '#34D399' : '#10B981',
      topColor: isDarkMode ? 'rgba(52, 211, 153, 0.4)' : 'rgba(16, 185, 129, 0.4)',
      bottomColor: isDarkMode ? 'rgba(52, 211, 153, 0.01)' : 'rgba(16, 185, 129, 0.01)',
      lineWidth: 2.5,
      priceFormat: { type: 'price', precision: 8, minMove: 0.00000001 },
    });
    seriesRef.current = series;
    series.setData(mockData);

    chart.applyOptions({
      watermark: {
        color: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
        visible: true,
        text: paperTitle.toUpperCase(),
        fontSize: 48,
        horzAlign: 'center',
        vertAlign: 'center',
      },
    });

    chart.timeScale().fitContent();
    console.log('✅ Chart initialized with mock data');

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  }, []); // Only run once on mount

  // Fetch and update chart data when contract/trades are available
  useEffect(() => {
    if (!chartRef.current || !seriesRef.current) {
      // Chart not ready yet, wait
      return;
    }
    
    if (!tokenContractId || !paperId) {
      // No contract/paperId yet, keep showing mock data
      console.log('⏳ Waiting for contract/paperId...');
      return;
    }
    
    let cancelled = false;
    
    const updateChartData = async () => {
      if (cancelled) return;
      
      try {
        console.log('🔄 Fetching trade data for chart update...');
        const data = await fetchTradeData(false);
        if (!cancelled && data && seriesRef.current) {
          console.log(`✅ Updating chart with ${data.length} data points`);
          seriesRef.current.setData(data);
          chartRef.current?.timeScale().fitContent();
          setIsPlaceholder(false);
        } else if (!cancelled && data && data.length === 0) {
          console.log('⚠️ No trade data available, keeping mock data');
        }
      } catch (err) {
        console.error('❌ Failed to update chart data:', err);
        // Keep showing existing data (mock or previous)
      }
    };
    
    // Initial load - try to get real data
    updateChartData();
    
    // Refresh every 15 seconds to catch new trades (less frequent to avoid overload)
    const intervalId = setInterval(() => {
      if (!cancelled) {
        updateChartData();
      }
    }, 15000);
    
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [tokenContractId, paperId, fetchTradeData]); // Update when contract/paperId changes

  useEffect(() => {
    if (!chartContainerRef.current) return;
    const observer = new ResizeObserver(entries => {
      if (entries[0] && chartRef.current) {
        const { width, height } = entries[0].contentRect;
        chartRef.current.applyOptions({ width, height });
      }
    });
    observer.observe(chartContainerRef.current);
    resizeObserver.current = observer;
    return () => {
      if (resizeObserver.current) resizeObserver.current.disconnect();
    };
  }, []);

  return (
    <div className={`w-full h-[500px] rounded-2xl p-4 flex flex-col ${isDarkMode ? 'bg-gray-800/50 text-gray-200' : 'bg-white/50 text-gray-800'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200/80'} shadow-lg backdrop-blur-xl`}>
        <div className="flex justify-between items-start mb-4">
            <div>
                <h2 className="text-xl font-bold">{paperTitle.toUpperCase()}</h2>
                <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-semibold">{formatEthPrice(currentPrice, 8)}</span>
                    <span className={`text-sm font-medium flex items-center ${priceChange.value >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {priceChange.value !== 0 && (priceChange.value > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />)}
                        <span className="ml-1">{priceChange.value.toFixed(8)} XLM ({priceChange.percentage.toFixed(2)}%)</span>
                    </span>
                </div>
                <p className="text-sm text-gray-400 mt-1">≈ ${(currentPrice * xlmToUsdRate).toFixed(2)} USD</p>
            </div>
            <div className="flex items-center gap-1 bg-gray-200/50 dark:bg-gray-900/50 p-1 rounded-lg">
                {(['1D', '1W', '1M', '3M'] as const).map(tf => (
                    <button 
                      key={tf} 
                      onClick={() => {
                        setTimeframe(tf);
                        // Regenerate mock data for new timeframe
                        if (seriesRef.current) {
                          const newMockData = generatePlaceholderData(currentPrice || 0.01);
                          seriesRef.current.setData(newMockData);
                          chartRef.current?.timeScale().fitContent();
                        }
                      }} 
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${timeframe === tf ? 'bg-white dark:bg-gray-700 shadow' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
                    >
                        {tf}
                    </button>
                ))}
            </div>
        </div>
        
        <div className="flex-1 w-full h-full relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
            <div ref={chartContainerRef} className={`w-full h-full transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`} />
            {isPlaceholder && !isLoading && (
              <div className="absolute top-2 right-2 z-10 px-3 py-1 bg-blue-100/80 dark:bg-blue-900/80 border border-blue-300 dark:border-blue-700 rounded-md text-blue-800 dark:text-blue-200 text-xs font-medium backdrop-blur-sm">
                Simulated Price Data
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center z-10 text-center p-4">
                <div className="p-4 bg-red-100/80 dark:bg-red-900/80 border border-red-300 dark:border-red-700 rounded-lg text-red-800 dark:text-red-200 backdrop-blur-sm">
                  <h3 className="font-medium">Chart Error</h3>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}
        </div>
    </div>
  );
};

export default TradingViewChart;

