import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dashboard API
export const getDashboardSummary = async () => {
  try {
    const response = await api.get('/dashboard/summary');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    throw error;
  }
};

// Purchase Requests API
export const getAllPRs = async (params = {}) => {
  try {
    const response = await api.get('/pr', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching PRs:', error);
    throw error;
  }
};

export const getPRById = async (prId) => {
  try {
    const response = await api.get(`/pr/${prId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching PR ${prId}:`, error);
    throw error;
  }
};

export const createPR = async (prData) => {
  try {
    const response = await api.post('/pr', prData);
    return response.data;
  } catch (error) {
    console.error('Error creating PR:', error);
    throw error;
  }
};

export const approvePR = async (prId, comments) => {
  try {
    const response = await api.post(`/pr/${prId}/approve`, { comments });
    return response.data;
  } catch (error) {
    console.error(`Error approving PR ${prId}:`, error);
    throw error;
  }
};

export const rejectPR = async (prId, reason) => {
  try {
    const response = await api.post(`/pr/${prId}/reject`, { reason });
    return response.data;
  } catch (error) {
    console.error(`Error rejecting PR ${prId}:`, error);
    throw error;
  }
};

// Rules API
export const getAllRules = async (category = null) => {
  try {
    const params = category ? { category } : {};
    const response = await api.get('/rules/catalog', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching rules:', error);
    throw error;
  }
};

export const evaluateRules = async (prData) => {
  try {
    const response = await api.post('/rules/evaluate', { prData });
    return response.data;
  } catch (error) {
    console.error('Error evaluating rules:', error);
    throw error;
  }
};

export const createRule = async (ruleData) => {
  try {
    const response = await api.post('/rules', ruleData);
    return response.data;
  } catch (error) {
    console.error('Error creating rule:', error);
    throw error;
  }
};

// Approvals API
export const getApprovalsInbox = async () => {
  try {
    const response = await api.get('/approvals/inbox');
    return response.data;
  } catch (error) {
    console.error('Error fetching approvals inbox:', error);
    throw error;
  }
};

// Exceptions API
export const getAllExceptions = async (params = {}) => {
  try {
    const response = await api.get('/exception/list', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching exceptions:', error);
    throw error;
  }
};

export const resolveException = async (exceptionId, resolution, comments) => {
  try {
    const response = await api.post(`/exception/${exceptionId}/resolve`, {
      resolution,
      comments,
    });
    return response.data;
  } catch (error) {
    console.error(`Error resolving exception ${exceptionId}:`, error);
    throw error;
  }
};

// Analytics API
export const getDashboardMetrics = async (startDate, endDate) => {
  try {
    const params = { startDate, endDate };
    const response = await api.get('/analytics/dashboard', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    throw error;
  }
};

export default api;
