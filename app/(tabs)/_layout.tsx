import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import React from 'react';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  
  const tintColor = colorScheme === 'dark' ? '#60a5fa' : '#3b82f6';
  const backgroundColor = colorScheme === 'dark' ? '#0f172a' : '#ffffff';
  const inactiveTintColor = colorScheme === 'dark' ? '#64748b' : '#6b7280';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tintColor,
        tabBarInactiveTintColor: inactiveTintColor,
        tabBarStyle: {
          backgroundColor,
          borderTopColor: colorScheme === 'dark' ? '#334155' : '#e2e8f0',
          borderTopWidth: 1,
          paddingBottom: 5,
          height: 60, 
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Inter-SemiBold',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tokens"
        options={{
          title: 'Tokens',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="boosted"
        options={{
          title: 'Boosted',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="flash" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{
          title: 'Portfolio',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="briefcase" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}