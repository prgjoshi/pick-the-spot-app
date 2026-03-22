import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GroupsStackParamList } from '../types';
import { useGroup } from '../contexts/GroupContext';
import { colors, spacing, typography, radius } from '../config/theme';

type Props = NativeStackScreenProps<GroupsStackParamList, 'CreateGroup'>;

const PARTY_SIZES = [2, 3, 4, 5, 6, 7, 8, 10, 12];

export default function CreateGroupScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [loading, setLoading] = useState(false);
  const { createGroup } = useGroup();

  const handleCreate = async () => {
    if (!name.trim()) { Alert.alert('Missing field', 'Enter a group name'); return; }
    if (!location.trim()) { Alert.alert('Missing field', 'Enter a location'); return; }

    setLoading(true);
    try {
      const group = await createGroup(name.trim(), location.trim(), partySize);
      navigation.replace('GroupSession', { groupId: group.id });
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Group Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Date Night, Team Lunch"
                value={name}
                onChangeText={setName}
                autoFocus
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Location *</Text>
              <TextInput
                style={styles.input}
                placeholder="City or neighborhood (e.g. San Francisco, CA)"
                value={location}
                onChangeText={setLocation}
              />
              <Text style={styles.hint}>Used to find nearby restaurants</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Party Size</Text>
              <View style={styles.sizeRow}>
                {PARTY_SIZES.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.sizeChip, partySize === s && styles.sizeChipSelected]}
                    onPress={() => setPartySize(s)}
                  >
                    <Text style={[styles.sizeChipText, partySize === s && styles.sizeChipTextSelected]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.disabled]}
              onPress={handleCreate}
              disabled={loading}
            >
              <Text style={styles.submitText}>{loading ? 'Creating...' : 'Create Group'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { padding: spacing.lg, flexGrow: 1 },
  form: { gap: spacing.lg },
  field: { gap: spacing.xs },
  label: { ...typography.label },
  hint: { ...typography.small, marginTop: 2 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    paddingHorizontal: spacing.md, paddingVertical: 14, fontSize: 15,
  },
  sizeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  sizeChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background,
  },
  sizeChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  sizeChipText: { fontSize: 14, color: colors.textMuted },
  sizeChipTextSelected: { color: colors.white, fontWeight: '600' },
  submitButton: {
    backgroundColor: colors.primary, paddingVertical: 16,
    borderRadius: radius.md, alignItems: 'center', marginTop: spacing.md,
  },
  disabled: { opacity: 0.6 },
  submitText: { color: colors.white, fontSize: 17, fontWeight: '700' },
});
