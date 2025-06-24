import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { Search, X, SlidersHorizontal, TrendingUp, TrendingDown } from "lucide-react-native";
import { TokenCard } from "../ui/TokenCard";
import { dexAPI } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";

const { width } = Dimensions.get("window");

interface SearchScreenProps {
  onTokenSelect: (token: any) => void;
}

interface AdvancedFilters {
  minPrice: number;
  maxPrice: number;
  minVolume: number;
  maxVolume: number;
  minMarketCap: number;
  maxMarketCap: number;
  minLiquidity: number;
  maxLiquidity: number;
  onlyVerified: boolean;
  minPriceChange: number;
  maxPriceChange: number;
}

interface Token {
  address: string;
  symbol: string;
  name: string;
  logoUri?: string;
  priceUsd: string;
  priceChange?: { h24: number };
  volume?: { h24: number };
  marketCap?: number;
  liquidity?: { usd: number };
  verified?: boolean;
}

export default function SearchScreen({ onTokenSelect }: SearchScreenProps) {
  const [query, setQuery] = useState("");
  const [allTokens, setAllTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Animation refs
  const searchInputRef = useRef<TextInput>(null);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const advancedFilterAnimation = useRef(new Animated.Value(0)).current;
  
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    minPrice: 0,
    maxPrice: 1000,
    minVolume: 0,
    maxVolume: 10000000,
    minMarketCap: 0,
    maxMarketCap: 1000000000,
    minLiquidity: 0,
    maxLiquidity: 10000000,
    onlyVerified: false,
    minPriceChange: -100,
    maxPriceChange: 100,
  });

  const debouncedQuery = useDebounce(query, 300);
  const availableFilters = [
    { name: "High Volume", icon: "📈" },
    { name: "New Listings", icon: "🆕" },
    { name: "Top Gainers", icon: "🚀" },
    { name: "Top Losers", icon: "📉" },
    { name: "DeFi", icon: "🔗" },
    { name: "Meme", icon: "🐕" },
  ];

  // Animate on mount
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // Animate advanced filters
  useEffect(() => {
    Animated.timing(advancedFilterAnimation, {
      toValue: showAdvancedFilters ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [showAdvancedFilters]);

  // Transform pairs to tokens with deduplication and aggregation
  const transformPairsToTokens = useCallback((pairs: any[]): Token[] => {
    const tokenMap = new Map<string, Token>();
    
    pairs.forEach((pair) => {
      if (!pair.baseToken) return;
      
      const token = pair.baseToken;
      const tokenAddress = token.address?.toLowerCase();
      
      if (!tokenAddress) return;
      
      const existingToken = tokenMap.get(tokenAddress);
      
      if (existingToken) {
        // Aggregate data from multiple pairs
        const existingVolume = existingToken.volume?.h24 || 0;
        const newVolume = pair.volume?.h24 || 0;
        const existingLiquidity = existingToken.liquidity?.usd || 0;
        const newLiquidity = pair.liquidity?.usd || 0;
        
        existingToken.volume = { h24: existingVolume + newVolume };
        existingToken.liquidity = { usd: existingLiquidity + newLiquidity };
        
        // Use the pair with higher liquidity for price data
        if (newLiquidity > existingLiquidity) {
          existingToken.priceUsd = pair.priceUsd;
          existingToken.priceChange = pair.priceChange;
        }
      } else {
        // Create new token entry
        tokenMap.set(tokenAddress, {
          address: token.address,
          symbol: token.symbol,
          name: token.name,
          logoUri: token.logoUri,
          priceUsd: pair.priceUsd,
          priceChange: pair.priceChange,
          volume: pair.volume,
          marketCap: pair.marketCap,
          liquidity: pair.liquidity,
          verified: token.verified || false,
        });
      }
    });
    
    return Array.from(tokenMap.values());
  }, []);

  const applyFilters = (tokens: Token[], filters: string[], advanced: AdvancedFilters) => {
  let filtered = [...tokens];

  if (filters.includes("High Volume")) {
    filtered = filtered.filter((t) => (t.volume?.h24 || 0) > 100000);
  }
  if (filters.includes("Top Gainers")) {
    filtered = filtered.filter((t) => (t.priceChange?.h24 || 0) > 5);
  }
  if (filters.includes("Top Losers")) {
    filtered = filtered.filter((t) => (t.priceChange?.h24 || 0) < -5);
  }
  // ... handle other quick filters similarly

  filtered = filtered.filter((token) => {
    const price = parseFloat(token.priceUsd) || 0;
    const volume = token.volume?.h24 || 0;
    const marketCap = token.marketCap || 0;
    const liquidity = token.liquidity?.usd || 0;
    const priceChange = token.priceChange?.h24 || 0;

    return (
      price >= advanced.minPrice &&
      price <= advanced.maxPrice &&
      volume >= advanced.minVolume &&
      volume <= advanced.maxVolume &&
      marketCap >= advanced.minMarketCap &&
      marketCap <= advanced.maxMarketCap &&
      liquidity >= advanced.minLiquidity &&
      liquidity <= advanced.maxLiquidity &&
      priceChange >= advanced.minPriceChange &&
      priceChange <= advanced.maxPriceChange &&
      (!advanced.onlyVerified || token.verified)
    );
  });

  return filtered.sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0));
};


  const loadTokens = useCallback(async (isRefresh = false) => {
  if (isRefresh) {
    setRefreshing(true);
  } else {
    setLoading(true);
  }
  setError(null);
  
  try {
    let pairs: any[] = [];

    if (!debouncedQuery.trim()) {
      // Load popular tokens initially
      const popularQueries = ["BTC", "ETH", "SOL", "BNB", "USDC", "USDT"];
      const popularPairs = await Promise.all(
        popularQueries.map(async (q) => {
          try {
            const result = await dexAPI.searchPairs(q);
            return result.pairs || [];
          } catch {
            return [];
          }
        })
      );
      pairs = popularPairs.flat();
    } else {
      const data = await dexAPI.searchPairs(debouncedQuery);
      pairs = data.pairs || [];
    }

    const tokens = transformPairsToTokens(pairs);
    // Apply filters directly here
    const filtered = applyFilters(tokens, filters, advancedFilters);
    setAllTokens(filtered);
  } catch (err) {
    setError("Failed to load tokens. Please try again.");
    setAllTokens([]);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
}, [debouncedQuery, filters, advancedFilters, transformPairsToTokens]);


  useEffect(() => {
    loadTokens();
  }, [loadTokens]);

  // Optimized filtering with memoization
  const filteredResults = useMemo(() => {
    let filtered = [...allTokens];

    // Quick filters
    if (filters.includes("High Volume")) {
      filtered = filtered.filter((t) => (t.volume?.h24 || 0) > 100000);
    }
    if (filters.includes("Top Gainers")) {
      filtered = filtered.filter((t) => (t.priceChange?.h24 || 0) > 5);
    }
    if (filters.includes("Top Losers")) {
      filtered = filtered.filter((t) => (t.priceChange?.h24 || 0) < -5);
    }
    if (filters.includes("New Listings")) {
      // Filter logic for new listings (would need timestamp from API)
      filtered = filtered.filter((t) => t.symbol); // Placeholder
    }
    if (filters.includes("DeFi")) {
      // Filter for DeFi tokens (would need category from API)
      filtered = filtered.filter((t) => t.symbol); // Placeholder
    }
    if (filters.includes("Meme")) {
      // Filter for meme tokens (would need category from API)
      filtered = filtered.filter((t) => t.symbol); // Placeholder
    }

    // Advanced filters
    filtered = filtered.filter((token) => {
      const price = parseFloat(token.priceUsd) || 0;
      const volume = token.volume?.h24 || 0;
      const marketCap = token.marketCap || 0;
      const liquidity = token.liquidity?.usd || 0;
      const priceChange = token.priceChange?.h24 || 0;

      return (
        price >= advancedFilters.minPrice &&
        price <= advancedFilters.maxPrice &&
        volume >= advancedFilters.minVolume &&
        volume <= advancedFilters.maxVolume &&
        marketCap >= advancedFilters.minMarketCap &&
        marketCap <= advancedFilters.maxMarketCap &&
        liquidity >= advancedFilters.minLiquidity &&
        liquidity <= advancedFilters.maxLiquidity &&
        priceChange >= advancedFilters.minPriceChange &&
        priceChange <= advancedFilters.maxPriceChange &&
        (!advancedFilters.onlyVerified || token.verified)
      );
    });

    // Sort by relevance/volume
    return filtered.sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0));
  }, [allTokens, filters, advancedFilters]);

  const toggleFilter = useCallback((filter: string) => {
    setFilters((prev) =>
      prev.includes(filter) 
        ? prev.filter((f) => f !== filter) 
        : [...prev, filter]
    );
  }, []);

  const resetFilters = useCallback(() => {
    setFilters([]);
    setAdvancedFilters({
      minPrice: 0,
      maxPrice: 1000,
      minVolume: 0,
      maxVolume: 10000000,
      minMarketCap: 0,
      maxMarketCap: 1000000000,
      minLiquidity: 0,
      maxLiquidity: 10000000,
      onlyVerified: false,
      minPriceChange: -100,
      maxPriceChange: 100,
    });
  }, []);

  const renderToken = useCallback(
    ({ item, index }: { item: Token; index: number }) => {
      const animatedStyle = {
        opacity: animatedValue,
        transform: [
          {
            translateY: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0],
            }),
          },
        ],
      };

      return (
        <Animated.View 
          style={[animatedStyle, { marginBottom: 12 }]}
        >
          <TokenCard
            token={item}
            onPress={() => onTokenSelect(item)}
          />
        </Animated.View>
      );
    },
    [onTokenSelect, animatedValue]
  );

  const renderFilterBadge = useCallback(({ item }: { item: typeof availableFilters[0] }) => {
    const isActive = filters.includes(item.name);
    
    return (
      <TouchableOpacity
        style={[styles.filterBadge, isActive && styles.filterActive]}
        onPress={() => toggleFilter(item.name)}
        activeOpacity={0.7}
      >
        <Text style={styles.filterEmoji}>{item.icon}</Text>
        <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
          {item.name}
        </Text>
        {isActive && <X size={12} color="#fff" style={styles.filterCloseIcon} />}
      </TouchableOpacity>
    );
  }, [filters, toggleFilter]);

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Discover Tokens</Text>
      <Text style={styles.subtitle}>Find and track your favorite crypto tokens</Text>
      
      <View style={styles.searchContainer}>
        <Search size={20} color="#64748b" style={styles.searchIcon} />
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          placeholder="Search by symbol, name, or address..."
          value={query}
          onChangeText={setQuery}
          placeholderTextColor="#94a3b8"
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query ? (
          <TouchableOpacity 
            onPress={() => setQuery("")}
            style={styles.clearButton}
            activeOpacity={0.7}
          >
            <X size={16} color="#64748b" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Results count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {loading ? "Searching..." : `${filteredResults.length} tokens found`}
        </Text>
        {error && (
          <TouchableOpacity onPress={() => loadTokens()} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersSection}>
      <FlatList
        data={availableFilters}
        renderItem={renderFilterBadge}
        keyExtractor={(item) => item.name}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      />
      
      <View style={styles.filterActions}>
        <TouchableOpacity
          style={[styles.advancedButton, showAdvancedFilters && styles.advancedButtonActive]}
          onPress={() => setShowAdvancedFilters(!showAdvancedFilters)}
          activeOpacity={0.7}
        >
          <SlidersHorizontal size={16} color={showAdvancedFilters ? "#3b82f6" : "#64748b"} />
          <Text style={[styles.advancedText, showAdvancedFilters && styles.advancedTextActive]}>
            Advanced
          </Text>
        </TouchableOpacity>

        {(filters.length > 0) && (
          <TouchableOpacity style={styles.resetButton} onPress={resetFilters} activeOpacity={0.7}>
            <Text style={styles.resetText}>Reset All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Animated Advanced Filters */}
      <Animated.View
        style={[
          styles.advancedFiltersCard,
          {
            height: advancedFilterAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 200], // Adjust based on content
            }),
            opacity: advancedFilterAnimation,
          },
        ]}
      >
        <Text style={styles.advancedTitle}>Advanced Filters</Text>
        <Text style={styles.advancedSubtitle}>More filtering options coming soon...</Text>
        {/* Add your advanced filter controls here */}
      </Animated.View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateEmoji}>🔍</Text>
      <Text style={styles.emptyStateTitle}>
        {query ? "No tokens found" : "Start searching"}
      </Text>
      <Text style={styles.emptyStateSubtitle}>
        {query 
          ? `No results for "${query}". Try adjusting your search or filters.`
          : "Enter a token symbol, name, or address to get started"
        }
      </Text>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#3b82f6" />
      <Text style={styles.loadingText}>Finding tokens...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderFilters()}
      
      {loading && !refreshing ? (
        renderLoadingState()
      ) : filteredResults.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredResults}
          renderItem={renderToken}
          keyExtractor={(item) => item.address}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={21}
          removeClippedSubviews={Platform.OS === 'android'}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => loadTokens(true)}
          getItemLayout={(data, index) => ({
            length: 80, // Approximate item height
            offset: 80 * index,
            index,
          })}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 10,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
listContainer: {
  padding: 20,
},
searchContainer: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#f1f5f9",
  borderRadius: 12,
  paddingHorizontal: 12,
  height: 44,
  borderWidth: 1,
  borderColor: "#e2e8f0",
},
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 12,
  },
 
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#0f172a",
    fontWeight: "500",
  },
  clearButton: {
    padding: 4,
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  resultsCount: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#fee2e2",
    borderRadius: 8,
  },
  retryText: {
    fontSize: 12,
    color: "#dc2626",
    fontWeight: "600",
  },
  filtersSection: {
    backgroundColor: "#ffffff",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  filtersContainer: {
    paddingHorizontal: 20,
  },
  filterBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6
  },
  filterActive: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  filterEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  filterText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  filterTextActive: {
    color: "#ffffff",
  },
  filterCloseIcon: {
    marginLeft: 4,
  },
  filterActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  advancedButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  advancedButtonActive: {
    backgroundColor: "#dbeafe",
  },
  advancedText: {
    marginLeft: 6,
    color: "#64748b",
    fontSize: 14,
    fontWeight: "500",
  },
  advancedTextActive: {
    color: "#3b82f6",
  },
  resetButton: {
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  resetText: {
    color: "#dc2626",
    fontSize: 14,
    fontWeight: "600",
  },
  advancedFiltersCard: {
    marginTop: 12,
    marginHorizontal: 20,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingHorizontal: 16,
    overflow: "hidden",
  },
  advancedTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 8,
    marginTop: 16,
  },
  advancedSubtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748b",
    fontWeight: "500",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
  },
});