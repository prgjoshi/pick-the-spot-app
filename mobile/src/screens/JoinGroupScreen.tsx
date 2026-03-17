import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GroupsStackParamList } from '../types';
import { useGroup } from '../contexts/GroupContext';
import { validateInviteCode } from '../utils/validation';
import { colors, spacing, typography, radius } from '../config/theme';

type Props = NativeStackScreenProps<GroupsStackParamList, 'JoinGroup'>;

export default function JoinGroupScreen({ navigation }: Props) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { joinGroup } = useGroup();

  const handleJoin = async () => {
    const err = validateInviteCode(code);
    if (err) { Alert.alert('Invalid code', err); return; }

    setLoading(true);
    try {
      const group = await joinGroup(code.trim().toUpperCase());
      navigation.replace('GroupSession', { groupId: group.id });
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to join group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <View style={styles.content}>
          <Text style={styles.emoji}>🔑</Text>
          <Text style={styles.title}>Join a Group</Text>
          <Text style={styles.subtitle}>Enter the 6-character invite code shared by your group creator.</Text>

          <TextInput
            style={styles.codeInput}
            placeholder="ABCDEF"
            value={code}
            onChangeText={(v) => setCode(v.toUpperCase())}
            maxLength={6}
            autoCapitalize="characters"
            autoFocus
            textAlign="center"
          />

          <Text style={styles.charCount}>{code.length} / 6</Text>

          <TouchableOpacity
            style={[styles.button, (code.length !== 6 || loading) && styles.disabled]}
            onPress={handleJoin}
            disabled={code.length !== 6 || loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Joining...' : 'Join Group'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  content: { flex: 1, padding: spacing.xl, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 56, marginBottom: spacing.md },
  title: { ...typography.h1, marginBottom: spacing.sm, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: spacing.xl },
  codeInput: {
    fontSize: 32, fontFamily: 'monospace', letterSpacing: 8,
    borderWidth: 2, borderColor: colors.border, borderRadius: radius.md,
    paddingVertical: 16, paddingHorizontal: spacing.xl,
    width: '100%', color: colors.text, backgroundColor: colors.background,
  },
  charCount: { ...typography.small, marginTop: spacing.xs, marginBottom: spacing.xl },
  button: {
    backgroundColor: colors.primary, paddingVertical: 16,
    borderRadius: radius.md, alignItems: 'center', width: '100%',
  },
  disabled: { opacity: 0.4 },
  buttonText: { color: colors.white, fontSize: 17, fontWeight: '700' },
});
