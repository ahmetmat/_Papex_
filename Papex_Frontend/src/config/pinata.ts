import { PinataSDK } from 'pinata-web3';

export const PINATA_CONFIG = {
  pinataJwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIzNGYwZDJjNy1lODc4LTQ2NmMtODhmNS1jM2U4YTQ3ODUzYmYiLCJlbWFpbCI6IjIxMDIwNTAyM0Bvc3RpbXRla25pay5lZHUudHIiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiNTdiYjNmNmQ5ZTY0MGMzMTJhZGUiLCJzY29wZWRLZXlTZWNyZXQiOiI2ZmI3NDc5MTY0YmRkZTY4NGMxMTFlM2MxMzY3Yzk2ZmMzNzMwMjIxZTI3YjZkNzY2NjgzYWIzYTA3ODVjYTQ2IiwiZXhwIjoxNzcwMTMyNjQ4fQ.aT2akMqRcdZ9QU2GwLIjRKqQ5B60dgqAtxjS9CV2Qm4',
  pinataGateway: 'aquamarine-total-swift-154.mypinata.cloud',
};

export const pinata = new PinataSDK({
  pinataJwt: PINATA_CONFIG.pinataJwt,
  pinataGateway: PINATA_CONFIG.pinataGateway,
});

/**
 * Convert IPFS hash or URI to Pinata gateway URL
 */
export function getPinataGatewayUrl(ipfsHashOrUri: string): string {
  // Remove ipfs:// prefix if present
  const hash = ipfsHashOrUri.replace(/^ipfs:\/\//, '').replace(/^\/ipfs\//, '');
  return `https://${PINATA_CONFIG.pinataGateway}/ipfs/${hash}`;
}

/**
 * Convert IPFS URI to readable format
 */
export function formatIPFSUri(ipfsHashOrUri: string): string {
  if (ipfsHashOrUri.startsWith('ipfs://')) {
    return ipfsHashOrUri;
  }
  if (ipfsHashOrUri.startsWith('http')) {
    return ipfsHashOrUri;
  }
  return `ipfs://${ipfsHashOrUri}`;
}

/**
 * List all pinned files from Pinata
 * Returns list of IPFS hashes and metadata
 */
export async function listPinnedFiles(limit = 100): Promise<Array<{
  ipfsHash: string;
  name?: string;
  metadataUri?: string;
  timestamp?: number;
}>> {
  try {
    // Use Pinata REST API to list pins
    // The SDK might not have direct list method, so we'll use fetch
    const response = await fetch('https://api.pinata.cloud/data/pinList', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PINATA_CONFIG.pinataJwt}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Pinata API error: ${response.status}`);
    }

    const data = await response.json();
    const pins = data.rows || [];

    // Filter and map to our format
    return pins.slice(0, limit).map((pin: any) => ({
      ipfsHash: pin.ipfs_pin_hash,
      name: pin.metadata?.name,
      metadataUri: `ipfs://${pin.ipfs_pin_hash}`,
      timestamp: pin.date_pinned ? new Date(pin.date_pinned).getTime() : undefined,
    }));
  } catch (error) {
    console.error('Failed to list pinned files from Pinata:', error);
    return [];
  }
}

