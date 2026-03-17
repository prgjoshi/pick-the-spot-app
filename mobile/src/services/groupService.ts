import api from './api';
import { Group, GroupWithMembers, UserPreferences, Restaurant } from '../types';

export async function createGroup(params: {
  name: string;
  location: string;
  session_date?: string;
  session_time?: string;
  party_size?: number;
}): Promise<Group> {
  const { data } = await api.post('/groups', params);
  return data;
}

export async function joinGroup(invite_code: string): Promise<Group> {
  const { data } = await api.post('/groups/join', { invite_code });
  return data;
}

export async function getGroups(): Promise<Group[]> {
  const { data } = await api.get('/groups');
  return data;
}

export async function getGroup(id: string): Promise<GroupWithMembers> {
  const { data } = await api.get(`/groups/${id}`);
  return data;
}

export async function updateSession(
  groupId: string,
  params: { location?: string; session_date?: string; session_time?: string; party_size?: number }
): Promise<Group> {
  const { data } = await api.put(`/groups/${groupId}/session`, params);
  return data;
}

export async function savePreferences(groupId: string, prefs: UserPreferences): Promise<UserPreferences> {
  const { data } = await api.put(`/groups/${groupId}/preferences`, prefs);
  return data;
}

export async function getRecommendations(groupId: string): Promise<{ group: Group; recommendations: Restaurant[] }> {
  const { data } = await api.get(`/groups/${groupId}/recommendations`);
  return data;
}
