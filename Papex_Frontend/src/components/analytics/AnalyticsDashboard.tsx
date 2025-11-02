import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card.tsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs.tsx';
import { Button } from '../ui/button.tsx';
import { Alert, AlertDescription } from '../ui/alert.tsx';
import { Loader2, TrendingUp, Award, Users, BarChart2, Globe, Clock, ArrowLeft } from 'lucide-react'; // ArrowLeft ikonu eklendi
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import { useArtica } from '../../context/ArticaContext.tsx';

// Import our visualization components
import CitationNetwork from '../analytics/CitationNetwork.tsx';
import ImpactTimeSeries from '../analytics/ImpactTimeSeries.tsx';
import GeographicDistribution from '../analytics/GeographicDistribution.tsx';
import AcademicMetricsPanel from '../analytics/AcademicMetricsPanel.tsx';
import PredictiveMetrics from '../analytics/PredictiveMetrics.tsx';

const AnalyticsDashboard: React.FC = () => {
  const { paperId } = useParams<{ paperId: string }>();
  const { token } = useAuth();
  const { getPaperTokenInfo } = useArtica();
  const navigate = useNavigate();

  const [paperData, setPaperData] = useState<any>(null);
  const [tokenData, setTokenData] = useState<any>(null);
  const [academicMetrics, setAcademicMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('impact');

  useEffect(() => {
    if (!paperId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch paper details from backend
        const paperResponse = await fetch(`http://localhost:8085/api/papers/${paperId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!paperResponse.ok) {
          throw new Error('Failed to load paper details');
        }

        const paperDetails = await paperResponse.json();
        setPaperData(paperDetails);

        // If paper has blockchain ID, fetch token data
        if (paperDetails.blockchainId) {
          try {
            const tokenInfo = await getPaperTokenInfo(parseInt(paperDetails.blockchainId));
            setTokenData(tokenInfo);
          } catch (err) {
            console.warn('Failed to fetch token info:', err);
            // Continue anyway as we have the paper data
          }
        }

        // Fetch academic metrics data
        // Bu fonksiyonun CrossRef veya başka bir API'ye göre güncellendiğini varsayıyoruz.
        // Şimdilik orijinal simüle edilmiş halini koruyalım veya API'li halini kullanalım.
        // Bu örnekte orijinal, simüle edilmiş haliyle bırakıyorum.
        // Eğer API'li halini istiyorsan, bir önceki yanıtlarımızdaki gibi değiştirebilirsin.
        await fetchSimulatedAcademicMetrics(paperDetails.doi);

      } catch (err: any) {
        console.error('Error loading analytics data:', err);
        setError(err.message || 'Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [paperId, token, getPaperTokenInfo]); // getPaperTokenInfo bağımlılıklara eklendi

  // Simüle edilmiş metrikler için fonksiyon (önceki versiyonlardaki gibi)
  const fetchSimulatedAcademicMetrics = async (doi: string | undefined) => {
    if (!doi) return;
    try {
      const metrics = {
        citations: Math.floor(Math.random() * 100) + 5,
        hIndex: Math.floor(Math.random() * 20) + 1,
        i10Index: Math.floor(Math.random() * 15) + 1,
        altmetric: {
          score: Math.floor(Math.random() * 100) + 1,
          mentions: {
            twitter: Math.floor(Math.random() * 50),
            facebook: Math.floor(Math.random() * 20),
            news: Math.floor(Math.random() * 5),
            blogs: Math.floor(Math.random() * 10)
          }
        },
        readers: Math.floor(Math.random() * 1000) + 50,
        downloads: Math.floor(Math.random() * 500) + 20,
        citationVelocity: Math.random() * 2, // .toFixed() hatası için kontrol edilecek
        predictedCitations: {
          sixMonths: Math.floor(Math.random() * 20) + 5,
          oneYear: Math.floor(Math.random() * 50) + 10,
          twoYears: Math.floor(Math.random() * 100) + 20
        }
      };
      setAcademicMetrics(metrics);
    } catch (err) {
      console.error('Error fetching academic metrics:', err);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !paperData) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Alert variant="destructive">
          <AlertDescription>{error || "Failed to load paper details"}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => navigate('/papers')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Makalelere Geri Dön
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Geri Butonu Eklendi */}
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate(`/token-trading/${paperId}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to trading
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{paperData.title}</h1>
          <p className="text-gray-500">
            {paperData.authorName} • DOI: {paperData.doi}
          </p>
        </div>
        {tokenData && (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-700">
              {tokenData.symbol}: {tokenData.currentPrice ? parseFloat(tokenData.currentPrice).toFixed(6) : 'N/A'} ETH
            </span>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4"> {/* Mobil için grid-cols-2 */}
          <TabsTrigger value="impact">
            <TrendingUp className="w-4 h-4 mr-2" />
            Etki Analizi
          </TabsTrigger>
          <TabsTrigger value="citations">
            <BarChart2 className="w-4 h-4 mr-2" />
            Atıf Ağı
          </TabsTrigger>
          <TabsTrigger value="geographic">
            <Globe className="w-4 h-4 mr-2" />
            Coğrafi Veri
          </TabsTrigger>
          <TabsTrigger value="predictions">
            <Clock className="w-4 h-4 mr-2" />
            Tahmini Metrikler
          </TabsTrigger>
        </TabsList>

        <TabsContent value="impact" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AcademicMetricsPanel metrics={academicMetrics} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Atıf ve Fiyat Korelasyonu</CardTitle>
              <CardDescription>
                Akademik etki ve token değerinin zaman içindeki ilişkisi
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-80">
                <ImpactTimeSeries
                  paperData={paperData}
                  tokenData={tokenData}
                  metrics={academicMetrics}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="citations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Atıf Ağı Analizi</CardTitle>
              <CardDescription>
                Bu araştırmaya atıfta bulunan ve bu araştırmanın atıfta bulunduğu makalelerin görselleştirilmesi
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-96">
                <CitationNetwork
                  paperId={paperData.id?.toString()} // paperId varsa string'e çevir
                  doi={paperData.doi}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geographic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Coğrafi Dağılım</CardTitle>
              <CardDescription>
                Okuyucuların ve token sahiplerinin küresel dağılımı
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-96">
                <GeographicDistribution
                  paperId={paperData.id?.toString()} // paperId varsa string'e çevir
                  tokenAddress={tokenData?.tokenAddress}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <PredictiveMetrics
            paperData={paperData}
            metrics={academicMetrics}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;