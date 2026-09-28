export type NetworkId = 'undeployed' | 'preview' | 'preprod';

export interface NetworkConfig {
  networkId: NetworkId;
  indexer: string;
  indexerWS: string;
  node: string;
  proofServer: string;
}

export const NETWORK_CONFIGS: Record<NetworkId, NetworkConfig> = {
  undeployed: {
    networkId: 'undeployed',
    indexer: 'http://127.0.0.1:8088/api/v4/graphql',
    indexerWS: 'ws://127.0.0.1:8088/api/v4/graphql/ws',
    node: 'ws://127.0.0.1:9944',
    proofServer: 'http://127.0.0.1:6300',
  },
  preview: {
    networkId: 'preview',
    indexer: 'https://indexer.preview.midnight.network/api/v4/graphql',
    indexerWS: 'wss://indexer.preview.midnight.network/api/v4/graphql/ws',
    node: 'https://rpc.preview.midnight.network',
    proofServer: 'http://127.0.0.1:6300',
  },
  preprod: {
    networkId: 'preprod',
    indexer: 'https://indexer.preprod.midnight.network/api/v4/graphql',
    indexerWS: 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
    node: 'https://rpc.preprod.midnight.network',
    proofServer: 'https://proof-server.preprod.midnight.network',
  },
};

// We will use local devnet for now, and switch to preprod for deployment.
// Vercel deployment will set VITE_NETWORK_ID="preprod" via .env.production or fallback to preprod.
export const ACTIVE_NETWORK: NetworkId = (import.meta.env.VITE_NETWORK_ID as NetworkId) || 'preprod';
export const config = NETWORK_CONFIGS[ACTIVE_NETWORK];

// From deployment-config.json (Preprod address)
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '68cfee8397ddbe8d376801af3bfd8c3787da1be37dd8747ea0d390bfde32eed7';
