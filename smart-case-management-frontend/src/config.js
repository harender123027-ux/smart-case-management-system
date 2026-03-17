import { Platform } from 'react-native';

const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    // Use localhost if running in browser
    return 'http://localhost:3000/api';
  }
  return 'http://192.168.0.108:3000/api';
};

export const API_BASE_URL = getBaseUrl();

export const GEMINI_API_KEY = 'AIzaSyC9XuO1pgWk_8LPm3HumUbRxAqJvdD0keo';
