import { create } from 'zustand';
import { WalletState } from '@/lib/types';
import {
  isConnected,
  requestAccess,
  getAddress,
  getNetwork,
  getNetworkDetails,
  WatchWalletChanges
} from '@stellar/freighter-api';

interface WalletStore extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: (network: 'testnet' | 'mainnet') => Promise<void>;
  refreshBalance: () => Promise<void>;
  checkConnection: () => Promise<void>;
  startWalletWatcher: () => void;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

// Wallet watcher instance
let walletWatcher: WatchWalletChanges | null = null;

export const useWalletStore = create<WalletStore>((set, get) => ({
  // Initial state
  isConnected: false,
  address: null,
  publicKey: null,
  balance: '0',
  network: 'testnet',
  isLoading: false,
  error: null,

  // Clear error state
  clearError: () => set({ error: null }),

  // Connect to Freighter wallet
  connect: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        throw new Error('Wallet connection only available in browser');
      }

      // Check if Freighter is installed and connected
      const connectionResult = await isConnected();
      
      if (connectionResult.error) {
        throw new Error('Freighter wallet not found. Please install Freighter extension.');
      }

      if (!connectionResult.isConnected) {
        throw new Error('Freighter is not connected. Please enable the extension.');
      }

      // Request access to user's public key
      const accessResult = await requestAccess();
      
      if (accessResult.error) {
        throw new Error(accessResult.error);
      }

      // Get network information
      const networkResult = await getNetworkDetails();
      
      if (networkResult.error) {
        throw new Error(networkResult.error);
      }

      // Map Freighter network names to our format
      const networkMapping: Record<string, 'testnet' | 'mainnet'> = {
        'TESTNET': 'testnet',
        'PUBLIC': 'mainnet',
        'FUTURENET': 'testnet', // Default futurenet to testnet for our purposes
        'STANDALONE': 'testnet'
      };

      const mappedNetwork = networkMapping[networkResult.network] || 'testnet';

      // Mock XLM balance - in production, you'd fetch this from Horizon
      const mockBalance = '100.0000000';

      set({
        isConnected: true,
        address: accessResult.address,
        publicKey: accessResult.address, // In Stellar, address and public key are the same
        balance: mockBalance,
        network: mappedNetwork,
        isLoading: false,
        error: null
      });

      // Start watching for wallet changes
      get().startWalletWatcher();

      console.log('Freighter wallet connected successfully:', {
        address: accessResult.address,
        network: networkResult.network,
        networkUrl: networkResult.networkUrl
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Wallet connection failed:', errorMessage);
      
      set({
        isConnected: false,
        address: null,
        publicKey: null,
        balance: '0',
        isLoading: false,
        error: errorMessage
      });
    }
  },

  // Disconnect wallet
  disconnect: () => {
    // Stop watching for changes
    if (walletWatcher) {
      walletWatcher.stop();
      walletWatcher = null;
    }

    set({
      isConnected: false,
      address: null,
      publicKey: null,
      balance: '0',
      error: null
    });
    console.log('Wallet disconnected');
  },

  // Switch network (Note: This requires user to manually switch in Freighter)
  switchNetwork: async (network: 'testnet' | 'mainnet') => {
    set({ isLoading: true, error: null });
    
    try {
      // Get current network from Freighter
      const networkResult = await getNetwork();
      
      if (networkResult.error) {
        throw new Error(networkResult.error);
      }

      // Check if we're already on the desired network
      const currentNetwork = networkResult.network === 'PUBLIC' ? 'mainnet' : 'testnet';
      
      if (currentNetwork === network) {
        set({ isLoading: false });
        return;
      }

      // We can't programmatically switch networks in Freighter
      // So we'll show an error message asking the user to switch manually
      const targetNetwork = network === 'mainnet' ? 'Mainnet (PUBLIC)' : 'Testnet';
      throw new Error(
        `Please switch to ${targetNetwork} in your Freighter wallet settings, then reconnect.`
      );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network switch failed';
      set({ 
        isLoading: false, 
        error: errorMessage 
      });
    }
  },

  // Refresh XLM balance
  refreshBalance: async () => {
    const { address, isConnected } = get();
    
    if (!isConnected || !address) {
      return;
    }

    try {
      console.log(`Refreshing balance for ${address}...`);
      
      // In production, you would fetch the actual balance from Horizon
      // For now, we'll use a mock balance
      const mockBalance = '100.0000000';
      set({ balance: mockBalance });
      
      console.log('Balance refreshed');
    } catch (error) {
      console.error('Failed to refresh balance:', error);
      // Don't set error state for balance refresh failures
    }
  },

  // Check if wallet is still connected
  checkConnection: async () => {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        return;
      }

      // Check if Freighter is still connected
      const connectionResult = await isConnected();
      
      if (connectionResult.error || !connectionResult.isConnected) {
        get().disconnect();
        return;
      }

      // If we think we're connected but don't have an address, try to get it
      const { isConnected: storeConnected, address } = get();
      if (storeConnected && !address) {
        const addressResult = await getAddress();
        if (addressResult.error || !addressResult.address) {
          get().disconnect();
          return;
        }
        
        set({ 
          address: addressResult.address, 
          publicKey: addressResult.address 
        });
      }
      
      console.log('Connection check completed');
    } catch (error) {
      console.error('Connection check failed:', error);
      get().disconnect();
    }
  },

  // Start wallet watcher (internal method)
  startWalletWatcher: () => {
    if (walletWatcher) {
      walletWatcher.stop();
    }

    walletWatcher = new WatchWalletChanges(3000); // Check every 3 seconds
    
    walletWatcher.watch((changes) => {
      const { address: currentAddress, network: currentNetwork } = get();
      
      // Check if address changed
      if (changes.address !== currentAddress) {
        if (changes.address) {
          set({
            address: changes.address,
            publicKey: changes.address,
            isConnected: true
          });
          console.log('Wallet address changed:', changes.address);
        } else {
          get().disconnect();
        }
      }

      // Check if network changed
      const mappedNetwork = changes.network === 'PUBLIC' ? 'mainnet' : 'testnet';
      if (mappedNetwork !== currentNetwork) {
        set({ network: mappedNetwork });
        console.log('Network changed:', changes.network);
      }
    });
  }
})); 