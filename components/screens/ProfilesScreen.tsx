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

export function ProfilesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const styles = getStyles(isDark);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const data = await dexAPI.getLatestTokenProfiles();
      setProfiles(data);
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfiles();
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

  const renderProfile = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.profileCard}
      onPress={() => {
        console.log('Navigate to profile:', item);
      }}
    >
      <View style={styles.profileHeader}>
        <View style={styles.profileIcon}>
          <Text style={styles.profileIconText}>
            {item.tokenAddress?.slice(0, 2).toUpperCase()}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileTitle}>
            {item.tokenAddress?.slice(0, 8)}...{item.tokenAddress?.slice(-6)}
          </Text>
          {item.description && (
            <Text style={styles.profileDescription} numberOfLines={2}>
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
      
      {item?.links && item?.links?.length > 0 && (
        <View style={styles.linksContainer}>
          <Text style={styles.linksText}>
            {item?.links?.length} link{item?.links?.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people" size={48} color={isDark ? '#64748b' : '#94a3b8'} />
      <Text style={styles.emptyText}>No Profiles Found</Text>
      <Text style={styles.emptySubtext}>
        No token profiles are currently available.
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.title}>Token Profiles</Text>
      <Text style={styles.subtitle}>Latest verified token profiles</Text>
      
      {/* Stats Card */}
      <View style={styles.statsCard}>
        <View style={styles.statsIcon}>
          <Ionicons name="people" size={24} color="#ffffff" />
        </View>
        <View style={styles.statsInfo}>
          <Text style={styles.statsLabel}>Total Profiles</Text>
          <Text style={styles.statsValue}>
            {loading ? '...' : profiles?.length}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={profiles}
        renderItem={renderProfile}
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
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  statsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statsInfo: {
    flex: 1,
  },
  statsLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#bfdbfe',
    marginBottom: 4,
  },
  statsValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  profileCard: {
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  profileIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileIconText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  profileInfo: {
    flex: 1,
    marginRight: 12,
  },
  profileTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: isDark ? '#ffffff' : '#1e293b',
    marginBottom: 4,
  },
  profileDescription: {
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
  linksContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: isDark ? '#334155' : '#e2e8f0',
  },
  linksText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: isDark ? '#94a3b8' : '#64748b',
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