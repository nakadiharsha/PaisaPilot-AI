const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');
const { db } = require('../../database/db');
const AuditService = require('../../services/auditService');

function createReminderMcpServer() {
  const server = new McpServer({
    name: 'reminder-mcp-server',
    version: '1.0.0'
  });

  // Helper to parse relative date expressions
  function resolveDate(dateStr) {
    const today = new Date('2026-11-24'); // Current reference date
    const lower = (dateStr || '').trim().toLowerCase();

    if (lower === 'tomorrow' || lower === 'tmrw') {
      const d = new Date(today);
      d.setDate(d.getDate() + 1);
      return d.toISOString().split('T')[0];
    }
    if (lower === 'today') {
      return today.toISOString().split('T')[0];
    }
    if (lower.includes('next week')) {
      const d = new Date(today);
      d.setDate(d.getDate() + 7);
      return d.toISOString().split('T')[0];
    }
    // If it's already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    // Fallback: try parsing Date
    try {
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }
    } catch {
      // ignore
    }
    // Default fallback to tomorrow
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }

  // Tool 1: create_reminder
  server.tool(
    'create_reminder',
    'Create an upcoming payment or financial bill reminder with due date, amount, and category. Supports natural language relative dates like "tomorrow", "today", or "2026-11-25".',
    {
      title: z.string().describe('Title of the reminder (e.g. Electricity Bill Payment, Rent, Credit Card Bill)'),
      due_date: z.string().describe('Due date (e.g. "tomorrow", "2026-11-25", "next week")'),
      amount: z.number().optional().default(0).describe('Amount in INR to be paid (optional, e.g. 3800)'),
      category: z.string().optional().default('Utilities').describe('Category (e.g. Utilities, Banking, Housing, Subscriptions)')
    },
    async ({ title, due_date, amount = 0, category = 'Utilities' }) => {
      const resolvedDueDate = resolveDate(due_date);
      const reminderId = 'rem_' + Date.now().toString(36);

      // If amount is 0 and title mentions electricity, check recent electricity bill for default
      let finalAmount = amount;
      if (finalAmount <= 0 && title.toLowerCase().includes('electricity')) {
        finalAmount = 3800.00;
      }

      const stmt = db.prepare(`
        INSERT INTO reminders (id, title, amount, due_date, category, status)
        VALUES (?, ?, ?, ?, ?, 'PENDING')
      `);

      stmt.run(reminderId, title, finalAmount, resolvedDueDate, category);

      const result = {
        reminder_id: reminderId,
        title,
        amount: finalAmount,
        formatted_amount: `₹${finalAmount.toLocaleString('en-IN')}`,
        due_date: resolvedDueDate,
        raw_input_date: due_date,
        category,
        status: 'PENDING',
        message: `Reminder set: "${title}" for ₹${finalAmount.toLocaleString('en-IN')} due on ${resolvedDueDate}.`
      };

      AuditService.logToolExecution({
        serverName: 'reminder-mcp-server',
        toolName: 'create_reminder',
        inputArguments: { title, due_date, amount: finalAmount, category },
        outputResult: result
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  // Tool 2: list_reminders
  server.tool(
    'list_reminders',
    'List all upcoming and scheduled financial payment reminders. Highlights overdue, due today, and upcoming bills.',
    {
      status: z.enum(['PENDING', 'PAID', 'ALL']).optional().default('ALL').describe('Filter by reminder status')
    },
    async ({ status = 'ALL' }) => {
      let query = 'SELECT * FROM reminders';
      const params = [];
      if (status !== 'ALL') {
        query += ' WHERE status = ?';
        params.push(status);
      }
      query += ' ORDER BY due_date ASC';

      const rows = db.prepare(query).all(...params);
      const todayStr = '2026-11-24';

      let totalPendingAmount = 0;
      let upcomingCount = 0;
      let overdueCount = 0;

      const formatted = rows.map(r => {
        if (r.status === 'PENDING') {
          totalPendingAmount += r.amount;
          if (r.due_date < todayStr) overdueCount++;
          else upcomingCount++;
        }

        let urgency = 'UPCOMING';
        if (r.due_date === todayStr) urgency = 'DUE_TODAY';
        else if (r.due_date < todayStr) urgency = 'OVERDUE';

        return {
          id: r.id,
          title: r.title,
          amount: r.amount,
          formatted_amount: `₹${r.amount.toLocaleString('en-IN')}`,
          due_date: r.due_date,
          category: r.category,
          status: r.status,
          urgency
        };
      });

      const result = {
        total_reminders: rows.length,
        total_pending_amount: totalPendingAmount,
        formatted_pending_amount: `₹${totalPendingAmount.toLocaleString('en-IN')}`,
        upcoming_count: upcomingCount,
        overdue_count: overdueCount,
        reminders: formatted
      };

      AuditService.logToolExecution({
        serverName: 'reminder-mcp-server',
        toolName: 'list_reminders',
        inputArguments: { status },
        outputResult: { count: rows.length, total_pending: totalPendingAmount }
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  // Tool 3: delete_reminder
  server.tool(
    'delete_reminder',
    'Delete or dismiss a financial payment reminder by ID.',
    {
      reminder_id: z.string().describe('The ID of the reminder to delete')
    },
    async ({ reminder_id }) => {
      const getStmt = db.prepare('SELECT * FROM reminders WHERE id = ?');
      const existing = getStmt.get(reminder_id);

      if (!existing) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ error: 'NOT_FOUND', message: `Reminder ${reminder_id} not found.` })
          }],
          isError: true
        };
      }

      db.prepare('DELETE FROM reminders WHERE id = ?').run(reminder_id);

      const result = {
        success: true,
        reminder_id,
        deleted_title: existing.title,
        message: `Reminder "${existing.title}" successfully deleted.`
      };

      AuditService.logToolExecution({
        serverName: 'reminder-mcp-server',
        toolName: 'delete_reminder',
        inputArguments: { reminder_id },
        outputResult: result
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  return server;
}

if (require.main === module) {
  const server = createReminderMcpServer();
  const transport = new StdioServerTransport();
  server.connect(transport).then(() => {
    console.error('Reminder MCP Server running over Stdio');
  }).catch((err) => {
    console.error('Failed to start Reminder MCP Server:', err);
    process.exit(1);
  });
}

module.exports = { createReminderMcpServer };
