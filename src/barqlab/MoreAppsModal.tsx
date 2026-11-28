import React from 'react';
import {
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { shareThisApp } from './share';
import { BARQ_APPS, BarqApp, openStorePage, SELF_SLUG } from './apps';

interface Props {
  visible: boolean;
  onClose: () => void;
}

function AppRow({ app }: { app: BarqApp }) {
  return (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.8}
      onPress={() => openStorePage(app)}
      accessibilityRole="link"
      accessibilityLabel={`Get ${app.name}`}
    >
      {app.icon ? (
        <Image source={app.icon} style={styles.icon} />
      ) : (
        <View style={[styles.icon, styles.iconFallback]}>
          <Text style={styles.iconFallbackText}>{app.name.charAt(0)}</Text>
        </View>
      )}
      <View style={styles.rowText}>
        <Text style={styles.appName}>{app.name}</Text>
        <Text style={styles.tagline} numberOfLines={2}>
          {app.tagline}
        </Text>
      </View>
      <View style={styles.getBtn}>
        <Text style={styles.getText}>Get</Text>
      </View>
    </TouchableOpacity>
  );
}

export function MoreAppsModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const apps = BARQ_APPS.filter((a) => a.slug !== SELF_SLUG);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>More from Barq Lab</Text>
              <Text style={styles.subtitle}>Free apps from the team behind this one.</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close">
              <Ionicons name="close" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.list}>
            {apps.map((app) => (
              <AppRow key={app.slug} app={app} />
            ))}

            <TouchableOpacity style={styles.shareRow} onPress={() => shareThisApp()} accessibilityRole="button">
              <Ionicons name="share-social-outline" size={18} color={COLORS.gold} />
              <Text style={styles.shareText}>Share this app with a friend</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => Linking.openURL('https://barqlab.app').catch(() => {})}>
              <Text style={styles.site}>barqlab.app</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: COLORS.overlay,
  },
  sheet: {
    maxHeight: '85%',
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingTop: 8,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 13,
  },
  iconFallback: {
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconFallbackText: {
    color: COLORS.goldText,
    fontSize: 24,
    fontWeight: '800',
  },
  rowText: {
    flex: 1,
  },
  appName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  tagline: {
    color: COLORS.textSecondary,
    fontSize: 12.5,
    marginTop: 2,
    lineHeight: 17,
  },
  getBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: COLORS.goldSoft,
  },
  getText: {
    color: COLORS.goldText,
    fontWeight: '800',
    fontSize: 13,
  },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  shareText: {
    color: COLORS.goldText,
    fontSize: 14,
    fontWeight: '700',
  },
  site: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
});
