import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Remplace par l'IP de ta machine sur le réseau local pour tester sur appareil physique
// Ex: 'http://192.168.1.X:3000/api'
const API_URL = 'http://10.0.2.2:3000/api'; // 10.0.2.2 = localhost depuis émulateur Android

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
