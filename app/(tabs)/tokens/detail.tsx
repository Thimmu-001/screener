import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import TokenDetailScreen from '@/components/screens/TokenDetailScreen';

export default function TokenDetailRoute() {
  const params = useLocalSearchParams();
  const router = useRouter();
  let parsedToken: any = null;
  let error = null;
  try {
    parsedToken = params.token ? JSON.parse(decodeURIComponent(params.token as string)) : null;
  } catch (e) {
    error = e;
    parsedToken = null;
  }
  if (error) {
    return <>{'Invalid token data.'}</>;
  }
  if (!parsedToken) {
    return <>{'Loading token details...'}</>;
  }
  return <TokenDetailScreen token={parsedToken} onBack={() => router.back()} />;
}
