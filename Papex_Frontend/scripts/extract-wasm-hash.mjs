#!/usr/bin/env node

/**
 * Extract WASM hash from a Soroban transaction
 * Usage: node extract-wasm-hash.mjs <transaction-hash>
 */

import * as sdk from '@stellar/stellar-sdk';

const txHash = process.argv[2];

if (!txHash) {
  console.error('❌ Usage: node extract-wasm-hash.mjs <transaction-hash>');
  process.exit(1);
}

async function extractWasmHash(txHash) {
  try {
    console.log('🔍 Fetching transaction:', txHash);
    
    // Fetch from Horizon
    const response = await fetch(`https://horizon-testnet.stellar.org/transactions/${txHash}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.successful) {
      throw new Error('Transaction was not successful');
    }
    
    if (!data.result_meta_xdr) {
      throw new Error('No result_meta_xdr found');
    }
    
    console.log('📦 Parsing transaction metadata...');
    
    // Parse the meta XDR
    const meta = sdk.xdr.TransactionMeta.fromXDR(data.result_meta_xdr, 'base64');
    
    // Get the Soroban meta
    const v3Meta = meta.v3();
    if (!v3Meta) {
      throw new Error('No v3 meta found - not a Soroban transaction?');
    }
    
    const sorobanMeta = v3Meta.sorobanMeta();
    if (!sorobanMeta) {
      throw new Error('No soroban meta found');
    }
    
    const returnValue = sorobanMeta.returnValue();
    if (!returnValue) {
      throw new Error('No return value found');
    }
    
    // Convert to native to get the hash bytes
    const hashBytes = sdk.scValToNative(returnValue);
    
    let hashHex;
    if (hashBytes instanceof Uint8Array || Buffer.isBuffer(hashBytes)) {
      hashHex = Array.from(hashBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    } else if (Array.isArray(hashBytes)) {
      hashHex = hashBytes.map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
      throw new Error('Unexpected hash format: ' + typeof hashBytes);
    }
    
    console.log('\n✅ WASM Hash extracted successfully!\n');
    console.log('Hash:', hashHex);
    console.log('\n📋 Copy and paste this command in your browser console:\n');
    console.log(`localStorage.setItem('papex_token_wasm_hash', '${hashHex}');`);
    console.log('\n🚀 Then retry the deployment - it will be instant!\n');
    
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    console.error('\n💡 Alternative: Check the transaction on Stellar Expert:');
    console.error(`   https://stellar.expert/explorer/testnet/tx/${txHash}`);
    console.error('\n   Look for the contract ID in the operations and manually set:');
    console.error(`   localStorage.setItem('papex_token_wasm_hash', 'YOUR_HASH_HERE');`);
    process.exit(1);
  }
}

extractWasmHash(txHash);

