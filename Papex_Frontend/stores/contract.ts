import { create } from 'zustand';
import { AssetMetadata, ComplianceData, ContractInfo } from '@/lib/types';
import { createContractClient, getContractInfo, getUserContractData } from '@/lib/contract';
import { RWA_CONTRACT_ID } from '@/lib/stellar';

interface ContractStore {
  // Contract information
  contractId: string;
  assetMetadata: AssetMetadata | null;
  totalSupply: string;
  isPaused: boolean;
  admin: string | null;

  // User-specific data
  userBalance: string;
  isWhitelisted: boolean;
  compliance: ComplianceData | null;

  // UI state
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;

  // Actions
  fetchContractData: () => Promise<void>;
  fetchUserData: (address: string) => Promise<void>;
  refreshBalance: (address: string) => Promise<void>;
  transfer: (from: string, to: string, amount: string) => Promise<boolean>;
  clearError: () => void;
  setContractId: (contractId: string) => void;
}

export const useContractStore = create<ContractStore>((set, get) => ({
  // Initial state
  contractId: RWA_CONTRACT_ID,
  assetMetadata: null,
  totalSupply: '0',
  isPaused: false,
  admin: null,
  userBalance: '0',
  isWhitelisted: false,
  compliance: null,
  isLoading: false,
  error: null,
  lastUpdated: null,

  // Clear error state
  clearError: () => set({ error: null }),

  // Set contract ID
  setContractId: (contractId: string) => {
    set({ contractId });
  },

  // Fetch general contract information
  fetchContractData: async () => {
    const { contractId } = get();
    set({ isLoading: true, error: null });

    try {
      console.log(`Fetching contract data for ${contractId}...`);
      
      const contractInfo = await getContractInfo(contractId);
      
      set({
        assetMetadata: contractInfo.metadata,
        totalSupply: contractInfo.totalSupply,
        isPaused: contractInfo.isPaused,
        admin: contractInfo.admin,
        isLoading: false,
        lastUpdated: Date.now()
      });

      console.log('Contract data fetched successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch contract data';
      console.error('Error fetching contract data:', errorMessage);
      
      set({
        isLoading: false,
        error: errorMessage
      });
    }
  },

  // Fetch user-specific contract data
  fetchUserData: async (address: string) => {
    const { contractId } = get();
    set({ isLoading: true, error: null });

    try {
      console.log(`Fetching user data for ${address}...`);
      
      const userData = await getUserContractData(address, contractId);
      
      set({
        userBalance: userData.balance,
        isWhitelisted: userData.isWhitelisted,
        compliance: userData.compliance,
        isLoading: false,
        lastUpdated: Date.now()
      });

      console.log('User data fetched successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user data';
      console.error('Error fetching user data:', errorMessage);
      
      set({
        isLoading: false,
        error: errorMessage
      });
    }
  },

  // Refresh only user balance
  refreshBalance: async (address: string) => {
    const { contractId } = get();

    try {
      console.log(`Refreshing balance for ${address}...`);
      
      const client = createContractClient(contractId);
      const balance = await client.balance(address);
      
      set({
        userBalance: balance,
        lastUpdated: Date.now()
      });

      console.log('Balance refreshed successfully');
    } catch (error) {
      console.error('Error refreshing balance:', error);
      // Don't set error state for balance refresh failures
    }
  },

  // Transfer tokens
  transfer: async (from: string, to: string, amount: string): Promise<boolean> => {
    const { contractId } = get();
    set({ isLoading: true, error: null });

    try {
      console.log(`Initiating transfer: ${amount} tokens from ${from} to ${to}`);
      
      const client = createContractClient(contractId);
      const success = await client.transfer(from, to, amount);
      
      if (success) {
        // Refresh user balance after successful transfer
        await get().refreshBalance(from);
        console.log('Transfer completed successfully');
      }
      
      set({ isLoading: false });
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transfer failed';
      console.error('Transfer error:', errorMessage);
      
      set({
        isLoading: false,
        error: errorMessage
      });
      
      return false;
    }
  }
})); 