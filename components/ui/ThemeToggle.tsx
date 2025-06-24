import React from 'react';
import { TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/providers/ThemeProvider';

export function ThemeToggle() {
  const systemColorScheme = useColorScheme();
  const { theme, setTheme, isDark } = useTheme();
  
  const styles = getStyles(isDark);

  const toggleTheme = () => {
    if (theme === 'system') {
      setTheme(systemColorScheme === 'dark' ? 'light' : 'dark');
    } else if (theme === 'light') {
      setTheme('dark');
    } else {
      setTheme('system');
    }
  };

  const getIcon = () => {
    if (theme === 'system') {
      return 'phone-portrait';
    }
    return isDark ? 'moon' : 'sunny';
  };

  return (
    <TouchableOpacity style={styles.container} onPress={toggleTheme}>
      <Ionicons name={getIcon()} size={20} color={isDark ? '#ffffff' : '#1e293b'} />
    </TouchableOpacity>
  );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});