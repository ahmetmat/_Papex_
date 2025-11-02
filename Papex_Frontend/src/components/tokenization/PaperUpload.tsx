import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card.tsx';
import { Button } from '../ui/button.tsx';
import { Input } from '../ui/input.tsx';
import { Textarea } from '../ui/textarea.tsx';
import { Alert, AlertDescription } from '../ui/alert.tsx';
import { useArtica } from '../../context/ArticaContext';
import { useNavigate } from '../../lib/router';
import { 
  Loader2, 
  Link as LinkIcon, 
  FileText, 
  Hash, 
  CheckCircle, 
  Upload,
  X
} from 'lucide-react';
import {
  extractPDFMetadata,
  uploadToIPFS,
  createMetadataJSON,
  validatePDFFile,
  type PaperMetadata,
} from '../../pdfService';

const PaperUpload: React.FC = () => {
  const { walletAddress, connectWallet, ensureWallet, registerPaper } = useArtica();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [metadataUri, setMetadataUri] = useState('');
  const [doi, setDoi] = useState('');
  const [notes, setNotes] = useState('');
  const [extractedMetadata, setExtractedMetadata] = useState<PaperMetadata | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [registeredId, setRegisteredId] = useState<number | null>(null);
  const [autoRegistered, setAutoRegistered] = useState(false);

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate PDF
    const validation = validatePDFFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid PDF file');
      return;
    }

    setPdfFile(file);
    setError(null);
    setExtractedMetadata(null);
    setSuccess(null);
    setMetadataUri('');
    setAutoRegistered(false);

    try {
      // Extract metadata from PDF
      const result = await extractPDFMetadata(file);
      if (result.success && result.metadata) {
        setExtractedMetadata(result.metadata);
        if (result.metadata.doi) {
          setDoi(result.metadata.doi);
        }
      } else {
        setError(result.error || 'Failed to extract PDF metadata');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process PDF');
    }
  };

  const handleRemoveFile = () => {
    setPdfFile(null);
    setExtractedMetadata(null);
    setMetadataUri('');
    setAutoRegistered(false);
    setSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const registerPaperAndProceed = async (
    { auto = false, metadataOverride }: { auto?: boolean; metadataOverride?: string } = {},
  ): Promise<number | null> => {
    const targetMetadataUri = (metadataOverride ?? metadataUri).trim();
    if (!targetMetadataUri) {
      setError('Metadata URI is required');
      return null;
    }

    setError(null);

    try {
      const caller = await ensureWallet();
      if (!caller) {
        throw new Error('Wallet connection is required to register your paper.');
      }
    } catch (walletErr) {
      const walletMessage =
        walletErr instanceof Error
          ? walletErr.message
          : 'Wallet connection is required to register your paper.';
      setError(
        auto
          ? `Wallet connection is required before moving to token creation. ${walletMessage}`
          : walletMessage,
      );
      setAutoRegistered(false);
      return null;
    }

    setSubmitting(true);
    try {
      // Ensure component state reflects the metadata URI used for registration
      if (metadataOverride) {
        setMetadataUri(targetMetadataUri);
      }

      const paperId = await registerPaper(targetMetadataUri, doi.trim() || null);
      setRegisteredId(paperId);
      if (paperId !== null) {
        setSuccess(`Paper registered on-chain with ID #${paperId}. Redirecting to token creation...`);
        setAutoRegistered(true);
        setTimeout(() => {
          navigate(`/token-creation/${paperId}`);
        }, auto ? 1200 : 2000);
      } else {
        setSuccess('Paper registration transaction submitted');
      }
      setNotes('');
      return paperId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register paper');
      setAutoRegistered(false);
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadPDF = async () => {
    if (!pdfFile) return;

    setUploading(true);
    setError(null);
    setSuccess(null);
    setAutoRegistered(false);

    try {
      // Upload PDF to IPFS
      const pdfHash = await uploadToIPFS(pdfFile);
      let resolvedMetadataUri = '';

      // Create and upload metadata JSON
      if (extractedMetadata) {
        const metadataHash = await createMetadataJSON(extractedMetadata, pdfHash, {
          notes: notes.trim() || undefined,
        });
        resolvedMetadataUri = metadataHash;
      } else {
        // If no metadata extracted, use PDF hash directly
        resolvedMetadataUri = pdfHash;
      }
      setMetadataUri(resolvedMetadataUri);

      setSuccess('PDF and metadata uploaded to IPFS successfully!');

      if (!autoRegistered) {
        const paperId = await registerPaperAndProceed({
          auto: true,
          metadataOverride: resolvedMetadataUri,
        });
        if (!paperId && !walletAddress) {
          setSuccess(
            'PDF uploaded to IPFS successfully! Connect your wallet and click "Register Paper" to continue.',
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload to IPFS');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    await registerPaperAndProceed();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Register Research Paper</CardTitle>
          <CardDescription>
            Store a reference to your paper on Soroban by submitting its metadata URI (e.g. IPFS hash) and optional DOI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!walletAddress && (
            <Alert className="mb-4">
              <AlertDescription>
                Connect your Freighter wallet to continue. You will be asked to approve the registration transaction on Soroban Futurenet.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4">
              <AlertDescription className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                {success}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* PDF Upload Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Upload className="h-4 w-4" />
                PDF File
              </label>
              {!pdfFile ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label
                    htmlFor="pdf-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="h-8 w-8 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Click to upload PDF or drag and drop
                    </span>
                    <span className="text-xs text-muted-foreground">
                      PDF files only, max 50MB
                    </span>
                  </label>
                </div>
              ) : (
                <div className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">{pdfFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleUploadPDF}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Upload to IPFS'
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              {extractedMetadata && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs font-medium text-blue-900 mb-1">Extracted Metadata:</p>
                  <p className="text-xs text-blue-800">{extractedMetadata.title}</p>
                  {extractedMetadata.authors.length > 0 && (
                    <p className="text-xs text-blue-700 mt-1">
                      Authors: {extractedMetadata.authors.join(', ')}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Metadata URI
              </label>
              <Input
                value={metadataUri}
                onChange={(event) => setMetadataUri(event.target.value)}
                placeholder="ipfs://..."
                readOnly={!!pdfFile}
              />
              <p className="text-xs text-muted-foreground">
                {pdfFile 
                  ? 'Will be automatically generated after uploading PDF to IPFS.'
                  : 'Provide the URI that hosts the paper metadata (IPFS, HTTPS, etc.) or upload a PDF above.'
                }
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Hash className="h-4 w-4" />
                DOI (optional)
              </label>
              <Input
                value={doi}
                onChange={(event) => setDoi(event.target.value)}
                placeholder="10.xxxx/xxxxx"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Notes (off-chain)
              </label>
              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional notes for your reference"
                rows={4}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="text-xs text-muted-foreground">
                {registeredId !== null && `Last registered paper ID: ${registeredId}`}
              </div>
              <div className="flex gap-2">
                {!walletAddress && (
                  <Button type="button" variant="outline" onClick={handleConnect}>
                    Connect Freighter
                  </Button>
                )}
                <Button 
                  type="submit" 
                  disabled={submitting || !walletAddress || !metadataUri.trim() || autoRegistered}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Register Paper'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaperUpload;
