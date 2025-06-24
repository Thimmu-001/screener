import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { TokenCard } from '@/components/ui/TokenCard';
import { TokenDetailModal } from '@/components/modals/TokenDetailModal';
import { useTokenStore } from '@/lib/store';

const { width } = Dimensions.get('window');

export function PortfolioScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { watchlist, portfolioValue, removeFromWatchlist } = useTokenStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'watchlist' | 'boosted'>('watchlist');
  const [portfolioHistory] = useState([
    125430, 128900, 132100, 129800, 135600, 142300, 138900
  ]);
  
  const styles = getStyles(isDark);

  const portfolioChange = 12.5;
  const isPortfolioPositive = portfolioChange >= 0;

  const boostedTokens = watchlist.filter(token => token.baseToken?.boosts?.active > 0);
  const regularTokens = watchlist.filter(token => !token.baseToken?.boosts?.active);

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderPortfolioChart = () => (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Portfolio Performance (7D)</Text>
      <LineChart
        data={{
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{ data: portfolioHistory }],
        }}
        width={width - 48}
        height={200}
        yAxisLabel="$"
        chartConfig={{
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          backgroundGradientFrom: isDark ? '#1e293b' : '#ffffff',
          backgroundGradientTo: isDark ? '#1e293b' : '#ffffff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
          labelColor: (opacity = 1) => isDark ? `rgba(148, 163, 184, ${opacity})` : `rgba(100, 116, 139, ${opacity})`,
          style: { borderRadius: 16 },
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: '#3b82f6',
          },
        }}
        bezier
        style={styles.chart}
      />
    </View>
  );

  const renderPortfolioSummary = () => (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>Total Portfolio Value</Text>
      <Text style={styles.summaryValue}>
        ${portfolioValue.toLocaleString()}
      </Text>
      <View style={styles.summaryChange}>
        <Ionicons 
          name={isPortfolioPositive ? "trending-up" : "trending-down"} 
          size={16} 
          color={isPortfolioPositive ? '#10b981' : '#ef4444'} 
        />
        <Text style={[
          styles.summaryChangeText,
          { color: isPortfolioPositive ? '#10b981' : '#ef4444' }
        ]}>
          {isPortfolioPositive ? '+' : ''}{portfolioChange.toFixed(2)}% (24h)
        </Text>
      </View>
      <Text style={styles.summarySubtext}>
        {watchlist.length} tokens tracked
      </Text>
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <View style={styles.statIcon}>
          <Ionicons name="star" size={20} color="#ffffff" />
        </View>
        <View style={styles.statInfo}>
          <Text style={styles.statLabel}>Watchlist</Text>
          <Text style={styles.statValue}>{regularTokens.length}</Text>
        </View>
      </View>
      
      <View style={[styles.statCard, styles.statCardSecondary]}>
        <View style={[styles.statIcon, styles.statIconSecondary]}>
          <Ionicons name="flash" size={20} color="#ffffff" />
        </View>
        <View style={styles.statInfo}>
          <Text style={styles.statLabel}>Boosted</Text>
          <Text style={styles.statValue}>{boostedTokens.length}</Text>
        </View>
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'watchlist' && styles.activeTab]}
        onPress={() => setActiveTab('watchlist')}
      >
        <Ionicons 
          name="star" 
          size={16} 
          color={activeTab === 'watchlist' ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b')} 
        />
        <Text style={[
          styles.tabText, 
          activeTab === 'watchlist' && styles.activeTabText
        ]}>
          My Watchlist ({regularTokens.length})
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'boosted' && styles.activeTab]}
        onPress={() => setActiveTab('boosted')}
      >
        <Ionicons 
          name="flash" 
          size={16} 
          color={activeTab === 'boosted' ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b')} 
        />
        <Text style={[
          styles.tabText, 
          activeTab === 'boosted' && styles.activeTabText
        ]}>
          Boosted ({boostedTokens.length})
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderTokenList = () => {
    const tokensToShow = activeTab === 'watchlist' ? regularTokens : boostedTokens;
    
    if (tokensToShow.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons 
            name={activeTab === 'watchlist' ? 'star-outline' : 'flash-outline'} 
            size={48} 
            color={isDark ? '#64748b' : '#94a3b8'} 
          />
          <Text style={styles.emptyText}>
            No {activeTab === 'watchlist' ? 'Watchlist' : 'Boosted'} Tokens
          </Text>
          <Text style={styles.emptySubtext}>
            {activeTab === 'watchlist' 
              ? 'Add tokens to your watchlist to track them here'
              : 'No boosted tokens in your portfolio'
            }
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.tokenList}>
        {tokensToShow.map((token, index) => (
          <View key={token.id} style={styles.tokenItem}>
            <TokenCard
              token={token}
              onPress={() => setSelectedToken(token)}
            />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeFromWatchlist(token.id)}
            >
              <Ionicons name="close" size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>My Portfolio</Text>
          <Text style={styles.subtitle}>Track your favorite tokens</Text>
        </View>

        {/* Portfolio Summary */}
        {renderPortfolioSummary()}

        {/* Portfolio Chart */}
        {renderPortfolioChart()}

        {/* Stats */}
        {renderStats()}

        {/* Tabs */}
        {renderTabs()}

        {/* Token List */}
        {renderTokenList()}
      </ScrollView>
      
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
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
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
  summaryCard: {
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
  summaryLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#bfdbfe',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  summaryChange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryChangeText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 4,
  },
  summarySubtext: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#bfdbfe',
  },
  chartContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chartTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: isDark ? '#ffffff' : '#1e293b',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#10b981',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statCardSecondary: {
    backgroundColor: '#eab308',
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statIconSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 16,
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
  tokenList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  tokenItem: {
    position: 'relative',
    marginBottom: 12,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: isDark ? '#334155' : '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 16,
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
});