const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

async function handleResponse(response) {
  if (!response.ok) {
    let errorDetail = 'Network request failed';
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorJson.message || JSON.stringify(errorJson);
    } catch {
      errorDetail = await response.text();
    }
    throw new Error(errorDetail || `HTTP error ${response.status}`);
  }
  return response.json();
}

export const api = {
  // System root status
  async getStatus() {
    const res = await fetch(`${API_BASE_URL}/`);
    return handleResponse(res);
  },

  // Dataset Statistics
  async getStatistics() {
    const res = await fetch(`${API_BASE_URL}/api/statistics`);
    return handleResponse(res);
  },

  async getDatasetStatistics() {
    const res = await fetch(`${API_BASE_URL}/api/dataset/statistics`);
    return handleResponse(res);
  },

  // Analytics Chart Data
  async getAnalytics() {
    const res = await fetch(`${API_BASE_URL}/api/analytics`);
    return handleResponse(res);
  },

  // Transactions list & details
  async getTransactions(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page);
    if (params.page_size) query.set('page_size', params.page_size);
    if (params.search) query.set('search', params.search);
    if (params.risk_level) query.set('risk_level', params.risk_level);
    if (params.prediction) query.set('prediction', params.prediction);
    if (params.sort_by) query.set('sort_by', params.sort_by);
    if (params.sort_order) query.set('sort_order', params.sort_order);

    const res = await fetch(`${API_BASE_URL}/api/transactions?${query.toString()}`);
    return handleResponse(res);
  },

  async getTransactionDetails(id) {
    const res = await fetch(`${API_BASE_URL}/api/transactions/${encodeURIComponent(id)}`);
    return handleResponse(res);
  },

  // Models list & details
  async getModels() {
    const res = await fetch(`${API_BASE_URL}/api/models`);
    return handleResponse(res);
  },

  async getModelDetails(model_key) {
    const res = await fetch(`${API_BASE_URL}/api/models/${encodeURIComponent(model_key)}`);
    return handleResponse(res);
  },

  // Training pipeline APIs
  async trainModel(model_key, parameters = {}) {
    const res = await fetch(`${API_BASE_URL}/api/train`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model_key, parameters })
    });
    return handleResponse(res);
  },

  async trainAllModels(parameters = {}) {
    const res = await fetch(`${API_BASE_URL}/api/train/all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parameters })
    });
    return handleResponse(res);
  },

  async getTrainingStatus() {
    const res = await fetch(`${API_BASE_URL}/api/training/status`);
    return handleResponse(res);
  },

  async getTrainingHistory() {
    const res = await fetch(`${API_BASE_URL}/api/training/history`);
    return handleResponse(res);
  },

  async runModel(model_key, parameters = {}) {
    const res = await fetch(`${API_BASE_URL}/api/models/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model_key, parameters })
    });
    return handleResponse(res);
  },

  async compareModels() {
    const res = await fetch(`${API_BASE_URL}/api/models/compare`, {
      method: 'GET'
    });
    return handleResponse(res);
  },

  // Dataset upload & cleaning
  async uploadDataset(file) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE_URL}/api/dataset/upload`, {
      method: 'POST',
      body: formData
    });
    return handleResponse(res);
  },

  async cleanDataset() {
    const res = await fetch(`${API_BASE_URL}/api/dataset/clean`, {
      method: 'POST'
    });
    return handleResponse(res);
  },

  async resetDemoDataset() {
    const res = await fetch(`${API_BASE_URL}/api/reset-demo`, {
      method: 'POST'
    });
    return handleResponse(res);
  },

  // Single transaction inference
  async predict(transaction, model_key = null) {
    const res = await fetch(`${API_BASE_URL}/api/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction, model_key })
    });
    return handleResponse(res);
  }
};
