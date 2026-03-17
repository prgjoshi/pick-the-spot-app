import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GroupsStackParamList, Group } from '../types';
import { useGroup } from '../contexts/GroupContext';
import { colors, spacing, typography, radius, shadow } from '../config/theme';
import { formatDate } from '../utils/helpers';

type Props = NativeStackScreenProps<GroupsStackParamList, 'GroupsList'>;

export default function GroupsScreen({ navigation }: Props) {
  const { groups, isLoading, error, loadGroups } = useGroup();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadGroups);
    return unsubscribe;
  }, [navigation, loadGroups]);

  const renderGroup = ({ item }: { item: Group }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('GroupSession', { groupId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.groupName}>{item.name}</Text>
        {item.is_creator && <View style={styles.badge}><Text style={styles.badgeText}>Creator</Text></View>}
      </View>
      <Text style={styles.location}>📍 {item.location}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.meta}>
          {item.party_size} people
          {item.session_date ? ` · ${formatDate(item.session_date)}` : ''}
        </Text>
        <View style={styles.codeChip}>
          <Text style={styles.codeText}>{item.invite_code}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {isLoading && groups.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(g) => g.id}
          renderItem={renderGroup}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🍽️</Text>
              <Text style={styles.emptyTitle}>No groups yet</Text>
              <Text style={styles.emptyDesc}>Create a group or join one with an invite code to get started.</Text>
            </View>
          }
        />
      )}

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.fab}>
        <TouchableOpacity style={styles.fabButton} onPress={() => navigation.navigate('CreateGroup')}>
          <Text style={styles.fabText}>+ Create</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.fabButton, styles.fabSecondary]} onPress={() => navigation.navigate('JoinGroup')}>
          <Text style={[styles.fabText, styles.fabSecondaryText]}>Join</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: spacing.md, gap: spacing.sm, paddingBottom: 100 },
  card: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.md, ...shadow.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  groupName: { ...typography.h3, flex: 1 },
  badge: { backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
  badgeText: { fontSize: 11, color: colors.primary, fontWeight: '600' },
  location: { ...typography.small, marginBottom: spacing.sm },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  meta: { ...typography.small },
  codeChip: { backgroundColor: colors.background, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  codeText: { fontFamily: 'monospace', fontSize: 12, color: colors.textMuted, letterSpacing: 1 },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: spacing.xl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { ...typography.h3, marginBottom: spacing.sm },
  emptyDesc: { ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  errorBanner: { backgroundColor: '#fee2e2', padding: spacing.md, margin: spacing.md, borderRadius: radius.sm },
  errorText: { color: '#dc2626', textAlign: 'center' },
  fab: { position: 'absolute', bottom: spacing.xl, right: spacing.md, left: spacing.md, flexDirection: 'row', gap: spacing.sm },
  fabButton: { flex: 1, backgroundColor: colors.primary, paddingVertical: 14, borderRadius: radius.md, alignItems: 'center' },
  fabSecondary: { backgroundColor: colors.white, borderWidth: 2, borderColor: colors.primary },
  fabText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  fabSecondaryText: { color: colors.primary },
});
