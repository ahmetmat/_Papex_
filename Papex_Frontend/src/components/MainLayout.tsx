import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from '../lib/router';
import { Button } from './ui/button.tsx';
import { Wallet, FileText, Layers, ShoppingBag } from 'lucide-react';
import { useArtica } from '../context/ArticaContext';

const navItems = [
  { to: '/papers', label: 'Papers', icon: <FileText className="h-4 w-4" /> },
  { to: '/upload', label: 'Register', icon: <Layers className="h-4 w-4" /> },
  { to: '/nft-marketplace', label: 'Marketplace', icon: <ShoppingBag className="h-4 w-4" /> },
];

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { walletAddress, connectWallet } = useArtica();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnectWallet = async () => {
    setConnecting(true);
    setError(null);
    try {
      await connectWallet();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(errorMessage);
      console.error('Wallet connection failed:', errorMessage);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="mx-auto flex h-16 w-full max-w-[1920px] items-center justify-between px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-lg font-semibold"
          >
            <span className="rounded bg-slate-900 px-2 py-1 text-white">Papex</span>
            <span className="hidden sm:inline text-slate-600">Soroban</span>
          </button>

          <nav className="flex items-center gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                    isActive || location.pathname.startsWith(item.to)
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {error && (
              <span className="text-xs text-red-600 max-w-[150px] truncate" title={error}>
                {error}
              </span>
            )}
            {walletAddress ? (
              <Button variant="outline" size="sm" className="font-mono text-xs">
                <Wallet className="mr-2 h-4 w-4" />
                {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
              </Button>
            ) : (
              <Button 
                size="sm" 
                onClick={handleConnectWallet}
                disabled={connecting}
              >
                <Wallet className="mr-2 h-4 w-4" />
                {connecting ? 'Connecting...' : 'Connect Freighter'}
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1920px] px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
