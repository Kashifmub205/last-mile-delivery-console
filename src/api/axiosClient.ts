import axios from 'axios';
import { MOCK_API_BASE_URL } from '@/constants/api';
import { mockAxiosAdapter } from '@/mock/server/mockAxiosAdapter';

export const axiosClient = axios.create({
  baseURL: MOCK_API_BASE_URL,
  adapter: mockAxiosAdapter,
  headers: {
    'Content-Type': 'application/json',
  },
});
