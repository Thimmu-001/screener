import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { dexAPI } from '@/lib/api';
import { useTheme } from '@/providers/ThemeProvider';

const screenWidth = Dimensions.get('window').width;

export default function TokenDetailScreen({ token, onBack }: { token: any, onBack: () => void }) {
  const [tokenPairs, setTokenPairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceHistory, setPriceHistory] = useState<number[]>([]);
  const { isDark } = useTheme();

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        if (token?.chainId && (token?.tokenAddress || token?.address)) {
          const pairs = await dexAPI.getTokenPairs(token.chainId, token.tokenAddress || token.address);
          setTokenPairs(Array.isArray(pairs) ? pairs : []);
        }
        // Generate mock price history for now
        const basePrice = parseFloat(token.priceUsd || '1');
        const history = [];
        for (let i = 0; i < 7; i++) {
          const variation = (Math.random() - 0.5) * 0.1;
          history.push(Math.max(0.000001, basePrice * (1 + variation)));
        }
        setPriceHistory(history);
      } catch (e) {
        setTokenPairs([]);
        setPriceHistory([]);
      }
      setLoading(false);
    };
    fetchDetails();
  }, [token]);

  if (!token) return null;

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

  const priceChange = token.priceChange?.h24 || 0;
  const isPositive = priceChange >= 0;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}> 
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={isDark ? '#60a5fa' : '#2563eb'} />
        </TouchableOpacity>
        <View style={styles.tokenHeaderInfo}>
          {token.logoUri ? (
            <Image source={{ uri: token.logoUri }} style={styles.tokenLogo} />
          ) : (
            <View style={[styles.tokenLogo, { backgroundColor: isDark ? '#1e293b' : '#e5e7eb' }]} />
          )}
          <View>
            <Text style={[styles.tokenSymbol, { color: isDark ? '#f1f5f9' : '#0f172a' }]}>{token.baseToken?.symbol || token.symbol || 'Token'}</Text>
            <Text style={[styles.tokenName, { color: isDark ? '#94a3b8' : '#64748b' }]}>{token.baseToken?.name || token.name || ''}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Token Info Card */}
        <View style={[styles.infoCard, { backgroundColor: isDark ? '#181f2e' : '#fff', borderColor: isDark ? '#334155' : '#e5e7eb' }]}> 
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Address</Text><Text style={styles.infoValue}>{token.tokenAddress || token.pairAddress || token.address}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Chain</Text><Text style={styles.infoValue}>{token.chainId || token._chain || 'N/A'}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Price</Text><Text style={[styles.infoValue, { fontWeight: 'bold', color: isDark ? '#60a5fa' : '#2563eb' }]}>{token.priceUsd ? formatNumber(token.priceUsd) : 'N/A'}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>24h Volume</Text><Text style={styles.infoValue}>{token.volume?.h24 ? formatNumber(token.volume.h24) : 'N/A'}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Liquidity</Text><Text style={styles.infoValue}>{token.liquidity?.usd ? formatNumber(token.liquidity.usd) : 'N/A'}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Market Cap</Text><Text style={styles.infoValue}>{token.marketCap ? formatNumber(token.marketCap) : 'N/A'}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Price Change (24h)</Text><Text style={[styles.infoValue, { color: isPositive ? '#10b981' : '#ef4444' }]}>{formatPercentage(priceChange)}</Text></View>
        </View>

        {/* Price Chart */}
        <View style={[styles.chartCard, { backgroundColor: isDark ? '#181f2e' : '#fff', borderColor: isDark ? '#334155' : '#e5e7eb' }]}> 
          <Text style={[styles.chartTitle, { color: isDark ? '#f1f5f9' : '#0f172a' }]}>Price Chart (7d)</Text>
          <LineChart
            data={{
              labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
              datasets: [{ data: priceHistory }],
            }}
            width={screenWidth - 48}
            height={180}
            yAxisLabel="$"
            chartConfig={{
              backgroundColor: isDark ? '#181f2e' : '#fff',
              backgroundGradientFrom: isDark ? '#181f2e' : '#f8fafc',
              backgroundGradientTo: isDark ? '#181f2e' : '#f8fafc',
              decimalPlaces: 6,
              color: (opacity = 1) => isDark ? `rgba(96, 165, 250, ${opacity})` : `rgba(37, 99, 235, ${opacity})`,
              labelColor: (opacity = 1) => isDark ? `rgba(226, 232, 240, ${opacity})` : `rgba(100, 116, 139, ${opacity})`,
              style: { borderRadius: 16 },
              propsForDots: { r: '4', strokeWidth: '2', stroke: isDark ? '#60a5fa' : '#2563eb' },
            }}
            bezier
            style={{ marginVertical: 8, borderRadius: 16 }}
          />
        </View>

        {/* Pairs List */}
        <View style={[styles.pairsCard, { backgroundColor: isDark ? '#181f2e' : '#fff', borderColor: isDark ? '#334155' : '#e5e7eb' }]}> 
          <Text style={[styles.pairsTitle, { color: isDark ? '#f1f5f9' : '#0f172a' }]}>Pairs</Text>
          {loading ? (
            <ActivityIndicator color={isDark ? '#60a5fa' : '#2563eb'} />
          ) : (
            tokenPairs.length > 0 ? tokenPairs.map((pair, idx) => (
              <View key={idx} style={styles.pairRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pairSymbol, { color: isDark ? '#f1f5f9' : '#0f172a' }]}>{pair.baseToken?.symbol} / {pair.quoteToken?.symbol}</Text>
                  <Text style={[styles.pairAddress, { color: isDark ? '#94a3b8' : '#64748b' }]}>{pair.pairAddress}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.pairPrice, { color: isDark ? '#60a5fa' : '#2563eb' }]}>{pair.priceUsd ? formatNumber(pair.priceUsd) : 'N/A'}</Text>
                  <Text style={[styles.pairVolume, { color: isDark ? '#f1f5f9' : '#0f172a' }]}>Vol: {pair.volume?.h24 ? formatNumber(pair.volume.h24) : 'N/A'}</Text>
                </View>
              </View>
            )) : <Text style={[styles.value, { color: isDark ? '#f1f5f9' : '#0f172a' }]}>No pairs found.</Text>
          )}
        </View>

        {/* Entire API Response (Debug/Transparency) */}
        <View style={[styles.pairsCard, { backgroundColor: isDark ? '#181f2e' : '#fff', borderColor: isDark ? '#334155' : '#e5e7eb' }]}> 
          <Text style={[styles.pairsTitle, { color: isDark ? '#f1f5f9' : '#0f172a', marginBottom: 8 }]}>Full API Response</Text>
          <ScrollView horizontal style={{ maxHeight: 200 }}>
            <Text style={{ color: isDark ? '#f1f5f9' : '#0f172a', fontSize: 12, fontFamily: 'Inter-Regular' }}>
              {JSON.stringify(token, null, 2)}
            </Text>
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 0 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingBottom: 0, backgroundColor: 'transparent' },
  backButton: { marginRight: 12 },
  tokenHeaderInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tokenLogo: { width: 56, height: 56, borderRadius: 28, marginRight: 16, borderWidth: 2, borderColor: '#3b82f6', backgroundColor: '#e5e7eb' },
  tokenSymbol: { fontSize: 28, fontFamily: 'Inter-Bold', letterSpacing: 1 },
  tokenName: { fontSize: 16, fontFamily: 'Inter-Regular', marginTop: 2 },
  scrollView: { flex: 1, backgroundColor: 'transparent' },
  infoCard: {
    margin: 16,
    marginBottom: 0,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 3,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  infoLabel: { fontSize: 15, color: '#64748b', fontFamily: 'Inter-SemiBold' },
  infoValue: { fontSize: 16, color: '#1e293b', fontFamily: 'Inter-Regular', maxWidth: '60%', textAlign: 'right' },
  chartCard: {
    margin: 16,
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 3,
  },
  chartTitle: { fontSize: 20, fontFamily: 'Inter-Bold', marginBottom: 8 },
  pairsCard: {
    margin: 16,
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 3,
  },
  pairsTitle: { fontSize: 20, fontFamily: 'Inter-Bold', marginBottom: 16 },
  pairRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  pairSymbol: { fontSize: 17, fontFamily: 'Inter-SemiBold' },
  pairAddress: { fontSize: 12, fontFamily: 'Inter-Regular', marginTop: 2 },
  pairPrice: { fontSize: 17, fontFamily: 'Inter-Bold' },
  pairVolume: { fontSize: 12, fontFamily: 'Inter-Regular', marginTop: 2 },
  value: { marginBottom: 8 },
});