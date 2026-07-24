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
    proofServer: 'http://127.0.0.1:6300',
  },
};

// We will use local devnet for now, and switch to preprod for deployment.
// Vercel deployment will set VITE_NETWORK_ID="preprod".
export const ACTIVE_NETWORK: NetworkId = (import.meta.env.VITE_NETWORK_ID as NetworkId) || 'undeployed';
export const config = NETWORK_CONFIGS[ACTIVE_NETWORK];

// From deployment-config.json (local devnet address)
// For Preprod, it will be injected or hardcoded during deployment.
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '9ce3d2d5e7669eac2d61b405f2944b738568b5c0e1b942be5607e9ae0846a55b';
