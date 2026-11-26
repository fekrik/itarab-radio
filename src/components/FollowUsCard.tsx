import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

type Social = {
  id: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  url: string;
};

// Barq Lab's social accounts. Keep in sync with barqlab.app.
const SOCIALS: Social[] = [
  { id: 'tiktok', label: 'TikTok', icon: 'logo-tiktok', url: 'https://www.tiktok.com/@barqlabapp' },
  { id: 'youtube', label: 'YouTube', icon: 'logo-youtube', url: 'https://www.youtube.com/@barqlabapp' },
  { id: 'x', label: 'X', icon: 'logo-x', url: 'https://x.com/barqlabapp' },
  {
    id: 'facebook',
    label: 'Facebook',
    icon: 'logo-facebook',
    url: 'https://www.facebook.com/profile.php?id=61597187121484',
  },
];

function open(url: string) {
  Linking.openURL(url).catch(() => {
    // Nothing useful to do if no browser/app can open it.
  });
}

export function FollowUsCard() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Follow Barq Lab</Text>
      <Text style={styles.subtitle}>
        New stations, updates and our other apps, first.
      </Text>
      <View style={styles.row}>
        {SOCIALS.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={styles.button}
            onPress={() => open(s.url)}
            accessibilityRole="link"
            accessibilityLabel={`Follow Barq Lab on ${s.label}`}
          >
            <Ionicons name={s.icon} size={20} color={COLORS.gold} />
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity onPress={() => open('https://barqlab.app')} accessibilityRole="link">
        <Text style={styles.site}>barqlab.app</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
    padding: 18,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  site: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 12,
  },
});
