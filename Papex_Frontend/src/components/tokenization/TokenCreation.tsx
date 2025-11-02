import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle,
  Loader2,
  RefreshCcw,
  Wallet,
  Coins,
  TrendingUp,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card.tsx';
import { Button } from '../ui/button.tsx';
import { Alert, AlertDescription } from '../ui/alert.tsx';
import { Input } from '../ui/input.tsx';
import { Badge } from '../ui/badge.tsx';
import { useNavigate } from '../../lib/router';
import {
  ChainPaper,
  TokenSummary,
  useArtica,
} from '../../context/ArticaContext';
import { formatDecimal } from '../../utils/stellarNumber';

interface TokenCreationProps {
  paperId: number;
  onSuccess?: (tokenInfo: { paperId: number; tokenAddress: string }) => void;
}

const TokenCreation: React.FC<TokenCreationProps> = ({ paperId, onSuccess }) => {
  const {
    walletAddress,
    connectWallet,
    getPaper,
    getTokenSummary,
    associateToken,
    registerListing,
    deployTokenContract,
    createToken,
    listPapers,
  } = useArtica();
  const navigate = useNavigate();

  const [paper, setPaper] = useState<ChainPaper | null>(null);
  const [summary, setSummary] = useState<TokenSummary | null>(null);
  const [tokenContractId, setTokenContractId] = useState('');
  const [metadataUri, setMetadataUri] = useState('');
  const [deployingContract, setDeployingContract] = useState(false);

  // Token creation form state - sadece token ismi ve yatırılacak miktar
  const [tokenName, setTokenName] = useState('');
  const [initialLiquidity, setInitialLiquidity] = useState('');
  
  // Otomatik parametreler (sabit değerler)
  const DEFAULT_MAX_SUPPLY = '1000000';
  const DEFAULT_BASE_PRICE = '0.01';
  const DEFAULT_SLOPE = '0.0001';
  const DEFAULT_INITIAL_SUPPLY = '0'; // Sahibe verilecek initial supply yok
  const DEFAULT_PAYMENT_TOKEN = null; // Native token kullan
  
  // Token symbol'i token isminden otomatik oluştur
  const generateTokenSymbol = (name: string): string => {
    if (!name.trim()) return '';
    // Kelimelerin ilk harflerini al ve büyük harfe çevir
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      // Tek kelime ise ilk 3-4 harfi al
      return name.substring(0, Math.min(4, name.length)).toUpperCase();
    }
    // Birden fazla kelime ise her kelimenin ilk harfini al
    return words.map(word => word.charAt(0).toUpperCase()).join('').substring(0, 6);
  };

  const [loading, setLoading] = useState(false);
  const [creatingToken, setCreatingToken] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPaperState = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const chainPaper = await getPaper(paperId);
      setPaper(chainPaper);
      if (chainPaper?.token) {
        setTokenContractId(chainPaper.token);
        const tokenSummary = await getTokenSummary(chainPaper.token);
        setSummary(tokenSummary);
      } else {
        setSummary(null);
      }
      if (chainPaper?.metadataUri) {
        setMetadataUri(chainPaper.metadataUri);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [getPaper, getTokenSummary, paperId]);

  useEffect(() => {
    loadPaperState();
  }, [loadPaperState]);

  const handleDeployContract = async () => {
    setDeployingContract(true);
    setError(null);
    setFeedback(null);

    try {
      const contractId = await deployTokenContract();
      if (contractId) {
        setTokenContractId(contractId);
        setFeedback(`Contract başarıyla deploy edildi! Contract ID: ${contractId}`);
      } else {
        setError('Contract deploy edilemedi. Lütfen tekrar deneyin.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Contract deploy hatası');
    } finally {
      setDeployingContract(false);
    }
  };

  const handleCreateToken = async () => {
    // Contract ID kontrolü - RPC çalışmıyorsa manuel giriş gerekli
    if (!tokenContractId.trim()) {
      setError(
        '⚠️ Soroban RPC şu anda çalışmıyor. ' +
        'Lütfen Soroban CLI ile contract deploy edin ve Contract ID\'yi girin. ' +
        '\n\nSoroban CLI ile deploy etmek için:\n' +
        '1. Terminal\'de: cd Papex_Contracts/contracts/papex-contract/papex_papertoken\n' +
        '2. stellar contract deploy --wasm target/wasm32v1-none/release/papex_papertoken.wasm --source <wallet-key> --network testnet\n' +
        '3. Çıkan Contract ID\'yi yukarıdaki input\'a yapıştırın.'
      );
      return;
    }

    if (!tokenName.trim()) {
      setError('Token ismi zorunludur');
      return;
    }
    if (!initialLiquidity.trim() || parseFloat(initialLiquidity) <= 0) {
      setError('Lütfen yatırmak istediğiniz miktarı girin (0\'dan büyük olmalı)');
      return;
    }

    setCreatingToken(true);
    setError(null);
    setFeedback(null);

    try {
      // Otomatik parametreleri kullan
      const autoSymbol = generateTokenSymbol(tokenName);
      const hash = await createToken(
        tokenContractId.trim(),
        tokenName.trim(),
        autoSymbol,
        DEFAULT_MAX_SUPPLY,
        DEFAULT_BASE_PRICE,
        DEFAULT_SLOPE,
        DEFAULT_INITIAL_SUPPLY,
        initialLiquidity.trim(),
        DEFAULT_PAYMENT_TOKEN,
      );

      setFeedback(
        hash
          ? `Token initialized successfully! Transaction hash: ${hash}`
          : 'Token initialization transaction submitted',
      );

      // Save token contract ID to localStorage for trading page
      localStorage.setItem(`papex_token_contract_${paperId}`, tokenContractId.trim());
      console.log('💾 Saved token contract ID to localStorage for paper', paperId);

      // Reload state to get token summary
      await loadPaperState();

      // Verify paper exists and get correct paper ID
      let finalPaperId = paperId;
      let foundPaper = paper;
      
      // If paper not found by ID, try to find it by metadataUri (IPFS hash)
      if (!foundPaper && metadataUri) {
        try {
          console.log('🔍 Paper not found by ID, searching by IPFS hash...', metadataUri);
          const allPapers = await listPapers(100);
          const normalizedUri = metadataUri.startsWith('ipfs://') 
            ? metadataUri 
            : `ipfs://${metadataUri.replace(/^\/ipfs\//, '')}`;
          
          foundPaper = allPapers.find(p => {
            if (!p.metadataUri) return false;
            const paperUri = p.metadataUri.startsWith('ipfs://') 
              ? p.metadataUri 
              : `ipfs://${p.metadataUri.replace(/^\/ipfs\//, '')}`;
            // Match exact URI or hash
            return paperUri === normalizedUri || 
                   paperUri.replace('ipfs://', '') === normalizedUri.replace('ipfs://', '');
          });
          
          if (foundPaper) {
            console.log('✅ Found paper by IPFS hash! Paper ID:', foundPaper.id);
            finalPaperId = foundPaper.id;
            setPaper(foundPaper);
          } else {
            console.warn('⚠️ Paper not found by IPFS hash either. The paper may not be registered on-chain.');
          }
        } catch (searchErr) {
          console.warn('⚠️ Could not search papers by IPFS hash:', searchErr);
        }
      }
      
      // If still no paper found, try one more time with getPaper
      if (!foundPaper) {
        try {
          console.log(`🔍 Attempting to fetch paper ID ${finalPaperId} one more time...`);
          foundPaper = await getPaper(finalPaperId);
          if (foundPaper) {
            setPaper(foundPaper);
          }
        } catch (fetchErr) {
          console.warn('⚠️ Could not fetch paper:', fetchErr);
        }
      }

      // Associate token to paper if not already associated
      let tokenAssociated = false;
      if (!foundPaper?.token) {
        try {
          console.log(`🔗 Attempting to associate token to paper ID ${finalPaperId}...`);
          await associateToken(finalPaperId, tokenContractId.trim());
          await loadPaperState();
          tokenAssociated = true;
          console.log('✅ Token successfully associated with paper');
        } catch (assocErr) {
          const assocErrorMsg = assocErr instanceof Error ? assocErr.message : String(assocErr);
          console.warn('⚠️ Failed to auto-associate token (non-critical):', assocErrorMsg);
          
          // Provide helpful feedback if it's a contract error
          if (assocErrorMsg.includes('paper not found') || 
              assocErrorMsg.includes('not authorized') ||
              assocErrorMsg.includes('not found') ||
              assocErrorMsg.includes('UnreachableCodeReached')) {
            console.warn(
              `⚠️ Token created but could not be linked. ` +
              `Paper ID ${finalPaperId} may not exist or you may not have permission.`
            );
          }
        }
      } else {
        tokenAssociated = true; // Already associated
      }

      // Redirect to trading page after successful token creation
      if (tokenAssociated || foundPaper?.token) {
        console.log('🚀 Token ready! Redirecting to trading page...');
        setFeedback('✅ Token created and associated successfully! Redirecting to trading...');
        setTimeout(() => {
          navigate(`/token-trading/${finalPaperId}`);
        }, 1500);
      } else {
        // Still redirect even if association failed - token is created
        console.log('🚀 Token created! Redirecting to trading page (association may be done later)...');
        setFeedback('✅ Token created successfully! Redirecting to trading...');
        setTimeout(() => {
          navigate(`/token-trading/${finalPaperId}`);
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreatingToken(false);
    }
  };

  const handleAssociateToken = async () => {
    if (!tokenContractId) {
      setError('Provide a token contract ID.');
      return;
    }
    setLoading(true);
    setError(null);
    setFeedback(null);
    try {
      const hash = await associateToken(paperId, tokenContractId);
      setFeedback(
        hash
          ? `Token contract linked to paper. Transaction hash: ${hash}`
          : 'Token contract linked to paper.',
      );
      if (onSuccess) {
        onSuccess({ paperId, tokenAddress: tokenContractId });
      }
      await loadPaperState();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterListing = async () => {
    if (!tokenContractId) {
      setError('Associate a token contract before registering a listing.');
      return;
    }
    if (!metadataUri) {
      setError('Metadata URI is required to register a marketplace listing.');
      return;
    }
    setLoading(true);
    setError(null);
    setFeedback(null);
    try {
      const hash = await registerListing(paperId, tokenContractId, metadataUri);
      setFeedback(
        hash
          ? `Marketplace listing created. Transaction hash: ${hash}`
          : 'Marketplace listing created.',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Tokenize Paper #{paperId}</h2>
          <p className="text-sm text-muted-foreground">
            Deploy and initialize a token contract for this paper, then link it to the marketplace.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {walletAddress ? (
            <Badge variant="outline">
              <Wallet className="mr-2 h-3 w-3" />
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </Badge>
          ) : (
            <Button variant="outline" onClick={connectWallet}>
              Connect Freighter
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={loadPaperState}>
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {feedback && (
        <Alert>
          <AlertDescription>{feedback}</AlertDescription>
        </Alert>
      )}

      {/* Token Creation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Create Token
          </CardTitle>
          <CardDescription>
            Contract ID'yi girdikten sonra sadece token ismini ve yatırmak istediğiniz miktarı girin. 
            Diğer parametreler otomatik olarak ayarlanacaktır.
            <br />
            <br />
            <strong>Not:</strong> RPC endpoint'leri çalışmıyorsa Soroban CLI kullanın (aşağıdaki komut).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Contract Deployment */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Token Contract ID
            </label>
            <div className="space-y-2">
              <Input
                placeholder="C... (Contract ID - Soroban CLI ile aldıysanız buraya yapıştırın)"
                value={tokenContractId}
                onChange={(e) => setTokenContractId(e.target.value)}
                className="text-base font-mono text-sm"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (!walletAddress) {
                      setError('Lütfen önce wallet\'ınızı bağlayın!');
                      try {
                        await connectWallet();
                      } catch (err) {
                        setError(err instanceof Error ? err.message : 'Wallet bağlantı hatası');
                      }
                      return;
                    }
                    await handleDeployContract();
                  }}
                  disabled={deployingContract}
                  className="flex-1"
                >
                  {deployingContract ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {!localStorage.getItem('papex_token_wasm_hash') 
                        ? 'İlk deployment...' 
                        : 'Deploying...'}
                    </>
                  ) : (
                    <>
                      <Coins className="mr-2 h-4 w-4" />
                      Otomatik Deploy
                    </>
                  )}
                </Button>
                {tokenContractId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTokenContractId('')}
                    className="flex-1"
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Temizle
                  </Button>
                )}
              </div>
              <Alert variant="default" className="mt-2">
                <AlertDescription className="text-xs">
                  <strong>📋 Soroban CLI ile Contract Deploy:</strong>
                  <br />
                  <code className="text-xs bg-muted p-1 rounded mt-1 block">
                    cd Papex_Contracts/contracts/papex-contract/papex_papertoken<br />
                    stellar contract deploy --wasm target/wasm32v1-none/release/papex_papertoken.wasm --source &lt;wallet-key&gt; --network testnet
                  </code>
                  <br />
                  {tokenContractId 
                    ? '✅ Contract ID ayarlandı. Token oluşturabilirsiniz.'
                    : 'Yukarıdaki komutu çalıştırın, çıkan Contract ID\'yi buraya yapıştırın.'}
                </AlertDescription>
              </Alert>
            </div>
          </div>

          {/* Token Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Token İsmi <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="örn: Research Paper Token"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              className="text-base"
            />
            {tokenName && (
              <p className="text-xs text-muted-foreground">
                Token Sembolü (otomatik): <span className="font-mono font-semibold text-blue-600">
                  {generateTokenSymbol(tokenName)}
                </span>
              </p>
            )}
          </div>

          {/* Initial Liquidity */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Yatırmak İstediğiniz Miktar <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="örn: 1000"
              value={initialLiquidity}
              onChange={(e) => {
                // Sadece sayı ve nokta/virgül kabul et
                const value = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
                setInitialLiquidity(value);
              }}
              className="text-base"
            />
            <p className="text-xs text-muted-foreground">
              Bu miktar token contract'ına initial liquidity olarak yatırılacaktır.
            </p>
          </div>

          {/* Auto Parameters Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-blue-900">Otomatik Parametreler:</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-blue-800">
              <div>
                <span className="font-medium">Max Supply:</span> {DEFAULT_MAX_SUPPLY}
              </div>
              <div>
                <span className="font-medium">Base Price:</span> {DEFAULT_BASE_PRICE}
              </div>
              <div>
                <span className="font-medium">Slope:</span> {DEFAULT_SLOPE}
              </div>
              <div>
                <span className="font-medium">Initial Supply:</span> {DEFAULT_INITIAL_SUPPLY}
              </div>
              <div className="col-span-2">
                <span className="font-medium">Payment Token:</span> Native (XLM)
              </div>
            </div>
          </div>
          <Button 
            onClick={handleCreateToken} 
            disabled={creatingToken || deployingContract || !walletAddress || !tokenName.trim() || !initialLiquidity.trim()}
            className="w-full"
          >
                     {creatingToken ? (
                       <>
                         <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                         {!tokenContractId && !localStorage.getItem('papex_token_wasm_hash')
                           ? 'İlk deployment başlatılıyor (2-3 dakika)...'
                           : 'Token Oluşturuluyor...'}
                       </>
                     ) : (
                       <>
                         <CheckCircle className="mr-2 h-4 w-4" />
                         {!tokenContractId && !localStorage.getItem('papex_token_wasm_hash')
                           ? 'İlk Token\'ı Oluştur (2-3 dk)' 
                           : 'Token Oluştur'}
                       </>
                     )}
          </Button>
                   {!tokenContractId && (
                     <p className="text-xs text-muted-foreground text-center">
                       {!localStorage.getItem('papex_token_wasm_hash') ? (
                         <>
                           ⏳ <strong>İlk token oluşturma 2-3 dakika sürebilir</strong> (WASM yükleme). 
                           Sonraki tokenlar sadece 10 saniyede oluşacak!
                         </>
                       ) : (
                         'Token oluştur butonuna bastığınızda contract otomatik olarak deploy edilecek (~10 saniye).'
                       )}
                     </p>
                   )}
        </CardContent>
      </Card>

      {/* Associate Token to Paper */}
      {summary && !paper?.token && (
        <Card>
          <CardHeader>
            <CardTitle>Link Token to Paper</CardTitle>
            <CardDescription>
              Associate the initialized token contract with this paper in the registry.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleAssociateToken} disabled={loading} className="w-full">
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-4 w-4" />
              )}
              Link Token to Paper
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Token Summary */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {summary.name} Overview
            </CardTitle>
            <CardDescription>Live configuration pulled from the token contract.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Symbol</p>
              <p className="text-lg font-semibold">{summary.symbol}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Total Supply</p>
              <p className="text-lg font-semibold">
                {formatDecimal(summary.totalSupply)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Liquidity Pool</p>
              <p className="text-lg font-semibold">
                {formatDecimal(summary.liquidity)}
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/token-trading/${paperId}`)}
            >
              Go to Trading Interface
            </Button>
            {!paper?.token && (
              <Button onClick={handleAssociateToken} disabled={loading}>
                Link to Paper
              </Button>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default TokenCreation;
