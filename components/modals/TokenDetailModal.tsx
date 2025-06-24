import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Dimensions,
  Linking,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useTokenStore } from '@/lib/store';
import { dexAPI } from '@/lib/api';

const { width, height } = Dimensions.get('window');

interface TokenDetailModalProps {
  token: any;
  visible: boolean;
  onClose: () => void;
}

type TimeFrame = '1D' | '1W' | '1M' | '1Y';

export function TokenDetailModal({ token, visible, onClose }: TokenDetailModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useTokenStore();
  
  const [loading, setLoading] = useState(false);
  const [tokenPairs, setTokenPairs] = useState<any[]>([]);
  const [activeTimeFrame, setActiveTimeFrame] = useState<TimeFrame>('1W');
  const [priceHistory, setPriceHistory] = useState<number[]>([]);
  
  const styles = getStyles(isDark);
  const isWatched = token ? isInWatchlist(token.id) : false;

  useEffect(() => {
    if (token && visible) {
      fetchTokenDetails();
      generateMockPriceHistory();
    }
  }, [token, visible, activeTimeFrame]);

  const fetchTokenDetails = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      if (token.chainId && token.address) {
        const pairs = await dexAPI.getTokenPairs(token.chainId, token.address);
        setTokenPairs(Array.isArray(pairs) ? pairs : []);
      }
    } catch (error) {
      console.error('Failed to fetch token details:', error);
      setTokenPairs([]);
    } finally {
      setLoading(false);
    }
  };

  const generateMockPriceHistory = () => {
    if (!token) return;
    
    const basePrice = parseFloat(token.priceUsd || '1');
    const dataPoints = activeTimeFrame === '1D' ? 24 : 
                      activeTimeFrame === '1W' ? 7 : 
                      activeTimeFrame === '1M' ? 30 : 365;
    
    const history = [];
    for (let i = 0; i < dataPoints; i++) {
      const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
      const price = basePrice * (1 + variation);
      history.push(Math.max(0.000001, price));
    }
    
    setPriceHistory(history);
  };

  const formatNumber = (num: number | string) => {
    const n = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(n)) return 'N/A';

    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
    return `$${n.toFixed(6)}`;
  };

  const formatPercentage = (num: number) => {
    if (isNaN(num)) return 'N/A';
    const sign = num >= 0 ? '+' : '';
    return `${sign}${num.toFixed(2)}%`;
  };

  const handleWatchlistToggle = () => {
    if (!token) return;
    
    if (isWatched) {
      removeFromWatchlist(token.id);
    } else {
      addToWatchlist(token);
    }
  };

  const openLink = (url: string) => {
    if (url) {
      Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
    }
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

  if (!token) return null;

  const priceChange = token.priceChange?.h24 || 0;
  const isPositive = priceChange >= 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={isDark ? '#ffffff' : '#1e293b'} />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <View style={styles.tokenHeader}>
              {token.logoUri ? (
                <Image source={{ uri: token.logoUri }} style={styles.tokenLogo} />
              ) : (
                <View style={styles.tokenIcon}>
                  <Text style={styles.tokenIconText}>
                    {(token.symbol || 'T').charAt(0)}
                  </Text>
                </View>
              )}
              <View style={styles.tokenTitleContainer}>
                <Text style={styles.tokenSymbol}>{token.symbol || 'TOKEN'}</Text>
                <Text style={styles.tokenName}>{token.name || 'Token Name'}</Text>
              </View>
              <View style={[
                styles.chainBadge,
                { backgroundColor: getChainColor(token.chainId) }
              ]}>
                <Text style={styles.chainBadgeText}>
                  {token.chainId?.charAt(0).toUpperCase() || 'C'}
                </Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.watchButton, isWatched && styles.watchButtonActive]}
            onPress={handleWatchlistToggle}
          >
            <Ionicons
              name={isWatched ? 'star' : 'star-outline'}
              size={20}
              color={isWatched ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b')}
            />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Price Section */}
          <View style={styles.priceSection}>
            <Text style={styles.currentPrice}>
              {formatNumber(parseFloat(token.priceUsd || '0'))}
            </Text>
            <View style={styles.priceChangeContainer}>
              <Ionicons 
                name={isPositive ? 'trending-up' : 'trending-down'} 
                size={16} 
                color={isPositive ? '#10b981' : '#ef4444'} 
              />
              <Text style={[
                styles.priceChangeText,
                { color: isPositive ? '#10b981' : '#ef4444' }
              ]}>
                {formatPercentage(Math.abs(priceChange))} (24h)
              </Text>
            </View>
          </View>

          {/* Chart Section */}
          <View style={styles.chartSection}>
            <View style={styles.timeFrameContainer}>
              {(['1D', '1W', '1M', '1Y'] as TimeFrame[]).map(timeFrame => (
                <TouchableOpacity
                  key={timeFrame}
                  style={[
                    styles.timeFrameButton,
                    activeTimeFrame === timeFrame && styles.timeFrameActive
                  ]}
                  onPress={() => setActiveTimeFrame(timeFrame)}
                >
                  <Text style={[
                    styles.timeFrameText,
                    activeTimeFrame === timeFrame && styles.timeFrameTextActive
                  ]}>
                    {timeFrame}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {priceHistory.length > 0 && (
              <LineChart
                data={{
                  labels: activeTimeFrame === '1D' ? 
                    ['00', '04', '08', '12', '16', '20'] :
                    activeTimeFrame === '1W' ?
                    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] :
                    activeTimeFrame === '1M' ?
                    ['W1', 'W2', 'W3', 'W4'] :
                    ['Q1', 'Q2', 'Q3', 'Q4'],
                  datasets: [{ data: priceHistory.slice(0, 6) }],
                }}
                width={width - 48}
                height={200}
                yAxisLabel="$"
                chartConfig={{
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  backgroundGradientFrom: isDark ? '#1e293b' : '#ffffff',
                  backgroundGradientTo: isDark ? '#1e293b' : '#ffffff',
                  decimalPlaces: 6,
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
            )}
          </View>

          {/* Stats Section */}
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Key Metrics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Market Cap</Text>
                <Text style={styles.statValue}>
                  {formatNumber(token.marketCap || 0)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>24h Volume</Text>
                <Text style={styles.statValue}>
                  {formatNumber(token.volume?.h24 || 0)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Liquidity</Text>
                <Text style={styles.statValue}>
                  {formatNumber(token.liquidity?.usd || 0)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Pair Address</Text>
                <Text style={styles.statValue} numberOfLines={1}>
                  {token.pairAddress ? 
                    `${token.pairAddress.slice(0, 6)}...${token.pairAddress.slice(-4)}` : 
                    'N/A'
                  }
                </Text>
              </View>
            </View>
          </View>

          {/* Links Section */}
          <View style={styles.linksSection}>
            <Text style={styles.sectionTitle}>External Links</Text>
            <View style={styles.linksGrid}>
              <TouchableOpacity 
                style={styles.linkButton}
                onPress={() => openLink(`https://dexscreener.com/${token.chainId}/${token.pairAddress}`)}
              >
                <Ionicons name="analytics" size={20} color="#3b82f6" />
                <Text style={styles.linkText}>DexScreener</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.linkButton}
                onPress={() => openLink(`https://etherscan.io/address/${token.address}`)}
              >
                <Ionicons name="search" size={20} color="#3b82f6" />
                <Text style={styles.linkText}>Explorer</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.linkButton}
                onPress={() => openLink(`https://coinmarketcap.com/currencies/${token.symbol?.toLowerCase()}`)}
              >
                <Ionicons name="trending-up" size={20} color="#3b82f6" />
                <Text style={styles.linkText}>CoinMarketCap</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.linkButton}
                onPress={() => openLink(`https://coingecko.com/en/coins/${token.symbol?.toLowerCase()}`)}
              >
                <Ionicons name="logo-github" size={20} color="#3b82f6" />
                <Text style={styles.linkText}>CoinGecko</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Trading Pairs */}
          {tokenPairs.length > 0 && (
            <View style={styles.pairsSection}>
              <Text style={styles.sectionTitle}>Trading Pairs</Text>
              {loading ? (
                <ActivityIndicator size="small" color="#3b82f6" />
              ) : (
                tokenPairs.slice(0, 5).map((pair, index) => (
                  <View key={index} style={styles.pairItem}>
                    <Text style={styles.pairSymbol}>
                      {pair.baseToken?.symbol} / {pair.quoteToken?.symbol}
                    </Text>
                    <Text style={styles.pairPrice}>
                      {formatNumber(parseFloat(pair.priceUsd || '0'))}
                    </Text>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#334155' : '#e2e8f0',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  tokenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tokenIconText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  tokenTitleContainer: {
    flex: 1,
  },
  tokenSymbol: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: isDark ? '#ffffff' : '#1e293b',
  },
  tokenName: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: isDark ? '#94a3b8' : '#64748b',
  },
  chainBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  chainBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  watchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  watchButtonActive: {
    backgroundColor: '#eab308',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  priceSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  currentPrice: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: isDark ? '#ffffff' : '#1e293b',
    marginBottom: 8,
  },
  priceChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceChangeText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 4,
  },
  chartSection: {
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  timeFrameContainer: {
    flexDirection: 'row',
    backgroundColor: isDark ? '#334155' : '#f1f5f9',
    borderRadius: 8,
    padding: 2,
    marginBottom: 16,
  },
  timeFrameButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  timeFrameActive: {
    backgroundColor: '#3b82f6',
  },
  timeFrameText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: isDark ? '#94a3b8' : '#64748b',
  },
  timeFrameTextActive: {
    color: '#ffffff',
  },
  chart: {
    borderRadius: 16,
  },
  statsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: isDark ? '#ffffff' : '#1e293b',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: isDark ? '#94a3b8' : '#64748b',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: isDark ? '#ffffff' : '#1e293b',
  },
  linksSection: {
    marginBottom: 24,
  },
  linksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  linkButton: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  linkText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: isDark ? '#ffffff' : '#1e293b',
    marginLeft: 8,
  },
  pairsSection: {
    marginBottom: 24,
  },
  pairItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pairSymbol: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: isDark ? '#ffffff' : '#1e293b',
  },
  pairPrice: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: isDark ? '#94a3b8' : '#64748b',
  },
});