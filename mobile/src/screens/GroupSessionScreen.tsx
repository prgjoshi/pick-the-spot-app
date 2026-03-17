import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Alert, Share, TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GroupsStackParamList, UserPreferences } from '../types';
import { useGroup } from '../contexts/GroupContext';
import * as groupService from '../services/groupService';
import { colors, spacing, typography, radius, shadow } from '../config/theme';

type Props = NativeStackScreenProps<GroupsStackParamList, 'GroupSession'>;

const CUISINE_TYPES = ['Italian', 'Mexican', 'Chinese', 'Japanese', 'American', 'Thai', 'Indian', 'Mediterranean', 'French', 'Korean'];
const DIETARY_OPTIONS = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut-Free', 'Halal', 'Kosher'];
const PRICE_LABELS = ['', '$', '$$', '$$$', '$$$$'];

export default function GroupSessionScreen({ route, navigation }: Props) {
  const { groupId } = route.params;
  const { currentGroup, preferences, isLoading, error, loadGroup, savePreferences, loadRecommendations } = useGroup();

  const [prefs, setPrefs] = useState<UserPreferences>({
    cuisines: [],
    price_min: 1,
    price_max: 4,
    dietary_restrictions: [],
    excluded_cuisines: [],
  });
  const [sessionTime, setSessionTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingRecs, setLoadingRecs] = useState(false);

  useEffect(() => {
    loadGroup(groupId);
  }, [groupId]);

  useEffect(() => {
    if (preferences) setPrefs(preferences);
  }, [preferences]);

  useEffect(() => {
    if (currentGroup?.session_time) {
      setSessionTime(currentGroup.session_time.slice(0, 5)); // "HH:MM"
    }
  }, [currentGroup]);

  // ── Toggle helpers ──────────────────────────────────────────────────────

  const toggleCuisine = (c: string) => {
    setPrefs((p) => ({
      ...p,
      cuisines: p.cuisines.includes(c) ? p.cuisines.filter((x) => x !== c) : [...p.cuisines, c],
      // If cuisine is now preferred, remove it from exclusions
      excluded_cuisines: p.excluded_cuisines.filter((x) => x !== c),
    }));
  };

  const toggleExclusion = (c: string) => {
    setPrefs((p) => ({
      ...p,
      excluded_cuisines: p.excluded_cuisines.includes(c)
        ? p.excluded_cuisines.filter((x) => x !== c)
        : [...p.excluded_cuisines, c],
      // If cuisine is now excluded, remove it from preferred list
      cuisines: p.cuisines.filter((x) => x !== c),
    }));
  };

  const toggleDietary = (d: string) => {
    setPrefs((p) => ({
      ...p,
      dietary_restrictions: p.dietary_restrictions.includes(d)
        ? p.dietary_restrictions.filter((x) => x !== d)
        : [...p.dietary_restrictions, d],
    }));
  };

  const handleShareCode = async () => {
    if (!currentGroup) return;
    await Share.share({ message: `Join my Pick the Spot group! Code: ${currentGroup.invite_code}` });
  };

  const handleGetRecs = async () => {
    // Validate time format if entered
    if (sessionTime && !/^\d{1,2}:\d{2}$/.test(sessionTime)) {
      Alert.alert('Invalid time', 'Enter time as HH:MM (e.g. 19:30)');
      return;
    }

    // Save session time if provided
    if (sessionTime) {
      try {
        await groupService.updateSession(groupId, { session_time: sessionTime });
      } catch {
        Alert.alert('Error', 'Failed to save session time');
        return;
      }
    }

    // Save preferences
    setSaving(true);
    try {
      await savePreferences(groupId, prefs);
    } catch {
      Alert.alert('Error', 'Failed to save preferences');
      setSaving(false);
      return;
    }
    setSaving(false);

    // Fetch recommendations
    setLoadingRecs(true);
    try {
      await loadRecommendations(groupId);
      navigation.navigate('Recommendations', { groupId });
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to fetch recommendations');
    } finally {
      setLoadingRecs(false);
    }
  };

  if (isLoading && !currentGroup) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Group Header */}
        {currentGroup && (
          <View style={styles.card}>
            <View style={styles.groupHeader}>
              <Text style={styles.groupName}>{currentGroup.name}</Text>
              <TouchableOpacity style={styles.shareBtn} onPress={handleShareCode}>
                <Text style={styles.shareBtnText}>Share Code</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.codeRow}>
              <Text style={styles.codeLabel}>Invite Code</Text>
              <Text style={styles.code}>{currentGroup.invite_code}</Text>
            </View>
          </View>
        )}

        {/* Members */}
        {currentGroup?.members && currentGroup.members.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Members ({currentGroup.members.length})</Text>
            {currentGroup.members.map((m) => (
              <View key={m.id} style={styles.memberRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{m.name[0].toUpperCase()}</Text>
                </View>
                <Text style={styles.memberName}>{m.name}</Text>
                {m.is_creator && <View style={styles.badge}><Text style={styles.badgeText}>Creator</Text></View>}
              </View>
            ))}
          </View>
        )}

        {/* Session Time */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Session Details</Text>
          <Text style={styles.prefLabel}>What time are you dining? (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 19:30"
            value={sessionTime}
            onChangeText={setSessionTime}
            keyboardType="numbers-and-punctuation"
            maxLength={5}
          />
          <Text style={styles.hint}>Used to check if restaurants are open at your arrival time</Text>
        </View>

        {/* Preferences */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Your Preferences</Text>

          {/* ── Preferred Cuisines ── */}
          <Text style={styles.prefLabel}>Preferred Cuisines</Text>
          <View style={styles.chipGrid}>
            {CUISINE_TYPES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.chip,
                  prefs.cuisines.includes(c) && styles.chipSelectedOrange,
                ]}
                onPress={() => toggleCuisine(c)}
              >
                <Text style={[styles.chipText, prefs.cuisines.includes(c) && styles.chipTextSelected]}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Cuisines to Avoid ── */}
          <Text style={[styles.prefLabel, { marginTop: spacing.md }]}>Cuisines to Avoid</Text>
          <Text style={styles.hint}>Restaurants whose only cuisine matches will be excluded</Text>
          <View style={styles.chipGrid}>
            {CUISINE_TYPES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.chip,
                  prefs.excluded_cuisines.includes(c) && styles.chipSelectedRed,
                ]}
                onPress={() => toggleExclusion(c)}
              >
                <Text style={[styles.chipText, prefs.excluded_cuisines.includes(c) && styles.chipTextSelected]}>
                  {prefs.excluded_cuisines.includes(c) ? `✕ ${c}` : c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Price Range ── */}
          <Text style={[styles.prefLabel, { marginTop: spacing.md }]}>Max Price Range</Text>
          <View style={styles.priceRow}>
            {[1, 2, 3, 4].map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.priceChip, prefs.price_max >= p && styles.chipSelectedOrange]}
                onPress={() => setPrefs((prev) => ({ ...prev, price_min: 1, price_max: p }))}
              >
                <Text style={[styles.chipText, prefs.price_max >= p && styles.chipTextSelected]}>
                  {PRICE_LABELS[p]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Dietary Restrictions ── */}
          <Text style={[styles.prefLabel, { marginTop: spacing.md }]}>Dietary Restrictions</Text>
          <View style={styles.chipGrid}>
            {DIETARY_OPTIONS.map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.chip, prefs.dietary_restrictions.includes(d) && styles.chipSelectedGreen]}
                onPress={() => toggleDietary(d)}
              >
                <Text style={[styles.chipText, prefs.dietary_restrictions.includes(d) && styles.chipTextSelected]}>
                  {d}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.ctaButton, (saving || loadingRecs) && styles.disabled]}
          onPress={handleGetRecs}
          disabled={saving || loadingRecs}
        >
          <Text style={styles.ctaText}>
            {saving ? 'Saving...' : loadingRecs ? 'Finding Restaurants...' : 'Get Restaurant Recommendations'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  card: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.md, ...shadow.sm },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  groupName: { ...typography.h2, flex: 1 },
  shareBtn: { backgroundColor: colors.primaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full },
  shareBtnText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  codeLabel: { ...typography.small },
  code: { fontFamily: 'monospace', fontSize: 18, fontWeight: '700', color: colors.primary, letterSpacing: 3 },
  sectionTitle: { ...typography.h3, marginBottom: spacing.md },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 6 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: colors.white, fontWeight: '700' },
  memberName: { ...typography.body, flex: 1 },
  badge: { backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
  badgeText: { fontSize: 11, color: colors.primary, fontWeight: '600' },
  prefLabel: { ...typography.label, marginBottom: spacing.xs },
  hint: { ...typography.small, marginBottom: spacing.sm, fontStyle: 'italic' },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 16,
    fontFamily: 'monospace', letterSpacing: 2,
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.sm,
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
  },
  chipSelectedOrange: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipSelectedGreen: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  chipSelectedRed: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  chipText: { fontSize: 13, color: colors.textMuted },
  chipTextSelected: { color: colors.white, fontWeight: '600' },
  priceRow: { flexDirection: 'row', gap: spacing.sm },
  priceChip: {
    flex: 1, paddingVertical: 10, borderRadius: radius.sm,
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  errorBox: { backgroundColor: '#fee2e2', padding: spacing.md, borderRadius: radius.sm },
  errorText: { color: '#dc2626', textAlign: 'center' },
  ctaButton: { backgroundColor: colors.primary, paddingVertical: 18, borderRadius: radius.md, alignItems: 'center', marginTop: spacing.sm },
  disabled: { opacity: 0.6 },
  ctaText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
