import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GroupsStackParamList } from '../types';
import GroupsScreen from '../screens/GroupsScreen';
import CreateGroupScreen from '../screens/CreateGroupScreen';
import JoinGroupScreen from '../screens/JoinGroupScreen';
import GroupSessionScreen from '../screens/GroupSessionScreen';
import RecommendationsScreen from '../screens/RecommendationsScreen';
import { colors } from '../config/theme';

const Stack = createNativeStackNavigator<GroupsStackParamList>();

export default function GroupsNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.white },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: '700', color: colors.text },
      }}
    >
      <Stack.Screen name="GroupsList" component={GroupsScreen} options={{ title: 'My Groups' }} />
      <Stack.Screen name="CreateGroup" component={CreateGroupScreen} options={{ title: 'Create Group' }} />
      <Stack.Screen name="JoinGroup" component={JoinGroupScreen} options={{ title: 'Join Group' }} />
      <Stack.Screen name="GroupSession" component={GroupSessionScreen} options={{ title: 'Group Session' }} />
      <Stack.Screen name="Recommendations" component={RecommendationsScreen} options={{ title: 'Recommendations' }} />
    </Stack.Navigator>
  );
}
