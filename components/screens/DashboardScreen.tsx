import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  RefreshControl, 
  TouchableOpacity,
  useColorScheme 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {TokenCard} from '../ui/TokenCard';
import {StatsCard} from '../ui/StatsCard';
import { ThemeToggle } from '../ui/ThemeToggle';
import { dexAPI } from '@/lib/api';
import { useTokenStore } from '@/lib/store';
import { DashboardData } from '@/lib/types/dextypes';
import { router } from 'expo-router';

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { setTopTokens, portfolioValue, watchlist } = useTokenStore();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    profiles: [],
    boostedLatest: [],
    boostedTop: [],
    searchResults: [],
  });
  const styles = getStyles(isDark);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Add or remove blockchains as needed
      const blockchains = ["solana", "ETH", "bsc", "polygon", "arbitrum", "avalanche", "optimism", "base"];
      const searchPromises = blockchains.map(chain => dexAPI.searchPairs(chain).catch(() => ({ pairs: [] })));

      const [profiles, boostedLatest, boostedTop, ...searchResults] = await Promise.all([
        dexAPI.getLatestTokenProfiles().catch(() => []),
        dexAPI.getLatestBoostedTokens().catch(() => []),
        dexAPI.getTopBoostedTokens().catch(() => []),
        ...searchPromises,
      ]);

      // Merge all pairs, limit to 5 per chain if you want
      const allPairs = searchResults.flatMap((result) => (result.pairs || []).slice(0, 5));

      setDashboardData({
        profiles: (profiles || []).slice(0, 5),
        boostedLatest: (boostedLatest || []).slice(0, 3),
        boostedTop: (boostedTop || []).slice(0, 3),
        searchResults: allPairs,
      });

      const sortedByVolume = allPairs
        .filter((pair) => (pair?.volume?.h24 || 0) > 10000)
        .sort((a, b) => (b?.volume?.h24 || 0) - (a?.volume?.h24 || 0))
        .slice(0, 8);

      setTopTokens(sortedByVolume);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const portfolioChange = 12.5;
  const isPortfolioPositive = portfolioChange >= 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>DexScreener Pro</Text>
            <Text style={styles.subtitle}>Complete Crypto Analytics</Text>
          </View>
          <View style={styles.headerActions}>
            <ThemeToggle />
            <TouchableOpacity 
              style={styles.searchButton}
              onPress={() => router.push('/(tabs)/search')}
            >
              <Ionicons name="search" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Portfolio Summary */}
        <View style={styles.portfolioCard}>
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
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatsCard
            icon="list"
            title="Tokens"
            value={dashboardData?.searchResults?.length.toString()}
            color="#3b82f6"
          />
          <StatsCard
            icon="people"
            title="Profiles"
            value={dashboardData?.profiles?.length.toString()}
            color="#8b5cf6"
          />
          <StatsCard
            icon="flash"
            title="Boosted"
            value={dashboardData?.boostedTop?.length.toString()}
            color="#eab308"
          />
          <StatsCard
            icon="trending-up"
            title="Trending"
            value="8"
            color="#10b981"
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/tokens')}
          >
            <Ionicons name="list" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            <Text style={styles.actionButtonText}>All Tokens</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/portfolio')}
          >
            <Ionicons name="briefcase" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            <Text style={styles.actionButtonText}>My Portfolio</Text>
          </TouchableOpacity>
        </View>

        {/* Boosted Tokens */}
        {dashboardData.boostedTop?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="flash" size={20} color="#eab308" />
                <Text style={styles.sectionTitle}>Top Boosted</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(tabs)/boosted')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            {dashboardData.boostedTop.map((token, index) => (
              <View key={index} style={styles.boostedTokenCard}>
                <View style={styles.boostedTokenIcon}>
                  <Ionicons name="flash" size={20} color="#ffffff" />
                </View>
                <View style={styles.boostedTokenInfo}>
                  <Text style={styles.boostedTokenTitle}>
                    {token.tokenAddress?.slice(0, 8)}...
                  </Text>
                  <Text style={styles.boostedTokenSubtitle}>
                    {token.totalAmount} boosts • ${token.amount}
                  </Text>
                </View>
                <View style={styles.boostedBadge}>
                  <Text style={styles.boostedBadgeText}>Boosted</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Trending Tokens */}
        {dashboardData?.searchResults?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="trending-up" size={20} color="#10b981" />
                <Text style={styles.sectionTitle}>Trending Pairs</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(tabs)/tokens')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            {dashboardData?.searchResults?.slice(0, 5).map((token, index) => (
              <TokenCard 
                key={index} 
                token={token} 
                onPress={() => {
                  // Navigate to token detail - would need to implement
                  console.log('Navigate to token:', token);
                }}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
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
  boostedTokenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  boostedTokenIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eab308',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  boostedTokenInfo: {
    flex: 1,
  },
  boostedTokenTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: isDark ? '#ffffff' : '#1e293b',
    marginBottom: 4,
  },
  boostedTokenSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: isDark ? '#94a3b8' : '#64748b',
  },
  boostedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#eab308',
  },
  boostedBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
});