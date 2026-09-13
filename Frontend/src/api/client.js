import axios from 'axios';
import { store, logout } from '../store/store';
import { queryClient } from './queries';
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', timeout: 15000 });
api.interceptors.request.use(config => {
  const { token } = store.getState().auth;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401 && !error.config?.url?.startsWith('/auth/')) {
    store.dispatch(logout());
    queryClient.removeQueries({ queryKey: ['orders'] });
  }
  return Promise.reject(error);
});
export function errorCode(error) {
  if (!error.response) return 'network';
  if (error.response.status === 429) return 'rateLimit';
  return error.response.data?.code || (error.response.status === 401 ? 'sessionExpired' : 'serverError');
}
