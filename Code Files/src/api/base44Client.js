import axios from 'axios';

// NAYA: Smart URL Logic. Typo fixed (kfrl -> kfr1)
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:8000/api' 
  : 'https://stranger-link-kfr1.onrender.com/api';

export const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const createEntityMethods = (entityName) => ({
  filter: async (params, sort, limit) => {
    try {
      const { data } = await apiClient.get(`/${entityName}`, { params: { ...params, sort, limit } });
      return data;
    } catch (e) { return []; }
  },
  create: async (payload) => {
    const { data } = await apiClient.post(`/${entityName}`, payload);
    return data;
  },
  update: async (id, payload) => {
    const { data } = await apiClient.put(`/${entityName}/${id}`, payload);
    return data;
  },
  delete: async (id) => {
    const { data } = await apiClient.delete(`/${entityName}/${id}`);
    return data;
  }
});

export const base44 = {
  auth: {
    isAuthenticated: async () => {
      return !!localStorage.getItem('access_token');
    },
    login: async (identifier, password) => {
      const { data } = await apiClient.post('/auth/login', { identifier, password });
      localStorage.setItem('access_token', data.access_token);
      return data.user;
    },
    register: async (payload) => {
      const { data } = await apiClient.post('/auth/register', payload);
      localStorage.setItem('access_token', data.access_token);
      return data.user;
    },
    firebaseLogin: async (payload) => {
      const { data } = await apiClient.post('/auth/firebase_login', payload);
      localStorage.setItem('access_token', data.access_token);
      return data.user;
    },
    me: async () => {
      const { data } = await apiClient.get('/auth/me');
      return data;
    },
    updateMe: async (payload) => {
      const { data } = await apiClient.put('/auth/me', payload);
      return data;
    },
    // NAYA: Delete aur Deactivate ka function
    deleteAccount: async (mode = 'deactivate') => {
      const { data } = await apiClient.delete(`/auth/me?mode=${mode}`);
      return data;
    },
    logout: (redirectUrl) => {
      localStorage.removeItem('access_token');
      if (redirectUrl) window.location.href = redirectUrl;
      else window.location.href = '/';
    },
    redirectToLogin: (redirectUrl) => {
      window.location.href = '/login' + (redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : '');
    }
  },
  
  entities: {
    ChatSession: createEntityMethods('chat-sessions'),
    Message: createEntityMethods('messages'),
    Notification: createEntityMethods('notifications'),
    UserFollow: createEntityMethods('user-follows'),
    Post: createEntityMethods('posts'),
    ChatLike: createEntityMethods('chat-likes'),
    User: createEntityMethods('users'),
    UserBlock: createEntityMethods('blocks'), // NAYA: UserBlock entities map ho gayi
    VIPPayment: createEntityMethods('vip-payments'),
  },
  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await apiClient.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data;
      }
    }
  }
};
// Supabase string: postgresql://postgres.byaysrildtutmegvrtul:Root%40...%237431@aws-1-ap-south-1.pooler.supabase.com:6543/postgres