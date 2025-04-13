import axios from "axios";

const API_URL = "http://localhost:4000/api/auth";

// Create axios instance with timeout and headers
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for logging
api.interceptors.request.use(config => {
  console.log('API Request:', {
    url: config.url,
    method: config.method,
    data: config.data
  });
  return config;
});

// Add response interceptor for logging
api.interceptors.response.use(
  response => {
    console.log('API Response:', {
      status: response.status,
      data: response.data
    });
    return response;
  },
  error => {
    console.error('API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
);

export const register = async (username, email, password) => {
  try {
    if (!username || !email || !password) {
      throw new Error('All fields are required');
    }

    if (!email.includes('@')) {
      throw new Error('Please enter a valid email address');
    }

    const response = await api.post('/register', { 
      username: username.trim(), 
      email: email.trim(), 
      password 
    });
    
    return response.data;
  } catch (error) {
    if (!error.response) {
      throw new Error('Network error. Please check your connection.');
    }
    // Throw the error message from the server if available
    throw new Error(error.response?.data?.msg || error.message);
  }
};

export const login = async (username, password) => {
  try {
    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    const response = await api.post('/login', { 
      username: username.trim(), 
      password 
    });
    
    return response.data;
  } catch (error) {
    if (!error.response) {
      throw new Error('Network error. Please check your connection.');
    }
    // Throw the error message from the server if available
    throw new Error(error.response?.data?.msg || error.message);
  }
};
