import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/providers/ThemeProvider';

interface StatsCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string;
  color: string;
}

export function StatsCard({ icon, title, value, color }: StatsCardProps) {
  const { isDark } = useTheme();
  const styles = getStyles(isDark, color);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color="#ffffff" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.value}>{value}</Text>
        </View>
      </View>
    </View>
  );
}

const getStyles = (isDark: boolean, color: string) => StyleSheet.create({
  container: {
    width: '48%',
    marginBottom: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: color,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: isDark ? '#f1f5f9' : '#0f172a',
    marginBottom: 2,
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
    color: isDark ? '#f1f5f9' : '#0f172a',
  },
});