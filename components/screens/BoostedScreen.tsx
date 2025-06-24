import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { dexAPI } from '@/lib/api';

export function BoostedScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [latestBoosted, setLatestBoosted] = useState<any[]>([]);
  const [topBoosted, setTopBoosted] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'top' | 'latest'>('top');
  
  const styles = getStyles(isDark);

  useEffect(() => {
    fetchBoostedTokens();
  }, []);

  const fetchBoostedTokens = async () => {
    try {
      setLoading(true);
      const [latest, top] = await Promise.all([
        dexAPI.getLatestBoostedTokens(),
        dexAPI.getTopBoostedTokens()
      ]);
      setLatestBoosted(latest);
      setTopBoosted(top);
    } catch (error) {
      console.error('Failed to fetch boosted tokens:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBoostedTokens();
  };

  const getChainColor = (chainId: string) => {
    const colors: { [key: string]: string } = {
      ethereum: '#3b82f6',
      bsc: '#eab308',
      polygon: '#8b5cf6',
      arbitrum: '#1d4ed8',
      optimism: '#ef4444',
      avalanche: '#dc2626',
      solana: '#10b981',
    };
    return colors[chainId?.toLowerCase()] || '#6b7280';
  };

  const renderBoostedToken = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity 
      style={styles.tokenCard}
      onPress={() => {
        console.log('Navigate to token:', item);
      }}
    >
      <View style={styles.tokenHeader}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>#{index + 1}</Text>
        </View>
        
        <View style={styles.tokenIcon}>
          <Ionicons name="flash" size={24} color="#ffffff" />
        </View>
        
        <View style={styles.tokenInfo}>
          <Text style={styles.tokenTitle}>
            {item.tokenAddress?.slice(0, 8)}...{item.tokenAddress?.slice(-6)}
          </Text>
          <View style={styles.boostInfo}>
            <View style={styles.boostBadge}>
              <Ionicons name="flash" size={12} color="#ffffff" />
              <Text style={styles.boostBadgeText}>{item.totalAmount} boosts</Text>
            </View>
            <Text style={styles.boostAmount}>${item.amount}</Text>
          </View>
          {item.description && (
            <Text style={styles.tokenDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>
        
        <View style={[
          styles.chainBadge,
          { backgroundColor: getChainColor(item.chainId) }
        ]}>
          <Text style={styles.chainBadgeText}>
            {item.chainId?.charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="flash" size={48} color={isDark ? '#64748b' : '#94a3b8'} />
      <Text style={styles.emptyText}>
        No {activeTab === 'top' ? 'Top' : 'Latest'} Boosted Tokens
      </Text>
      <Text style={styles.emptySubtext}>
        No {activeTab === 'top' ? 'top' : 'recently'} boosted tokens are currently available.
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.title}>Boosted Tokens</Text>
      <Text style={styles.subtitle}>Promoted and trending tokens</Text>
      
      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statsCard}>
          <View style={styles.statsIcon}>
            <Ionicons name="trending-up" size={20} color="#ffffff" />
          </View>
          <View style={styles.statsInfo}>
            <Text style={styles.statsLabel}>Top Boosted</Text>
            <Text style={styles.statsValue}>
              {loading ? '...' : topBoosted?.length}
            </Text>
          </View>
        </View>
        
        <View style={[styles.statsCard, styles.statsCardSecondary]}>
          <View style={[styles.statsIcon, styles.statsIconSecondary]}>
            <Ionicons name="time" size={20} color="#ffffff" />
          </View>
          <View style={styles.statsInfo}>
            <Text style={styles.statsLabel}>Latest</Text>
            <Text style={styles.statsValue}>
              {loading ? '...' : latestBoosted?.length}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'top' && styles.activeTab]}
          onPress={() => setActiveTab('top')}
        >
          <Ionicons 
            name="trending-up" 
            size={16} 
            color={activeTab === 'top' ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b')} 
          />
          <Text style={[
            styles.tabText, 
            activeTab === 'top' && styles.activeTabText
          ]}>
            Top Boosted
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'latest' && styles.activeTab]}
          onPress={() => setActiveTab('latest')}
        >
          <Ionicons 
            name="time" 
            size={16} 
            color={activeTab === 'latest' ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b')} 
          />
          <Text style={[
            styles.tabText, 
            activeTab === 'latest' && styles.activeTabText
          ]}>
            Latest
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const currentData = activeTab === 'top' ? topBoosted : latestBoosted;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={currentData}
        renderItem={renderBoostedToken}
        keyExtractor={(item, index) => `${item.tokenAddress}-${index}`}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!loading ? renderEmpty : null}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
      
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      )}
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
  headerContainer: {
    paddingVertical: 16,
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
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statsCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#eab308',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsCardSecondary: {
    backgroundColor: '#f97316',
  },
  statsIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statsIconSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statsInfo: {
    flex: 1,
  },
  statsLabel: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  statsValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: isDark ? '#94a3b8' : '#64748b',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#ffffff',
  },
  tokenCard: {
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tokenHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#eab308',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  tokenIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eab308',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tokenInfo: {
    flex: 1,
    marginRight: 12,
  },
  tokenTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: isDark ? '#ffffff' : '#1e293b',
    marginBottom: 8,
  },
  boostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  boostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#eab308',
    marginRight: 8,
  },
  boostBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    marginLeft: 4,
  },
  boostAmount: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: isDark ? '#94a3b8' : '#64748b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: isDark ? '#334155' : '#e2e8f0',
  },
  tokenDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: isDark ? '#94a3b8' : '#64748b',
    lineHeight: 20,
  },
  chainBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chainBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
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
});