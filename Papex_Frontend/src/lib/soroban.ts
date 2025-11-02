import {
  Account,
  Address,
  BASE_FEE,
  Contract,
  SorobanRpc,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
  xdr,
  Operation,
  StrKey,
} from '@stellar/stellar-sdk';
import { signTransaction as freighterSignTransaction } from '@stellar/freighter-api';
import { STELLAR_CONFIG } from '../config/stellar';

// Soroban testnet RPC endpoints (try in order if primary fails)
const RPC_ENDPOINTS = [
  'https://soroban-testnet.stellar.org:443', // Official Soroban testnet RPC (port 443)
  'https://rpc-testnet.stellar.org', // Alternative endpoint
];

const server = new SorobanRpc.Server(
  STELLAR_CONFIG.rpcUrl || RPC_ENDPOINTS[0], 
  { allowHttp: true }
);

const toAccount = async (publicKey: string): Promise<Account> => {
  // Validate public key format
  if (!publicKey || typeof publicKey !== 'string' || publicKey.trim() === '') {
    throw new Error('Invalid public key: must be a non-empty string');
  }
  
  const trimmedKey = publicKey.trim();
  
  // Stellar public keys are 56 characters and start with 'G'
  if (!trimmedKey.startsWith('G') || trimmedKey.length !== 56) {
    throw new Error(
      `Invalid public key format: "${trimmedKey.substring(0, 10)}...". ` +
      `Stellar public keys must start with 'G' and be 56 characters long. ` +
      `Please connect your wallet again.`
    );
  }
  
  try {
    const accountResponse = await server.getAccount(trimmedKey);
    return new Account(accountResponse.accountId(), accountResponse.sequenceNumber());
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    
    // For view-only calls, we can use a dummy account with sequence 0
    // This works because view calls don't require a funded account
    if (errorMsg.includes('not found') || errorMsg.includes('does not exist')) {
      console.warn(`Account ${trimmedKey.substring(0, 8)}... not found, using dummy account for view call`);
      return new Account(trimmedKey, '0');
    }
    
    // For transaction calls, account must exist and be funded
    if (errorMsg.includes('accountId is invalid') || errorMsg.includes('invalid')) {
      throw new Error(
        `Invalid or unfunded account: ${trimmedKey.substring(0, 8)}... ` +
        `Please make sure your wallet is connected correctly and the account has XLM balance. ` +
        `For testnet, get free XLM from: https://laboratory.stellar.org/#account-creator?network=testnet`
      );
    }
    
    throw new Error(`Failed to load account ${trimmedKey.substring(0, 8)}...: ${errorMsg}`);
  }
};

const buildTransaction = async (
  source: Account,
  contractId: string,
  method: string,
  args: xdr.ScVal[],
) => {
  const contract = new Contract(contractId);
  return new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: STELLAR_CONFIG.networkPassphrase,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();
};

export const invokeView = async (
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  publicKey?: string | null,
) => {
  try {
    const viewAccount = publicKey
      ? await toAccount(publicKey)
      : await toAccount('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF');

    const tx = await buildTransaction(viewAccount, contractId, method, args);
    const simulation = await server.simulateTransaction(tx);
    
    if (SorobanRpc.Api.isSimulationError(simulation)) {
      throw new Error(`Simulation failed: ${simulation.error}`);
    }

    if (simulation.result && simulation.result.retval) {
      return scValToNative(simulation.result.retval);
    } else {
      throw new Error('No return value from view call');
    }
  } catch (error) {
    console.error('View invocation error:', error);
    throw error;
  }
};

export const invokeTransaction = async (
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  signTransaction: (xdr: string, opts: any) => Promise<string>,
  publicKey: string,
) => {
  try {
    console.log('🔍 invokeTransaction: Getting account for publicKey:', publicKey.substring(0, 8) + '...');
  const source = await toAccount(publicKey);
    console.log('✅ Account loaded, building transaction...');
    
  let tx = await buildTransaction(source, contractId, method, args);
    console.log('✅ Transaction built, simulating...');
    
    // Simulate first to get resource estimates - handle XDR parse errors and RPC failures
    let simulation;
    try {
      simulation = await server.simulateTransaction(tx);
    } catch (simError: any) {
      const simErrorMsg = String(simError?.message || '');
      
      // Check for network errors - but be careful, some errors are expected (405 from browser access)
      // The RPC endpoint works for actual RPC calls, just not browser GET requests
      if (simErrorMsg.includes('Failed to fetch') && 
          !simErrorMsg.includes('405') && // 405 is expected when accessing RPC URL in browser
          !simErrorMsg.includes('Method Not Allowed')) {
        console.warn('⚠️ Network error during simulation, but continuing...', simErrorMsg);
        // Continue - might be a transient network issue
      } else if (simErrorMsg.includes('NetworkError') ||
                 simErrorMsg.includes('ERR_NETWORK')) {
        console.warn('⚠️ Network error during simulation, but continuing...', simErrorMsg);
        // Continue - might be a transient network issue
      }
      
      if (simErrorMsg.includes('switch') || simErrorMsg.includes('is not a function')) {
        console.warn('⚠️ Simulation XDR parse error (non-critical), continuing...');
        // Continue anyway - simulation is optional for validation
      } else {
        throw simError;
      }
    }
    
    if (simulation && SorobanRpc.Api.isSimulationError(simulation)) {
      const simErrorMsg = String(simulation.error || '');
      const simErrorData = (simulation as any).errorResultXdr || (simulation as any).diagnosticEvents;
      
      // Check for specific contract errors
      if (simErrorMsg.includes('UnreachableCodeReached') || simErrorMsg.includes('InvalidAction')) {
        // This usually means a panic!() in the contract
        // Check if it's "already initialized" - but don't throw, let createToken handle it
        const errorDetails = JSON.stringify(simErrorData || {});
        if (errorDetails.includes('already initialized') || 
            (errorDetails.includes('init') && errorDetails.includes('panic'))) {
          // Return a special error that createToken can catch and handle
          throw new Error(
            `CONTRACT_ALREADY_INITIALIZED: Contract ${contractId.substring(0, 8)}... is already initialized. ` +
            `Simulation error: ${simErrorMsg}`
          );
        }
        
        // Provide more specific error messages based on method
        let errorDetail = '';
        if (method === 'set_token') {
          errorDetail = 
            `\n\nPossible causes:\n` +
            `1. Paper ID not found in registry\n` +
            `2. You are not the paper owner or admin\n` +
            `3. Paper may not be registered yet\n` +
            `\nTry: Check if paper ID ${contractId === STELLAR_CONFIG.registryContractId ? 'exists' : 'is correct'} and you have permission.`;
        } else if (method === 'init') {
          errorDetail = 
            `\n\nPossible causes:\n` +
            `1. Contract already initialized\n` +
            `2. Invalid parameters (negative values, etc.)\n` +
            `3. Authorization failed\n` +
            `\nTry: Deploy a new contract instance if already initialized.`;
        } else if (method === 'buy') {
          errorDetail = 
            `\n\nPossible causes:\n` +
            `1. Trading is disabled - contract owner needs to enable trading\n` +
            `2. Exceeds max supply - amount is too large\n` +
            `3. Insufficient payment - max_payment is less than quote cost\n` +
            `4. Native XLM payment failed - ensure sufficient XLM balance\n` +
            `\nTry: Check token config (trading enabled?), reduce amount, or increase max_payment.`;
        } else if (method === 'sell') {
          errorDetail = 
            `\n\nPossible causes:\n` +
            `1. Trading is disabled\n` +
            `2. Insufficient token balance\n` +
            `3. Slippage too high - min_payment exceeds quote cost\n` +
            `4. Insufficient liquidity in contract\n` +
            `\nTry: Check token balance, reduce amount, or adjust slippage tolerance.`;
        }
        
        throw new Error(
          `❌ Contract ${method} simulation failed. ` +
          `This usually indicates a contract error (panic). ` +
          `Error: ${simErrorMsg} ` +
          `Contract: ${contractId.substring(0, 8)}... ` +
          `Method: ${method}.` +
          errorDetail +
          `\n\nCheck contract code and parameters.`
        );
      }
      
      throw new Error(`Simulation failed: ${simErrorMsg}`);
    }
    
    console.log('✅ Simulation complete, preparing transaction...');
    
    // Prepare the transaction with simulated data - handle XDR parse errors
    try {
  tx = await server.prepareTransaction(tx);
      console.log('✅ Transaction prepared');
    } catch (prepError: any) {
      const prepErrorMsg = String(prepError?.message || '');
      if (prepErrorMsg.includes('switch') || prepErrorMsg.includes('is not a function')) {
        console.warn('⚠️ prepareTransaction XDR parse error, but transaction might still work');
        // Continue with the original transaction
      } else {
        throw prepError;
      }
    }
    
    // Sign transaction
  const signed = await signTransaction(tx.toXDR(), {
    networkPassphrase: STELLAR_CONFIG.networkPassphrase,
  });
    
    // Parse signed transaction - handle XDR parsing errors
    let prepared;
    try {
      const signedXdr = typeof signed === 'string' ? signed : (signed as any).signedTxXdr || (signed as any).xdr || String(signed);
      prepared = TransactionBuilder.fromXDR(signedXdr, STELLAR_CONFIG.networkPassphrase);
    } catch (xdrParseError: any) {
      const errorMsg = String(xdrParseError?.message || '');
      if (errorMsg.includes('switch') || errorMsg.includes('is not a function')) {
        console.error('⚠️ XDR parse error in fromXDR. Signed transaction format:', typeof signed);
        console.error('Signed value:', signed);
        
        // Try alternative parsing methods
        if (typeof signed === 'string') {
          // Try to parse as base64 XDR
          try {
            prepared = TransactionBuilder.fromXDR(signed, STELLAR_CONFIG.networkPassphrase);
          } catch {
            throw new Error(
              `Failed to parse signed transaction XDR. ` +
              `This may be due to SDK/network version mismatch. ` +
              `Signed XDR length: ${signed.length} characters. ` +
              `Original error: ${errorMsg}`
            );
          }
        } else if ((signed as any).signedTxXdr) {
          try {
            prepared = TransactionBuilder.fromXDR((signed as any).signedTxXdr, STELLAR_CONFIG.networkPassphrase);
          } catch {
            throw new Error(
              `Failed to parse signedTxXdr. ` +
              `Original error: ${errorMsg}`
            );
          }
        } else {
          throw new Error(
            `Invalid signed transaction format. Expected string or object with signedTxXdr. ` +
            `Got: ${typeof signed}. ` +
            `Original error: ${errorMsg}`
          );
        }
      } else {
        throw xdrParseError;
      }
    }
    
    // Send transaction - try RPC, but if it fails, we can still proceed with just Horizon polling
    let response: any;
    try {
      response = await server.sendTransaction(prepared);
    } catch (sendError: any) {
      const sendErrorMsg = String(sendError?.message || '');
      
      // Check for actual network errors (not 405 which is expected for browser GET requests)
      if (sendErrorMsg.includes('Failed to fetch') && 
          !sendErrorMsg.includes('405') && 
          !sendErrorMsg.includes('Method Not Allowed')) {
        console.error('❌ Network error sending transaction:', sendErrorMsg);
        throw new Error(
          `Failed to send transaction to Soroban RPC. ` +
          `Please check your network connection and try again. ` +
          `\nIf the issue persists, you can use Soroban CLI:\n` +
          `stellar tx submit <signed-xdr> --network testnet\n` +
          `\nOriginal error: ${sendErrorMsg}`
        );
      } else if (sendErrorMsg.includes('NetworkError') ||
                 sendErrorMsg.includes('ERR_NETWORK')) {
        console.error('❌ Network error sending transaction:', sendErrorMsg);
        throw new Error(
          `Network error while sending transaction. ` +
          `Please check your connection and try again.\n` +
          `Original error: ${sendErrorMsg}`
        );
      }
      
      // Re-throw other errors
      throw sendError;
    }

    // Check if transaction failed (status is a string, not an enum)
    if (response.status === 'ERROR') {
      const errorMsg = (response as any).errorResultXdr || (response as any).errorResult || 'Transaction failed to send';
      throw new Error(errorMsg);
  }

  if (!response.hash) {
      throw new Error('No transaction hash returned');
  }

    // Wait for transaction to complete - use ONLY Horizon API since RPC is down
    console.log('⏳ Waiting for transaction to complete via Horizon API, hash:', response.hash);
    console.log('ℹ️ Using Horizon API because Soroban RPC is currently unavailable');
    
    const horizonUrl = STELLAR_CONFIG.horizonUrl || 'https://horizon-testnet.stellar.org';
    let finalResponse = null;
    
    // Poll Horizon API directly (RPC çalışmıyor)
    for (let horizonAttempt = 0; horizonAttempt < 120; horizonAttempt++) { // 2 minutes max
      try {
        const horizonResponse = await fetch(`${horizonUrl}/transactions/${response.hash}`);
        if (horizonResponse.ok) {
          const horizonData = await horizonResponse.json();
          
          if (horizonData.successful === true) {
            console.log('✅ Transaction confirmed successful via Horizon!');
            // Return success - we can't get returnValue from Horizon but transaction succeeded
            finalResponse = {
              hash: response.hash,
              status: 'SUCCESS',
              successful: true,
              returnValue: null,
              horizonConfirmed: true,
            };
            break;
          } else if (horizonData.successful === false) {
            throw new Error(
              `Transaction failed on blockchain. ` +
              `Check: https://stellar.expert/explorer/testnet/tx/${response.hash}`
            );
          }
          // Transaction not in ledger yet, continue polling
        } else if (horizonResponse.status === 404) {
          // Transaction not found yet, still processing
          if ((horizonAttempt + 1) % 10 === 0) {
            console.log(`⏳ Transaction not in ledger yet... (${(horizonAttempt + 1) * 2}s)`);
          }
        }
      } catch (horizonErr: any) {
        const errorMsg = String(horizonErr?.message || '');
        // Only log errors that aren't 404 (not found is expected while processing)
        if (!errorMsg.includes('404') && !errorMsg.includes('Not Found')) {
          console.warn(`⚠️ Horizon check error (attempt ${horizonAttempt + 1}):`, errorMsg);
        }
      }
      
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Check every 2 seconds
    }

    if (!finalResponse) {
      // Horizon polling de başarısız oldu
      throw new Error(
        `Failed to get transaction result after polling both RPC and Horizon. ` +
        `Transaction hash: ${response.hash}. ` +
        `The transaction may still be processing or RPC/Horizon are slow. ` +
        `Check status: https://stellar.expert/explorer/testnet/tx/${response.hash}`
      );
    }
    
    // Check if transaction failed (status is a string)
    const finalStatusStr = String((finalResponse as any)?.status || '');
    if (finalStatusStr === 'FAILED') {
      const errorMsg = (finalResponse as any).errorResultXdr || (finalResponse as any).errorResult || 'Transaction failed';
      throw new Error(`Transaction failed: ${errorMsg}`);
    }
    
    // Extract return value - handle scValToNative errors gracefully
    // Type guard: returnValue only exists on successful transactions
    const returnValue = (finalResponse as any)?.returnValue;
    if (returnValue) {
      try {
        // Check if returnValue is already a native type
        const returnVal = returnValue;
        
        // If it's already a native value, return it directly
        if (typeof returnVal === 'string' || typeof returnVal === 'number' || typeof returnVal === 'boolean' || 
            Array.isArray(returnVal) || returnVal === null || returnVal === undefined) {
          return {
            ...finalResponse,
            returnValue: returnVal,
          };
        }
        
        // Try to convert using scValToNative
        try {
          const converted = scValToNative(returnVal);
          return {
            ...finalResponse,
            returnValue: converted,
          };
        } catch (scValError: any) {
          const errorMsg = String(scValError?.message || '');
          if (errorMsg.includes('switch') || errorMsg.includes('is not a function')) {
            // XDR parsing issue - return the raw response instead
            console.warn('⚠️ scValToNative conversion failed (XDR parse issue), returning raw response:', errorMsg);
            return {
              ...finalResponse,
              returnValue: returnVal,
              conversionError: 'Could not convert returnValue, using raw value',
            };
          }
          throw scValError;
        }
      } catch (conversionError) {
        console.warn('⚠️ Return value conversion failed, returning raw response:', conversionError);
        return {
          ...finalResponse,
          conversionError: String(conversionError),
        };
      }
    }
    
    return finalResponse;
  } catch (error) {
    console.error('Transaction invocation error:', error);
    throw error;
  }
};

/* ---- Token functions ---- */

export const createToken = async (
  contractId: string,
  name: string,
  symbol: string,
  decimals: number,
  supply: bigint,
  signTransaction: (xdr: string, opts: any) => Promise<string>,
  publicKey: string,
  tokenMetadataUrl?: string,
) => {
  const args = [
    nativeToScVal(name, { type: 'string' }),
    nativeToScVal(symbol, { type: 'string' }),
    nativeToScVal(decimals, { type: 'u32' }),
    nativeToScVal(supply, { type: 'i128' }),
    new Address(publicKey).toScVal(),
  ];
  
  if (tokenMetadataUrl) {
    args.push(nativeToScVal(tokenMetadataUrl, { type: 'string' }));
  }
  
  return invokeTransaction(contractId, 'create_token', args, signTransaction, publicKey);
};

export const getTokenInfo = async (
  contractId: string,
  tokenId: bigint,
  publicKey?: string,
) => {
  const args = [nativeToScVal(tokenId, { type: 'u32' })];
  return invokeView(contractId, 'get_token', args, publicKey);
};

export const getTokenSupply = async (
  contractId: string,
  tokenId: bigint,
  publicKey?: string,
) => {
  const args = [nativeToScVal(tokenId, { type: 'u32' })];
  return invokeView(contractId, 'get_supply', args, publicKey);
};

export const getTokenBalance = async (
  contractId: string,
  tokenId: bigint,
  accountId: string,
  publicKey?: string,
) => {
  const args = [
    nativeToScVal(tokenId, { type: 'u32' }),
    new Address(accountId).toScVal(),
  ];
  return invokeView(contractId, 'balance_of', args, publicKey);
};

export const transfer = async (
  contractId: string,
  tokenId: bigint,
  to: string,
  amount: bigint,
  signTransaction: (xdr: string, opts: any) => Promise<string>,
  publicKey: string,
) => {
  const args = [
    nativeToScVal(tokenId, { type: 'u32' }),
    new Address(publicKey).toScVal(),
    new Address(to).toScVal(),
    nativeToScVal(amount, { type: 'i128' }),
  ];
  return invokeTransaction(contractId, 'transfer', args, signTransaction, publicKey);
};

export const mint = async (
  contractId: string,
  tokenId: bigint,
  to: string,
  amount: bigint,
  signTransaction: (xdr: string, opts: any) => Promise<string>,
  publicKey: string,
) => {
  const args = [
    nativeToScVal(tokenId, { type: 'u32' }),
    new Address(to).toScVal(),
    nativeToScVal(amount, { type: 'i128' }),
  ];
  return invokeTransaction(contractId, 'mint', args, signTransaction, publicKey);
};

export const burn = async (
  contractId: string,
  tokenId: bigint,
  from: string,
  amount: bigint,
  signTransaction: (xdr: string, opts: any) => Promise<string>,
  publicKey: string,
) => {
  const args = [
    nativeToScVal(tokenId, { type: 'u32' }),
    new Address(from).toScVal(),
    nativeToScVal(amount, { type: 'i128' }),
  ];
  return invokeTransaction(contractId, 'burn', args, signTransaction, publicKey);
};

export const freeze = async (
  contractId: string,
  tokenId: bigint,
  signTransaction: (xdr: string, opts: any) => Promise<string>,
  publicKey: string,
) => {
  const args = [nativeToScVal(tokenId, { type: 'u32' })];
  return invokeTransaction(contractId, 'freeze', args, signTransaction, publicKey);
};

export const unfreeze = async (
  contractId: string,
  tokenId: bigint,
  signTransaction: (xdr: string, opts: any) => Promise<string>,
  publicKey: string,
) => {
  const args = [nativeToScVal(tokenId, { type: 'u32' })];
  return invokeTransaction(contractId, 'unfreeze', args, signTransaction, publicKey);
};

export const setTokenMetadata = async (
  contractId: string,
  tokenId: bigint,
  metadataUrl: string,
  signTransaction: (xdr: string, opts: any) => Promise<string>,
  publicKey: string,
) => {
  const args = [
    nativeToScVal(tokenId, { type: 'u32' }),
    nativeToScVal(metadataUrl, { type: 'string' }),
  ];
  return invokeTransaction(contractId, 'set_token_metadata', args, signTransaction, publicKey);
};

// Cache for WASM hash to skip upload step on subsequent deployments
const WASM_HASH_CACHE_KEY = 'papex_token_wasm_hash';

export const deployContract = async (
  publicKey: string,
  signTransaction?: (xdr: string, opts: any) => Promise<string>,
  wasmBytes?: Uint8Array,
  wasmPath: string = '/contracts/papex_papertoken.wasm',
) => {
  try {
    console.log('🚀 Starting fast contract deployment...');
    
    // Validate publicKey before proceeding
    if (!publicKey || typeof publicKey !== 'string' || publicKey.trim() === '') {
      throw new Error(
        'Wallet not connected. Please connect your Freighter wallet first.'
      );
    }
    
    const source = await toAccount(publicKey);
    const signFn = signTransaction || freighterSignTransaction;
    
    // Check if we have cached or pre-configured WASM hash
    let wasmHash: Uint8Array | null = null;
    const cachedHashHex = localStorage.getItem(WASM_HASH_CACHE_KEY);
    const preDeployedHash = STELLAR_CONFIG.preDeployedWasmHash;
    
    if (cachedHashHex) {
      console.log('✓ Found cached WASM hash, skipping upload step!');
      wasmHash = new Uint8Array(
        cachedHashHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
      );
    } else if (preDeployedHash) {
      console.log('✓ Using pre-deployed WASM hash from config, skipping upload step!');
      wasmHash = new Uint8Array(
        preDeployedHash.match(/.{1,2}/g)!.map((byte: string) => parseInt(byte, 16))
      );
      // Cache it for future use
      localStorage.setItem(WASM_HASH_CACHE_KEY, preDeployedHash);
    } else {
      console.log('⚡ First deployment - uploading WASM (this only happens once)...');
      console.log('💡 TIP: Bu yavaş geliyorsa, terminal\'de "soroban contract install" komutunu çalıştırıp hash\'i manuel ekleyebilirsiniz.');
      
      // Fetch WASM file
      let wasmFile: Uint8Array;
      if (wasmBytes) {
        wasmFile = wasmBytes;
      } else {
        const wasmResponse = await fetch(wasmPath);
        if (!wasmResponse.ok) {
          throw new Error(`Failed to fetch WASM: ${wasmResponse.status}`);
        }
        wasmFile = new Uint8Array(await wasmResponse.arrayBuffer());
      }
      console.log(`WASM loaded: ${wasmFile.length} bytes`);
      
      // Upload WASM (Step 1 - only once)
      // Use longer timeout for slow networks
      let uploadTx = new TransactionBuilder(source, {
        fee: String(Number(BASE_FEE) * 2000), // Increased fee for faster processing
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      })
        .addOperation(
          Operation.invokeHostFunction({
            func: xdr.HostFunction.hostFunctionTypeUploadContractWasm(wasmFile as any),
            auth: [],
          })
        )
        .setTimeout(180) // Increased timeout to 3 minutes
        .build();
      
      uploadTx = await server.prepareTransaction(uploadTx);
      
      const signedUpload = await signFn(uploadTx.toXDR(), {
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      });
      
      const signedUploadXdr = typeof signedUpload === 'string' ? signedUpload : signedUpload.signedTxXdr;
      const preparedUpload = TransactionBuilder.fromXDR(signedUploadXdr, STELLAR_CONFIG.networkPassphrase);
      
      const uploadResponse = await server.sendTransaction(preparedUpload);
      
      if (uploadResponse.status === 'ERROR' || !uploadResponse.hash) {
        throw new Error('WASM upload failed');
      }
      
      console.log('WASM upload sent:', uploadResponse.hash);
      
      // Wait for upload (with progress)
      let uploadResult = null;
      let uploadAttempts = 0;
      
      console.log('Waiting for upload confirmation...');
      
      while (uploadAttempts < 60) {
      try {
        uploadResult = await server.getTransaction(uploadResponse.hash);
        
        if ((uploadAttempts + 1) % 10 === 0) {
          console.log(`Still waiting... (${uploadAttempts + 1}s)`);
        }
        
        if (uploadResult.status === 'SUCCESS') {
          console.log('✓ Upload confirmed!');
          break;
        } else if (uploadResult.status === 'FAILED') {
          const errorMsg = (uploadResult as any).errorResultXdr || 'Upload failed';
          throw new Error('WASM upload transaction failed: ' + errorMsg);
        } else if (uploadResult.status === 'NOT_FOUND' || uploadResult.status === 'PENDING') {
          // Transaction still processing, continue waiting
        }
      } catch (err: any) {
        const errorMsg = String(err?.message || '');
        
        // Handle "Bad union switch" and other XDR parsing errors
        if (errorMsg.includes('Bad union switch') || 
            errorMsg.includes('not found') || 
            errorMsg.includes('NOT_FOUND')) {
          console.log(`[Upload Attempt ${uploadAttempts + 1}/60] Transaction processing...`);
          // Continue waiting
        } else if (!errorMsg.includes('WASM upload transaction failed')) {
          // Log other unexpected errors but continue
          console.warn('Error checking upload status:', errorMsg);
        } else {
          // Re-throw deployment failures
          throw err;
        }
      }
        
        uploadAttempts++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      if (!uploadResult || uploadResult.status !== 'SUCCESS') {
        // Try harder to get the result
        console.log('⏳ Upload took longer than expected, retrying with longer interval...');
        
        for (let i = 0; i < 30; i++) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second intervals
          try {
            uploadResult = await server.getTransaction(uploadResponse.hash);
            if (uploadResult.status === 'SUCCESS') {
              console.log('✓ Upload confirmed after extended wait!');
              break;
            }
          } catch (err) {
            // Continue trying
          }
          
          if ((i + 1) % 5 === 0) {
            console.log(`Still waiting... (${60 + (i + 1) * 2}s total)`);
          }
        }
        
        if (!uploadResult || uploadResult.status !== 'SUCCESS') {
          // Check Horizon as final fallback
          try {
            const horizonUrl = STELLAR_CONFIG.rpcUrl.replace('soroban-', 'horizon-').replace('/soroban/rpc', '') || 'https://horizon-testnet.stellar.org';
            const horizonResponse = await fetch(`${horizonUrl}/transactions/${uploadResponse.hash}`);
            if (horizonResponse.ok) {
              const horizonData = await horizonResponse.json();
              if (horizonData.successful === true) {
                console.log('✓ Upload confirmed successful via Horizon!');
                // Try RPC one more time with longer waits
                for (let i = 0; i < 20; i++) {
                  await new Promise(resolve => setTimeout(resolve, 3000));
                  try {
                    uploadResult = await server.getTransaction(uploadResponse.hash);
                    if (uploadResult.status === 'SUCCESS') {
                      console.log('✓ Finally got the result from RPC!');
                      break;
                    }
                  } catch {
                    // Keep trying
                  }
                }
              }
            }
          } catch (horizonErr) {
            console.error('Horizon check failed:', horizonErr);
          }
          
          if (!uploadResult || uploadResult.status !== 'SUCCESS') {
            throw new Error(
              'Upload was successful but RPC response timed out. ' +
              'Please manually cache the WASM hash. ' +
              'Open browser console and run: ' +
              `localStorage.setItem('papex_token_wasm_hash', 'YOUR_HASH_HERE'); ` +
              'Transaction: https://stellar.expert/explorer/testnet/tx/' + uploadResponse.hash
            );
          }
        }
      }
      
      // Extract and cache WASM hash
      const returnVal = (uploadResult as any).returnValue;
      if (!returnVal) {
        throw new Error('No WASM hash returned from transaction');
      }
      
      const hashBytes = scValToNative(returnVal);
      if (hashBytes instanceof Uint8Array) {
        wasmHash = hashBytes;
      } else if (hashBytes && typeof hashBytes === 'object' && 'buffer' in hashBytes) {
        wasmHash = new Uint8Array(hashBytes as any);
      } else {
        throw new Error('Invalid WASM hash format');
      }
      
      // Cache the hash for future deployments
      const hashHex = Array.from(wasmHash).map(b => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(WASM_HASH_CACHE_KEY, hashHex);
      console.log('✓ WASM hash cached - next deployments will be instant!');
    }
    
    // Step 2: Create contract instance (fast!)
    console.log('⚡ Creating contract instance (fast step)...');
    
    // Step 2: Create contract instance from WASM hash
    const salt = crypto.getRandomValues(new Uint8Array(32));
    
    // Decode the account public key
    const accountIdBuffer = StrKey.decodeEd25519PublicKey(publicKey);
    
    // Build create contract args using XDR factory methods
    let createArgs: xdr.CreateContractArgs;
    try {
      const accountAddress = xdr.ScAddress.scAddressTypeAccount(
        xdr.PublicKey.publicKeyTypeEd25519(accountIdBuffer)
      );
      
      const preimageFromAddress = new xdr.ContractIdPreimageFromAddress({
        address: accountAddress,
        salt: salt as any
      });
      
      const contractIdPreimage = xdr.ContractIdPreimage.contractIdPreimageFromAddress(
        preimageFromAddress
      );
      
      const executableWasm = xdr.ContractExecutable.contractExecutableWasm(
        wasmHash as any
      );
      
      createArgs = new xdr.CreateContractArgs({
        contractIdPreimage,
        executable: executableWasm
      });
      
      console.log('✅ CreateContractArgs built successfully');
      console.log('Contract executable type: WASM');
      console.log('Salt length:', salt.length);
      
    } catch (argsError: any) {
      console.error('❌ Failed to build CreateContractArgs:', argsError);
      throw new Error(
        `Failed to build contract creation arguments: ${argsError.message}. ` +
        `Please check WASM hash and account format.`
      );
    }
    
    // Build transaction for contract creation
    // Use higher fee for contract deployment transactions
    const deploymentFee = String(Number(BASE_FEE) * 2000); // Higher fee for deployment
    
    let createTx = new TransactionBuilder(source, {
      fee: deploymentFee,
      networkPassphrase: STELLAR_CONFIG.networkPassphrase,
    })
      .addOperation(
        Operation.invokeHostFunction({
          func: xdr.HostFunction.hostFunctionTypeCreateContract(createArgs),
          auth: [],
        })
      )
      .setTimeout(180) // Increased timeout for contract creation
      .build();
    
    console.log('✅ Transaction built, fee:', deploymentFee);
    
    // Simulate transaction first to get resource estimates
    let simulation;
    try {
      simulation = await server.simulateTransaction(createTx);
      if (SorobanRpc.Api.isSimulationError(simulation)) {
        console.warn('⚠️ Simulation error (non-critical for deployment):', simulation.error);
      } else {
        console.log('✅ Simulation successful');
      }
    } catch (simError: any) {
      console.warn('⚠️ Simulation failed (non-critical), continuing...', simError.message);
    }
    
    // Prepare transaction - try to prepare, but if XDR error occurs, use raw transaction
    // Some SDK versions have XDR parsing issues but transaction may still work
    let transactionToSign = createTx;
    let preparationSkipped = false;
    
    try {
      transactionToSign = await server.prepareTransaction(createTx);
      console.log('✅ Transaction prepared successfully');
    } catch (prepareError: any) {
      const prepareErrorMsg = String(prepareError?.message || '');
      
      // XDR version mismatch errors - these are SDK/network compatibility issues
      // But we'll try to send the transaction anyway without preparation
      if (prepareErrorMsg.includes('SorobanAuthorizedFunctionType') || 
          prepareErrorMsg.includes('XDR Read Error') ||
          prepareErrorMsg.includes('switch') ||
          prepareErrorMsg.includes('is not a function') ||
          prepareErrorMsg.includes('unknown')) {
        console.warn('⚠️ XDR parse error in prepareTransaction (SDK version mismatch)');
        console.warn('⚠️ Attempting to send transaction without preparation (may fail with txMalformed)...');
        preparationSkipped = true;
        // Use original transaction - it might work for some operations
        transactionToSign = createTx;
      } else {
        console.error('❌ prepareTransaction failed:', prepareErrorMsg);
        throw new Error(
          `Failed to prepare transaction for contract deployment. ` +
          `This step is required for Soroban transactions. ` +
          `Error: ${prepareErrorMsg}`
        );
      }
    }
    
    // Sign transaction (use prepared transaction if available)
    const signedCreate = await signFn(transactionToSign.toXDR(), {
      networkPassphrase: STELLAR_CONFIG.networkPassphrase,
    });
    
    if (preparationSkipped) {
      console.warn('⚠️ Transaction was signed without preparation. If you see "txMalformed" error, please update SDK: npm update @stellar/stellar-sdk');
    }
    
    // Parse signed transaction - handle XDR parsing errors
    // If parsing fails, try sending the raw XDR string directly
    const signedCreateXdr = typeof signedCreate === 'string' ? signedCreate : (signedCreate as any).signedTxXdr || (signedCreate as any).xdr || String(signedCreate);
    
    let preparedCreate;
    try {
      preparedCreate = TransactionBuilder.fromXDR(signedCreateXdr, STELLAR_CONFIG.networkPassphrase);
      console.log('✅ Signed transaction parsed successfully');
    } catch (parseError: any) {
      const parseErrorMsg = String(parseError?.message || '');
      console.warn('⚠️ Failed to parse signed transaction, will try sending raw XDR:', parseErrorMsg);
      // Will try to send raw XDR string instead
      preparedCreate = null;
    }
    
    console.log('Sending contract creation transaction...');
    
    // Send transaction with error handling
    let response: any;
    try {
      // Try using parsed transaction first, fallback to raw XDR string
      if (preparedCreate) {
        response = await server.sendTransaction(preparedCreate);
      } else {
        // Send raw XDR string if parsing failed
        console.log('⚠️ Sending transaction as raw XDR string (parsing failed)...');
        response = await server.sendTransaction(signedCreateXdr);
      }
    } catch (sendError: any) {
      const sendErrorMsg = String(sendError?.message || '');
      if (sendErrorMsg.includes('SorobanAuthorizedFunctionType') || 
          sendErrorMsg.includes('XDR Read Error')) {
        // If we have a hash despite the error, transaction might have been sent
        if ((sendError as any).hash) {
          console.warn('XDR parse error in sendTransaction, but transaction hash found. Continuing...');
          response = {
            status: 'PENDING',
            hash: (sendError as any).hash,
          };
        } else {
          throw new Error(
            `Transaction send encountered XDR parse error. This is likely an SDK version issue. ` +
            `Please try using Soroban CLI to deploy contracts instead. ` +
            `Original error: ${sendErrorMsg}`
          );
        }
      } else {
        throw sendError;
      }
    }
    
    // Check if transaction failed (status is a string, not an enum)
    if (response.status === 'ERROR' || (response.status === 'PENDING' && !response.hash)) {
      let errorMsg = 'Contract deployment failed to send';
      
      // Try to extract error message properly
      if ((response as any).errorResultXdr) {
        errorMsg = String((response as any).errorResultXdr);
      } else if ((response as any).errorResult) {
        const errResult = (response as any).errorResult;
        if (typeof errResult === 'string') {
          errorMsg = errResult;
        } else if (errResult && typeof errResult === 'object') {
          errorMsg = errResult.message || errResult.error || JSON.stringify(errResult);
        }
      } else if ((response as any).error) {
        const err = (response as any).error;
        errorMsg = typeof err === 'string' ? err : (err.message || JSON.stringify(err));
      }
      
      throw new Error(`Contract deployment failed: ${errorMsg}`);
    }
    
    if (!response.hash) {
      throw new Error('No transaction hash returned');
    }
    
    console.log('Deployment transaction sent, hash:', response.hash);
    
    // Wait for transaction to complete
    // Soroban transactions can take longer, especially contract deployments
    // Contract deployments typically take 5-30 seconds, but can take up to 2 minutes
    const maxAttemptsDeploy = 120; // 120 seconds (2 minutes) timeout for contract deployment
    let attemptsDeploy = 0;
    let finalResponse = null;
    
    while (attemptsDeploy < maxAttemptsDeploy) {
      try {
        // Try to get transaction - catch XDR parsing errors specifically
        try {
          finalResponse = await server.getTransaction(response.hash);
        } catch (xdrParseError: any) {
          // If it's an XDR parsing error (auth field issue), check Horizon instead
          const errorMsg = String(xdrParseError?.message || '');
          if (errorMsg.includes('SorobanAuthorizedFunctionType') || 
              errorMsg.includes('XDR Read Error') ||
              errorMsg.includes('unknown') && errorMsg.includes('member')) {
            console.warn('XDR parse error detected. Checking Horizon API instead...');
            
            // Check Horizon to see if transaction succeeded
            try {
              const horizonUrl = STELLAR_CONFIG.horizonUrl || 'https://horizon-testnet.stellar.org';
              const horizonResponse = await fetch(`${horizonUrl}/transactions/${response.hash}`);
              if (horizonResponse.ok) {
                const horizonData = await horizonResponse.json();
                if (horizonData.successful === true) {
                  // Transaction succeeded but we can't parse RPC response
                  // Create a minimal response object and break - we'll extract from returnValue
                  console.log('✓ Transaction confirmed successful via Horizon (XDR parse issue in RPC)');
                  finalResponse = {
                    status: 'SUCCESS',
                    hash: response.hash,
                    // returnValue will be extracted via alternative method below
                  };
                  break;
                } else if (horizonData.successful === false) {
                  throw new Error('Transaction failed on blockchain');
                }
              }
            } catch (horizonErr) {
              // Horizon check failed, continue waiting
            }
            
            // If Horizon didn't help, wait a bit and retry (maybe XDR will parse later)
            attemptsDeploy++;
            if (attemptsDeploy < maxAttemptsDeploy / 2) {
              console.log(`[Attempt ${attemptsDeploy}/${maxAttemptsDeploy}] XDR parse error, waiting for transaction to finalize...`);
              await new Promise((resolve) => setTimeout(resolve, 2000));
              continue;
            } else {
              // After many attempts, assume success and try to extract from Horizon
              console.warn('Multiple XDR parse errors. Assuming transaction succeeded and using Horizon fallback.');
              finalResponse = {
                status: 'SUCCESS',
                hash: response.hash,
              };
              break;
            }
          } else {
            // Not an XDR parse error, re-throw
            throw xdrParseError;
          }
        }
        
        if (!finalResponse) {
          attemptsDeploy++;
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
        
        console.log(`[Attempt ${attemptsDeploy + 1}/${maxAttemptsDeploy}] Transaction status:`, finalResponse.status);
        
        // Check if transaction is still pending or not found
        const statusStr = String(finalResponse.status || '');
        if (statusStr === 'NOT_FOUND' || statusStr.includes('NOT_FOUND') || 
            statusStr === 'PENDING' || statusStr.includes('PENDING')) {
          attemptsDeploy++;
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
        
        // Transaction is either SUCCESS or FAILED - break the loop
        console.log('Transaction finalized with status:', finalResponse.status);
        break;
      } catch (error: any) {
        const errorMsg = String(error?.message || '');
        const errorCode = String(error?.code || '');
        
        // Handle XDR parsing errors - these often happen when transaction is being processed
        // "Bad union switch" is a common XDR parsing error that occurs during transaction processing
        if (errorMsg.includes('Bad union switch') || 
            errorMsg.includes('not found') || errorMsg.includes('NOT_FOUND') || 
            errorCode === 'NOT_FOUND' || errorCode.includes('NOT_FOUND')) {
          attemptsDeploy++;
          console.log(`[Attempt ${attemptsDeploy}/${maxAttemptsDeploy}] Transaction processing (${errorMsg.substring(0, 50)}...), waiting...`);
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds for processing
          continue;
        }
        
        // For other errors, check if we can extract any useful info
        console.warn(`[Attempt ${attemptsDeploy + 1}/${maxAttemptsDeploy}] Error getting transaction:`, errorMsg);
        
        // If we're past halfway point, we might need to try a different approach
        if (attemptsDeploy > maxAttemptsDeploy / 2) {
          // Try one more time with longer wait
          attemptsDeploy++;
          await new Promise((resolve) => setTimeout(resolve, 3000));
          continue;
        }
        
        attemptsDeploy++;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    
    if (!finalResponse) {
      // Transaction might have succeeded but we couldn't parse the response from Soroban RPC
      // Try to check Horizon API as a fallback
      console.warn(`Could not get transaction response from Soroban RPC after ${maxAttemptsDeploy} seconds. Checking Horizon API...`);
      try {
        const horizonUrl = STELLAR_CONFIG.rpcUrl.replace('soroban-', 'horizon-').replace('/soroban/rpc', '') || 'https://horizon-testnet.stellar.org';
        const horizonResponse = await fetch(`${horizonUrl}/transactions/${response.hash}`);
        if (horizonResponse.ok) {
          const horizonData = await horizonResponse.json();
          if (horizonData.successful === true) {
            console.log('✓ Transaction confirmed successful via Horizon API');
            console.log(`Transaction hash: ${response.hash}`);
            console.log(`Ledger: ${horizonData.ledger}`);
            // Since we can't get contract ID from Horizon easily, we'll need to inform user
            throw new Error(
              `Transaction was successful on the blockchain (verified via Horizon API), ` +
              `but we could not extract the contract ID from the Soroban RPC response. ` +
              `Transaction hash: ${response.hash}. ` +
              `Please check the transaction on Stellar Expert to find the deployed contract ID: ` +
              `https://stellar.expert/explorer/testnet/tx/${response.hash}`
            );
          }
        }
      } catch (horizonError) {
        console.warn('Could not check Horizon API:', horizonError);
      }
      
      throw new Error(
        `Transaction is still processing after ${maxAttemptsDeploy} seconds. ` +
        `Transaction hash: ${response.hash}. ` +
        `Please check the transaction status manually: ` +
        `https://stellar.expert/explorer/testnet/tx/${response.hash}`
      );
    }
    
    const finalStatusStr = String(finalResponse.status || '');
    if (finalStatusStr === 'NOT_FOUND' || finalStatusStr.includes('NOT_FOUND') || 
        finalStatusStr === 'PENDING' || finalStatusStr.includes('PENDING')) {
      console.warn(`Transaction still pending after ${maxAttemptsDeploy} seconds. Transaction hash: ${response.hash}`);
      console.warn(`Check transaction status at: https://stellar.expert/explorer/testnet/tx/${response.hash}`);
      throw new Error(
        `Transaction still pending after ${maxAttemptsDeploy} seconds. ` +
        `Transaction hash: ${response.hash}. ` +
        `Please check the transaction status manually. It may complete in a few more seconds.`
      );
    }
    
    // Check if transaction failed (status is a string)
    if (finalResponse.status === 'FAILED') {
      const errorMsg = (finalResponse as any).errorResultXdr || (finalResponse as any).errorResult || 'Transaction failed';
      throw new Error(`Contract deployment failed: ${errorMsg}`);
    }
    
    // Extract contract ID from create transaction result
    // The contract ID is returned as an Address in the return value
    let contractId: string | null = null;
    
    try {
      // Get contract ID from return value
      if ((finalResponse as any).returnValue) {
        try {
          const returnVal = (finalResponse as any).returnValue;
          
          // The return value should be an ScAddress
          if (returnVal && returnVal.switch && returnVal.switch().name === 'scvAddress') {
            const addressVal = returnVal.address();
            const address = new Address(addressVal);
            contractId = address.toString();
            console.log('Contract ID extracted from returnValue:', contractId);
          } else {
            // Try to convert using scValToNative as fallback
            const nativeVal = scValToNative(returnVal);
            if (typeof nativeVal === 'string' && nativeVal.startsWith('C')) {
              contractId = nativeVal;
              console.log('Contract ID extracted via scValToNative:', contractId);
            }
          }
        } catch (err) {
          console.warn('Could not extract from returnValue:', err);
        }
      }
      
      // Skip resultMetaXdr parsing entirely - it causes XDR auth field errors
      // The returnValue above should be sufficient for contract ID extraction
      // If contractId is still not found, we'll provide a helpful error message below
      if (!contractId) {
        console.warn('Contract ID not found in returnValue. This may be due to network/SDK version mismatch.');
        console.warn('Transaction hash:', response.hash);
        console.warn('Please check the transaction on Stellar Expert to find the contract ID manually.');
      }
    } catch (error) {
      console.error('Error extracting contract ID:', error);
    }
    
    if (!contractId) {
      // Provide helpful error with transaction hash
      throw new Error(
        `Could not extract contract ID from deployment transaction. ` +
        `Transaction was successful but contract ID extraction failed. ` +
        `Transaction hash: ${response.hash}. ` +
        `Please check the transaction on Stellar Expert: ` +
        `https://stellar.expert/explorer/testnet/tx/${response.hash}`
      );
    }
    
    console.log('✓ Contract deployed successfully!');
    console.log('Contract ID:', contractId);
    console.log('Transaction hash:', response.hash);
    return contractId;
  } catch (error: any) {
    const errorMsg = String(error?.message || '');
    
    // If it's an XDR parse error, try to recover by checking Horizon
    if (errorMsg.includes('SorobanAuthorizedFunctionType') || 
        errorMsg.includes('XDR Read Error') ||
        (errorMsg.includes('unknown') && errorMsg.includes('member'))) {
      console.error('XDR parse error in deployment. Trying Horizon recovery...');
      
      // Try to get the transaction hash from the error context
      // If we have a response with hash, check Horizon
      try {
        const horizonUrl = STELLAR_CONFIG.horizonUrl || 'https://horizon-testnet.stellar.org';
        
        // Try to find transaction hash in error or response
        let txHash: string | null = null;
        if ((error as any).hash) {
          txHash = (error as any).hash;
        } else if ((error as any).response?.hash) {
          txHash = (error as any).response.hash;
        }
        
        if (txHash) {
          const horizonResponse = await fetch(`${horizonUrl}/transactions/${txHash}`);
          if (horizonResponse.ok) {
            const horizonData = await horizonResponse.json();
            if (horizonData.successful === true) {
              throw new Error(
                `Contract deployment succeeded, but we cannot parse the response due to SDK version mismatch. ` +
                `Please find the contract ID manually on Stellar Expert: ` +
                `https://stellar.expert/explorer/testnet/tx/${txHash}`
              );
            }
          }
        }
      } catch (horizonErr) {
        // Continue with original error
      }
      
      // If we can't recover, provide helpful error message with solutions
      throw new Error(
        `⚠️ XDR Parsing Error (SDK Version Mismatch)\n\n` +
        `The Stellar SDK cannot parse the network response. This is a known issue.\n\n` +
        `✅ SOLUTIONS:\n` +
        `1. Check Freighter wallet - transaction may have succeeded\n` +
        `2. Use Soroban CLI instead (RECOMMENDED):\n` +
        `   cd Papex_Contracts/contracts/papex-contract\n` +
        `   stellar contract deploy --wasm target/wasm32v1-none/release/papex_papertoken.wasm --network testnet\n` +
        `3. Update @stellar/stellar-sdk: npm install @stellar/stellar-sdk@latest\n\n` +
        `Original error: ${errorMsg}`
      );
    }
    
    // For non-XDR errors, format error message properly
    let errorMessage = 'Contract deployment failed';
    
    if (error && typeof error === 'object') {
      // Extract meaningful error message
      if (error.message) {
        errorMessage = String(error.message);
      } else if (error.toString && error.toString() !== '[object Object]') {
        errorMessage = error.toString();
      } else {
        // Try to stringify if it's a plain object
        try {
          errorMessage = JSON.stringify(error);
        } catch {
          errorMessage = 'Unknown deployment error';
        }
      }
    } else if (error) {
      errorMessage = String(error);
    }
    
    console.error('Contract deployment error:', errorMessage, error);
    throw new Error(errorMessage);
  }
};

export const toAddress = (accountId: string) => new Address(accountId);
export const toI128 = (value: bigint) => nativeToScVal(value, { type: 'i128' });
export const toU32 = (value: number) => nativeToScVal(value, { type: 'u32' });