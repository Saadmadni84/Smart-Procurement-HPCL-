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
    const url = category ? `/rules/category/${category}` : '/rules';
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching rules:', error);
    throw error;
  }
};

export const getActiveRules = async () => {
  try {
    const response = await api.get('/rules/active');
    return response.data;
  } catch (error) {
    console.error('Error fetching active rules:', error);
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

export const updateRule = async (id, ruleData) => {
  try {
    const response = await api.put(`/rules/${id}`, ruleData);
    return response.data;
  } catch (error) {
    console.error('Error updating rule:', error);
    throw error;
  }
};

export const deleteRule = async (id) => {
  try {
    const response = await api.delete(`/rules/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting rule:', error);
    throw error;
  }
};

// Approvals API
export const getAllApprovals = async () => {
  try {
    const response = await api.get('/approvals');
    return response.data;
  } catch (error) {
    console.error('Error fetching approvals:', error);
    throw error;
  }
};

export const getPendingApprovals = async () => {
  try {
    const response = await api.get('/approvals/pending');
    return response.data;
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    throw error;
  }
};

export const getApprovalsInbox = async (approverId) => {
  try {
    const response = await api.get(`/approvals/inbox/${approverId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching approvals inbox:', error);
    throw error;
  }
};

export const getApprovalsByPR = async (prId) => {
  try {
    const response = await api.get(`/approvals/pr/${prId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching approvals for PR:', error);
    throw error;
  }
};

export const approveApproval = async (id, comments, approverId) => {
  try {
    const response = await api.post(`/approvals/${id}/approve`, { comments, approverId });
    return response.data;
  } catch (error) {
    console.error('Error approving approval:', error);
    throw error;
  }
};

export const rejectApproval = async (id, comments, approverId) => {
  try {
    const response = await api.post(`/approvals/${id}/reject`, { comments, approverId });
    return response.data;
  } catch (error) {
    console.error('Error rejecting approval:', error);
    throw error;
  }
};

// Exceptions API
export const getAllExceptions = async () => {
  try {
    const response = await api.get('/exceptions');
    return response.data;
  } catch (error) {
    console.error('Error fetching exceptions:', error);
    throw error;
  }
};

export const getOpenExceptions = async () => {
  try {
    const response = await api.get('/exceptions/open');
    return response.data;
  } catch (error) {
    console.error('Error fetching open exceptions:', error);
    throw error;
  }
};

export const getExceptionsByPR = async (prId) => {
  try {
    const response = await api.get(`/exceptions/pr/${prId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching exceptions for PR:', error);
    throw error;
  }
};

export const getExceptionsBySeverity = async (severity) => {
  try {
    const response = await api.get(`/exceptions/severity/${severity}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching exceptions by severity:', error);
    throw error;
  }
};

export const resolveException = async (exceptionId, resolution, resolvedBy) => {
  try {
    const response = await api.post(`/exceptions/${exceptionId}/resolve`, {
      resolution,
      resolvedBy,
    });
    return response.data;
  } catch (error) {
    console.error(`Error resolving exception ${exceptionId}:`, error);
    throw error;
  }
};

export const escalateException = async (exceptionId) => {
  try {
    const response = await api.post(`/exceptions/${exceptionId}/escalate`);
    return response.data;
  } catch (error) {
    console.error(`Error escalating exception ${exceptionId}:`, error);
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
