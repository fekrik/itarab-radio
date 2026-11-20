import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import type { TabKey } from '../types/radio';

interface BottomTabBarProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  favoritesCount: number;
}

const TABS: Array<{
  key: TabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}> = [
  { key: 'stations', label: 'Stations', icon: 'radio-outline', activeIcon: 'radio' },
  { key: 'countries', label: 'Countries', icon: 'globe-outline', activeIcon: 'globe' },
  { key: 'favorites', label: 'Favorites', icon: 'heart-outline', activeIcon: 'heart' },
];

export function BottomTabBar({
  activeTab,
  onSelectTab,
  favoritesCount,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        { paddingBottom: Math.max(insets.bottom, 10) },
      ]}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        const showCount = tab.key === 'favorites' && favoritesCount > 0;
        return (
          <TouchableOpacity
            key={tab.key}
            activeOpacity={0.75}
            onPress={() => onSelectTab(tab.key)}
            style={styles.tabBtn}
          >
            <View style={styles.iconWrap}>
              <Ionicons
                name={isActive ? tab.activeIcon : tab.icon}
                size={22}
                color={isActive ? COLORS.gold : COLORS.textMuted}
              />
              {showCount && (
                <View style={styles.countDot}>
                  <Text style={styles.countText}>
                    {favoritesCount > 99 ? '99+' : favoritesCount}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  iconWrap: {
    position: 'relative',
  },
  countDot: {
    position: 'absolute',
    top: -4,
    right: -12,
    backgroundColor: COLORS.gold,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    color: COLORS.bg,
    fontSize: 9,
    fontWeight: '800',
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  labelActive: {
    color: COLORS.goldText,
  },
});
