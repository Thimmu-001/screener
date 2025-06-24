import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/providers/ThemeProvider';

interface TokenCardProps {
  token: any;
  onPress?: () => void;
  compact?: boolean;
}

export function TokenCard({ token, onPress, compact = false }: TokenCardProps) {
  const { isDark } = useTheme();
  const styles = getStyles(isDark, compact);

  const formatNumber = (num: number | string) => {
    const n = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(n)) return 'N/A';

    if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
    return `$${n.toFixed(2)}`;
  };

  const formatPercentage = (num: number) => {
    if (isNaN(num)) return 'N/A';
    const sign = num >= 0 ? '+' : '';
    return `${sign}${num.toFixed(2)}%`;
  };

  const priceChange = token.priceChange?.h24 || 0;
  const isPositive = priceChange >= 0;
  const volume = token.volume?.h24 || 0;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <View style={styles.tokenIcon}>
            <Text style={styles.tokenIconText}>
              {(token.baseToken?.symbol || token.symbol || 'T').charAt(0)}
            </Text>
          </View>
          <View style={styles.tokenInfo}>
            <View style={styles.tokenHeader}>
              <Text style={styles.tokenSymbol}>
                {token.baseToken?.symbol || token.symbol || 'TOKEN'}
              </Text>
              {token.boosts?.active > 0 && (
                <View style={styles.boostedBadge}>
                  <Text style={styles.boostedBadgeText}>Boosted</Text>
                </View>
              )}
            </View>
            <Text style={styles.tokenPrice}>
              {token.priceUsd ? `$${parseFloat(token.priceUsd).toFixed(6)}` : 'Price N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.rightSection}>
          <View style={styles.priceChangeContainer}>
            <Ionicons 
              name={isPositive ? 'trending-up' : 'trending-down'} 
              size={12} 
              color={isPositive ? '#10b981' : '#ef4444'} 
            />
            <Text style={[
              styles.priceChangeText,
              { color: isPositive ? '#10b981' : '#ef4444' }
            ]}>
              {formatPercentage(Math.abs(priceChange))}
            </Text>
          </View>
          <Text style={styles.volumeText}>
            Vol: {formatNumber(volume)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const getStyles = (isDark: boolean, compact: boolean) => StyleSheet.create({
  container: {
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    borderRadius: compact ? 8 : 12,
    padding: compact ? 12 : 16,
    marginBottom: compact ? 8 : 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tokenIcon: {
    width: compact ? 36 : 40,
    height: compact ? 36 : 40,
    borderRadius: compact ? 18 : 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tokenIconText: {
    fontSize: compact ? 14 : 16,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  tokenInfo: {
    flex: 1,
  },
  tokenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  tokenSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: isDark ? '#f1f5f9' : '#0f172a',
    marginBottom: 2,
  },
  boostedBadge: {
    backgroundColor: isDark ? '#fde047' : '#eab308',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  boostedBadgeText: {
    fontSize: 10,
    color: '#1e293b',
    fontWeight: 'bold',
  },
  tokenPrice: {
    fontSize: 14,
    color: isDark ? '#94a3b8' : '#64748b',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  priceChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  priceChangeText: {
    fontSize: 12,
    marginLeft: 2,
  },
  volumeText: {
    fontSize: 12,
    color: isDark ? '#f1f5f9' : '#0f172a',
    marginTop: 2,
  },
});