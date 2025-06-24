
export interface DashboardData {
  profiles: TokenProfile[];
  boostedLatest: BoostedToken[];
  boostedTop: BoostedToken[];
  searchResults: SearchPair[];
}



// src/types/DexScreenerTypes.ts

export interface TokenProfile {
  tokenAddress: string;
  symbol: string;
  name: string;
  chainId: string;
  priceUsd: number;
  liquidity: {
    usd: number;
  };
  marketCapUsd: number;
  volume: {
    h24: number;
  };
  // add more fields depending on API response
}

export interface BoostedToken {
  tokenAddress: string;
  totalAmount: number;
  amount: number;
  boostsCount?: number; // optional if exists
}

export interface SearchPair {
  pairAddress: string;
  baseToken: {
    address: string;
    symbol: string;
    name: string;
  };
  quoteToken: {
    address: string;
    symbol: string;
    name: string;
  };
  priceUsd: number;
  liquidity: {
    usd: number;
  };
  volume: {
    h24: number;
  };
  chainId: string;
}
