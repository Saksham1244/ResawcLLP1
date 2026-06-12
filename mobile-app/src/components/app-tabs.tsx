import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { globalUser } from '@/utils/api';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.text,
      }}>
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Home',
          tabBarIcon: () => null
        }} 
      />
      <Tabs.Screen 
        name="leads" 
        options={{ 
          title: 'Leads',
          tabBarIcon: () => null,
          href: (globalUser?.role?.toLowerCase() === 'admin' || globalUser?.role?.toLowerCase() === 'editor') ? null : '/leads',
        }} 
      />
      <Tabs.Screen 
        name="tasks" 
        options={{ 
          title: 'Tasks',
          tabBarIcon: () => null,
          href: globalUser?.role?.toLowerCase() === 'admin' ? null : '/tasks',
        }} 
      />
      <Tabs.Screen 
        name="attendance" 
        options={{ 
          title: 'Attendance',
          tabBarIcon: () => null
        }} 
      />
    </Tabs>
  );
}
