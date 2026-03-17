import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Linking,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GroupsStackParamList, Restaurant } from '../types';
import { useGroup } from '../contexts/GroupContext';
import { getPriceLabel, getRestaurantName, getScoreColor } from '../utils/helpers';
import { colors, spacing, typography, radius, shadow } from '../config/theme';

type Props = NativeStackScreenProps<GroupsStackParamList, 'Recommendations'>;

export default function RecommendationsScreen({ route, navigation }: Props) {
  const { recommendations, isLoading, error } = useGroup();

  const openMaps = (address: string) => {
    const url = `maps://?q=${encodeURIComponent(address)}`;
    const fallback = `https://maps.google.com/?q=${encodeURIComponent(address)}`;
    Linking.openURL(url).catch(() => Linking.openURL(fallback));
  };

  const callRestaurant = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const renderItem = ({ item, index }: { item: Restaurant; index: number }) => {
    const name = getRestaurantName(item);
    const scoreColor = getScoreColor(item.groupScore);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>#{index + 1}</Text>
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.restName}>{name}</Text>
            {item.formattedAddress && (
              <Text style={styles.address} numberOfLines={1}>{item.formattedAddress}</Text>
            )}
          </View>
          <View style={[styles.scoreBadge, { backgroundColor: scoreColor + '20' }]}>
            <Text style={[styles.scoreText, { color: scoreColor }]}>{item.groupScore}%</Text>
            <Text style={[styles.scoreLabel, { color: scoreColor }]}>match</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          {item.rating !== undefined && (
            <View style={styles.metaChip}>
              <Text style={styles.metaText}>⭐ {item.rating.toFixed(1)}</Text>
            </View>
          )}
          {item.priceLevel && (
            <View style={styles.metaChip}>
              <Text style={styles.metaText}>{getPriceLabel(item.priceLevel)}</Text>
            </View>
          )}
          {item.currentOpeningHours?.openNow !== undefined && (
            <View style={[styles.metaChip, { backgroundColor: item.currentOpeningHours.openNow ? '#dcfce7' : '#fee2e2' }]}>
              <Text style={{ fontSize: 12, color: item.currentOpeningHours.openNow ? '#16a34a' : '#dc2626', fontWeight: '600' }}>
                {item.currentOpeningHours.openNow ? 'Open' : 'Closed'}
              </Text>
            </View>
          )}
        </View>

        {item.reasoning && (
          <Text style={styles.reasoning}>💡 {item.reasoning}</Text>
        )}

        <View style={styles.actionRow}>
          {item.formattedAddress && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => openMaps(item.formattedAddress!)}>
              <Text style={styles.actionBtnText}>📍 Directions</Text>
            </TouchableOpacity>
          )}
          {item.nationalPhoneNumber && (
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={() => callRestaurant(item.nationalPhoneNumber!)}>
              <Text style={[styles.actionBtnText, { color: colors.primary }]}>📞 Call</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Finding the best spots for your group...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.retryText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={recommendations}
          keyExtractor={(r) => r.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderTitle}>
                {recommendations.length} restaurant{recommendations.length !== 1 ? 's' : ''} found
              </Text>
              <Text style={styles.listHeaderSub}>Sorted by group compatibility score</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyIcon}>🍽️</Text>
              <Text style={styles.emptyTitle}>No results found</Text>
              <Text style={styles.emptyDesc}>Try a different location or broader cuisine preferences.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  list: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  listHeader: { marginBottom: spacing.sm },
  listHeaderTitle: { ...typography.h3 },
  listHeaderSub: { ...typography.small },
  card: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.md, ...shadow.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm },
  rankBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  rankText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  titleBlock: { flex: 1 },
  restName: { ...typography.h3, fontSize: 16 },
  address: { ...typography.small, marginTop: 2 },
  scoreBadge: { alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm },
  scoreText: { fontSize: 20, fontWeight: '800' },
  scoreLabel: { fontSize: 10, fontWeight: '600' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  metaChip: { backgroundColor: colors.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm },
  metaText: { fontSize: 12, color: colors.textMuted },
  reasoning: { ...typography.small, fontStyle: 'italic', marginBottom: spacing.sm, lineHeight: 18 },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  actionBtn: { flex: 1, backgroundColor: colors.primary, paddingVertical: 10, borderRadius: radius.sm, alignItems: 'center' },
  actionBtnSecondary: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.primary },
  actionBtnText: { color: colors.white, fontWeight: '600', fontSize: 13 },
  loadingText: { ...typography.body, color: colors.textMuted, marginTop: spacing.md, textAlign: 'center' },
  errorText: { ...typography.body, color: '#dc2626', textAlign: 'center' },
  retryBtn: { marginTop: spacing.md, backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: 12, borderRadius: radius.md },
  retryText: { color: colors.white, fontWeight: '700' },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { ...typography.h3, marginBottom: spacing.sm },
  emptyDesc: { ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
});
