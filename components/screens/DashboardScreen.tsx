import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  RefreshControl, 
  TouchableOpacity,
  Animated 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {TokenCard} from '../ui/TokenCard';
import {StatsCard} from '../ui/StatsCard';
import { ThemeToggle } from '../ui/ThemeToggle';
import { dexAPI } from '@/lib/api';
import { useTokenStore } from '@/lib/store';
import { useTheme } from '@/providers/ThemeProvider';
import { router } from 'expo-router';
import { TokenDetailModal } from '../modals/TokenDetailModal';

// Types for BoostedToken
interface BoostedToken {
  id: string;
  tokenAddress: string;
  symbol: string;
  name: string;
  priceUsd: string;
  priceChange: { h24: number };
  volume: { h24: number };
  marketCap: number;
  liquidity: { usd: number };
  chainId: string;
  address: string;
  boosted: boolean;
  baseToken: {
    symbol: string;
    name: string;
    address: string;
  };
  [key: string]: any;
}

export default function DashboardScreen() {
  const { isDark } = useTheme();
  const { setTopTokens, portfolioValue, watchlist } = useTokenStore();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [boostedTokens, setBoostedTokens] = useState<BoostedToken[]>([]);
  const [selectedToken, setSelectedToken] = useState<BoostedToken | null>(null);
  const styles = getStyles(isDark);

  useEffect(() => {
    fetchDashboardTokens();
    
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Fetch tokens for dashboard using the same logic as TokensScreen
  const fetchDashboardTokens = async () => {
    try {
      setLoading(true);
      const chains = ['ethereum', 'bsc', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'solana'];
      const searchPromises = chains.map(chain =>
        dexAPI.searchPairs(chain).catch(() => ({ pairs: [] }))
      );
      const results = await Promise.all(searchPromises);
      const allPairs = results.flatMap(result => Array.isArray(result.pairs) ? result.pairs : []);
      // Transform pairs to tokens and deduplicate
      const tokenMap = new Map<string, any>();
      allPairs.forEach(pair => {
        if (!pair || typeof pair !== 'object' || !pair.baseToken || !pair.baseToken.address || !pair.chainId) return;
        const tokenKey = `${pair.baseToken.address}-${pair.chainId}`;
        const existingToken = tokenMap.get(tokenKey);
        if (existingToken) {
          existingToken.volume = existingToken.volume || { h24: 0 };
          existingToken.liquidity = existingToken.liquidity || { usd: 0 };
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
            volume: pair.volume || { h24: 0 },
            liquidity: pair.liquidity || { usd: 0 },
          });
        }
      });
      const uniqueTokens = Array.from(tokenMap.values())
        .filter(token => token.volume?.h24 > 1000)
        .slice(0, 20); // Show top 20 for dashboard
      setBoostedTokens(uniqueTokens);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      setBoostedTokens([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardTokens();
  };

  const portfolioChange = 12.5;
  const isPortfolioPositive = portfolioChange >= 0;

  const interleavePairs = (pairs: any[], blockchains: string[]) => {
    // Group by chain
    const grouped: Record<string, any[]> = {};
    blockchains.forEach(chain => grouped[chain] = []);
    pairs.forEach(pair => {
      if (grouped[pair._chain]) grouped[pair._chain].push(pair);
    });
    // Interleave
    const result: any[] = [];
    let added = true, i = 0;
    while (added && result.length < 16) {
      added = false;
      for (const chain of blockchains) {
        if (grouped[chain][i]) {
          result.push(grouped[chain][i]);
          added = true;
        }
      }
      i++;
    }
    return result;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Believe Screener</Text>
              <Text style={styles.subtitle}>Boosted Token Analytics</Text>
            </View>
            <View style={styles.headerActions}>
              <ThemeToggle />
              <TouchableOpacity 
                style={styles.searchButton}
                onPress={() => router.push('/(tabs)/tokens')}
              >
                <Ionicons name="search" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Portfolio Summary */}
          <Animated.View 
            style={[
              styles.portfolioCard,
              {
                transform: [{
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  })
                }]
              }
            ]}
          >
            <Text style={styles.portfolioLabel}>Portfolio Value</Text>
            <Text style={styles.portfolioValue}>
              ${portfolioValue.toLocaleString()}
            </Text>
            <View style={styles.portfolioChange}>
              <Ionicons 
                name={isPortfolioPositive ? "trending-up" : "trending-down"} 
                size={16} 
                color={isPortfolioPositive ? '#10b981' : '#ef4444'} 
              />
              <Text style={[
                styles.portfolioChangeText,
                { color: isPortfolioPositive ? '#10b981' : '#ef4444' }
              ]}>
                {isPortfolioPositive ? '+' : ''}{portfolioChange.toFixed(2)}% (24h)
              </Text>
            </View>
            <Text style={styles.portfolioSubtext}>
              {watchlist?.length} tokens tracked
            </Text>
          </Animated.View>

          {/* Stats Grid */}
          <Animated.View 
            style={[
              styles.statsGrid,
              {
                transform: [{
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  })
                }]
              }
            ]}
          >
            <StatsCard
              icon="flash"
              title="Total Market Cap"
              value={boostedTokens.length.toString()}
              color="#eab308"
            />
            <StatsCard
              icon="briefcase"
              title="Portfolio"
              value={watchlist?.length.toString()}
              color="#3b82f6"
            />
            <StatsCard
              icon="trending-up"
              title="Active"
              value="24/7"
              color="#10b981"
            />
            <StatsCard
              icon="layers"
              title="Chains"
              value="8"
              color="#f59e0b"
            />
          </Animated.View>

          {/* Quick Actions */}
          <Animated.View 
            style={[
              styles.quickActions,
              {
                transform: [{
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  })
                }]
              }
            ]}
          >
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/tokens')}
            >
              <Ionicons name="flash" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
              <Text style={styles.actionButtonText}>Boosted Tokens</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/portfolio')}
            >
              <Ionicons name="briefcase" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
              <Text style={styles.actionButtonText}>My Portfolio</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Tokens Section (like TokensScreen) */}
          {boostedTokens.length > 0 ? (
            <Animated.View 
              style={[
                styles.section,
                {
                  opacity: fadeAnim,
                  transform: [{
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [40, 0],
                    })
                  }]
                }
              ]}
            >
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Ionicons name="trending-up" size={20} color="#10b981" />
                  <Text style={styles.sectionTitle}>Trending Tokens</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/(tabs)/tokens')}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>
              {/* Render all boosted tokens, not just a subset */}
              {boostedTokens.map((token, index) => (
                <Animated.View
                  key={token.id || token.address || `token-${index}`}
                  style={{ opacity: fadeAnim, transform: [{ translateX: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [index % 2 === 0 ? 50 : -50, 0] }) }] }}
                >
                  <TokenCard
                    token={token}
                    onPress={() => setSelectedToken(token)}
                  />
                </Animated.View>
              ))}
            </Animated.View>
          ) : (
            <View style={{ alignItems: 'center', marginTop: 32 }}>
              <Text style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: 16 }}>No tokens found.</Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>

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
  animatedContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerText: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
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
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e2e8f0',
  },
  portfolioCard: {
    margin: 16,
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  portfolioLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#bfdbfe',
    marginBottom: 8,
  },
  portfolioValue: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  portfolioChange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  portfolioChangeText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 4,
  },
  portfolioSubtext: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#bfdbfe',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#e2e8f0',
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: isDark ? '#ffffff' : '#1e293b',
    marginLeft: 8,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: isDark ? '#ffffff' : '#1e293b',
    marginLeft: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#3b82f6',
  },
});