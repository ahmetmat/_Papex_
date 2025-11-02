import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { Card, CardContent } from '../ui/card.tsx';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs.tsx';
import { Badge } from '../ui/badge.tsx';
import { Loader2, AlertTriangle, Users, Wallet } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert.tsx';

interface GeographicDistributionProps {
  paperId: number | string;
  tokenAddress?: string;
}

interface CountryData {
  code: string;
  name: string;
  readers: number;
  tokenHolders: number;
  totalValue: number;
  lat: number;
  lng: number;
}

// Static world outline data (simplified)
const createWorldOutline = () => {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { name: "North America" },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [-170, 70], [-50, 70], [-50, 15], [-170, 15], [-170, 70]
          ]]
        }
      },
      {
        type: "Feature", 
        properties: { name: "South America" },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [-85, 15], [-35, 15], [-35, -60], [-85, -60], [-85, 15]
          ]]
        }
      },
      {
        type: "Feature",
        properties: { name: "Europe" },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [-15, 70], [40, 70], [40, 35], [-15, 35], [-15, 70]
          ]]
        }
      },
      {
        type: "Feature",
        properties: { name: "Africa" },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [-20, 40], [55, 40], [55, -40], [-20, -40], [-20, 40]
          ]]
        }
      },
      {
        type: "Feature",
        properties: { name: "Asia" },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [40, 80], [180, 80], [180, 10], [40, 10], [40, 80]
          ]]
        }
      },
      {
        type: "Feature",
        properties: { name: "Australia" },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [110, -10], [160, -10], [160, -50], [110, -50], [110, -10]
          ]]
        }
      }
    ]
  };
};

const GeographicDistribution: React.FC<GeographicDistributionProps> = ({ 
  paperId, 
  tokenAddress 
}) => {
  const mapRef = useRef<SVGSVGElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [countryData, setCountryData] = useState<CountryData[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  const [dataType, setDataType] = useState<'readers' | 'tokens'>('readers');

  const generateSimulatedCountryData = useCallback((): CountryData[] => {
    const countries = [
      { code: 'USA', name: 'United States', lat: 39.8283, lng: -98.5795 },
      { code: 'GBR', name: 'United Kingdom', lat: 55.3781, lng: -3.4360 },
      { code: 'DEU', name: 'Germany', lat: 51.1657, lng: 10.4515 },
      { code: 'CHN', name: 'China', lat: 35.8617, lng: 104.1954 },
      { code: 'JPN', name: 'Japan', lat: 36.2048, lng: 138.2529 },
      { code: 'AUS', name: 'Australia', lat: -25.2744, lng: 133.7751 },
      { code: 'BRA', name: 'Brazil', lat: -14.2350, lng: -51.9253 },
      { code: 'IND', name: 'India', lat: 20.5937, lng: 78.9629 },
      { code: 'RUS', name: 'Russia', lat: 61.5240, lng: 105.3188 },
      { code: 'CAN', name: 'Canada', lat: 56.1304, lng: -106.3468 },
      { code: 'FRA', name: 'France', lat: 46.6034, lng: 1.8883 },
      { code: 'ITA', name: 'Italy', lat: 41.8719, lng: 12.5674 },
      { code: 'ESP', name: 'Spain', lat: 40.4637, lng: -3.7492 },
      { code: 'KOR', name: 'South Korea', lat: 35.9078, lng: 127.7669 },
      { code: 'NLD', name: 'Netherlands', lat: 52.1326, lng: 5.2913 },
      { code: 'CHE', name: 'Switzerland', lat: 46.8182, lng: 8.2275 },
      { code: 'SWE', name: 'Sweden', lat: 60.1282, lng: 18.6435 },
      { code: 'ZAF', name: 'South Africa', lat: -30.5595, lng: 22.9375 },
      { code: 'MEX', name: 'Mexico', lat: 23.6345, lng: -102.5528 },
      { code: 'TUR', name: 'Turkey', lat: 38.9637, lng: 35.2433 }
    ];
    
    const baseReaders = 500;
    
    return countries.map(country => {
      const academicFactors: Record<string, number> = {
        'USA': 0.8, 'GBR': 0.7, 'DEU': 0.65, 'CHN': 0.6, 'JPN': 0.55,
        'CAN': 0.5, 'AUS': 0.45, 'FRA': 0.4, 'ITA': 0.35, 'ESP': 0.3,
        'KOR': 0.35, 'NLD': 0.4, 'CHE': 0.45, 'SWE': 0.4, 'IND': 0.25,
        'BRA': 0.2, 'RUS': 0.3, 'ZAF': 0.15, 'MEX': 0.1, 'TUR': 0.15
      };
      
      const factor = academicFactors[country.code] || 0.1;
      const readers = Math.floor(baseReaders * factor * (Math.random() * 0.5 + 0.75));
      
      const tokenFactor = Math.random() * 0.4 + 0.1;
      const tokenHolders = Math.floor(readers * tokenFactor);
      
      const avgValue = Math.random() * 0.05 + 0.01;
      const totalValue = tokenHolders * avgValue;
      
      return {
        code: country.code,
        name: country.name,
        readers,
        tokenHolders,
        totalValue,
        lat: country.lat,
        lng: country.lng
      };
    });
  }, []);

  const renderMap = useCallback(() => {
    if (!mapRef.current) return;
    
    const container = mapRef.current.parentElement;
    if (!container) return;
    
    const width = container.clientWidth;
    const height = Math.min(container.clientHeight || 400, 400);
    
    // Clear previous visualization
    d3.select(mapRef.current).selectAll('*').remove();
    
    const svg = d3.select(mapRef.current)
      .attr('width', width)
      .attr('height', height);
    
    // Create projection
    const projection = d3.geoNaturalEarth1()
      .scale(width / 6.5)
      .translate([width / 2, height / 2]);
    
    const path = d3.geoPath().projection(projection);
    
    // Ocean background
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', '#dbeafe'); // Light blue ocean
    
    // Draw simplified continents
    const worldOutline = createWorldOutline();
    
    svg.selectAll('.continent')
      .data(worldOutline.features)
      .enter()
      .append('path')
      .attr('class', 'continent')
      .attr('d', path)
      .attr('fill', '#f1f5f9')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 1)
      .style('pointer-events', 'none');
    
    // Draw latitude/longitude grid
    const graticule = d3.geoGraticule()
      .step([20, 20]);
    
    svg.append('path')
      .datum(graticule)
      .attr('class', 'graticule')
      .attr('d', path)
      .attr('fill', 'none')
      .attr('stroke', '#e2e8f0')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.5);
    
    // Color scale
    const maxValue = d3.max(countryData, d => 
      dataType === 'readers' ? d.readers : d.tokenHolders
    ) || 100;
    
    const colorScale = d3.scaleSequential()
      .domain([0, maxValue])
      .interpolator(dataType === 'readers' ? d3.interpolateBlues : d3.interpolateGreens);
    
    // Create tooltip
    let tooltip = d3.select('body').select('.geo-tooltip');
    if (tooltip.empty()) {
      tooltip = d3.select('body')
        .append('div')
        .attr('class', 'geo-tooltip')
        .style('position', 'absolute')
        .style('background', 'rgba(0, 0, 0, 0.9)')
        .style('color', 'white')
        .style('padding', '12px')
        .style('border-radius', '8px')
        .style('font-size', '13px')
        .style('pointer-events', 'none')
        .style('opacity', 0)
        .style('z-index', 1000)
        .style('box-shadow', '0 4px 12px rgba(0,0,0,0.3)')
        .style('backdrop-filter', 'blur(4px)');
    }
    
    // Draw data points
    const dataPoints = countryData.filter(d => 
      (dataType === 'readers' ? d.readers : d.tokenHolders) > 0
    );
    
    const circles = svg.selectAll('.data-point')
      .data(dataPoints)
      .enter()
      .append('circle')
      .attr('class', 'data-point')
      .attr('cx', d => {
        const coords = projection([d.lng, d.lat]);
        return coords ? coords[0] : 0;
      })
      .attr('cy', d => {
        const coords = projection([d.lng, d.lat]);
        return coords ? coords[1] : 0;
      })
      .attr('r', d => {
        const value = dataType === 'readers' ? d.readers : d.tokenHolders;
        return Math.max(5, Math.sqrt(value / maxValue) * 25);
      })
      .attr('fill', d => {
        const value = dataType === 'readers' ? d.readers : d.tokenHolders;
        return colorScale(value);
      })
      .attr('fill-opacity', 0.8)
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))');
    
    circles
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('stroke-width', 3)
          .attr('stroke', '#1f2937')
          .attr('r', d => {
            const value = dataType === 'readers' ? d.readers : d.tokenHolders;
            return Math.max(7, Math.sqrt(value / maxValue) * 30);
          })
          .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))');
        
        const value = dataType === 'readers' ? d.readers : d.tokenHolders;
        const label = dataType === 'readers' ? 'Readers' : 'Token Holders';
        
        tooltip
          .style('opacity', 1)
          .html(`
            <div style="font-weight: bold; margin-bottom: 6px; font-size: 14px;">${d.name}</div>
            <div style="margin-bottom: 3px;">${label}: <strong>${value.toLocaleString()}</strong></div>
            ${dataType === 'tokens' ? `<div>Total Value: <strong>${d.totalValue.toFixed(4)} ETH</strong></div>` : ''}
            ${dataType === 'readers' ? `<div>Token Holders: <strong>${d.tokenHolders.toLocaleString()}</strong></div>` : ''}
          `)
          .style('left', (event.pageX + 15) + 'px')
          .style('top', (event.pageY - 10) + 'px');
        
        setSelectedCountry(d);
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('stroke-width', 2)
          .attr('stroke', 'white')
          .attr('r', d => {
            const value = dataType === 'readers' ? d.readers : d.tokenHolders;
            return Math.max(5, Math.sqrt(value / maxValue) * 25);
          })
          .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))');
        
        tooltip.style('opacity', 0);
      });
    
    // Add labels for top countries
    const topCountries = [...countryData]
      .sort((a, b) => (dataType === 'readers' ? b.readers - a.readers : b.tokenHolders - a.tokenHolders))
      .slice(0, 8);
    
    svg.selectAll('.country-label')
      .data(topCountries)
      .enter()
      .append('text')
      .attr('class', 'country-label')
      .attr('x', d => {
        const coords = projection([d.lng, d.lat]);
        return coords ? coords[0] : 0;
      })
      .attr('y', d => {
        const coords = projection([d.lng, d.lat]);
        return coords ? coords[1] + 6 : 0;
      })
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', 'white')
      .style('text-shadow', '2px 2px 4px rgba(0,0,0,0.8)')
      .style('pointer-events', 'none')
      .text(d => {
        const value = dataType === 'readers' ? d.readers : d.tokenHolders;
        return value > 50 ? value.toString() : '';
      });
    
    // Legend
    const legendWidth = 220;
    const legendHeight = 20;
    
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - legendWidth - 20}, ${height - 60})`);
    
    // Legend background
    legend.append('rect')
      .attr('x', -15)
      .attr('y', -30)
      .attr('width', legendWidth + 30)
      .attr('height', 60)
      .attr('fill', 'rgba(255, 255, 255, 0.95)')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 1)
      .attr('rx', 6)
      .style('filter', 'drop-shadow(0 2px 8px rgba(0,0,0,0.1))');
    
    // Legend gradient
    const gradientId = `legend-gradient-${dataType}-${Date.now()}`;
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0%')
      .attr('x2', '100%');
    
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      gradient.append('stop')
        .attr('offset', `${(i / steps) * 100}%`)
        .attr('style', `stop-color:${colorScale(maxValue * i / steps)}`);
    }
    
    legend.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', `url(#${gradientId})`)
      .attr('rx', 3);
    
    // Legend labels
    legend.append('text')
      .attr('x', 0)
      .attr('y', legendHeight + 18)
      .style('font-size', '11px')
      .style('fill', '#374151')
      .style('font-weight', '500')
      .text('0');
    
    legend.append('text')
      .attr('x', legendWidth)
      .attr('y', legendHeight + 18)
      .attr('text-anchor', 'end')
      .style('font-size', '11px')
      .style('fill', '#374151')
      .style('font-weight', '500')
      .text(d3.format('.0s')(maxValue));
    
    legend.append('text')
      .attr('x', legendWidth / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .style('font-size', '13px')
      .style('font-weight', 'bold')
      .style('fill', '#1f2937')
      .text(dataType === 'readers' ? 'Reader Distribution' : 'Token Holder Distribution');

  }, [countryData, dataType]);

  useEffect(() => {
    const initializeData = async () => {
      try {
        const simulatedData = generateSimulatedCountryData();
        setCountryData(simulatedData);
        setLoading(false);
      } catch (err: any) {
        console.error('Error initializing data:', err);
        setLoading(false);
      }
    };
    
    initializeData();
  }, [paperId, tokenAddress, generateSimulatedCountryData]);

  useEffect(() => {
    if (countryData.length > 0 && mapRef.current) {
      renderMap();
    }
  }, [countryData, dataType, renderMap]);

  const getTotalReaders = () => {
    return countryData.reduce((sum, country) => sum + country.readers, 0);
  };

  const getTotalTokenHolders = () => {
    return countryData.reduce((sum, country) => sum + country.tokenHolders, 0);
  };

  const getTotalTokenValue = () => {
    return countryData.reduce((sum, country) => sum + country.totalValue, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const topCountries = [...countryData]
    .sort((a, b) => {
      if (dataType === 'readers') {
        return b.readers - a.readers;
      } else {
        return b.tokenHolders - a.tokenHolders;
      }
    })
    .slice(0, 5);

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <Tabs 
          value={dataType} 
          onValueChange={(value: any) => setDataType(value)}
        >
          <TabsList className="grid w-[300px] grid-cols-2">
            <TabsTrigger value="readers">
              <Users className="w-4 h-4 mr-2" />
              Readers
            </TabsTrigger>
            <TabsTrigger value="tokens">
              <Wallet className="w-4 h-4 mr-2" />
              Token Holders
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex gap-3">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {dataType === 'readers' ? 'Total Readers' : 'Total Holders'}: 
            {' '}
            {dataType === 'readers' ? getTotalReaders().toLocaleString() : getTotalTokenHolders().toLocaleString()}
          </Badge>
          
          {dataType === 'tokens' && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Total Value: {getTotalTokenValue().toFixed(4)} ETH
            </Badge>
          )}
        </div>
      </div>
      
      {/* Map and Details */}
      <div className="flex gap-4 flex-1">
        <div className="flex-1 border rounded-lg bg-white overflow-hidden shadow-sm">
          <svg ref={mapRef} className="w-full h-full" style={{ minHeight: '400px' }} />
        </div>
        
        {selectedCountry && (
          <Card className="w-64 flex-shrink-0 shadow-md">
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-3 text-gray-900">{selectedCountry.name}</h3>
              
              <div className="space-y-3">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <div className="text-sm text-blue-600 mb-1">Readers</div>
                  <div className="text-xl font-bold text-blue-800">{selectedCountry.readers.toLocaleString()}</div>
                  <div className="text-xs text-blue-600">
                    {((selectedCountry.readers / getTotalReaders()) * 100).toFixed(1)}% of total
                  </div>
                </div>
                
                <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                  <div className="text-sm text-green-600 mb-1">Token Holders</div>
                  <div className="text-xl font-bold text-green-800">{selectedCountry.tokenHolders.toLocaleString()}</div>
                  <div className="text-xs text-green-600">
                    {((selectedCountry.tokenHolders / getTotalTokenHolders()) * 100).toFixed(1)}% of total
                  </div>
                </div>
                
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                  <div className="text-sm text-purple-600 mb-1">Total Token Value</div>
                  <div className="text-xl font-bold text-purple-800">{selectedCountry.totalValue.toFixed(4)} ETH</div>
                  <div className="text-xs text-purple-600">
                    {((selectedCountry.totalValue / getTotalTokenValue()) * 100).toFixed(1)}% of total
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div className="text-sm text-gray-600 mb-1">Avg. Value per Holder</div>
                  <div className="text-lg font-semibold text-gray-800">
                    {selectedCountry.tokenHolders > 0 
                      ? (selectedCountry.totalValue / selectedCountry.tokenHolders).toFixed(4) 
                      : '0.0000'} ETH
                  </div>
                </div>
                
                <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                  <div className="text-sm text-indigo-600 mb-1">Token Adoption Rate</div>
                  <div className="text-lg font-semibold text-indigo-800">
                    {selectedCountry.readers > 0 
                      ? ((selectedCountry.tokenHolders / selectedCountry.readers) * 100).toFixed(1) 
                      : '0.0'}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Top Countries */}
      <div className="grid grid-cols-5 gap-3">
        {topCountries.map((country) => (
          <Card 
            key={country.code}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedCountry?.code === country.code ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
            }`}
            onClick={() => setSelectedCountry(country)}
          >
            <CardContent className="p-3">
              <div className="text-center">
                <div className="font-semibold text-sm truncate mb-1">{country.name}</div>
                <div className="text-lg font-bold text-blue-600">
                  {dataType === 'readers' 
                    ? country.readers.toLocaleString() 
                    : country.tokenHolders.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                  {dataType === 'readers' ? 'Readers' : 'Token Holders'}
                </div>
                {dataType === 'tokens' && (
                  <div className="text-xs text-green-600 mt-1 font-medium">
                    {country.totalValue.toFixed(3)} ETH
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GeographicDistribution;