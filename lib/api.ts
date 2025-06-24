// lib/api.ts

import { TokenProfile, BoostedToken, SearchPair } from '../lib/types/dextypes';

const BASE_URL = "https://api.dexscreener.com";

class RateLimiter {
  private requests: { [key: string]: number[] } = {};

  canMakeRequest(endpoint: string, limit: number): boolean {
    const now = Date.now();
    const minute = 60 * 1000;

    if (!this.requests[endpoint]) {
      this.requests[endpoint] = [];
    }

    this.requests[endpoint] = this.requests[endpoint].filter((time) => now - time < minute);

    if (this.requests[endpoint]?.length >= limit) {
      return false;
    }

    this.requests[endpoint].push(now);
    return true;
  }
}

class APICache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly TTL = 30000;

  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.data as T;
    }
    this.cache.delete(key);
    return null;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}

const rateLimiter = new RateLimiter();
const cache = new APICache();

export class DexScreenerAPI {
  private async makeRequest<T>(endpoint: string, rateLimit: number): Promise<T> {
    const cacheKey = endpoint;
    const cached = cache.get<T>(cacheKey);
    if (cached) return cached;

    if (!rateLimiter.canMakeRequest(endpoint, rateLimit)) {
      throw new Error(`Rate limit exceeded for ${endpoint}`);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    cache.set<T>(cacheKey, data);
    return data;
  }

  async getLatestTokenProfiles(): Promise<TokenProfile[]> {
    const data = await this.makeRequest<{ data: TokenProfile[] }>("/token-profiles/latest/v1", 60);
    return data.data;
  }

  async getLatestBoostedTokens(): Promise<BoostedToken[]> {
    const data = await this.makeRequest<{ data: BoostedToken[] }>("/token-boosts/latest/v1", 60);
    return data.data;
  }

  async getTopBoostedTokens(): Promise<BoostedToken[]> {
    const data = await this.makeRequest<{ data: BoostedToken[] }>("/token-boosts/top/v1", 60);
    return data.data;
  }

  async searchPairs(query: string): Promise<{ pairs: SearchPair[] }> {
    if (!query.trim()) return { pairs: [] };
    return this.makeRequest<{ pairs: SearchPair[] }>(
      `/latest/dex/search?q=${encodeURIComponent(query)}`, 300
    );
  }
   async getTokenPairs(chainId: string, tokenAddress: string): Promise<any[]> {
    // You may need to adjust the endpoint path based on your API docs
    return this.makeRequest<any[]>(
      `/token/pairs/${chainId}/${tokenAddress}`,
      300
    );
  }
}

export const dexAPI = new DexScreenerAPI();
