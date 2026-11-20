import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CATEGORY_GRADIENTS, COLORS } from '../theme/colors';
import type { CategoryId } from '../types/radio';

interface StationArtworkProps {
  name: string;
  category: CategoryId;
  logoUrl: string | null;
  size?: number;
  borderRadius?: number;
}

function getMonogramLabel(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) return '♪';

  if (/[\u0600-\u06FF]/.test(cleaned)) {
    const firstWord = cleaned.split(/\s+/)[0] || '';
    if (firstWord.length > 0 && firstWord.length <= 6) {
      return firstWord;
    }
    return firstWord ? firstWord.slice(0, 5) : '♪';
  }

  const words = cleaned
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return '♪';
}

export function StationArtwork({
  name,
  category,
  logoUrl,
  size = 52,
  borderRadius = 12,
}: StationArtworkProps) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [logoUrl]);

  const showImage = Boolean(logoUrl) && !imageFailed;
  const gradient = CATEGORY_GRADIENTS[category] ?? CATEGORY_GRADIENTS.variety;
  const label = getMonogramLabel(name);
  const isArabic = /[\u0600-\u06FF]/.test(label);
  const fontSize = isArabic
    ? Math.max(12, Math.round(size * 0.24))
    : Math.max(14, Math.round(size * 0.34));

  if (showImage && logoUrl) {
    return (
      <View
        style={[
          styles.imageContainer,
          { width: size, height: size, borderRadius },
        ]}
      >
        <Image
          source={{ uri: logoUrl }}
          style={{ width: size, height: size, borderRadius }}
          resizeMode="cover"
          onError={() => setImageFailed(true)}
        />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.fallbackContainer,
        { width: size, height: size, borderRadius },
      ]}
    >
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[styles.monogramText, { fontSize }]}
      >
        {label}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  fallbackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  monogramText: {
    color: COLORS.white,
    fontWeight: '700',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
});
