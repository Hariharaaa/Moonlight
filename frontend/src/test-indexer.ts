import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { getPublicStates } from '@midnight-ntwrk/midnight-js-contracts';
const CONTRACT_ADDRESS = 'd3a9182b9b58b653c8dbae9fc31422b0c217e3c8a7693293aa090e8e909d23fd';
import * as AuctionContract from '../../managed/contract';

import { StateValue } from '@midnight-ntwrk/compact-runtime';

async function test() {
  console.log('Testing indexer connection for contract:', CONTRACT_ADDRESS);
  const indexerUri = 'https://indexer.preprod.midnight.network/api/v4/graphql';
  const indexerWsUri = 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws';
  
  const publicDataProvider = indexerPublicDataProvider(indexerUri, indexerWsUri);
  
  try {
    console.log('Fetching public states...');
    const { contractState } = await getPublicStates(publicDataProvider as any, CONTRACT_ADDRESS);
    
    console.log('Decoding ledger...');
    const encodedBytes = contractState.data.state.encode();
    const safeStateValue = StateValue.decode(encodedBytes);
    
    const state = AuctionContract.ledger(safeStateValue);
    console.log('Phase:', state.phase);
    console.log('Highest Bid:', state.highest_bid);
  } catch (err: any) {
    console.error('Error:', err.message || err);
    if (err.stack) console.error(err.stack);
  }
}

test();
