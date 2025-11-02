import React, { useEffect, useRef } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
  Scatter,
  Bar
} from 'recharts';
import { format, subMonths } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card.tsx';
import { Badge } from '../ui/badge.tsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs.tsx';
import { Book, TrendingUp, Award, Download, Bookmark, MessageCircle } from 'lucide-react';

interface ImpactTimeSeriesProps {
  paperData: any;
  tokenData: any;
  metrics: any;
}

const ImpactTimeSeries: React.FC<ImpactTimeSeriesProps> = ({ 
  paperData, 
  tokenData,
  metrics 
}) => {
  const [activeChart, setActiveChart] = React.useState<'correlation' | 'citations' | 'price'>('correlation');
  const [timeScale, setTimeScale] = React.useState<'1m' | '6m' | '1y' | 'all'>('6m');
  
  // Generate time series data
  const generateTimeSeriesData = () => {
    const now = new Date();
    const data = [];
    
    // Determine number of data points based on timeScale
    let numberOfPoints = 30;
    let timeIncrement = 1;
    
    switch (timeScale) {
      case '1m':
        numberOfPoints = 30;
        timeIncrement = 1;
        break;
      case '6m':
        numberOfPoints = 24;
        timeIncrement = 7;
        break;
      case '1y':
        numberOfPoints = 12;
        timeIncrement = 30;
        break;
      case 'all':
        numberOfPoints = 24;
        timeIncrement = 60;
        break;
    }
    
    // Start from the past and move forward
    let currentDate = subMonths(now, (numberOfPoints * timeIncrement) / 30);
    
    // Generate a base price and citation count
    const basePrice = 0.01;
    const baseCitations = metrics?.citations || 10;
    
    // Create price and citation patterns with randomization
    for (let i = 0; i < numberOfPoints; i++) {
      // Move date forward
      currentDate = new Date(currentDate.getTime() + timeIncrement * 24 * 60 * 60 * 1000);
      
      // Calculate price, adding some randomness but with an overall upward trend
      // Use a sigmoid function to model S-curve growth that often happens with academic papers
      const timeFactor = i / numberOfPoints; // normalized time from 0 to 1
      const sigmoid = 1 / (1 + Math.exp(-10 * (timeFactor - 0.5)));
      
      // Calculate price with randomness
      const randomFactor = 0.8 + Math.random() * 0.4; // random between 0.8 and 1.2
      const price = basePrice * (1 + sigmoid * 5) * randomFactor;
      
      // Calculate citations with a similar pattern but different randomness
      const citationRandomFactor = 0.9 + Math.random() * 0.2;
      const citationSigmoid = 1 / (1 + Math.exp(-8 * (timeFactor - 0.4)));
      const citations = Math.floor(baseCitations * citationSigmoid * citationRandomFactor);
      
      // Add social metrics
      const mentions = Math.floor(citations * (0.5 + Math.random()));
      const readers = Math.floor(citations * (2 + Math.random() * 2));
      const downloads = Math.floor(readers * (0.3 + Math.random() * 0.4));
      
      // Add point to dataset
      data.push({
        date: format(currentDate, 'yyyy-MM-dd'),
        dateObj: currentDate,
        price: parseFloat(price.toFixed(6)),
        citations: citations,
        cumulativeCitations: citations,
        mentions: mentions,
        readers: readers,
        downloads: downloads
      });
    }
    
    // Calculate cumulative citations
    let cumulativeCount = 0;
    data.forEach(point => {
      cumulativeCount += point.citations;
      point.cumulativeCitations = cumulativeCount;
    });
    
    return data;
  };
  
  const timeSeriesData = generateTimeSeriesData();
  
  // Calculate correlation coefficient
  const calculateCorrelation = () => {
    // Extract arrays of prices and citations
    const prices = timeSeriesData.map(d => d.price);
    const citations = timeSeriesData.map(d => d.cumulativeCitations);
    
    // Calculate means
    const priceMean = prices.reduce((sum, val) => sum + val, 0) / prices.length;
    const citationMean = citations.reduce((sum, val) => sum + val, 0) / citations.length;
    
    // Calculate covariance and standard deviations
    let numerator = 0;
    let priceStdDev = 0;
    let citationStdDev = 0;
    
    for (let i = 0; i < prices.length; i++) {
      const priceDiff = prices[i] - priceMean;
      const citationDiff = citations[i] - citationMean;
      
      numerator += priceDiff * citationDiff;
      priceStdDev += priceDiff * priceDiff;
      citationStdDev += citationDiff * citationDiff;
    }
    
    priceStdDev = Math.sqrt(priceStdDev / prices.length);
    citationStdDev = Math.sqrt(citationStdDev / citations.length);
    
    // Calculate correlation coefficient
    const correlation = numerator / (prices.length * priceStdDev * citationStdDev);
    
    return parseFloat(correlation.toFixed(2));
    };
  
  const correlation = calculateCorrelation();
  
  // Format tool tips
  const formatXAxis = (dateStr: string) => {
    return format(new Date(dateStr), 'MMM d');
  };
  
  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded shadow-md">
          <p className="font-medium">{format(new Date(label), 'MMMM d, yyyy')}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.name === 'Price' ? ' ETH' : ''}
            </p>
          ))}
        </div>
      );
    }
  
    return null;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <Tabs value={activeChart} onValueChange={(value: any) => setActiveChart(value)}>
          <TabsList>
            <TabsTrigger value="correlation">
              <TrendingUp className="w-4 h-4 mr-2" />
              Correlation
            </TabsTrigger>
            <TabsTrigger value="citations">
              <Book className="w-4 h-4 mr-2" />
              Citations
            </TabsTrigger>
            <TabsTrigger value="price">
              <Award className="w-4 h-4 mr-2" />
              Token Value
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex border rounded-md overflow-hidden">
          {(['1m', '6m', '1y', 'all'] as const).map((scale) => (
            <button
              key={scale}
              className={`px-3 py-1 text-xs font-medium ${
                timeScale === scale 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setTimeScale(scale)}
            >
              {scale === 'all' ? 'All' : scale}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex mb-4">
        <Badge 
          variant="outline" 
          className="bg-blue-50 text-blue-700 border-blue-200"
        >
          Correlation: {correlation > 0 ? '+' : ''}{correlation}
        </Badge>
        
        <div className="grow"></div>
        
        <div className="flex gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Price (ETH)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span>Citations</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          {activeChart === 'correlation' ? (
            <ComposedChart
              data={timeSeriesData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }} 
                tickFormatter={formatXAxis} 
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 12 }} 
                tickFormatter={(value) => `${value}`.substring(0, 6)}
                domain={[0, 'dataMax * 1.2']}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                tick={{ fontSize: 12 }} 
                domain={[0, 'dataMax * 1.2']}
              />
              <Tooltip content={customTooltip} />
              <Legend />
              <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="price" 
                name="Price" 
                stroke="#3b82f6" 
                fill="#3b82f6" 
                strokeWidth={2} 
                dot={false}
                activeDot={{ r: 6 }}
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="cumulativeCitations" 
                name="Citations" 
                stroke="#f59e0b" 
                fill="#f59e0b" 
                strokeWidth={2} 
                dot={false}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          ) : activeChart === 'citations' ? (
            <ComposedChart
              data={timeSeriesData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }} 
                tickFormatter={formatXAxis} 
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 12 }} 
                domain={[0, 'dataMax * 1.2']}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                tick={{ fontSize: 12 }} 
                domain={[0, 'dataMax * 1.2']}
              />
              <Tooltip content={customTooltip} />
              <Legend />
              <Area 
                yAxisId="left" 
                type="monotone" 
                dataKey="cumulativeCitations" 
                name="Total Citations" 
                stroke="#f59e0b" 
                fill="#f59e0b" 
                fillOpacity={0.3}
              />
              <Bar 
                yAxisId="right" 
                dataKey="citations" 
                name="New Citations" 
                fill="#3b82f6" 
                barSize={20}
              />
            </ComposedChart>
          ) : (
            <ComposedChart
              data={timeSeriesData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }} 
                tickFormatter={formatXAxis} 
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 12 }} 
                domain={[0, 'dataMax * 1.2']}
                tickFormatter={(value) => `${value}`.substring(0, 6)}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                tick={{ fontSize: 12 }} 
                domain={[0, 'dataMax * 1.2']}
              />
              <Tooltip content={customTooltip} />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="price"
                name="Price"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.2}
              />
              <Scatter
                yAxisId="right"
                dataKey="mentions"
                name="Social Mentions"
                fill="#f87171"
              />
              <Scatter
                yAxisId="right"
                dataKey="readers"
                name="Readers"
                fill="#4ade80"
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mt-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 font-medium">Current Price</p>
              <p className="text-xl font-bold text-blue-800">{parseFloat(tokenData?.currentPrice || '0.01').toFixed(6)} ETH</p>
            </div>
            <TrendingUp className="text-blue-500 w-8 h-8 opacity-60" />
          </CardContent>
        </Card>
        
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-600 font-medium">Total Citations</p>
              <p className="text-xl font-bold text-amber-800">{metrics?.citations || 0}</p>
            </div>
            <Book className="text-amber-500 w-8 h-8 opacity-60" />
          </CardContent>
        </Card>
        
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-600 font-medium">Citation Velocity</p>
              <p className="text-xl font-bold text-emerald-800">{metrics?.citationVelocity?.toFixed(2) || '0.00'}</p>
            </div>
            <Award className="text-emerald-500 w-8 h-8 opacity-60" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default ImpactTimeSeries;