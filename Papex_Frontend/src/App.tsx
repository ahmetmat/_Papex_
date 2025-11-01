import React from 'react';
import { BrowserRouter, Navigate, Route, Routes, useParams } from './lib/router';
import { ArticaProvider } from './context/ArticaContext';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './components/MainLayout';
import PaperList from './components/marketplace/PaperList';
import PaperUpload from './components/tokenization/PaperUpload';
import TokenCreation from './components/tokenization/TokenCreation';
import TokenTrading from './components/trading/TokenTrading';
import NFTMarketplaceTrading from './NFTMarketplaceTrading';
import NftCreation from './NftCreation';

const TokenCreationWrapper: React.FC = () => {
  const { paperId } = useParams<{ paperId: string }>();
  if (!paperId) return null;
  return <TokenCreation paperId={Number(paperId)} onSuccess={() => undefined} />;
};

const TokenTradingWrapper: React.FC = () => {
  const { paperId } = useParams<{ paperId: string }>();
  if (!paperId) return null;
  return <TokenTrading paperId={Number(paperId)} />;
};

const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <ArticaProvider>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/papers" replace />} />
            <Route path="papers" element={<PaperList />} />
            <Route path="upload" element={<PaperUpload />} />
            <Route path="token-creation/:paperId" element={<TokenCreationWrapper />} />
            <Route path="token-trading/:paperId" element={<TokenTradingWrapper />} />
            <Route path="nft-creation/:paperId" element={<NftCreation />} />
            <Route path="nft-marketplace" element={<NFTMarketplaceTrading />} />
            <Route path="*" element={<Navigate to="/papers" replace />} />
          </Route>
        </Routes>
      </ArticaProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
