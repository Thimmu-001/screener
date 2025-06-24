import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { dexAPI } from '@/lib/api';

const screenWidth = Dimensions.get('window').width;

export default function TokenDetailScreen({ token, onBack }: { token: any, onBack: () => void }) {
  const [tokenPairs, setTokenPairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock price data for the chart (replace with real data if available)
  const [priceHistory, setPriceHistory] = useState<number[]>([1.2, 1.3, 1.5, 1.4, 1.6, 1.7, 1.8]);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        if (token?.chainId && token?.tokenAddress) {
          const pairs = await dexAPI.getTokenPairs(token.chainId, token.tokenAddress);
          setTokenPairs(Array.isArray(pairs) ? pairs : []);
        }
        // TODO: Fetch real price history here and setPriceHistory([...])
      } catch (e) {
        setTokenPairs([]);
      }
      setLoading(false);
    };
    fetchDetails();
  }, [token]);

  if (!token) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#2563eb" />
        </TouchableOpacity>
        <Text style={styles.title}>{token.baseToken?.symbol || token.symbol || 'Token'}</Text>
      </View>

      <ScrollView style={{ flex: 1 }}>
        <Text style={styles.address}>{token.tokenAddress || token.pairAddress}</Text>
        <Text style={styles.label}>Price USD:</Text>
        <Text style={styles.value}>{token.priceUsd ? `$${parseFloat(token.priceUsd).toFixed(6)}` : 'N/A'}</Text>

        {/* Price Chart */}
        <Text style={styles.label}>Price Chart (7d)</Text>
        <LineChart
          data={{
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{ data: priceHistory }],
          }}
          width={screenWidth - 48}
          height={180}
          yAxisLabel="$"
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#f8fafc',
            backgroundGradientTo: '#f8fafc',
            decimalPlaces: 2,
            color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: { r: '4', strokeWidth: '2', stroke: '#2563eb' },
          }}
          bezier
          style={{ marginVertical: 8, borderRadius: 16 }}
        />

        <Text style={styles.label}>24h Volume:</Text>
        <Text style={styles.value}>{token.volume?.h24 ? `$${token.volume.h24}` : 'N/A'}</Text>

        {/* Add more fields as needed */}
        <Text style={styles.label}>Pairs:</Text>
        {loading ? (
          <ActivityIndicator />
        ) : (
          tokenPairs.length > 0 ? tokenPairs.map((pair, idx) => (
            <View key={idx} style={styles.pairRow}>
              <Text>{pair.baseToken?.symbol} / {pair.quoteToken?.symbol}</Text>
              <Text>{pair.priceUsd ? `$${parseFloat(pair.priceUsd).toFixed(6)}` : 'N/A'}</Text>
            </View>
          )) : <Text style={styles.value}>No pairs found.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', borderRadius: 12, padding: 16, flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 20, fontWeight: 'bold', marginLeft: 12 },
  address: { fontSize: 12, color: '#64748b', marginBottom: 8 },
  label: { fontWeight: 'bold', marginTop: 12 },
  value: { marginBottom: 8 },
  pairRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
});