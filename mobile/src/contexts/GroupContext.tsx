import React, { createContext, useContext, useState, useCallback } from 'react';
import { Group, GroupWithMembers, UserPreferences, Restaurant } from '../types';
import * as groupService from '../services/groupService';

interface GroupContextValue {
  groups: Group[];
  currentGroup: GroupWithMembers | null;
  preferences: UserPreferences | null;
  recommendations: Restaurant[];
  isLoading: boolean;
  error: string | null;
  loadGroups: () => Promise<void>;
  createGroup: (name: string, location: string, partySize?: number) => Promise<Group>;
  joinGroup: (inviteCode: string) => Promise<Group>;
  loadGroup: (id: string) => Promise<void>;
  savePreferences: (groupId: string, prefs: UserPreferences) => Promise<void>;
  loadRecommendations: (groupId: string) => Promise<void>;
  clearError: () => void;
}

const GroupContext = createContext<GroupContextValue | null>(null);

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentGroup, setCurrentGroup] = useState<GroupWithMembers | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [recommendations, setRecommendations] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGroups = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await groupService.getGroups();
      setGroups(data);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to load groups');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createGroup = useCallback(async (name: string, location: string, partySize = 2): Promise<Group> => {
    setIsLoading(true);
    setError(null);
    try {
      const group = await groupService.createGroup({ name, location, party_size: partySize });
      setGroups((prev) => [group, ...prev]);
      return group;
    } catch (err: any) {
      const msg = err.response?.data?.error ?? 'Failed to create group';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const joinGroup = useCallback(async (inviteCode: string): Promise<Group> => {
    setIsLoading(true);
    setError(null);
    try {
      const group = await groupService.joinGroup(inviteCode);
      setGroups((prev) => {
        if (prev.find((g) => g.id === group.id)) return prev;
        return [group, ...prev];
      });
      return group;
    } catch (err: any) {
      const msg = err.response?.data?.error ?? 'Failed to join group';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadGroup = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const group = await groupService.getGroup(id);
      setCurrentGroup(group);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to load group');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const savePreferences = useCallback(async (groupId: string, prefs: UserPreferences) => {
    setIsLoading(true);
    setError(null);
    try {
      await groupService.savePreferences(groupId, prefs);
      setPreferences(prefs);
    } catch (err: any) {
      const msg = err.response?.data?.error ?? 'Failed to save preferences';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadRecommendations = useCallback(async (groupId: string) => {
    setIsLoading(true);
    setError(null);
    setRecommendations([]);
    try {
      const { recommendations: recs } = await groupService.getRecommendations(groupId);
      setRecommendations(recs);
    } catch (err: any) {
      const msg = err.response?.data?.error ?? 'Failed to fetch recommendations';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <GroupContext.Provider
      value={{
        groups,
        currentGroup,
        preferences,
        recommendations,
        isLoading,
        error,
        loadGroups,
        createGroup,
        joinGroup,
        loadGroup,
        savePreferences,
        loadRecommendations,
        clearError,
      }}
    >
      {children}
    </GroupContext.Provider>
  );
}

export function useGroup(): GroupContextValue {
  const ctx = useContext(GroupContext);
  if (!ctx) throw new Error('useGroup must be used within GroupProvider');
  return ctx;
}
