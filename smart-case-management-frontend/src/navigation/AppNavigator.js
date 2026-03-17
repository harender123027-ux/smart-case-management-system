import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useApp } from '../context/AppContext';
import { t } from '../i18n/translations';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ComplaintScreen from '../screens/ComplaintScreen';
import CaseSearchScreen from '../screens/CaseSearchScreen';
import EvidenceScreen from '../screens/EvidenceScreen';
import PredictiveScreen from '../screens/PredictiveScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Dashboard: '🏠',
  Cases: '📁',
  Complaint: '📝',
  Evidence: '🗂️',
  Predictive: '🤖',
};

function MainTabs() {
  const { language } = useApp();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: () => <Text style={{ fontSize: 22 }}>{TAB_ICONS[route.name]}</Text>,
        tabBarActiveTintColor: '#1a237e',
        tabBarInactiveTintColor: '#9e9e9e',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e0e0e0',
          paddingBottom: 4,
          height: 62,
          elevation: 10,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: t('dashboard', language) }} />
      <Tab.Screen name="Cases" component={CaseSearchScreen} options={{ tabBarLabel: t('cases', language) }} />
      <Tab.Screen name="Complaint" component={ComplaintScreen} options={{ tabBarLabel: t('complaints', language) }} />
      <Tab.Screen name="Evidence" component={EvidenceScreen} options={{ tabBarLabel: t('evidence', language) }} />
      <Tab.Screen name="Predictive" component={PredictiveScreen} options={{ tabBarLabel: language === 'hi' ? 'AI' : 'AI' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, isLoading } = useApp();

  if (isLoading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
