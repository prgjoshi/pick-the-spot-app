export interface User {
  id: string;
  email: string;
  name: string;
  created_at?: string;
}

export interface Group {
  id: string;
  name: string;
  invite_code: string;
  creator_id: string;
  location: string;
  session_date?: string | null;
  session_time?: string | null;
  party_size: number;
  created_at: string;
  is_creator?: boolean;
}

export interface GroupMember {
  id: string;
  name: string;
  email: string;
  is_creator: boolean;
  joined_at: string;
}

export interface GroupWithMembers extends Group {
  members: GroupMember[];
}

export interface UserPreferences {
  cuisines: string[];
  price_min: number;
  price_max: number;
  dietary_restrictions: string[];
  excluded_cuisines: string[];
}

export interface ScoreBreakdown {
  cuisine: number;       // 0–100
  price: number;         // 0–100
  distance: number;      // 0–100
  rating: number;        // 0–100
  availability: number | null;  // 0–100, or null if no session time set
  isOpenAtSessionTime: boolean | null;
}

export interface Restaurant {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  rating?: number;
  priceLevel?: string;
  location?: { latitude: number; longitude: number };
  types?: string[];
  nationalPhoneNumber?: string;
  currentOpeningHours?: { openNow?: boolean };
  regularOpeningHours?: {
    periods?: Array<{
      open: { day: number; hour: number; minute?: number };
      close?: { day: number; hour: number; minute?: number };
    }>;
    weekdayDescriptions?: string[];
  };
  reservable?: boolean;
  websiteUri?: string;
  groupScore: number;
  reasoning: string;
  scoreBreakdown: ScoreBreakdown | null;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

export interface GroupState {
  groups: Group[];
  currentGroup: GroupWithMembers | null;
  preferences: UserPreferences | null;
  recommendations: Restaurant[];
  isLoading: boolean;
  error: string | null;
}

// Navigation types
export type RootStackParamList = {
  Welcome: undefined;
  Auth: { mode?: 'login' | 'register' };
};

export type MainTabParamList = {
  Groups: undefined;
  Profile: undefined;
};

export type GroupsStackParamList = {
  GroupsList: undefined;
  CreateGroup: undefined;
  JoinGroup: undefined;
  GroupSession: { groupId: string };
  Recommendations: { groupId: string };
};
