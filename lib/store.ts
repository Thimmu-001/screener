import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Token {
  id: string;
  symbol: string;
  name?: string;
  price: number;
  priceChange24h?: number;
  volume24h?: number;
  marketCap?: number;
  liquidity?: number;
  pairAddress?: string;
  baseToken?: any;
}

interface TokenStore {
  topTokens: any[];
  watchlist: Token[];
  portfolioValue: number;
  setTopTokens: (tokens: any[]) => void;
  addToWatchlist: (token: any) => void;
  removeFromWatchlist: (tokenId: string) => void;
  isInWatchlist: (tokenId: string) => boolean;
}

export const useTokenStore = create<TokenStore>()(
  persist(
    (set, get) => ({
      topTokens: [],
      watchlist: [],
      portfolioValue: 125430,

      setTopTokens: (tokens) => set({ topTokens: tokens }),

      addToWatchlist: (token) => {
        const { watchlist } = get();
        const tokenId = token.pairAddress || token.id || Date.now().toString();

        if (watchlist.some((t) => t.id === tokenId)) return;

        const newToken: Token = {
          id: tokenId,
          symbol: token.baseToken?.symbol || token.symbol || "UNKNOWN",
          name: token.baseToken?.name || token.name,
          price: parseFloat(token.priceUsd ?? '0') || token.price || 0,
          priceChange24h: token.priceChange?.h24 ?? token.priceChange24h ?? 0,
          volume24h: token.volume?.h24 ?? token.volume24h ?? 0,
          marketCap: token.marketCap,
          liquidity: token.liquidity?.usd,
          pairAddress: token.pairAddress,
          baseToken: token.baseToken,
        };

        set((state) => ({
          watchlist: [...state.watchlist, newToken],
        }));
      },

      removeFromWatchlist: (tokenId) =>
        set((state) => ({
          watchlist: state.watchlist.filter((token) => token.id !== tokenId),
        })),

      isInWatchlist: (tokenId) => {
        const { watchlist } = get();
        return watchlist.some((token) => token.id === tokenId);
      },
    }),
    {
      name: 'dex-screener-storage',
      storage: createJSONStorage(() => AsyncStorage),  // <-- REPLACED HERE!
    }
  )
);
