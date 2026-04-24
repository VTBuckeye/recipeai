import axios from 'axios';
import Session from 'supertokens-auth-react/recipe/session';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add session token to requests
Session.addAxiosInterceptors(api);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login if unauthorized
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export default api;
