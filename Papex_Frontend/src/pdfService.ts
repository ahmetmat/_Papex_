import * as pdfjs from 'pdfjs-dist';
import { pinata, getPinataGatewayUrl, formatIPFSUri } from './config/pinata';

// Configure PDF.js worker - use worker from public folder to avoid CSP issues
// The worker file is copied to public/pdf.worker.min.mjs during build
// This ensures it's accessible at runtime without CSP violations
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export interface PaperMetadata {
  title: string;
  authors: string[];
  abstract: string;
  keywords: string[];
  doi?: string;
  publicationDate?: string;
  rawText?: string;
  pageCount?: number;
  fileSize?: number;
}

export interface PDFProcessingResult {
  success: boolean;
  metadata?: PaperMetadata;
  preview?: string;
  error?: string;
}

/**
 * Extract metadata from PDF file
 */
export async function extractPDFMetadata(file: File): Promise<PDFProcessingResult> {
  try {
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const typedArray = new Uint8Array(arrayBuffer);

    // Load PDF document
    const pdf = await pdfjs.getDocument({ data: typedArray }).promise;
    
    // Get PDF metadata
    const metadata = await pdf.getMetadata();
    const firstPage = await pdf.getPage(1);
    
    // Extract text from first few pages for metadata detection
    let fullText = '';
    const pagesToScan = Math.min(3, pdf.numPages); // Scan first 3 pages
    
    for (let i = 1; i <= pagesToScan; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    // Extract structured metadata
    const extractedMetadata = await parseMetadataFromText(fullText, metadata);
    extractedMetadata.pageCount = pdf.numPages;
    extractedMetadata.fileSize = file.size;
    extractedMetadata.rawText = fullText.substring(0, 5000); // Keep first 5000 chars

    // Generate preview thumbnail
    const preview = await generateThumbnail(firstPage);

    return {
      success: true,
      metadata: extractedMetadata,
      preview,
    };
  } catch (error) {
    console.error('PDF processing error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error processing PDF',
    };
  }
}

/**
 * Parse metadata from extracted text using pattern matching
 */
async function parseMetadataFromText(
  text: string,
  pdfMetadata: any
): Promise<PaperMetadata> {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  
  // Try to extract title (usually first significant text block)
  let title = pdfMetadata.info?.Title || '';
  if (!title && lines.length > 0) {
    // Find first line with substantial content
    const titleLine = lines.find(line => 
      line.length > 10 && 
      line.length < 200 &&
      !line.toLowerCase().includes('abstract') &&
      !line.toLowerCase().includes('introduction')
    );
    title = titleLine || lines[0];
  }

  // Try to extract authors
  let authors: string[] = [];
  if (pdfMetadata.info?.Author) {
    authors = pdfMetadata.info.Author.split(/[,;]/).map((a: string) => a.trim());
  } else {
    // Look for author patterns in text
    const authorPattern = /(?:by|authors?:?)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s*,\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)*)/i;
    const authorMatch = text.match(authorPattern);
    if (authorMatch) {
      authors = authorMatch[1].split(',').map(a => a.trim());
    }
  }

  // Extract abstract
  let abstract = '';
  const abstractMatch = text.match(/abstract[:\s]*([^]*?)(?=\n\n|introduction|keywords?|$)/i);
  if (abstractMatch) {
    abstract = abstractMatch[1].trim().substring(0, 1000); // Limit to 1000 chars
  }

  // Extract keywords
  let keywords: string[] = [];
  const keywordsMatch = text.match(/keywords?[:\s]*([^]*?)(?=\n\n|introduction|$)/i);
  if (keywordsMatch) {
    keywords = keywordsMatch[1]
      .split(/[,;]/)
      .map(k => k.trim())
      .filter(k => k.length > 2 && k.length < 50)
      .slice(0, 10);
  }

  // Extract DOI
  let doi: string | undefined;
  const doiMatch = text.match(/doi[:\s]*(10\.\d{4,}\/[^\s]+)/i);
  if (doiMatch) {
    doi = doiMatch[1];
  }

  // Extract publication date
  let publicationDate: string | undefined;
  if (pdfMetadata.info?.CreationDate) {
    publicationDate = parseDate(pdfMetadata.info.CreationDate);
  } else {
    const dateMatch = text.match(/\b(19|20)\d{2}\b/);
    if (dateMatch) {
      publicationDate = dateMatch[0];
    }
  }

  return {
    title: title || 'Untitled Paper',
    authors: authors.length > 0 ? authors : ['Unknown Author'],
    abstract: abstract || 'No abstract available',
    keywords,
    doi,
    publicationDate,
  };
}

/**
 * Generate thumbnail image from PDF page
 */
async function generateThumbnail(page: pdfjs.PDFPageProxy): Promise<string> {
  const viewport = page.getViewport({ scale: 0.5 });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) {
    throw new Error('Could not get canvas context');
  }

  canvas.height = viewport.height;
  canvas.width = viewport.width;

  await page.render({
    canvasContext: context,
    viewport: viewport,
  }).promise;

  return canvas.toDataURL('image/jpeg', 0.8);
}

/**
 * Parse PDF date format
 */
function parseDate(pdfDate: string): string {
  try {
    // PDF dates are in format: D:YYYYMMDDHHmmSSOHH'mm
    const year = pdfDate.substring(2, 6);
    const month = pdfDate.substring(6, 8);
    const day = pdfDate.substring(8, 10);
    return `${year}-${month}-${day}`;
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Upload file to IPFS using Pinata
 */
export async function uploadToIPFS(file: File, metadata?: { name?: string; keyValues?: Record<string, string> }): Promise<string> {
  try {
    console.log('Uploading to IPFS via Pinata:', file.name, 'Size:', file.size);
    
    // Upload file to Pinata using the chainable API (matches Artica implementation)
    let uploadPromise = pinata.upload.file(file);
    
    // Add metadata if provided (for optional metadata support)
    if (metadata) {
      uploadPromise = uploadPromise.addMetadata({
        name: metadata.name || file.name,
        keyValues: metadata.keyValues || {},
      });
    }
    
    const result = await uploadPromise;
    
    console.log('Pinata upload result:', result);
    
    // Check for IpfsHash property (Pinata SDK returns IpfsHash)
    const ipfsHash = result?.IpfsHash;
    
    if (!ipfsHash) {
      console.error('Upload result missing IpfsHash:', result);
      throw new Error('Failed to upload file to IPFS - no hash returned');
    }
    
    console.log('File uploaded successfully. IPFS Hash:', ipfsHash);
    
    return formatIPFSUri(ipfsHash);
  } catch (error) {
    console.error('IPFS upload error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw new Error(
      error instanceof Error 
        ? `Failed to upload to IPFS: ${error.message}`
        : 'Failed to upload file to IPFS'
    );
  }
}

/**
 * Create metadata JSON for IPFS
 */
export async function createMetadataJSON(
  metadata: PaperMetadata,
  pdfHash: string,
  additionalData?: any
): Promise<string> {
  const metadataObject = {
    name: metadata.title,
    description: metadata.abstract,
    image: pdfHash, // PDF file hash
    attributes: [
      {
        trait_type: 'Authors',
        value: metadata.authors.join(', '),
      },
      {
        trait_type: 'Publication Date',
        value: metadata.publicationDate || 'Unknown',
      },
      {
        trait_type: 'Pages',
        value: metadata.pageCount?.toString() || 'Unknown',
      },
      ...(metadata.keywords || []).map(keyword => ({
        trait_type: 'Keyword',
        value: keyword,
      })),
      ...(metadata.doi ? [{
        trait_type: 'DOI',
        value: metadata.doi,
      }] : []),
    ],
    properties: {
      authors: metadata.authors,
      keywords: metadata.keywords,
      doi: metadata.doi,
      pageCount: metadata.pageCount,
      fileSize: metadata.fileSize,
      pdfUrl: pdfHash.startsWith('ipfs://') ? getPinataGatewayUrl(pdfHash) : pdfHash,
      ...additionalData,
    },
  };

  const jsonString = JSON.stringify(metadataObject, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const file = new File([blob], 'metadata.json', { type: 'application/json' });
  
  return uploadToIPFS(file);
}

/**
 * Validate PDF file
 */
export function validatePDFFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
    return {
      valid: false,
      error: 'File must be a PDF',
    };
  }

  // Check file size (max 50MB)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size must be less than 50MB',
    };
  }

  return { valid: true };
}