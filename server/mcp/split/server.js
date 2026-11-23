const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');
const { db } = require('../../database/db');
const AuditService = require('../../services/auditService');

function createSplitMcpServer() {
  const server = new McpServer({
    name: 'upi-split-mcp-server',
    version: '1.0.0'
  });

  // Tool 1: split_bill
  server.tool(
    'split_bill',
    'Calculate an equal split of a bill among a specified number of friends or named people. Records the split group in the database and computes individual per-person shares.',
    {
      total_amount: z.number().positive().describe('Total bill amount in INR (e.g. 2000)'),
      num_people: z.number().int().positive().optional().describe('Number of people splitting the bill (e.g. 4)'),
      friends: z.array(z.object({
        name: z.string(),
        upi_id: z.string().optional()
      })).optional().describe('Optional list of friend names and UPI IDs'),
      title: z.string().optional().default('Dinner / Expense Split').describe('Description or title of the expense')
    },
    async ({ total_amount, num_people, friends, title = 'Dinner / Expense Split' }) => {
      let count = num_people;
      let participants = [];

      if (friends && friends.length > 0) {
        count = friends.length;
        participants = friends;
      } else {
        count = count || 2;
        // Default demo friend roster if names not provided
        const defaultNames = ['Aarav Sharma (You)', 'Rahul Verma', 'Priya Patel', 'Rohan Das', 'Ananya Iyer', 'Vikram Malhotra'];
        participants = Array.from({ length: count }, (_, i) => ({
          name: defaultNames[i] || `Friend ${i + 1}`,
          upi_id: i === 0 ? 'aarav.sharma@okaxis' : `${(defaultNames[i] || `friend${i + 1}`).toLowerCase().replace(/[^a-z0-9]/g, '')}@okupi`
        }));
      }

      const perPerson = Math.round((total_amount / count) * 100) / 100;
      const groupId = 'grp_' + Date.now().toString(36);
      const today = new Date().toISOString().split('T')[0];

      // Save to database
      const insertGroup = db.prepare(`
        INSERT INTO split_groups (id, title, total_amount, created_by, date, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      insertGroup.run(groupId, title, total_amount, 'Aarav Sharma', today, 'active');

      const insertItem = db.prepare(`
        INSERT INTO split_items (id, group_id, friend_name, friend_upi, amount, status, upi_link)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const items = participants.map((p, idx) => {
        const itemId = `item_${groupId}_${idx + 1}`;
        const isSelf = p.name.includes('(You)') || p.name.toLowerCase() === 'aarav sharma';
        const status = isSelf ? 'PAID' : 'PENDING';
        
        // Generate UPI intent URI for others to pay Aarav
        const encodedNote = encodeURIComponent(`${title} Share`);
        const upiUri = `upi://pay?pa=aarav.sharma@okaxis&pn=Aarav%20Sharma&am=${perPerson.toFixed(2)}&cu=INR&tn=${encodedNote}`;

        insertItem.run(itemId, groupId, p.name, p.upi_id || 'unknown@upi', perPerson, status, isSelf ? null : upiUri);

        return {
          id: itemId,
          name: p.name,
          upi_id: p.upi_id || 'unknown@upi',
          share_amount: perPerson,
          formatted_share: `₹${perPerson.toLocaleString('en-IN')}`,
          status,
          upi_link: isSelf ? null : upiUri
        };
      });

      const result = {
        group_id: groupId,
        title,
        total_amount,
        formatted_total: `₹${total_amount.toLocaleString('en-IN')}`,
        participants_count: count,
        per_person_share: perPerson,
        formatted_per_person: `₹${perPerson.toLocaleString('en-IN')}`,
        breakdown: items,
        summary: `Split ₹${total_amount.toLocaleString('en-IN')} equally among ${count} people: ₹${perPerson.toLocaleString('en-IN')} each.`
      };

      AuditService.logToolExecution({
        serverName: 'upi-split-mcp-server',
        toolName: 'split_bill',
        inputArguments: { total_amount, num_people, title },
        outputResult: { group_id: groupId, per_person: perPerson, count }
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  // Tool 2: calculate_custom_split
  server.tool(
    'calculate_custom_split',
    'Calculate and record custom (unequal or percentage-based) splits among friends with validation.',
    {
      total_amount: z.number().positive().describe('Total bill amount in INR'),
      title: z.string().optional().default('Custom Split'),
      splits: z.array(z.object({
        name: z.string(),
        share_amount: z.number().optional(),
        percentage: z.number().optional(),
        upi_id: z.string().optional()
      })).describe('List of friends and their respective amounts or percentage shares')
    },
    async ({ total_amount, title = 'Custom Split', splits }) => {
      let calculatedSplits = [];
      let calculatedTotal = 0;

      for (const s of splits) {
        let amount = 0;
        if (s.share_amount !== undefined) {
          amount = s.share_amount;
        } else if (s.percentage !== undefined) {
          amount = Math.round(((total_amount * s.percentage) / 100) * 100) / 100;
        }
        calculatedTotal += amount;
        calculatedSplits.push({
          ...s,
          amount
        });
      }

      // Check for discrepancies > 1 rupee due to rounding
      const difference = Math.abs(total_amount - calculatedTotal);
      if (difference > 1.0) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: 'CUSTOM_SPLIT_VALIDATION_FAILED',
              message: `The sum of custom shares (₹${calculatedTotal}) does not match the total bill amount (₹${total_amount}). Discrepancy: ₹${difference.toFixed(2)}`
            })
          }],
          isError: true
        };
      }

      const groupId = 'grp_custom_' + Date.now().toString(36);
      const today = new Date().toISOString().split('T')[0];

      db.prepare(`
        INSERT INTO split_groups (id, title, total_amount, created_by, date, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(groupId, title, total_amount, 'Aarav Sharma', today, 'active');

      const insertItem = db.prepare(`
        INSERT INTO split_items (id, group_id, friend_name, friend_upi, amount, status, upi_link)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const items = calculatedSplits.map((p, idx) => {
        const itemId = `item_${groupId}_${idx + 1}`;
        const isSelf = p.name.includes('(You)') || p.name.toLowerCase() === 'aarav sharma';
        const encodedNote = encodeURIComponent(`${title} Custom Split`);
        const upiUri = `upi://pay?pa=aarav.sharma@okaxis&pn=Aarav%20Sharma&am=${p.amount.toFixed(2)}&cu=INR&tn=${encodedNote}`;
        const status = isSelf ? 'PAID' : 'PENDING';

        insertItem.run(itemId, groupId, p.name, p.upi_id || 'unknown@upi', p.amount, status, isSelf ? null : upiUri);

        return {
          id: itemId,
          name: p.name,
          amount: p.amount,
          formatted_amount: `₹${p.amount.toLocaleString('en-IN')}`,
          status,
          upi_link: isSelf ? null : upiUri
        };
      });

      const result = {
        group_id: groupId,
        title,
        total_amount,
        formatted_total: `₹${total_amount.toLocaleString('en-IN')}`,
        participants_count: items.length,
        items
      };

      AuditService.logToolExecution({
        serverName: 'upi-split-mcp-server',
        toolName: 'calculate_custom_split',
        inputArguments: { total_amount, title, splits_count: splits.length },
        outputResult: { group_id: groupId, total_amount }
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  // Tool 3: generate_upi_payment_link
  server.tool(
    'generate_upi_payment_link',
    'Generate standard NPCI-compliant UPI Intent payment link (upi://pay?pa=...&pn=...&am=...&cu=INR). Human approval required before sharing or finalizing external payment requests.',
    {
      payee_upi: z.string().describe('Payee VPA / UPI ID (e.g., aarav.sharma@okaxis or merchant VPA)'),
      payee_name: z.string().describe('Payee legal name'),
      amount: z.number().positive().describe('Payment amount in INR'),
      note: z.string().optional().default('PaisaPilot Payment').describe('Transaction note or purpose'),
      transaction_ref: z.string().optional().describe('Optional unique merchant/bill reference ID'),
      request_approval: z.boolean().optional().default(true).describe('Flag indicating human-in-the-loop review requirement')
    },
    async ({ payee_upi, payee_name, amount, note = 'PaisaPilot Payment', transaction_ref, request_approval = true }) => {
      // Validate UPI ID format: username@bank
      const upiRegex = /^[\w.\-_]{2,256}@[a-zA-Z]{2,64}$/;
      const isValidUpi = upiRegex.test(payee_upi);

      const tr = transaction_ref || 'PP' + Date.now();
      const encodedNote = encodeURIComponent(note);
      const encodedName = encodeURIComponent(payee_name);
      const formattedAmount = amount.toFixed(2);

      // NPCI standard UPI URI format
      const upiUri = `upi://pay?pa=${payee_upi}&pn=${encodedName}&am=${formattedAmount}&cu=INR&tn=${encodedNote}&tr=${tr}`;
      
      // QR Code payload data
      const qrPayload = upiUri;

      const approvalDetails = {
        payee_upi,
        payee_name,
        amount,
        formatted_amount: `₹${amount.toLocaleString('en-IN')}`,
        note,
        transaction_ref: tr,
        intent_uri: upiUri,
        validation: isValidUpi ? 'VALID_VPA' : 'CUSTOM_OR_SIMULATED_VPA'
      };

      let auditId = null;
      if (request_approval) {
        auditId = AuditService.logToolExecution({
          serverName: 'upi-split-mcp-server',
          toolName: 'generate_upi_payment_link',
          inputArguments: { payee_upi, payee_name, amount, note, transaction_ref },
          outputResult: { upi_uri: upiUri, status: 'PENDING_HUMAN_APPROVAL' },
          requiresApproval: true,
          approvalStatus: 'PENDING',
          approvalDetails
        });
      }

      const result = {
        upi_intent_uri: upiUri,
        payee_name,
        payee_upi,
        amount,
        formatted_amount: `₹${amount.toLocaleString('en-IN')}`,
        currency: 'INR',
        transaction_note: note,
        transaction_ref: tr,
        qr_code_payload: qrPayload,
        requires_human_approval: request_approval,
        approval_id: auditId,
        approval_status: request_approval ? 'PENDING_REVIEW' : 'APPROVED',
        security_notice: 'Human-in-the-loop: Review payee details and amount before dispatching or opening UPI applications. Never share your UPI PIN.'
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  // Tool 4: get_split_status
  server.tool(
    'get_split_status',
    'Get current settlement status across group splits or a specific split group. Shows pending balances, who has paid, and who owes money.',
    {
      group_id: z.string().optional().describe('Optional specific group ID to query')
    },
    async ({ group_id }) => {
      let groupQuery = 'SELECT * FROM split_groups';
      const params = [];
      if (group_id) {
        groupQuery += ' WHERE id = ?';
        params.push(group_id);
      }
      groupQuery += ' ORDER BY created_at DESC';

      const groups = db.prepare(groupQuery).all(...params);

      const fullGroups = groups.map(g => {
        const items = db.prepare(`
          SELECT * FROM split_items WHERE group_id = ? ORDER BY status DESC
        `).all(g.id);

        let settledAmount = 0;
        let pendingAmount = 0;

        items.forEach(item => {
          if (item.status === 'PAID') settledAmount += item.amount;
          else pendingAmount += item.amount;
        });

        return {
          id: g.id,
          title: g.title,
          total_amount: g.total_amount,
          formatted_total: `₹${g.total_amount.toLocaleString('en-IN')}`,
          created_by: g.created_by,
          date: g.date,
          status: g.status,
          settled_amount: settledAmount,
          formatted_settled: `₹${settledAmount.toLocaleString('en-IN')}`,
          pending_amount: pendingAmount,
          formatted_pending: `₹${pendingAmount.toLocaleString('en-IN')}`,
          settlement_rate: g.total_amount > 0 ? Math.round((settledAmount / g.total_amount) * 100) : 0,
          members: items.map(i => ({
            id: i.id,
            name: i.friend_name,
            upi_id: i.friend_upi,
            amount: i.amount,
            formatted_amount: `₹${i.amount.toLocaleString('en-IN')}`,
            status: i.status,
            upi_link: i.upi_link,
            settled_at: i.settled_at
          }))
        };
      });

      const totalPendingOverall = fullGroups.reduce((sum, g) => sum + g.pending_amount, 0);
      const totalSettledOverall = fullGroups.reduce((sum, g) => sum + g.settled_amount, 0);

      const result = {
        total_groups: fullGroups.length,
        total_pending_all_groups: totalPendingOverall,
        formatted_pending_overall: `₹${totalPendingOverall.toLocaleString('en-IN')}`,
        total_settled_all_groups: totalSettledOverall,
        formatted_settled_overall: `₹${totalSettledOverall.toLocaleString('en-IN')}`,
        groups: fullGroups
      };

      AuditService.logToolExecution({
        serverName: 'upi-split-mcp-server',
        toolName: 'get_split_status',
        inputArguments: { group_id },
        outputResult: { groups_count: fullGroups.length, pending_overall: totalPendingOverall }
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  return server;
}

if (require.main === module) {
  const server = createSplitMcpServer();
  const transport = new StdioServerTransport();
  server.connect(transport).then(() => {
    console.error('UPI & Split MCP Server running over Stdio');
  }).catch((err) => {
    console.error('Failed to start UPI & Split MCP Server:', err);
    process.exit(1);
  });
}

module.exports = { createSplitMcpServer };
