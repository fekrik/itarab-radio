import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';

interface SleepTimerModalProps {
  visible: boolean;
  activeMinutes: number | null;
  onSelect: (minutes: number | null) => void;
  onClose: () => void;
}

const PRESETS: Array<{ label: string; minutes: number | null }> = [
  { label: 'Off', minutes: null },
  { label: '15 minutes', minutes: 15 },
  { label: '30 minutes', minutes: 30 },
  { label: '45 minutes', minutes: 45 },
  { label: '60 minutes', minutes: 60 },
];

export function SleepTimerModal({
  visible,
  activeMinutes,
  onSelect,
  onClose,
}: SleepTimerModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <Ionicons name="moon-outline" size={20} color={COLORS.gold} />
            <Text style={styles.title}>Sleep Timer</Text>
          </View>
          <Text style={styles.subtitle}>
            Playback will automatically stop when the timer ends.
          </Text>

          {PRESETS.map((preset) => {
            const isSelected = activeMinutes === preset.minutes;
            return (
              <TouchableOpacity
                key={preset.label}
                style={[styles.option, isSelected && styles.optionActive]}
                onPress={() => {
                  onSelect(preset.minutes);
                  onClose();
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    isSelected && styles.optionTextActive,
                  ]}
                >
                  {preset.label}
                </Text>
                {isSelected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={COLORS.gold}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  optionActive: {
    borderColor: COLORS.gold,
    backgroundColor: COLORS.goldSoft,
  },
  optionText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  optionTextActive: {
    color: COLORS.goldText,
  },
});
