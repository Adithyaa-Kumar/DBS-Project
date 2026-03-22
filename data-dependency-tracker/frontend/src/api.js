/**
 * API Utility Module
 * Handles all HTTP requests to the backend
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// API endpoints
export const API = {
  // Health check
  healthCheck: () => apiClient.get('/health'),

  // Tables
  createTable: (tableName, columns) =>
    apiClient.post('/tables', { tableName, columns }),

  getAllTables: () => apiClient.get('/tables'),

  getTable: (tableName) => apiClient.get(`/tables/${tableName}`),

  // Rows
  insertRow: (tableName, data) =>
    apiClient.post(`/tables/${tableName}/rows`, { data }),

  getTableRows: (tableName) => apiClient.get(`/tables/${tableName}/rows`),

  deleteRow: (tableName, pkValue) =>
    apiClient.delete(`/tables/${tableName}/rows/${pkValue}`),

  // Simulation
  simulateDeletion: (tableName, pkValue) =>
    apiClient.post('/simulate-deletion', { tableName, pkValue }),

  // Relationships
  getRelationships: () => apiClient.get('/relationships'),

  getCascadingOrder: (tableName, pkValue) =>
    apiClient.post('/cascade-order', { tableName, pkValue }),

  // Queries
  executeJoinQuery: (query) => apiClient.post('/query/join', query),

  executeComplexQuery: (query) => apiClient.post('/query/complex', query),

  getQueryExamples: () => apiClient.get('/query/examples'),

  // Utilities
  clearAllData: () => apiClient.post('/clear')
};

export default API;
