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
} from '@stellar/stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';
import { STELLAR_CONFIG } from '../config/stellar';

const server = new SorobanRpc.Server(STELLAR_CONFIG.rpcUrl, { allowHttp: true });

const toAccount = async (publicKey: string): Promise<Account> => {
  try {
    const accountResponse = await server.getAccount(publicKey);
    return new Account(accountResponse.accountId(), accountResponse.sequenceNumber());
  } catch {
    return new Account(publicKey, '0');
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
  const account = await toAccount(publicKey ?? STELLAR_CONFIG.readOnlyAccount);
  const tx = await buildTransaction(account, contractId, method, args);
  const simulation = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(simulation)) {
    const error = simulation.result?.error || 'Simulation failed';
    throw new Error(error);
  }
  const result = simulation.result?.retval;
  return result ? scValToNative(result) : null;
};

export const invokeTransaction = async (
  publicKey: string,
  contractId: string,
  method: string,
  args: xdr.ScVal[],
) => {
  const source = await toAccount(publicKey);
  let tx = await buildTransaction(source, contractId, method, args);
  tx = await server.prepareTransaction(tx);

  const signed = await signTransaction(tx.toXDR(), {
    networkPassphrase: STELLAR_CONFIG.networkPassphrase,
  });
  const prepared = TransactionBuilder.fromXDR(signed, STELLAR_CONFIG.networkPassphrase);
  const response = await server.sendTransaction(prepared);

  if (response.status === SorobanRpc.SendTransactionStatus.ERROR) {
    throw new Error(response.errorResultXdr || 'Transaction failed to send');
  }

  if (!response.hash) {
    return { hash: null, status: response.status };
  }

  let finalResponse = await server.getTransaction(response.hash).catch(() => null);
  while (finalResponse && finalResponse.status === SorobanRpc.GetTransactionStatus.NOT_FOUND) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    finalResponse = await server.getTransaction(response.hash).catch(() => null);
  }

  return {
    hash: response.hash,
    status: finalResponse?.status ?? response.status,
    result: finalResponse?.returnValue ? scValToNative(finalResponse.returnValue) : null,
  };
};

export const toAddress = (accountId: string) => new Address(accountId);
export const toI128 = (value: bigint) => nativeToScVal(value, { type: 'i128' });
export const toU32 = (value: number) => nativeToScVal(value, { type: 'u32' });
