import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [language, setLanguage] = useState('en');
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredData();
    const unsubscribe = NetInfo.addEventListener(state => {
      // isInternetReachable can be null on web (unknown), treat null as online
      setIsOnline(state.isConnected && (state.isInternetReachable !== false));
    });
    return () => unsubscribe();
  }, []);

  const loadStoredData = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      const storedLang = await AsyncStorage.getItem('language');

      if (storedToken) setToken(storedToken);
      if (storedUser) setUser(JSON.parse(storedUser));
      if (storedLang) setLanguage(storedLang);
    } catch (e) {
      console.error('Load stored data error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    await AsyncStorage.setItem('token', authToken);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  };

  const toggleLanguage = async () => {
    const newLang = language === 'en' ? 'hi' : 'en';
    setLanguage(newLang);
    await AsyncStorage.setItem('language', newLang);
  };

  return (
    <AppContext.Provider value={{ user, token, language, isOnline, isLoading, login, logout, toggleLanguage }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
