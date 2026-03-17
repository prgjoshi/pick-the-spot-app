import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Linking, Modal, ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GroupsStackParamList, Restaurant, ReservationData, ScoreBreakdown } from '../types';
import { useGroup } from '../contexts/GroupContext';
import { getPriceLabel, getRestaurantName, getScoreColor } from '../utils/helpers';
import { colors, spacing, typography, radius, shadow } from '../config/theme';

type Props = NativeStackScreenProps<GroupsStackParamList, 'Recommendations'>;

// ── Scoring methodology modal ────────────────────────────────────────────────

function ScoringModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={modal.container}>
        <View style={modal.header}>
          <Text style={modal.title}>How Scores Work</Text>
          <TouchableOpacity onPress={onClose} style={modal.closeBtn}>
            <Text style={modal.closeText}>Done</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={modal.body}>
          <Text style={modal.sectionLabel}>Score Components</Text>
          {[
            { icon: '🍜', label: 'Cuisine Match', weight: '35%', desc: "What % of your group prefers this type of food. Higher weight because cuisine is the most personal preference." },
            { icon: '💰', label: 'Price Range', weight: '25%', desc: "What % of your group's budget covers this restaurant's price level ($ to $$$$)." },
            { icon: '📍', label: 'Distance', weight: '20%', desc: "How close it is to your location. Score drops linearly to 0 beyond 10 km." },
            { icon: '⭐', label: 'Google Rating', weight: '10%', desc: "Google Maps rating, normalized from 1–5 stars to a 0–100 score." },
            { icon: '🕐', label: 'Availability', weight: '10%', desc: "Whether the restaurant is open at your session time. Only scored when a session time is set — full points if no time specified." },
          ].map((row) => (
            <View key={row.label} style={modal.row}>
              <Text style={modal.rowIcon}>{row.icon}</Text>
              <View style={modal.rowBody}>
                <View style={modal.rowHeader}>
                  <Text style={modal.rowLabel}>{row.label}</Text>
                  <View style={modal.weightBadge}>
                    <Text style={modal.weightText}>{row.weight}</Text>
                  </View>
                </View>
                <Text style={modal.rowDesc}>{row.desc}</Text>
              </View>
            </View>
          ))}

          <Text style={[modal.sectionLabel, { marginTop: spacing.xl }]}>Hard Filters</Text>
          <Text style={modal.filterNote}>
            These restaurants are automatically removed from results regardless of score:
          </Text>
          {[
            { icon: '🥦', label: 'Vegetarian', desc: "If any group member is vegetarian, restaurants that don't serve vegetarian food are removed." },
            { icon: '🚫', label: 'Excluded Cuisines', desc: "If a restaurant's only cuisine type is one a member wants to avoid, it's removed entirely." },
            { icon: '📊', label: 'Low Score', desc: "Any restaurant scoring below 30/100 after calculation is filtered out." },
          ].map((row) => (
            <View key={row.label} style={modal.row}>
              <Text style={modal.rowIcon}>{row.icon}</Text>
              <View style={modal.rowBody}>
                <Text style={modal.rowLabel}>{row.label}</Text>
                <Text style={modal.rowDesc}>{row.desc}</Text>
              </View>
            </View>
          ))}

          <View style={modal.formula}>
            <Text style={modal.formulaLabel}>Final Formula</Text>
            <Text style={modal.formulaText}>
              score = (0.35 × cuisine) + (0.25 × price){'\n'}
              {'      '}+ (0.20 × distance) + (0.10 × rating){'\n'}
              {'      '}+ (0.10 × availability)
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ── Score breakdown bar row ───────────────────────────────────────────────────

function ScoreBar({ label, value, color: barColor }: { label: string; value: number; color: string }) {
  return (
    <View style={bar.row}>
      <Text style={bar.label}>{label}</Text>
      <View style={bar.track}>
        <View style={[bar.fill, { width: `${value}%`, backgroundColor: barColor }]} />
      </View>
      <Text style={bar.value}>{value}</Text>
    </View>
  );
}

// ── Restaurant card ───────────────────────────────────────────────────────────

function RestaurantCard({ item, index }: { item: Restaurant; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const name = getRestaurantName(item);
  const scoreColor = getScoreColor(item.groupScore);
  const bd = item.scoreBreakdown;
  const rd: ReservationData | null | undefined = item.reservationData;

  const fullyBooked = rd?.available === false;
  const hasSlots = rd?.available === true && (rd.slots?.length ?? 0) > 0;
  const hasBookingLink = !!rd?.bookingUrl;

  const openMaps = (address: string) => {
    Linking.openURL(`maps://?q=${encodeURIComponent(address)}`).catch(() =>
      Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(address)}`)
    );
  };

  const callRestaurant = (phone: string) => Linking.openURL(`tel:${phone}`);
  const openWebsite = (uri: string) => Linking.openURL(uri);

  return (
    <View style={[card.container, fullyBooked && card.containerDimmed]}>
      {/* Header row */}
      <View style={card.header}>
        <View style={card.rankBadge}>
          <Text style={card.rankText}>#{index + 1}</Text>
        </View>
        <View style={card.titleBlock}>
          <Text style={card.name}>{name}</Text>
          {item.formattedAddress && (
            <Text style={card.address} numberOfLines={1}>{item.formattedAddress}</Text>
          )}
        </View>
        <View style={[card.scoreBadge, { backgroundColor: scoreColor + '20' }]}>
          <Text style={[card.scoreNum, { color: scoreColor }]}>{item.groupScore}%</Text>
          <Text style={[card.scoreLabel, { color: scoreColor }]}>match</Text>
        </View>
      </View>

      {/* Meta chips */}
      <View style={card.metaRow}>
        {item.rating !== undefined && (
          <View style={card.chip}><Text style={card.chipText}>⭐ {item.rating.toFixed(1)}</Text></View>
        )}
        {item.priceLevel && (
          <View style={card.chip}><Text style={card.chipText}>{getPriceLabel(item.priceLevel)}</Text></View>
        )}
        {item.currentOpeningHours?.openNow !== undefined && !bd?.isOpenAtSessionTime && (
          <View style={[card.chip, { backgroundColor: item.currentOpeningHours.openNow ? '#dcfce7' : '#fee2e2' }]}>
            <Text style={{ fontSize: 12, color: item.currentOpeningHours.openNow ? '#16a34a' : '#dc2626', fontWeight: '600' }}>
              {item.currentOpeningHours.openNow ? 'Open Now' : 'Closed Now'}
            </Text>
          </View>
        )}
        {bd?.isOpenAtSessionTime !== null && bd?.isOpenAtSessionTime !== undefined && (
          <View style={[card.chip, { backgroundColor: bd.isOpenAtSessionTime ? '#dcfce7' : '#fee2e2' }]}>
            <Text style={{ fontSize: 12, color: bd.isOpenAtSessionTime ? '#16a34a' : '#dc2626', fontWeight: '600' }}>
              {bd.isOpenAtSessionTime ? '🕐 Open at your time' : '🕐 Closed at your time'}
            </Text>
          </View>
        )}
        {/* Reservation availability badges — only shown when OT data exists */}
        {hasSlots && (
          <View style={[card.chip, { backgroundColor: '#dcfce7' }]}>
            <Text style={{ fontSize: 12, color: '#16a34a', fontWeight: '600' }}>
              🟢 {rd!.slots.length} slot{rd!.slots.length !== 1 ? 's' : ''} available
            </Text>
          </View>
        )}
        {fullyBooked && (
          <View style={[card.chip, { backgroundColor: '#fee2e2' }]}>
            <Text style={{ fontSize: 12, color: '#dc2626', fontWeight: '600' }}>🔴 Fully booked</Text>
          </View>
        )}
        {/* Booking link available (from OT/Resy URL or reservable flag) */}
        {hasBookingLink && !hasSlots && !fullyBooked && (
          <View style={[card.chip, { backgroundColor: '#dbeafe' }]}>
            <Text style={{ fontSize: 12, color: '#1d4ed8', fontWeight: '600' }}>
              🗓 {rd!.platform === 'opentable' ? 'On OpenTable' : rd!.platform === 'resy' ? 'On Resy' : 'Reservations'}
            </Text>
          </View>
        )}
        {/* Fallback when no booking data at all */}
        {item.reservable === true && !rd && (
          <View style={[card.chip, { backgroundColor: '#dbeafe' }]}>
            <Text style={{ fontSize: 12, color: '#1d4ed8', fontWeight: '600' }}>Takes Reservations</Text>
          </View>
        )}
      </View>

      {/* Available time slots (horizontal scroll) */}
      {hasSlots && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={card.slotsScroll} contentContainerStyle={card.slotsRow}>
          {rd!.slots.map((slot) => (
            <TouchableOpacity
              key={slot.time}
              style={card.slotChip}
              onPress={() => openWebsite(slot.bookingUrl)}
            >
              <Text style={card.slotChipText}>{slot.time}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Reasoning */}
      {item.reasoning && (
        <Text style={card.reasoning}>💡 {item.reasoning}</Text>
      )}

      {/* Score breakdown (collapsible) */}
      {bd && (
        <>
          <TouchableOpacity onPress={() => setExpanded((e) => !e)} style={card.breakdownToggle}>
            <Text style={card.breakdownToggleText}>{expanded ? '▲ Hide score breakdown' : '▼ Score breakdown'}</Text>
          </TouchableOpacity>
          {expanded && (
            <View style={card.breakdown}>
              <ScoreBar label="🍜 Cuisine" value={bd.cuisine} color="#f97316" />
              <ScoreBar label="💰 Price" value={bd.price} color="#22c55e" />
              <ScoreBar label="📍 Distance" value={bd.distance} color="#3b82f6" />
              <ScoreBar label="⭐ Rating" value={bd.rating} color="#eab308" />
              {bd.availability !== null && (
                <ScoreBar label="🕐 Availability" value={bd.availability} color="#8b5cf6" />
              )}
            </View>
          )}
        </>
      )}

      {/* Action buttons */}
      <View style={card.actions}>
        {item.formattedAddress && (
          <TouchableOpacity style={card.btn} onPress={() => openMaps(item.formattedAddress!)}>
            <Text style={card.btnText}>📍 Directions</Text>
          </TouchableOpacity>
        )}
        {/* Book a Table — priority: confirmed slots > pre-filled booking link > website */}
        {hasSlots && (
          <TouchableOpacity style={[card.btn, card.btnBookOT]} onPress={() => openWebsite(rd!.slots[0].bookingUrl)}>
            <Text style={[card.btnText, { color: colors.white }]}>🗓 Book a Table</Text>
          </TouchableOpacity>
        )}
        {!hasSlots && hasBookingLink && !fullyBooked && (
          <TouchableOpacity style={[card.btn, card.btnBook]} onPress={() => openWebsite(rd!.bookingUrl!)}>
            <Text style={[card.btnText, { color: '#1d4ed8' }]}>🗓 Find a Table</Text>
          </TouchableOpacity>
        )}
        {!rd && item.reservable && item.websiteUri && (
          <TouchableOpacity style={[card.btn, card.btnBook]} onPress={() => openWebsite(item.websiteUri!)}>
            <Text style={[card.btnText, { color: '#1d4ed8' }]}>🗓 Book Online</Text>
          </TouchableOpacity>
        )}
        {!item.reservable && item.websiteUri && !rd && (
          <TouchableOpacity style={[card.btn, card.btnGray]} onPress={() => openWebsite(item.websiteUri!)}>
            <Text style={[card.btnText, { color: colors.textMuted }]}>🌐 Visit Website</Text>
          </TouchableOpacity>
        )}
        {item.nationalPhoneNumber && (
          <TouchableOpacity style={[card.btn, card.btnSecondary]} onPress={() => callRestaurant(item.nationalPhoneNumber!)}>
            <Text style={[card.btnText, { color: colors.primary }]}>📞 Call</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function RecommendationsScreen({ route, navigation }: Props) {
  const { recommendations, isLoading, error } = useGroup();
  const [showScoring, setShowScoring] = useState(false);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Finding the best spots for your group...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScoringModal visible={showScoring} onClose={() => setShowScoring(false)} />

      <FlatList
        data={recommendations}
        keyExtractor={(r) => r.id}
        renderItem={({ item, index }) => <RestaurantCard item={item} index={index} />}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View>
              <Text style={styles.listHeaderTitle}>
                {recommendations.length} restaurant{recommendations.length !== 1 ? 's' : ''} found
              </Text>
              <Text style={styles.listHeaderSub}>Sorted by group compatibility</Text>
            </View>
            <TouchableOpacity style={styles.infoBtn} onPress={() => setShowScoring(true)}>
              <Text style={styles.infoBtnText}>ℹ️ How scores work</Text>
            </TouchableOpacity>
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
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  list: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: spacing.sm },
  listHeaderTitle: { ...typography.h3 },
  listHeaderSub: { ...typography.small },
  infoBtn: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.full },
  infoBtnText: { fontSize: 12, color: colors.textMuted },
  loadingText: { ...typography.body, color: colors.textMuted, marginTop: spacing.md, textAlign: 'center' },
  errorText: { ...typography.body, color: '#dc2626', textAlign: 'center' },
  retryBtn: { marginTop: spacing.md, backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: 12, borderRadius: radius.md },
  retryText: { color: colors.white, fontWeight: '700' },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { ...typography.h3, marginBottom: spacing.sm },
  emptyDesc: { ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
});

const card = StyleSheet.create({
  container: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.md, ...shadow.sm },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm },
  rankBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  rankText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  titleBlock: { flex: 1 },
  name: { ...typography.h3, fontSize: 16 },
  address: { ...typography.small, marginTop: 2 },
  scoreBadge: { alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm },
  scoreNum: { fontSize: 20, fontWeight: '800' },
  scoreLabel: { fontSize: 10, fontWeight: '600' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  chip: { backgroundColor: colors.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm },
  chipText: { fontSize: 12, color: colors.textMuted },
  reasoning: { ...typography.small, fontStyle: 'italic', marginBottom: spacing.sm, lineHeight: 18 },
  breakdownToggle: { paddingVertical: 6 },
  breakdownToggleText: { fontSize: 12, color: colors.primary, fontWeight: '500' },
  breakdown: { backgroundColor: colors.background, borderRadius: radius.sm, padding: spacing.sm, marginBottom: spacing.sm, gap: 6 },
  containerDimmed: { opacity: 0.55 },
  slotsScroll: { marginBottom: spacing.sm },
  slotsRow: { flexDirection: 'row', gap: spacing.xs, paddingVertical: 2 },
  slotChip: { backgroundColor: '#dcfce7', borderWidth: 1, borderColor: '#86efac', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.sm },
  slotChipText: { fontSize: 13, color: '#15803d', fontWeight: '700' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  btn: { flex: 1, minWidth: 90, backgroundColor: colors.primary, paddingVertical: 9, borderRadius: radius.sm, alignItems: 'center' },
  btnSecondary: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.primary },
  btnBook: { backgroundColor: '#dbeafe', borderWidth: 1, borderColor: '#93c5fd' },
  btnBookOT: { backgroundColor: '#16a34a' },
  btnGray: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  btnText: { color: colors.white, fontWeight: '600', fontSize: 12 },
});

const bar = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  label: { fontSize: 11, color: colors.textMuted, width: 90 },
  track: { flex: 1, height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  value: { fontSize: 11, color: colors.textMuted, width: 28, textAlign: 'right' },
});

const modal = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { ...typography.h2 },
  closeBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  closeText: { color: colors.primary, fontWeight: '600', fontSize: 15 },
  body: { padding: spacing.lg, gap: spacing.sm },
  sectionLabel: { ...typography.label, textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.5, color: colors.textMuted, marginBottom: spacing.xs },
  filterNote: { ...typography.small, marginBottom: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.xs },
  rowIcon: { fontSize: 22, marginTop: 2 },
  rowBody: { flex: 1 },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 2 },
  rowLabel: { ...typography.label },
  weightBadge: { backgroundColor: colors.primaryLight, paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.full },
  weightText: { fontSize: 11, color: colors.primary, fontWeight: '700' },
  rowDesc: { ...typography.small, lineHeight: 17 },
  formula: { marginTop: spacing.lg, backgroundColor: '#f1f5f9', borderRadius: radius.md, padding: spacing.md },
  formulaLabel: { ...typography.label, marginBottom: spacing.xs },
  formulaText: { fontFamily: 'monospace', fontSize: 13, color: colors.text, lineHeight: 20 },
});
