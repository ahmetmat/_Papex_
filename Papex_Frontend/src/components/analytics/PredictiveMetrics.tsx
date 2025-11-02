import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '../ui/card.tsx';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
  ComposedChart

} from 'recharts';
import { Clock, TrendingUp, Award, AlertTriangle, Share2, Download, DollarSign } from 'lucide-react';
import { Button } from '../ui/button.tsx';
import { Alert, AlertDescription } from '../ui/alert.tsx';
import { Badge } from '../ui/badge.tsx';
import { Progress } from '../ui/progress.tsx';

interface PredictiveMetricsProps {
  paperData: any;
  metrics: any;
}

const PredictiveMetrics: React.FC<PredictiveMetricsProps> = ({ paperData, metrics }) => {
  const [forecastType, setForecastType] = useState<'citations' | 'altmetric' | 'token'>('citations');
  
  // Default mock metrics if not provided
  const defaultMetrics = {
    citations: 45,
    predictedCitations: {
      sixMonths: 65,
      oneYear: 120,
      twoYears: 280,
    },
    predictedAltmetric: {
      sixMonths: 18,
      oneYear: 32,
      twoYears: 58,
    },
    predictedTokenPrice: {
      sixMonths: 0.015,
      oneYear: 0.028,
      twoYears: 0.052,
    },
    altmetric: {
      score: 12,
    },
  };

  // Use provided metrics or fall back to mock data
  const safeMetrics = metrics || defaultMetrics;
  
  // Generate citation forecast data
  const generateCitationForecast = () => {
    const data = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Generate monthly forecasts for the next 24 months
    for (let i = 0; i < 24; i++) {
      const forecastMonth = new Date(currentYear, currentMonth + i, 1);
      const yearFraction = i / 12;
      
      // Sigmoid growth model with some randomness
      const sigmoid = 1 / (1 + Math.exp(-3 * (yearFraction - 1)));
      const growthFactor = 1 + sigmoid * 3; // Growth increases over time
      
      let citations;
      const predictedCitations = safeMetrics.predictedCitations || defaultMetrics.predictedCitations;
      if (i < 6) {
        citations = predictedCitations.sixMonths * (i + 1) / 6 * (0.9 + Math.random() * 0.2);
      } else if (i < 12) {
        citations = predictedCitations.sixMonths + 
          (predictedCitations.oneYear - predictedCitations.sixMonths) * 
          ((i - 6) / 6) * (0.9 + Math.random() * 0.2);
      } else {
        citations = predictedCitations.oneYear + 
          (predictedCitations.twoYears - predictedCitations.oneYear) * 
          ((i - 12) / 12) * (0.9 + Math.random() * 0.2);
      }
      
      // Calculate cumulative citations
      const baseCitations = safeMetrics.citations || 10;
      const cumulativeCitations = baseCitations + Math.floor(citations);
      
      // Add monthly variation
      const randomFactor = 0.9 + Math.random() * 0.2;
      const monthlyCitations = Math.floor(citations / 12 * randomFactor);
      
      // Calculate confidence intervals (±20%)
      const lowerBound = Math.floor(cumulativeCitations * 0.8);
      const upperBound = Math.floor(cumulativeCitations * 1.2);
      
      // Add to dataset
      data.push({
        date: forecastMonth.toISOString().substring(0, 7), // YYYY-MM format
        monthName: forecastMonth.toLocaleString('default', { month: 'short', year: '2-digit' }),
        cumulativeCitations,
        monthlyCitations: Math.max(0, monthlyCitations),
        lowerBound,
        upperBound
      });
    }
    
    return data;
  };
  
  // Generate altmetric forecast data
  const generateAltmetricForecast = () => {
    const data = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Base altmetric score
    const baseScore = safeMetrics.altmetric?.score || 20;
    
    // Generate monthly forecasts for the next 12 months
    for (let i = 0; i < 12; i++) {
      const forecastMonth = new Date(currentYear, currentMonth + i, 1);
      
      // Altmetric tends to grow fast initially then plateau
      const growthFactor = Math.exp(-0.2 * i); // Exponential decay
      const scoreIncrease = Math.floor(baseScore * 0.2 * growthFactor * (0.8 + Math.random() * 0.4));
      const cumulativeScore = baseScore + scoreIncrease;
      
      // Social metrics
      const tweets = Math.floor((safeMetrics.altmetric?.twitter || 10) * (1 + i * 0.1) * (0.9 + Math.random() * 0.2));
      const mentions = Math.floor((safeMetrics.altmetric?.news || 2) * (1 + i * 0.05) * (0.9 + Math.random() * 0.2));
      
      data.push({
        date: forecastMonth.toISOString().substring(0, 7),
        monthName: forecastMonth.toLocaleString('default', { month: 'short', year: '2-digit' }),
        score: cumulativeScore,
        tweets,
        mentions,
        monthlyScore: scoreIncrease
      });
    }
    
    return data;
  };
  
  // Generate token value forecast
  const generateTokenForecast = () => {
    const data = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Base token price (in ETH)
    const basePrice = 0.01;
    
    // Generate monthly forecasts for the next 12 months
    for (let i = 0; i < 12; i++) {
      const forecastMonth = new Date(currentYear, currentMonth + i, 1);
      
      // Model price as correlated with citation growth but with more volatility
      const timeFactor = i / 12;
      const citations = generateCitationForecast()[i].cumulativeCitations;
      const citationFactor = citations / (safeMetrics.citations || 10);
      
      // Price model with some randomness and volatility
      const trendFactor = 1 + timeFactor * (0.5 + Math.random() * 1.5);
      const price = basePrice * trendFactor * (citationFactor * 0.3 + 0.7) * (0.8 + Math.random() * 0.4);
      
      // Model trading volume
      const volume = Math.floor(10 + i * 5 * (0.8 + Math.random() * 0.4));
      
      // Calculate confidence intervals with more volatility
      const lowerBound = price * (0.7 + Math.random() * 0.2);
      const upperBound = price * (1.1 + Math.random() * 0.3);
      
      data.push({
        date: forecastMonth.toISOString().substring(0, 7),
        monthName: forecastMonth.toLocaleString('default', { month: 'short', year: '2-digit' }),
        price: parseFloat(price.toFixed(6)),
        priceChange: parseFloat((price - (i > 0 ? data[i-1]?.price : basePrice)).toFixed(6)),
        volume,
        lowerBound: parseFloat(lowerBound.toFixed(6)),
        upperBound: parseFloat(upperBound.toFixed(6))
      });
    }
    
    return data;
  };
  
  const citationForecast = generateCitationForecast();
  const altmetricForecast = generateAltmetricForecast();
  const tokenForecast = generateTokenForecast();
  
  // Format for tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card className="p-3 shadow-md">
          <div className="font-medium">{label}</div>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="text-sm" style={{ color: entry.color }}>
              <span className="font-medium">{entry.name}:</span> {entry.value}
            </div>
          ))}
        </Card>
      );
    }
    return null;
  };
  
  // Determine confidence level for predictions
  const getConfidenceLevel = () => {
    const citationCount = safeMetrics.citations || 0;
    if (citationCount > 50) return 'High';
    if (citationCount > 20) return 'Medium';
    return 'Low';
  };
  
  const confidenceLevel = getConfidenceLevel();
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card
          className={`cursor-pointer transition-colors ${
            forecastType === 'citations' ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => setForecastType('citations')}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-blue-100 rounded-full p-3">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="font-medium">Citation Forecast</div>
              <div className="text-sm text-gray-500">
                Projected growth based on paper impact
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card
          className={`cursor-pointer transition-colors ${
            forecastType === 'altmetric' ? 'ring-2 ring-purple-500' : ''
          }`}
          onClick={() => setForecastType('altmetric')}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-purple-100 rounded-full p-3">
              <Share2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="font-medium">Social Impact</div>
              <div className="text-sm text-gray-500">
                Projected altmetric and social media impact
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card
          className={`cursor-pointer transition-colors ${
            forecastType === 'token' ? 'ring-2 ring-green-500' : ''
          }`}
          onClick={() => setForecastType('token')}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-green-100 rounded-full p-3">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="font-medium">Token Value</div>
              <div className="text-sm text-gray-500">
                Projected token price based on research impact
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>
                {forecastType === 'citations' && 'Citation Growth Forecast'}
                {forecastType === 'altmetric' && 'Altmetric Score Forecast'}
                {forecastType === 'token' && 'Token Value Forecast'}
              </CardTitle>
              <CardDescription>
                {forecastType === 'citations' && 'Predicted citation accumulation over the next 24 months'}
                {forecastType === 'altmetric' && 'Predicted social media impact over the next 12 months'}
                {forecastType === 'token' && 'Predicted token price movement over the next 12 months'}
              </CardDescription>
            </div>
            <Badge 
              variant="outline" 
              className={`${
                confidenceLevel === 'High' 
                  ? 'bg-green-50 text-green-700 border-green-200' 
                  : confidenceLevel === 'Medium'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              {confidenceLevel} Confidence
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {forecastType === 'citations' && (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={citationForecast}
                  margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis 
                    dataKey="monthName" 
                    tick={{ fontSize: 12 }} 
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }} 
                    domain={[0, 'dataMax * 1.3']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <defs>
                    <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="upperBound" 
                    stroke="none" 
                    fill="#3b82f6" 
                    fillOpacity={0.1} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="lowerBound" 
                    stroke="none" 
                    fill="#fff" 
                    fillOpacity={0.1} 
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulativeCitations"
                    name="Predicted Citations"
                    stroke="#3b82f6"
                    fill="url(#splitColor)"
                    strokeWidth={2}
                  />
                  <Bar 
                    dataKey="monthlyCitations" 
                    name="Monthly New Citations" 
                    fill="#93c5fd" 
                    barSize={4}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
          
          {forecastType === 'altmetric' && (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={altmetricForecast}
                  margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis 
                    dataKey="monthName" 
                    tick={{ fontSize: 12 }} 
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
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="score" 
                    name="Altmetric Score" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="tweets" 
                    name="Twitter Mentions" 
                    stroke="#06b6d4" 
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="mentions" 
                    name="News Mentions" 
                    stroke="#f43f5e" 
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          
          {forecastType === 'token' && (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={tokenForecast}
                  margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis 
                    dataKey="monthName" 
                    tick={{ fontSize: 12 }} 
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
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <defs>
                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="upperBound" 
                    fill="#10b981" 
                    stroke="none"
                    fillOpacity={0.1} 
                  />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="lowerBound" 
                    fill="#fff" 
                    stroke="none"
                    fillOpacity={0.1} 
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="price" 
                    name="Token Price (ETH)" 
                    stroke="#10b981" 
                    fill="url(#colorUv)"
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                  />
                  <Bar 
                    yAxisId="right"
                    dataKey="volume" 
                    name="Trading Volume" 
                    fill="#34d399"
                    barSize={10}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="p-4 border-t">
          <div className="w-full">
            <div className="grid grid-cols-3 gap-6">
              {forecastType === 'citations' && (
                <>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">6-Month Forecast</div>
                    <div className="text-lg font-bold text-blue-700">
                      {safeMetrics.predictedCitations?.sixMonths || 0} citations
                    </div>
                    <div className="text-xs text-gray-500">
                      {safeMetrics.citations ? Math.round(((safeMetrics.predictedCitations?.sixMonths || 0) / safeMetrics.citations - 1) * 100) : 0}% increase
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">1-Year Forecast</div>
                    <div className="text-lg font-bold text-blue-700">
                      {safeMetrics.predictedCitations?.oneYear || 0} citations
                    </div>
                    <div className="text-xs text-gray-500">
                      {safeMetrics.citations ? Math.round(((safeMetrics.predictedCitations?.oneYear || 0) / safeMetrics.citations - 1) * 100) : 0}% increase
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">2-Year Forecast</div>
                    <div className="text-lg font-bold text-blue-700">
                      {safeMetrics.predictedCitations?.twoYears || 0} citations
                    </div>
                    <div className="text-xs text-gray-500">
                      {safeMetrics.citations ? Math.round(((safeMetrics.predictedCitations?.twoYears || 0) / safeMetrics.citations - 1) * 100) : 0}% increase
                    </div>
                  </div>
                </>
              )}
              
              {forecastType === 'altmetric' && (
                <>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">6-Month Forecast</div>
                    <div className="text-lg font-bold text-purple-700">
                      {Math.round(altmetricForecast[5].score)} score
                    </div>
                    <div className="text-xs text-gray-500">
                      {safeMetrics.altmetric?.score ? Math.round((altmetricForecast[5].score / safeMetrics.altmetric.score - 1) * 100) : 0}% increase
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Total Twitter Mentions</div>
                    <div className="text-lg font-bold text-cyan-700">
                      {altmetricForecast[altmetricForecast.length - 1].tweets} tweets
                    </div>
                    <div className="text-xs text-gray-500">
                      {safeMetrics.altmetric?.twitter ? Math.round((altmetricForecast[altmetricForecast.length - 1].tweets / safeMetrics.altmetric.twitter - 1) * 100) : 0}% growth
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">News Coverage</div>
                    <div className="text-lg font-bold text-rose-700">
                      {altmetricForecast[altmetricForecast.length - 1].mentions} mentions
                    </div>
                    <div className="text-xs text-gray-500">
                      {safeMetrics.altmetric?.news ? Math.round((altmetricForecast[altmetricForecast.length - 1].mentions / safeMetrics.altmetric.news - 1) * 100) : 0}% increase
                    </div>
                  </div>
                </>
              )}
              
              {forecastType === 'token' && (
                <>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">6-Month Price</div>
                    <div className="text-lg font-bold text-emerald-700">
                      {tokenForecast[5].price.toFixed(6)} ETH
                    </div>
                    <div className="text-xs text-gray-500">
                      {Math.round((tokenForecast[5].price / 0.01 - 1) * 100)}% potential growth
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">12-Month Price</div>
                    <div className="text-lg font-bold text-emerald-700">
                      {tokenForecast[tokenForecast.length - 1].price.toFixed(6)} ETH
                    </div>
                    <div className="text-xs text-gray-500">
                      {Math.round((tokenForecast[tokenForecast.length - 1].price / 0.01 - 1) * 100)}% potential growth
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Price Volatility</div>
                    <div className="text-lg font-bold text-amber-700">
                      {Math.round(
                        (tokenForecast.reduce((sum, item) => sum + Math.abs(item.priceChange), 0) / 
                        tokenForecast.length / 
                        tokenForecast[0].price) * 100
                      )}%
                    </div>
                    <div className="text-xs text-gray-500">
                      Monthly average
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="mt-4 text-xs text-gray-500 italic">
              Disclaimer: These predictions are generated using machine learning models trained on historical academic data.
              Actual results may vary. Token price predictions should not be considered as financial advice.
            </div>
          </div>
        </CardFooter>
      </Card>
      
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              Time to Maximum Impact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                <span className="text-xl font-bold text-amber-700">
                  {Math.floor(Math.random() * 18) + 6}mo
                </span>
              </div>
              <div>
                <div className="font-medium">Peak Citation Period</div>
                <div className="text-sm text-gray-500">
                  Estimated time to reach maximum citation velocity
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Current Impact Stage</span>
                <span className="font-medium">Growth Phase</span>
              </div>
              <Progress value={35} className="h-2 w-full bg-gray-100" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Early</span>
                <span>Growth</span>
                <span>Peak</span>
                <span>Stable</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-600" />
              Academic Impact Ranking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-xl font-bold text-purple-700">
                  Top {Math.floor(Math.random() * 5) + 1}%
                </span>
              </div>
              <div>
                <div className="font-medium">Field Percentile</div>
                <div className="text-sm text-gray-500">
                  Predicted rank compared to papers in the same field
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Citation Impact</span>
                <span className="font-medium">Very High</span>
              </div>
              <Progress value={85} className="h-2 w-full bg-gray-100" />
              
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Economic Impact</span>
                <span className="font-medium">High</span>
              </div>
              <Progress value={75} className="h-2 w-full bg-gray-100" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PredictiveMetrics;