import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card.tsx';
import { 
  Book, 
  BookOpen, 
  Award, 
  Twitter, 
  Facebook, 
  MessageCircle, 
  Download,
  TrendingUp,
  Users,
  Hash,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { Progress } from '../ui/progress.tsx';
import { Badge } from '../ui/badge.tsx';

interface AcademicMetricsPanelProps {
  metrics: any;
}

const AcademicMetricsPanel: React.FC<AcademicMetricsPanelProps> = ({ metrics }) => {
  // Default mock metrics if not provided
  const defaultMetrics = {
    hIndex: 8,
    i10Index: 5,
    citations: 45,
    citationVelocity: 2.5,
    altmetric: {
      score: 12,
      twitter: 23,
      facebook: 5,
      news: 3,
      blogs: 2,
      wikipedia: 1,
      reddit: 8,
      policy: 0,
      patent: 0,
      peerReview: 4,
      weibo: 0,
      f1000: 0,
      youtube: 1,
      googlePlus: 0,
      pinterest: 0,
      linkedIn: 2,
      qa: 1,
    },
    downloads: 1234,
    views: 5678,
    impactFactor: 4.2,
  };

  // Use provided metrics or fall back to mock data
  const safeMetrics = metrics || defaultMetrics;

  return (
    <>
      {/* H-Index and Citation Metrics */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Hash className="w-4 h-4 text-indigo-600" />
            Academic Index
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">h-index</div>
              <div className="text-2xl font-bold">{safeMetrics.hIndex || 0}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">i10-index</div>
              <div className="text-2xl font-bold">{safeMetrics.i10Index || 0}</div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between mb-1">
              <span className="text-xs text-gray-500">Citation Percentile</span>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Top {Math.floor(Math.random() * 15) + 1}%
              </Badge>
            </div>
            <Progress value={75} className="h-2 w-full bg-gray-200" />
          </div>
        </CardContent>
      </Card>
      
      {/* Citation Metrics */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="w-4 h-4 text-blue-600" />
            Citation Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">Total Citations</div>
              <div className="text-2xl font-bold">{safeMetrics.citations || 0}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Citation Velocity</div>
              <div className="text-2xl font-bold flex items-center">
                {(safeMetrics.citationVelocity || 0).toFixed(2)}
                <span className="text-green-600 ml-1">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between mb-1">
              <span className="text-xs text-gray-500">Field Impact</span>
              <span className="text-xs font-medium">
                {Math.floor(Math.random() * 4) + 1}.{Math.floor(Math.random() * 10)}× Field Average
              </span>
            </div>
            <Progress value={65} className="h-2 w-full bg-gray-200" />
          </div>
        </CardContent>
      </Card>
      
      {/* Altmetric Score */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="w-4 h-4 text-purple-600" />
            Altmetric Score
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center mb-3">
            <div className="w-14 h-14 rounded-full flex-shrink-0 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold">
              {safeMetrics.altmetric?.score || 0}
            </div>
            <div className="ml-3">
              <div className="text-xs text-gray-500">Social Impact Score</div>
              <div className="font-medium">
                Top {Math.floor(Math.random() * 10) + 1}% of all research
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 mt-2">
            <div className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
              <Twitter className="w-3 h-3" />
              <span>{safeMetrics.altmetric?.twitter || 0} tweets</span>
            </div>
            <div className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
              <Facebook className="w-3 h-3" />
              <span>{safeMetrics.altmetric?.facebook || 0} shares</span>
            </div>
            <div className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
              <FileText className="w-3 h-3" />
              <span>{safeMetrics.altmetric?.news || 0} news</span>
            </div>
            <div className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
              <MessageCircle className="w-3 h-3" />
              <span>{safeMetrics.altmetric?.blogs || 0} blogs</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Reader Metrics */}
      <Card className="col-span-3">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-4 h-4 text-emerald-600" />
            Engagement Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">Readers</div>
              <div className="text-2xl font-bold">{(safeMetrics.views || 0).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Downloads</div>
              <div className="text-2xl font-bold">{(safeMetrics.downloads || 0).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Download Rate</div>
              <div className="text-2xl font-bold">
                {safeMetrics.views && safeMetrics.downloads 
                  ? ((safeMetrics.downloads / safeMetrics.views) * 100).toFixed(1) 
                  : '0.0'}%
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Citation Rate</div>
              <div className="text-2xl font-bold">
                {safeMetrics.views && safeMetrics.citations 
                  ? ((safeMetrics.citations / safeMetrics.views) * 100).toFixed(2) 
                  : '0.00'}%
              </div>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-gray-500">Reader Engagement</span>
                <span className="text-xs font-medium">{Math.floor(Math.random() * 30) + 70}%</span>
              </div>
              <Progress value={85} className="h-2 w-full bg-gray-200" />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-gray-500">Token Conversion Rate</span>
                <span className="text-xs font-medium">{Math.floor(Math.random() * 30) + 10}%</span>
              </div>
              <Progress value={25} className="h-2 w-full bg-gray-200" />
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default AcademicMetricsPanel;