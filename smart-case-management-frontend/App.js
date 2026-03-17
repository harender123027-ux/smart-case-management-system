import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { AppProvider, useApp } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator';
import { initDatabase } from './src/db/localDb';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

function AppContent() {
  const { isLoading } = useApp();

  useEffect(() => {
    // Initialize local SQLite DB on startup
    try {
      initDatabase();
    } catch (e) {
      console.error('DB init error:', e);
    }
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a237e' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return <AppNavigator />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </GestureHandlerRootView>
  );
}
