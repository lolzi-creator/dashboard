import axios from 'axios';

// Create API client with base URL
const api = axios.create({
        baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
    timeout: 10000
});

// Error handling interceptor
api.interceptors.response.use(
    response => response.data,
    error => {
        const errorMessage = error.response?.data?.message || error.message;
        console.error('API Error:', errorMessage);
        throw new Error(errorMessage);
    }
);

export default api;