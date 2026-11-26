const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const centralMcpClient = require('../agent/mcpClient');
const AuditService = require('../services/auditService');

// 1. Overview Dashboard Summary
router.get('/overview', async (req, res) => {
  try {
    const currentMonth = '2026-11';

    // Accounts
    const accounts = db.prepare('SELECT * FROM accounts ORDER BY is_primary DESC').all();
    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

    // Monthly Income and Expenses
    const incomeRes = db.prepare("SELECT SUM(amount) as income FROM transactions WHERE type = 'CREDIT' AND date LIKE ?").get(`${currentMonth}%`);
    const expenseRes = db.prepare("SELECT SUM(amount) as expenses FROM transactions WHERE type = 'DEBIT' AND date LIKE ?").get(`${currentMonth}%`);

    const monthlyIncome = (incomeRes && incomeRes.income) || 0;
    const monthlyExpenses = (expenseRes && expenseRes.expenses) || 0;
    const netSavings = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? Math.round((netSavings / monthlyIncome) * 1000) / 10 : 0;

    // Category breakdown for chart
    const categories = db.prepare(`
      SELECT category, SUM(amount) as total
      FROM transactions
      WHERE type = 'DEBIT' AND date LIKE ?
      GROUP BY category
      ORDER BY total DESC
    `).all(`${currentMonth}%`);

    // 3-Month Trend (Sep, Oct, Nov 2026)
    const trend = [
      { month: 'Sep 2026', key: '2026-09' },
      { month: 'Oct 2026', key: '2026-10' },
      { month: 'Nov 2026', key: '2026-11' }
    ].map(m => {
      const inc = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE type = 'CREDIT' AND date LIKE ?").get(`${m.key}%`);
      const exp = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE type = 'DEBIT' AND date LIKE ?").get(`${m.key}%`);
      return {
        month: m.month,
        income: (inc && inc.total) || 0,
        expenses: (exp && exp.total) || 0,
        savings: ((inc && inc.total) || 0) - ((exp && exp.total) || 0)
      };
    });

    // Recent 5 transactions
    const recentTransactions = db.prepare('SELECT * FROM transactions ORDER BY date DESC, created_at DESC LIMIT 5').all();

    // Upcoming reminders (top 3)
    const upcomingReminders = db.prepare("SELECT * FROM reminders WHERE status = 'PENDING' ORDER BY due_date ASC LIMIT 3").all();

    res.json({
      success: true,
      data: {
        totalBalance,
        formattedTotalBalance: `₹${totalBalance.toLocaleString('en-IN')}`,
        accounts,
        monthlyIncome,
        formattedIncome: `₹${monthlyIncome.toLocaleString('en-IN')}`,
        monthlyExpenses,
        formattedExpenses: `₹${monthlyExpenses.toLocaleString('en-IN')}`,
        netSavings,
        formattedSavings: `₹${netSavings.toLocaleString('en-IN')}`,
        savingsRate,
        categoryBreakdown: categories,
        trend,
        recentTransactions,
        upcomingReminders
      }
    });
  } catch (err) {
    console.error('Error fetching overview:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Transactions (List, filter, search)
router.get('/transactions', (req, res) => {
  try {
    const { search, category, type, payment_method, month, limit = 50, offset = 0 } = req.query;

    let sql = 'SELECT * FROM transactions WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (merchant LIKE ? OR notes LIKE ? OR category LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (category && category !== 'ALL') {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (type && type !== 'ALL') {
      sql += ' AND type = ?';
      params.push(type);
    }
    if (payment_method && payment_method !== 'ALL') {
      sql += ' AND payment_method = ?';
      params.push(payment_method);
    }
    if (month && month !== 'ALL') {
      sql += ' AND date LIKE ?';
      params.push(`${month}%`);
    }

    sql += ' ORDER BY date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const transactions = db.prepare(sql).all(...params);

    // Categories list for filter dropdown
    const categories = db.prepare('SELECT DISTINCT category FROM transactions ORDER BY category ASC').all().map(r => r.category);
    const paymentMethods = db.prepare('SELECT DISTINCT payment_method FROM transactions ORDER BY payment_method ASC').all().map(r => r.payment_method);

    res.json({
      success: true,
      count: transactions.length,
      data: transactions,
      categories,
      paymentMethods
    });
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new transaction
router.post('/transactions', (req, res) => {
  try {
    const { account_id = 'acc_hdfc', merchant, amount, type = 'DEBIT', category, payment_method = 'UPI', date, notes = '' } = req.body;
    if (!merchant || !amount || !category) {
      return res.status(400).json({ success: false, error: 'Merchant, amount, and category are required' });
    }

    const id = 'tx_' + Date.now().toString(36);
    const txDate = date || new Date().toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO transactions (id, account_id, merchant, amount, type, category, payment_method, date, notes, is_recurring)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(id, account_id, merchant, parseFloat(amount), type, category, payment_method, txDate, notes);

    // Update account balance
    const balanceChange = type === 'CREDIT' ? parseFloat(amount) : -parseFloat(amount);
    db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?').run(balanceChange, account_id);

    res.json({ success: true, id, message: 'Transaction recorded successfully' });
  } catch (err) {
    console.error('Error creating transaction:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Analytics
router.get('/analytics', (req, res) => {
  try {
    const currentMonth = '2026-11';
    const lastMonth = '2026-10';

    // Category breakdown
    const categoryBreakdown = db.prepare(`
      SELECT category, SUM(amount) as total, COUNT(*) as count
      FROM transactions
      WHERE type = 'DEBIT' AND date LIKE ?
      GROUP BY category
      ORDER BY total DESC
    `).all(`${currentMonth}%`);

    const totalExpense = categoryBreakdown.reduce((sum, c) => sum + c.total, 0);

    // Merchant breakdown (Top 8 merchants)
    const merchantBreakdown = db.prepare(`
      SELECT merchant, SUM(amount) as total, COUNT(*) as count
      FROM transactions
      WHERE type = 'DEBIT' AND date LIKE ?
      GROUP BY merchant
      ORDER BY total DESC
      LIMIT 8
    `).all(`${currentMonth}%`);

    // Month-over-month comparison
    const comparison = db.prepare(`
      SELECT 
        c.category,
        COALESCE(m1.spent, 0) as current_month,
        COALESCE(m2.spent, 0) as last_month
      FROM (SELECT DISTINCT category FROM transactions WHERE type = 'DEBIT') c
      LEFT JOIN (
        SELECT category, SUM(amount) as spent 
        FROM transactions 
        WHERE type = 'DEBIT' AND date LIKE ? 
        GROUP BY category
      ) m1 ON c.category = m1.category
      LEFT JOIN (
        SELECT category, SUM(amount) as spent 
        FROM transactions 
        WHERE type = 'DEBIT' AND date LIKE ? 
        GROUP BY category
      ) m2 ON c.category = m2.category
      ORDER BY current_month DESC
    `).all(`${currentMonth}%`, `${lastMonth}%`);

    // Subscriptions
    const subscriptions = db.prepare("SELECT * FROM subscriptions WHERE status = 'active' ORDER BY amount DESC").all();

    // Budget utilization
    const budgets = db.prepare(`
      SELECT b.category, b.monthly_limit, COALESCE(s.spent, 0) as spent
      FROM budgets b
      LEFT JOIN (
        SELECT category, SUM(amount) as spent 
        FROM transactions 
        WHERE type = 'DEBIT' AND date LIKE ? 
        GROUP BY category
      ) s ON b.category = s.category
      WHERE b.month = ?
    `).all(`${currentMonth}%`, currentMonth);

    res.json({
      success: true,
      data: {
        currentMonth,
        totalExpense,
        categoryBreakdown: categoryBreakdown.map(c => ({
          ...c,
          percentage: totalExpense > 0 ? Math.round((c.total / totalExpense) * 1000) / 10 : 0
        })),
        merchantBreakdown,
        comparison: comparison.map(c => ({
          ...c,
          diff: c.current_month - c.last_month,
          pctChange: c.last_month > 0 ? Math.round(((c.current_month - c.last_month) / c.last_month) * 100) : 0
        })),
        subscriptions,
        budgets: budgets.map(b => ({
          ...b,
          remaining: Math.max(0, b.monthly_limit - b.spent),
          utilization: Math.round((b.spent / b.monthly_limit) * 100)
        }))
      }
    });
  } catch (err) {
    console.error('Error fetching analytics:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Budgets
router.get('/budgets', (req, res) => {
  try {
    const currentMonth = '2026-11';
    const budgets = db.prepare(`
      SELECT b.id, b.category, b.monthly_limit, b.month, COALESCE(s.spent, 0) as spent
      FROM budgets b
      LEFT JOIN (
        SELECT category, SUM(amount) as spent
        FROM transactions
        WHERE type = 'DEBIT' AND date LIKE ?
        GROUP BY category
      ) s ON b.category = s.category
      WHERE b.month = ?
      ORDER BY b.monthly_limit DESC
    `).all(`${currentMonth}%`, currentMonth);

    const formatted = budgets.map(b => {
      const remaining = b.monthly_limit - b.spent;
      const utilization = Math.round((b.spent / b.monthly_limit) * 100);
      let status = 'ON_TRACK';
      if (b.spent > b.monthly_limit) status = 'EXCEEDED';
      else if (utilization >= 80) status = 'WARNING';

      return {
        ...b,
        remaining: Math.max(0, remaining),
        overspent: Math.max(0, -remaining),
        utilization,
        status
      };
    });

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error('Error fetching budgets:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/budgets', (req, res) => {
  try {
    const { category, monthly_limit, month = '2026-11' } = req.body;
    if (!category || !monthly_limit) {
      return res.status(400).json({ success: false, error: 'Category and monthly_limit are required' });
    }

    const existing = db.prepare('SELECT id FROM budgets WHERE category = ? AND month = ?').get(category, month);
    if (existing) {
      db.prepare('UPDATE budgets SET monthly_limit = ? WHERE id = ?').run(parseFloat(monthly_limit), existing.id);
      res.json({ success: true, message: 'Budget updated successfully' });
    } else {
      const id = 'bgt_' + Date.now().toString(36);
      db.prepare('INSERT INTO budgets (id, category, monthly_limit, month) VALUES (?, ?, ?, ?)').run(id, category, parseFloat(monthly_limit), month);
      res.json({ success: true, id, message: 'Budget created successfully' });
    }
  } catch (err) {
    console.error('Error saving budget:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Group Splits
router.get('/split', (req, res) => {
  try {
    const groups = db.prepare('SELECT * FROM split_groups ORDER BY created_at DESC').all();
    const result = groups.map(g => {
      const items = db.prepare('SELECT * FROM split_items WHERE group_id = ? ORDER BY status DESC').all(g.id);
      const settled = items.filter(i => i.status === 'PAID').reduce((sum, i) => sum + i.amount, 0);
      const pending = items.filter(i => i.status === 'PENDING').reduce((sum, i) => sum + i.amount, 0);
      return {
        ...g,
        settled,
        pending,
        settlementRate: g.total_amount > 0 ? Math.round((settled / g.total_amount) * 100) : 0,
        items
      };
    });

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Error fetching splits:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/split', (req, res) => {
  try {
    const { title, total_amount, participants = [] } = req.body;
    if (!title || !total_amount || participants.length === 0) {
      return res.status(400).json({ success: false, error: 'Title, total_amount, and participants are required' });
    }

    const groupId = 'grp_' + Date.now().toString(36);
    const today = new Date().toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO split_groups (id, title, total_amount, created_by, date, status)
      VALUES (?, ?, ?, 'Aarav Sharma', ?, 'active')
    `).run(groupId, title, parseFloat(total_amount), today);

    const insertItem = db.prepare(`
      INSERT INTO split_items (id, group_id, friend_name, friend_upi, amount, status, upi_link)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    participants.forEach((p, idx) => {
      const itemId = `item_${groupId}_${idx + 1}`;
      const isSelf = p.name.includes('(You)') || p.name.toLowerCase() === 'aarav sharma';
      const status = p.status || (isSelf ? 'PAID' : 'PENDING');
      const encodedNote = encodeURIComponent(`${title} Share`);
      const upiLink = isSelf ? null : `upi://pay?pa=aarav.sharma@okaxis&pn=Aarav%20Sharma&am=${parseFloat(p.amount).toFixed(2)}&cu=INR&tn=${encodedNote}`;
      insertItem.run(itemId, groupId, p.name, p.upi_id || 'friend@upi', parseFloat(p.amount), status, upiLink);
    });

    res.json({ success: true, groupId, message: 'Group split created' });
  } catch (err) {
    console.error('Error creating split:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/split/item/:itemId/settle', (req, res) => {
  try {
    const { itemId } = req.params;
    const now = new Date().toISOString();
    db.prepare("UPDATE split_items SET status = 'PAID', settled_at = ? WHERE id = ?").run(now, itemId);
    res.json({ success: true, message: 'Split marked as settled' });
  } catch (err) {
    console.error('Error settling split item:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Reminders
router.get('/reminders', (req, res) => {
  try {
    const reminders = db.prepare('SELECT * FROM reminders ORDER BY due_date ASC').all();
    res.json({ success: true, data: reminders });
  } catch (err) {
    console.error('Error fetching reminders:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/reminders', (req, res) => {
  try {
    const { title, amount, due_date, category = 'Utilities' } = req.body;
    if (!title || !due_date) {
      return res.status(400).json({ success: false, error: 'Title and due_date are required' });
    }

    const id = 'rem_' + Date.now().toString(36);
    db.prepare(`
      INSERT INTO reminders (id, title, amount, due_date, category, status)
      VALUES (?, ?, ?, ?, ?, 'PENDING')
    `).run(id, title, parseFloat(amount || 0), due_date, category);

    res.json({ success: true, id, message: 'Reminder created' });
  } catch (err) {
    console.error('Error creating reminder:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/reminders/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM reminders WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Reminder deleted' });
  } catch (err) {
    console.error('Error deleting reminder:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Audit History and Human-in-the-loop Approvals
router.get('/audit', (req, res) => {
  try {
    const logs = AuditService.getAuditLogs(100);
    const pending = AuditService.getPendingApprovals();
    res.json({
      success: true,
      count: logs.length,
      pendingCount: pending.length,
      pending,
      data: logs
    });
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/audit/:id/approve', (req, res) => {
  try {
    const { id } = req.params;
    const success = AuditService.updateApproval(id, 'APPROVED', { approvedBy: 'User (Manual Approval)', approvedAt: new Date().toISOString() });
    res.json({ success, message: 'Action approved successfully by user.' });
  } catch (err) {
    console.error('Error approving action:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/audit/:id/reject', (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Rejected by user' } = req.body;
    const success = AuditService.updateApproval(id, 'REJECTED', { rejectedBy: 'User', rejectedAt: new Date().toISOString(), reason });
    res.json({ success, message: 'Action rejected by user.' });
  } catch (err) {
    console.error('Error rejecting action:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. MCP Status
router.get('/mcp/status', async (req, res) => {
  try {
    await centralMcpClient.init();
    const servers = centralMcpClient.getServersStatus();
    const tools = centralMcpClient.getTools();
    res.json({
      success: true,
      servers,
      totalTools: tools.length,
      tools
    });
  } catch (err) {
    console.error('Error fetching MCP status:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
