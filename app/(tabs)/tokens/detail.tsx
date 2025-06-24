import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import TokenDetailScreen from '@/components/screens/TokenDetailScreen';
import { View, Text, ActivityIndicator, Button } from 'react-native';
export default function TokenDetailRoute() {
  const params = useLocalSearchParams();
  const router = useRouter();
  
  let parsedToken = null;
  try {
    if (params.token) {
      parsedToken = JSON.parse(decodeURIComponent(params.token as string));
      // Add basic validation
      if (!parsedToken.symbol) {
        parsedToken.symbol = 'UNKNOWN';
      }
      if (!parsedToken.id) {
        parsedToken.id = parsedToken.address || `token-${Date.now()}`;
      }
    }
  } catch (e) {
    console.error('Error parsing token:', e);
    // Return error state
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Invalid token data. Please try again.</Text>
        <Button title="Go Back" onPress={() => router.back()} />
      </View>
    );
  }

  if (!parsedToken) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
        <Text>Loading token details...</Text>
      </View>
    );
  }

  return <TokenDetailScreen token={parsedToken} onBack={() => router.back()} />;
}