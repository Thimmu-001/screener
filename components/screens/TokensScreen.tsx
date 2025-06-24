import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TokenDetailModal } from '@/components/modals/TokenDetailModal';
import { TokenCard } from '@/components/ui/TokenCard';
import { dexAPI } from '@/lib/api';
import { useTokenStore } from '@/lib/store';
import { useDebounce } from '@/hooks/useDebounce';

const { width } = Dimensions.get('window');

type SortOption = 'name' | 'price' | 'change' | 'volume' | 'marketCap';
type ViewMode = 'grid' | 'list';

export function TokensScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useTokenStore();
  
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('volume');
  const [sortAscending, setSortAscending] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  const debouncedSearch = useDebounce(searchQuery, 300);
  const styles = getStyles(isDark);

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      setLoading(true);
      
      // Fetch from multiple chains to get comprehensive token data
      const chains = ['ethereum', 'bsc', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'solana'];
      const searchPromises = chains.map(chain => 
        dexAPI.searchPairs(chain).catch(() => ({ pairs: [] }))
      );
      
      const results = await Promise.all(searchPromises);
      const allPairs = results.flatMap(result => result.pairs || []);
      
      // Transform pairs to tokens and deduplicate
      const tokenMap = new Map();
      allPairs.forEach(pair => {
        if (!pair.baseToken) return;
        
        const tokenKey = `${pair.baseToken.address}-${pair.chainId}`;
        const existingToken = tokenMap.get(tokenKey);
        
        if (existingToken) {
          // Aggregate volume and liquidity
          existingToken.volume.h24 += pair.volume?.h24 || 0;
          existingToken.liquidity.usd += pair.liquidity?.usd || 0;
        } else {
          tokenMap.set(tokenKey, {
            ...pair,
            id: tokenKey,
            symbol: pair.baseToken.symbol,
            name: pair.baseToken.name,
            address: pair.baseToken.address,
            logoUri: pair.baseToken.logoUri,
          });
        }
      });
      
      const uniqueTokens = Array.from(tokenMap.values())
        .filter(token => token.volume?.h24 > 1000) // Filter out low volume tokens
        .slice(0, 200); // Limit for performance
      
      setTokens(uniqueTokens);
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredAndSortedTokens = useMemo(() => {
    let filtered = tokens;
    
    // Apply search filter
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      filtered = tokens.filter(token => 
        token.symbol?.toLowerCase().includes(query) ||
        token.name?.toLowerCase().includes(query) ||
        token.address?.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.symbol || '';
          bValue = b.symbol || '';
          break;
        case 'price':
          aValue = parseFloat(a.priceUsd || '0');
          bValue = parseFloat(b.priceUsd || '0');
          break;
        case 'change':
          aValue = a.priceChange?.h24 || 0;
          bValue = b.priceChange?.h24 || 0;
          break;
        case 'volume':
          aValue = a.volume?.h24 || 0;
          bValue = b.volume?.h24 || 0;
          break;
        case 'marketCap':
          aValue = a.marketCap || 0;
          bValue = b.marketCap || 0;
          break;
        default:
          return 0;
      }
      
      if (typeof aValue === 'string') {
        return sortAscending ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      return sortAscending ? aValue - bValue : bValue - aValue;
    });
    
    return filtered;
  }, [tokens, debouncedSearch, sortBy, sortAscending]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTokens();
  };

  const handleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortAscending(!sortAscending);
    } else {
      setSortBy(option);
      setSortAscending(false);
    }
    setShowFilters(false);
  };

  const renderToken = ({ item, index }: { item: any; index: number }) => {
    const isWatched = isInWatchlist(item.id);
    
    return (
      <View style={[
        styles.tokenContainer,
        viewMode === 'grid' && styles.tokenGridItem
      ]}>
        <TokenCard
          token={item}
          compact={viewMode === 'grid'}
          onPress={() => setSelectedToken(item)}
        />
        <TouchableOpacity
          style={[styles.watchButton, isWatched && styles.watchButtonActive]}
          onPress={() => {
            if (isWatched) {
              removeFromWatchlist(item.id);
            } else {
              addToWatchlist(item);
            }
          }}
        >
          <Ionicons
            name={isWatched ? 'star' : 'star-outline'}
            size={16}
            color={isWatched ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b')}
          />
        </TouchableOpacity>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Tokens</Text>
        <Text style={styles.subtitle}>
          {filteredAndSortedTokens.length} tokens available
        </Text>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={isDark ? '#64748b' : '#94a3b8'} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tokens..."
          placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close" size={20} color={isDark ? '#64748b' : '#94a3b8'} />
          </TouchableOpacity>
        ) : null}
      </View>
      
      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="filter" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
          <Text style={styles.controlButtonText}>Sort</Text>
        </TouchableOpacity>
        
        <View style={styles.viewModeContainer}>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeActive]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons name="list" size={20} color={
              viewMode === 'list' ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b')
            } />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'grid' && styles.viewModeActive]}
            onPress={() => setViewMode('grid')}
          >
            <Ionicons name="grid" size={20} color={
              viewMode === 'grid' ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b')
            } />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Sort Options */}
      {showFilters && (
        <View style={styles.sortContainer}>
          {[
            { key: 'volume', label: 'Volume' },
            { key: 'price', label: 'Price' },
            { key: 'change', label: '24h Change' },
            { key: 'name', label: 'Name' },
            { key: 'marketCap', label: 'Market Cap' },
          ].map(option => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.sortOption,
                sortBy === option.key && styles.sortOptionActive
              ]}
              onPress={() => handleSort(option.key as SortOption)}
            >
              <Text style={[
                styles.sortOptionText,
                sortBy === option.key && styles.sortOptionTextActive
              ]}>
                {option.label}
              </Text>
              {sortBy === option.key && (
                <Ionicons
                  name={sortAscending ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="#ffffff"
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search" size={48} color={isDark ? '#64748b' : '#94a3b8'} />
      <Text style={styles.emptyText}>
        {searchQuery ? 'No tokens found' : 'No tokens available'}
      </Text>
      <Text style={styles.emptySubtext}>
        {searchQuery 
          ? `No results for "${searchQuery}"`
          : 'Try refreshing to load tokens'
        }
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredAndSortedTokens}
        renderItem={renderToken}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!loading ? renderEmpty : null}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode} // Force re-render when view mode changes
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        initialNumToRender={20}
        maxToRenderPerBatch={10}
        windowSize={21}
        removeClippedSubviews={Platform.OS === 'android'}
      />
      
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading tokens...</Text>
        </View>
      )}
      
      {/* Token Detail Modal */}
      <TokenDetailModal
        token={selectedToken}
        visible={!!selectedToken}
        onClose={() => setSelectedToken(null)}
      />
    </SafeAreaView>
  );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  header: {
    paddingVertical: 16,
  },
  titleContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: isDark ? '#ffffff' : '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: isDark ? '#94a3b8' : '#64748b',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: isDark ? '#ffffff' : '#1e293b',
    marginLeft: 12,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  controlButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: isDark ? '#ffffff' : '#1e293b',
    marginLeft: 6,
  },
  viewModeContainer: {
    flexDirection: 'row',
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    borderRadius: 8,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  viewModeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  viewModeActive: {
    backgroundColor: '#3b82f6',
  },
  sortContainer: {
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 2,
  },
  sortOptionActive: {
    backgroundColor: '#3b82f6',
  },
  sortOptionText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: isDark ? '#ffffff' : '#1e293b',
  },
  sortOptionTextActive: {
    color: '#ffffff',
  },
  tokenContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  tokenGridItem: {
    width: (width - 48) / 2,
    marginHorizontal: 4,
  },
  watchButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: isDark ? '#334155' : '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  watchButtonActive: {
    backgroundColor: '#eab308',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: isDark ? '#ffffff' : '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: isDark ? '#94a3b8' : '#64748b',
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(248, 250, 252, 0.8)',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: isDark ? '#ffffff' : '#1e293b',
    marginTop: 12,
  },
});