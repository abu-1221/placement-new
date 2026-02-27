import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

export const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  }
};

export const studentService = {
  getAvailableTests: async () => {
    const response = await api.get('/tests/available');
    return response.data;
  },
  getTestById: async (id) => {
    const response = await api.get(`/tests/${id}`);
    return response.data;
  },
  submitTest: async (testData) => {
    const response = await api.post('/tests/submit', testData);
    return response.data;
  },
  getStudentResults: async (username) => {
    const response = await api.get(`/results/student/${username}`);
    return response.data;
  }
};

export const staffService = {
  createTest: async (testData) => {
    const response = await api.post('/staff/create-test', testData);
    return response.data;
  },
  getAllResults: async () => {
    const response = await api.get('/results/all');
    return response.data;
  },
  getAllStudents: async () => {
    const response = await api.get('/staff/students');
    return response.data;
  },
  deleteTest: async (id) => {
    const response = await api.delete(`/staff/tests/${id}`);
    return response.data;
  }
};

export default api;
