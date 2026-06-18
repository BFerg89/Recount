import { Tabs } from 'expo-router';
import { NotebookIcon, PencilSimpleLineIcon, UserIcon } from 'phosphor-react-native';
import React from 'react';

import { recountTheme } from '@/constants/RecountTheme';

const { colors } = recountTheme;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.terracotta,
        tabBarInactiveTintColor: colors.inkSoft,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.paperCard,
          borderTopColor: colors.rule,
          borderTopWidth: 1.5,
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Logs',
          tabBarIcon: ({ color }) => (
            <NotebookIcon color={color} size={28} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create Log',
          tabBarIcon: ({ color }) => (
            <PencilSimpleLineIcon color={color} size={28} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <UserIcon color={color} size={28} />
          ),
        }}
      />
    </Tabs>
  );
}
