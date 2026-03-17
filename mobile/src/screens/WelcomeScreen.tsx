import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { colors, spacing, typography, radius } from '../config/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.emoji}>🍽️</Text>
          <Text style={styles.title}>Pick the Spot</Text>
          <Text style={styles.subtitle}>
            End the "where should we eat?" debate forever. Get personalized restaurant recommendations your whole group will love.
          </Text>
        </View>

        <View style={styles.features}>
          {[
            { icon: '👥', title: 'Group Preferences', desc: "Collect everyone's dining preferences in one place" },
            { icon: '⭐', title: 'Smart Scoring', desc: 'AI-powered algorithm finds restaurants that satisfy everyone' },
            { icon: '📍', title: 'Real Restaurants', desc: 'Live data from Google Places — real ratings and availability' },
          ].map((f) => (
            <View key={f.title} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Auth', { mode: 'register' })}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Auth', { mode: 'login' })}
          >
            <Text style={styles.secondaryButtonText}>I already have an account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primaryLight },
  content: { flex: 1, padding: spacing.lg, justifyContent: 'space-between' },
  hero: { alignItems: 'center', paddingTop: spacing.xl },
  emoji: { fontSize: 64, marginBottom: spacing.md },
  title: { ...typography.h1, fontSize: 36, textAlign: 'center', color: colors.primary, marginBottom: spacing.md },
  subtitle: { ...typography.body, textAlign: 'center', color: colors.textMuted, lineHeight: 22 },
  features: { gap: spacing.md },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, backgroundColor: colors.white, padding: spacing.md, borderRadius: radius.md },
  featureIcon: { fontSize: 28 },
  featureText: { flex: 1 },
  featureTitle: { ...typography.label, marginBottom: 2 },
  featureDesc: { ...typography.small },
  actions: { gap: spacing.sm },
  primaryButton: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: radius.md, alignItems: 'center' },
  primaryButtonText: { color: colors.white, fontSize: 17, fontWeight: '700' },
  secondaryButton: { paddingVertical: 12, alignItems: 'center' },
  secondaryButtonText: { color: colors.primary, fontSize: 15, fontWeight: '500' },
});
