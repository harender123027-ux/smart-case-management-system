import axios from 'axios';
import { API_BASE_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({ baseURL: API_BASE_URL, timeout: 30000 });

// Attach JWT token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Let the browser set Content-Type automatically for FormData (multipart boundary)
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
});

export default api;
