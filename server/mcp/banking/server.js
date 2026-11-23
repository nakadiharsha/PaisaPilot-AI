const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');
const { db } = require('../../database/db');
const AuditService = require('../../services/auditService');

function createBankingMcpServer() {
  const server = new McpServer({
    name: 'banking-mcp-server',
    version: '1.0.0'
  });

  // Tool 1: get_balance
  server.tool(
    'get_balance',
    'Get user available balance across all accounts or for a specific account. Returns synthetic simulated banking data for demo.',
    {
      account_id: z.string().optional().describe('Optional specific account ID (e.g. acc_hdfc, acc_icici)')
    },
    async ({ account_id }) => {
      let accounts;
      if (account_id) {
        const stmt = db.prepare('SELECT id, name, account_number, type, bank_name, balance, is_primary, currency FROM accounts WHERE id = ?');
        const acc = stmt.get(account_id);
        accounts = acc ? [acc] : [];
      } else {
        const stmt = db.prepare('SELECT id, name, account_number, type, bank_name, balance, is_primary, currency FROM accounts ORDER BY is_primary DESC');
        accounts = stmt.all();
      }

      const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

      const result = {
        total_balance: totalBalance,
        currency: 'INR',
        formatted_total: `₹${totalBalance.toLocaleString('en-IN')}`,
        accounts_count: accounts.length,
        accounts: accounts.map(a => ({
          ...a,
          formatted_balance: `₹${a.balance.toLocaleString('en-IN')}`
        })),
        as_of: new Date().toISOString(),
        is_simulated: true,
        disclaimer: 'Simulated banking balance for hackathon demonstration. Not real financial funds.'
      };

      AuditService.logToolExecution({
        serverName: 'banking-mcp-server',
        toolName: 'get_balance',
        inputArguments: { account_id },
        outputResult: result
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  // Tool 2: get_transactions
  server.tool(
    'get_transactions',
    'Retrieve recent user transactions with optional filters for category, month (YYYY-MM), transaction type (DEBIT/CREDIT), and limit.',
    {
      limit: z.number().optional().default(10).describe('Maximum number of transactions to return'),
      category: z.string().optional().describe('Filter by expense category (e.g., Food & Dining, Shopping, Utilities)'),
      month: z.string().optional().describe('Filter by month in YYYY-MM format (e.g., 2026-11)'),
      type: z.enum(['DEBIT', 'CREDIT', 'ALL']).optional().default('ALL').describe('Filter by DEBIT, CREDIT, or ALL'),
      sort_by: z.enum(['date', 'amount']).optional().default('date').describe('Sort field: date or amount'),
      order: z.enum(['ASC', 'DESC']).optional().default('DESC').describe('Sort direction: ASC or DESC')
    },
    async ({ limit = 10, category, month, type = 'ALL', sort_by = 'date', order = 'DESC' }) => {
      let query = 'SELECT * FROM transactions WHERE 1=1';
      const params = [];

      if (category && category !== 'ALL') {
        query += ' AND category LIKE ?';
        params.push(`%${category}%`);
      }

      if (month) {
        query += ' AND date LIKE ?';
        params.push(`${month}%`);
      }

      if (type && type !== 'ALL') {
        query += ' AND type = ?';
        params.push(type);
      }

      query += ` ORDER BY ${sort_by === 'amount' ? 'amount' : 'date'} ${order === 'ASC' ? 'ASC' : 'DESC'} LIMIT ?`;
      params.push(limit);

      const stmt = db.prepare(query);
      const rows = stmt.all(...params);

      // Compute summary stats
      let totalDebit = 0;
      let totalCredit = 0;
      rows.forEach(r => {
        if (r.type === 'DEBIT') totalDebit += r.amount;
        if (r.type === 'CREDIT') totalCredit += r.amount;
      });

      const result = {
        count: rows.length,
        total_debit: totalDebit,
        total_credit: totalCredit,
        formatted_debit: `₹${totalDebit.toLocaleString('en-IN')}`,
        formatted_credit: `₹${totalCredit.toLocaleString('en-IN')}`,
        transactions: rows.map(r => ({
          ...r,
          formatted_amount: `${r.type === 'DEBIT' ? '-' : '+'}₹${r.amount.toLocaleString('en-IN')}`
        }))
      };

      AuditService.logToolExecution({
        serverName: 'banking-mcp-server',
        toolName: 'get_transactions',
        inputArguments: { limit, category, month, type, sort_by, order },
        outputResult: { count: rows.length, total_debit: totalDebit, total_credit: totalCredit }
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  // Tool 3: search_transactions
  server.tool(
    'search_transactions',
    'Search transactions across merchant names, notes, and categories with optional amount ranges and dates.',
    {
      query: z.string().describe('Search keyword (e.g. Swiggy, Biryani, Electricity, Rent, Salary)'),
      min_amount: z.number().optional().describe('Minimum amount filter'),
      max_amount: z.number().optional().describe('Maximum amount filter'),
      start_date: z.string().optional().describe('Start date YYYY-MM-DD'),
      end_date: z.string().optional().describe('End date YYYY-MM-DD'),
      limit: z.number().optional().default(20).describe('Max results to return')
    },
    async ({ query, min_amount, max_amount, start_date, end_date, limit = 20 }) => {
      let sql = 'SELECT * FROM transactions WHERE (merchant LIKE ? OR notes LIKE ? OR category LIKE ?)';
      const searchTerm = `%${query}%`;
      const params = [searchTerm, searchTerm, searchTerm];

      if (min_amount !== undefined) {
        sql += ' AND amount >= ?';
        params.push(min_amount);
      }
      if (max_amount !== undefined) {
        sql += ' AND amount <= ?';
        params.push(max_amount);
      }
      if (start_date) {
        sql += ' AND date >= ?';
        params.push(start_date);
      }
      if (end_date) {
        sql += ' AND date <= ?';
        params.push(end_date);
      }

      sql += ' ORDER BY date DESC LIMIT ?';
      params.push(limit);

      const stmt = db.prepare(sql);
      const rows = stmt.all(...params);

      const totalAmount = rows.reduce((sum, r) => sum + r.amount, 0);

      const result = {
        query,
        match_count: rows.length,
        total_amount: totalAmount,
        formatted_total: `₹${totalAmount.toLocaleString('en-IN')}`,
        transactions: rows.map(r => ({
          ...r,
          formatted_amount: `${r.type === 'DEBIT' ? '-' : '+'}₹${r.amount.toLocaleString('en-IN')}`
        }))
      };

      AuditService.logToolExecution({
        serverName: 'banking-mcp-server',
        toolName: 'search_transactions',
        inputArguments: { query, min_amount, max_amount, start_date, end_date },
        outputResult: { query, match_count: rows.length, total_amount: totalAmount }
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  // Tool 4: get_transaction_by_merchant
  server.tool(
    'get_transaction_by_merchant',
    'Get detailed transaction history and aggregated spending for a specific merchant (e.g., Swiggy, Zomato, Amazon, Tata Power).',
    {
      merchant: z.string().describe('Merchant or brand name (e.g. Swiggy, Amazon, Zomato)'),
      month: z.string().optional().describe('Optional month filter in YYYY-MM format, or "current" (2026-11), or "last" (2026-10)')
    },
    async ({ merchant, month }) => {
      let monthFilter = month;
      if (month === 'current') monthFilter = '2026-11';
      if (month === 'last') monthFilter = '2026-10';

      let sql = 'SELECT * FROM transactions WHERE LOWER(merchant) LIKE ?';
      const params = [`%${merchant.toLowerCase()}%`];

      if (monthFilter) {
        sql += ' AND date LIKE ?';
        params.push(`${monthFilter}%`);
      }

      sql += ' ORDER BY date DESC';

      const stmt = db.prepare(sql);
      const rows = stmt.all(...params);

      const totalSpent = rows
        .filter(r => r.type === 'DEBIT')
        .reduce((sum, r) => sum + r.amount, 0);

      const orderCount = rows.length;
      const averageOrderValue = orderCount > 0 ? Math.round((totalSpent / orderCount) * 100) / 100 : 0;

      const result = {
        merchant,
        month: monthFilter || 'All time',
        order_count: orderCount,
        total_spent: totalSpent,
        formatted_total_spent: `₹${totalSpent.toLocaleString('en-IN')}`,
        average_order_value: averageOrderValue,
        formatted_aov: `₹${averageOrderValue.toLocaleString('en-IN')}`,
        transactions: rows.map(r => ({
          ...r,
          formatted_amount: `${r.type === 'DEBIT' ? '-' : '+'}₹${r.amount.toLocaleString('en-IN')}`
        }))
      };

      AuditService.logToolExecution({
        serverName: 'banking-mcp-server',
        toolName: 'get_transaction_by_merchant',
        inputArguments: { merchant, month },
        outputResult: { merchant, order_count: orderCount, total_spent: totalSpent }
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  return server;
}

// Standalone execution support via stdio transport
if (require.main === module) {
  const server = createBankingMcpServer();
  const transport = new StdioServerTransport();
  server.connect(transport).then(() => {
    console.error('Banking MCP Server running over Stdio');
  }).catch((err) => {
    console.error('Failed to start Banking MCP Server:', err);
    process.exit(1);
  });
}

module.exports = { createBankingMcpServer };
