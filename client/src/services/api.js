const BASE_URL = '/api';

export const api = {
  // Overview
  async getOverview() {
    const res = await fetch(`${BASE_URL}/overview`);
    return res.json();
  },

  // Transactions
  async getTransactions(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}/transactions?${query}`);
    return res.json();
  },

  async createTransaction(data) {
    const res = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Analytics
  async getAnalytics() {
    const res = await fetch(`${BASE_URL}/analytics`);
    return res.json();
  },

  // Budgets
  async getBudgets() {
    const res = await fetch(`${BASE_URL}/budgets`);
    return res.json();
  },

  async saveBudget(data) {
    const res = await fetch(`${BASE_URL}/budgets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Group Splits
  async getSplits() {
    const res = await fetch(`${BASE_URL}/split`);
    return res.json();
  },

  async createSplit(data) {
    const res = await fetch(`${BASE_URL}/split`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async settleSplitItem(itemId) {
    const res = await fetch(`${BASE_URL}/split/item/${itemId}/settle`, {
      method: 'POST'
    });
    return res.json();
  },

  // Reminders
  async getReminders() {
    const res = await fetch(`${BASE_URL}/reminders`);
    return res.json();
  },

  async createReminder(data) {
    const res = await fetch(`${BASE_URL}/reminders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deleteReminder(id) {
    const res = await fetch(`${BASE_URL}/reminders/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // Audit and Approvals
  async getAuditLogs() {
    const res = await fetch(`${BASE_URL}/audit`);
    return res.json();
  },

  async approveAction(id) {
    const res = await fetch(`${BASE_URL}/audit/${id}/approve`, {
      method: 'POST'
    });
    return res.json();
  },

  async rejectAction(id, reason = 'User rejected') {
    const res = await fetch(`${BASE_URL}/audit/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    return res.json();
  },

  // MCP Servers Status
  async getMcpStatus() {
    const res = await fetch(`${BASE_URL}/mcp/status`);
    return res.json();
  },

  // Agent Chat
  async sendChatMessage(message, sessionId = 'web_session_' + Date.now()) {
    const res = await fetch(`${BASE_URL}/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, sessionId })
    });
    return res.json();
  },

  async getSuggestedPrompts() {
    const res = await fetch(`${BASE_URL}/agent/suggested`);
    return res.json();
  }
};
