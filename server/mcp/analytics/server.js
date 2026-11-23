const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');
const { db } = require('../../database/db');
const AuditService = require('../../services/auditService');

function createAnalyticsMcpServer() {
  const server = new McpServer({
    name: 'analytics-mcp-server',
    version: '1.0.0'
  });

  // Tool 1: analyze_spending
  server.tool(
    'analyze_spending',
    'Comprehensive spending analysis by category for a specific month (defaults to current month 2026-11). Calculates totals, percentages, daily burn rate, and top expense categories.',
    {
      month: z.string().optional().default('2026-11').describe('Month in YYYY-MM format'),
      include_income: z.boolean().optional().default(false).describe('Whether to include income summary in analysis')
    },
    async ({ month = '2026-11', include_income = false }) => {
      // Query debits for category breakdown
      const debitsStmt = db.prepare(`
        SELECT category, SUM(amount) as total_amount, COUNT(*) as tx_count
        FROM transactions
        WHERE type = 'DEBIT' AND date LIKE ?
        GROUP BY category
        ORDER BY total_amount DESC
      `);
      const debits = debitsStmt.all(`${month}%`);

      const totalSpent = debits.reduce((sum, d) => sum + d.total_amount, 0);

      // Income query if requested
      let totalIncome = 0;
      if (include_income) {
        const incomeStmt = db.prepare(`
          SELECT SUM(amount) as income
          FROM transactions
          WHERE type = 'CREDIT' AND date LIKE ?
        `);
        const res = incomeStmt.get(`${month}%`);
        totalIncome = res && res.income ? res.income : 0;
      }

      // Compute percentages and daily rate
      // Assuming 24 days elapsed if 2026-11, else 30
      const daysElapsed = month === '2026-11' ? 24 : 30;
      const dailyAverage = totalSpent > 0 ? Math.round(totalSpent / daysElapsed) : 0;

      const categoryBreakdown = debits.map(d => ({
        category: d.category,
        amount: d.total_amount,
        formatted_amount: `₹${d.total_amount.toLocaleString('en-IN')}`,
        percentage: totalSpent > 0 ? Math.round((d.total_amount / totalSpent) * 1000) / 10 : 0,
        transaction_count: d.tx_count
      }));

      const topCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;

      const result = {
        month,
        days_analyzed: daysElapsed,
        total_spending: totalSpent,
        formatted_total_spending: `₹${totalSpent.toLocaleString('en-IN')}`,
        daily_burn_rate: dailyAverage,
        formatted_daily_burn: `₹${dailyAverage.toLocaleString('en-IN')}/day`,
        top_category: topCategory ? topCategory.category : 'N/A',
        top_category_amount: topCategory ? topCategory.formatted_amount : '₹0',
        categories_count: categoryBreakdown.length,
        category_breakdown: categoryBreakdown,
        ...(include_income && {
          total_income: totalIncome,
          formatted_income: `₹${totalIncome.toLocaleString('en-IN')}`,
          net_savings: totalIncome - totalSpent,
          formatted_net_savings: `₹${(totalIncome - totalSpent).toLocaleString('en-IN')}`,
          savings_rate_pct: totalIncome > 0 ? Math.round(((totalIncome - totalSpent) / totalIncome) * 1000) / 10 : 0
        })
      };

      AuditService.logToolExecution({
        serverName: 'analytics-mcp-server',
        toolName: 'analyze_spending',
        inputArguments: { month, include_income },
        outputResult: { month, total_spending: totalSpent, top_category: result.top_category }
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  // Tool 2: compare_monthly_spending
  server.tool(
    'compare_monthly_spending',
    'Compare spending between two months (e.g., current month 2026-11 vs last month 2026-10), either overall or filtered for a specific category like Food & Dining or Shopping.',
    {
      category: z.string().optional().describe('Optional specific category to compare (e.g. Food & Dining, Shopping, Utilities)'),
      month_a: z.string().optional().default('2026-11').describe('Primary month (e.g., current month 2026-11)'),
      month_b: z.string().optional().default('2026-10').describe('Comparison month (e.g., previous month 2026-10)')
    },
    async ({ category, month_a = '2026-11', month_b = '2026-10' }) => {
      let queryA = `SELECT SUM(amount) as total, COUNT(*) as count FROM transactions WHERE type = 'DEBIT' AND date LIKE ?`;
      let queryB = `SELECT SUM(amount) as total, COUNT(*) as count FROM transactions WHERE type = 'DEBIT' AND date LIKE ?`;
      const paramsA = [`${month_a}%`];
      const paramsB = [`${month_b}%`];

      if (category) {
        queryA += ' AND category LIKE ?';
        queryB += ' AND category LIKE ?';
        paramsA.push(`%${category}%`);
        paramsB.push(`%${category}%`);
      }

      const resA = db.prepare(queryA).get(...paramsA);
      const resB = db.prepare(queryB).get(...paramsB);

      const totalA = (resA && resA.total) || 0;
      const countA = (resA && resA.count) || 0;
      const totalB = (resB && resB.total) || 0;
      const countB = (resB && resB.count) || 0;

      const diff = totalA - totalB;
      const pctChange = totalB > 0 ? Math.round(((totalA - totalB) / totalB) * 1000) / 10 : 0;
      const direction = diff > 0 ? 'increased' : diff < 0 ? 'decreased' : 'unchanged';

      // Also get detailed breakdown per merchant if category provided
      let merchantBreakdown = [];
      if (category) {
        const stmtM = db.prepare(`
          SELECT merchant, 
                 SUM(CASE WHEN date LIKE ? THEN amount ELSE 0 END) as spent_month_a,
                 SUM(CASE WHEN date LIKE ? THEN amount ELSE 0 END) as spent_month_b
          FROM transactions
          WHERE type = 'DEBIT' AND category LIKE ? AND (date LIKE ? OR date LIKE ?)
          GROUP BY merchant
          ORDER BY spent_month_a DESC
        `);
        merchantBreakdown = stmtM.all(`${month_a}%`, `${month_b}%`, `%${category}%`, `${month_a}%`, `${month_b}%`);
      }

      const result = {
        scope: category ? `Category: ${category}` : 'Overall Spending',
        month_a: {
          label: month_a,
          amount: totalA,
          formatted: `₹${totalA.toLocaleString('en-IN')}`,
          transaction_count: countA
        },
        month_b: {
          label: month_b,
          amount: totalB,
          formatted: `₹${totalB.toLocaleString('en-IN')}`,
          transaction_count: countB
        },
        difference: {
          amount: Math.abs(diff),
          formatted: `₹${Math.abs(diff).toLocaleString('en-IN')}`,
          direction,
          percentage_change: Math.abs(pctChange),
          summary: `${category || 'Spending'} in ${month_a} is ${direction} by ₹${Math.abs(diff).toLocaleString('en-IN')} (${Math.abs(pctChange)}%) compared to ${month_b}.`
        },
        merchant_breakdown: merchantBreakdown.map(m => ({
          merchant: m.merchant,
          [month_a]: `₹${m.spent_month_a.toLocaleString('en-IN')}`,
          [month_b]: `₹${m.spent_month_b.toLocaleString('en-IN')}`
        }))
      };

      AuditService.logToolExecution({
        serverName: 'analytics-mcp-server',
        toolName: 'compare_monthly_spending',
        inputArguments: { category, month_a, month_b },
        outputResult: { category, diff, direction, pctChange }
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  // Tool 3: detect_subscriptions
  server.tool(
    'detect_subscriptions',
    'Detect and list all recurring subscriptions, autopay mandates, and periodic charges (e.g., Netflix, Spotify, Gym, Broadband). Calculates monthly commitment and annual impact.',
    {
      status: z.enum(['active', 'all']).optional().default('active').describe('Filter active or all subscriptions')
    },
    async ({ status = 'active' }) => {
      let query = 'SELECT * FROM subscriptions';
      const params = [];
      if (status === 'active') {
        query += ' WHERE status = ?';
        params.push('active');
      }
      query += ' ORDER BY amount DESC';

      const subscriptions = db.prepare(query).all(...params);

      // Also check recurring transactions from transactions table
      const recurringTx = db.prepare(`
        SELECT merchant, category, payment_method, COUNT(*) as times_charged, AVG(amount) as avg_amount
        FROM transactions
        WHERE is_recurring = 1 AND type = 'DEBIT'
        GROUP BY merchant, category, payment_method
      `).all();

      // Normalize all to monthly impact
      let totalMonthly = 0;
      let totalAnnual = 0;

      const formattedSubs = subscriptions.map(s => {
        const monthlyCost = s.billing_cycle === 'yearly' ? Math.round(s.amount / 12) : s.amount;
        const annualCost = s.billing_cycle === 'yearly' ? s.amount : s.amount * 12;
        totalMonthly += monthlyCost;
        totalAnnual += annualCost;

        return {
          id: s.id,
          name: s.name,
          merchant: s.merchant,
          amount: s.amount,
          formatted_amount: `₹${s.amount.toLocaleString('en-IN')}`,
          billing_cycle: s.billing_cycle,
          monthly_equivalent: `₹${monthlyCost.toLocaleString('en-IN')}/month`,
          annual_equivalent: `₹${annualCost.toLocaleString('en-IN')}/year`,
          category: s.category,
          renewal_date: s.renewal_date,
          payment_method: s.payment_method,
          status: s.status
        };
      });

      const result = {
        total_subscriptions_count: subscriptions.length,
        total_monthly_burn: totalMonthly,
        formatted_monthly_burn: `₹${totalMonthly.toLocaleString('en-IN')}/month`,
        total_annual_burn: totalAnnual,
        formatted_annual_burn: `₹${totalAnnual.toLocaleString('en-IN')}/year`,
        active_subscriptions: formattedSubs,
        verified_recurring_history: recurringTx.map(r => ({
          merchant: r.merchant,
          category: r.category,
          occurrences: r.times_charged,
          avg_charge: `₹${Math.round(r.avg_amount).toLocaleString('en-IN')}`
        }))
      };

      AuditService.logToolExecution({
        serverName: 'analytics-mcp-server',
        toolName: 'detect_subscriptions',
        inputArguments: { status },
        outputResult: { count: subscriptions.length, total_monthly_burn: totalMonthly }
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  // Tool 4: predict_budget
  server.tool(
    'predict_budget',
    'Forecast spending for a budget category based on month-to-date pace. Determines if user is likely to exceed budget and predicts projected overspend.',
    {
      category: z.string().optional().describe('Category to inspect (e.g. Shopping, Food & Dining, Groceries). If omitted, evaluates all budgets.'),
      month: z.string().optional().default('2026-11').describe('Month in YYYY-MM format')
    },
    async ({ category, month = '2026-11' }) => {
      let budgetQuery = 'SELECT * FROM budgets WHERE month = ?';
      const budgetParams = [month];

      if (category) {
        budgetQuery += ' AND category LIKE ?';
        budgetParams.push(`%${category}%`);
      }

      const budgets = db.prepare(budgetQuery).all(...budgetParams);

      const daysInMonth = 30; // November
      const daysElapsed = month === '2026-11' ? 24 : 30;
      const daysRemaining = daysInMonth - daysElapsed;
      const pctMonthPassed = Math.round((daysElapsed / daysInMonth) * 100);

      const predictions = budgets.map(b => {
        // Query actual spent so far
        const spentRes = db.prepare(`
          SELECT SUM(amount) as spent
          FROM transactions
          WHERE type = 'DEBIT' AND category LIKE ? AND date LIKE ?
        `).get(`%${b.category}%`, `${month}%`);

        const spentSoFar = (spentRes && spentRes.spent) || 0;
        const dailyRate = daysElapsed > 0 ? spentSoFar / daysElapsed : 0;
        const projectedSpend = Math.round(spentSoFar + (dailyRate * daysRemaining));
        const projectedDiff = projectedSpend - b.monthly_limit;
        const utilizationPct = Math.round((spentSoFar / b.monthly_limit) * 1000) / 10;

        let riskLevel = 'LOW';
        let alertMessage = 'Spending is on track within budget.';
        if (spentSoFar > b.monthly_limit) {
          riskLevel = 'ALREADY_EXCEEDED';
          alertMessage = `Budget already exceeded by ₹${(spentSoFar - b.monthly_limit).toLocaleString('en-IN')}!`;
        } else if (projectedSpend > b.monthly_limit) {
          riskLevel = 'HIGH';
          alertMessage = `High risk! At current pace (₹${Math.round(dailyRate)}/day), projected to exceed limit by ₹${projectedDiff.toLocaleString('en-IN')}.`;
        } else if (utilizationPct > pctMonthPassed) {
          riskLevel = 'MODERATE';
          alertMessage = `Moderate risk: Spending pace (${utilizationPct}%) is ahead of time elapsed (${pctMonthPassed}%).`;
        }

        return {
          category: b.category,
          monthly_limit: b.monthly_limit,
          formatted_limit: `₹${b.monthly_limit.toLocaleString('en-IN')}`,
          spent_so_far: spentSoFar,
          formatted_spent: `₹${spentSoFar.toLocaleString('en-IN')}`,
          remaining_budget: Math.max(0, b.monthly_limit - spentSoFar),
          utilization_pct: utilizationPct,
          projected_end_of_month: projectedSpend,
          formatted_projected: `₹${projectedSpend.toLocaleString('en-IN')}`,
          projected_overspend: Math.max(0, projectedDiff),
          risk_level: riskLevel,
          alert: alertMessage
        };
      });

      const result = {
        month,
        days_elapsed: daysElapsed,
        days_remaining: daysRemaining,
        month_progress_pct: pctMonthPassed,
        analyzed_budgets_count: predictions.length,
        budgets: predictions
      };

      AuditService.logToolExecution({
        serverName: 'analytics-mcp-server',
        toolName: 'predict_budget',
        inputArguments: { category, month },
        outputResult: { category, evaluated_count: predictions.length }
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  // Tool 5: generate_savings_recommendations
  server.tool(
    'generate_savings_recommendations',
    'Generate actionable, pragmatic savings recommendations to hit a specific savings target (e.g. ₹5,000) by analyzing discretionary expenditures like food delivery, quick commerce, subscriptions, and non-essential shopping.',
    {
      target_savings_amount: z.number().optional().default(5000).describe('Target amount user wishes to save in INR'),
      month: z.string().optional().default('2026-11').describe('Reference month')
    },
    async ({ target_savings_amount = 5000, month = '2026-11' }) => {
      // Analyze discretionary buckets:
      // 1. Food Delivery (Swiggy, Zomato)
      const foodRes = db.prepare(`
        SELECT merchant, SUM(amount) as total, COUNT(*) as orders
        FROM transactions
        WHERE (merchant LIKE '%Swiggy%' OR merchant LIKE '%Zomato%') AND date LIKE ?
        GROUP BY merchant
      `).all(`${month}%`);
      const foodDeliveryTotal = foodRes.reduce((sum, r) => sum + r.total, 0);

      // 2. Shopping
      const shoppingRes = db.prepare(`
        SELECT SUM(amount) as total
        FROM transactions
        WHERE category = 'Shopping' AND date LIKE ?
      `).get(`${month}%`);
      const shoppingTotal = (shoppingRes && shoppingRes.total) || 0;

      // 3. Subscriptions
      const subRes = db.prepare(`SELECT SUM(amount) as total FROM subscriptions WHERE status = 'active'`).get();
      const subTotal = (subRes && subRes.total) || 0;

      const recommendations = [];
      let totalPotentialSavings = 0;

      // Recommendation 1: Food Delivery Optimization
      if (foodDeliveryTotal > 3000) {
        const potentialFoodCut = Math.min(2500, Math.round(foodDeliveryTotal * 0.4));
        recommendations.push({
          category: 'Food & Dining (Swiggy/Zomato)',
          current_spend: `₹${foodDeliveryTotal.toLocaleString('en-IN')}`,
          proposed_cut: `₹${potentialFoodCut.toLocaleString('en-IN')}`,
          action: `You ordered ${foodRes.map(f => `${f.orders} times on ${f.merchant}`).join(' and ')} this month. Preparing home-cooked meals 2-3 times per week or skipping mid-week midnight snacks will easily save ₹${potentialFoodCut.toLocaleString('en-IN')}.`
        });
        totalPotentialSavings += potentialFoodCut;
      }

      // Recommendation 2: Non-essential Shopping Cool-Off
      if (shoppingTotal > 8000) {
        const potentialShoppingCut = Math.min(2000, Math.round(shoppingTotal * 0.2));
        recommendations.push({
          category: 'Online Shopping (Amazon/Flipkart/Myntra)',
          current_spend: `₹${shoppingTotal.toLocaleString('en-IN')}`,
          proposed_cut: `₹${potentialShoppingCut.toLocaleString('en-IN')}`,
          action: `Implement a 48-hour cool-off rule before purchasing non-essential tech and apparel gadgets on Amazon and Flipkart. This typically curbs impulse buying by ₹${potentialShoppingCut.toLocaleString('en-IN')}.`
        });
        totalPotentialSavings += potentialShoppingCut;
      }

      // Recommendation 3: Subscriptions Audit
      if (subTotal > 2000) {
        recommendations.push({
          category: 'Digital Subscriptions',
          current_spend: `₹${subTotal.toLocaleString('en-IN')}/mo`,
          proposed_cut: '₹800',
          action: 'Audit active entertainment and fitness plans: pausing Cult.fit during busy work weeks or switching individual Spotify to a Family plan saves ~₹800/month.'
        });
        totalPotentialSavings += 800;
      }

      // Recommendation 4: Quick Commerce micro-orders (Blinkit/Zepto)
      const groceryRes = db.prepare(`
        SELECT SUM(amount) as total
        FROM transactions
        WHERE (merchant LIKE '%Blinkit%' OR merchant LIKE '%Zepto%') AND date LIKE ?
      `).get(`${month}%`);
      const qcTotal = (groceryRes && groceryRes.total) || 0;
      if (qcTotal > 3000) {
        recommendations.push({
          category: 'Quick Commerce (Blinkit/Zepto)',
          current_spend: `₹${qcTotal.toLocaleString('en-IN')}`,
          proposed_cut: '₹500',
          action: 'Consolidate small daily Blinkit/Zepto micro-orders into a planned weekly basket to eliminate surge handling and small cart delivery fees (~₹500 savings).'
        });
        totalPotentialSavings += 500;
      }

      const result = {
        target_savings_amount: target_savings_amount,
        formatted_target: `₹${target_savings_amount.toLocaleString('en-IN')}`,
        total_potential_savings: totalPotentialSavings,
        formatted_potential_savings: `₹${totalPotentialSavings.toLocaleString('en-IN')}`,
        is_target_achievable: totalPotentialSavings >= target_savings_amount,
        summary: totalPotentialSavings >= target_savings_amount
          ? `Great news! By making targeted discretionary adjustments across food delivery, online shopping, and subscription plans, you can save ₹${totalPotentialSavings.toLocaleString('en-IN')}, fully meeting your ₹${target_savings_amount.toLocaleString('en-IN')} goal.`
          : `We identified ₹${totalPotentialSavings.toLocaleString('en-IN')} in potential discretionary savings towards your ₹${target_savings_amount.toLocaleString('en-IN')} goal.`,
        action_plan: recommendations
      };

      AuditService.logToolExecution({
        serverName: 'analytics-mcp-server',
        toolName: 'generate_savings_recommendations',
        inputArguments: { target_savings_amount, month },
        outputResult: { target_savings_amount, total_potential_savings: totalPotentialSavings }
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  return server;
}

if (require.main === module) {
  const server = createAnalyticsMcpServer();
  const transport = new StdioServerTransport();
  server.connect(transport).then(() => {
    console.error('Analytics MCP Server running over Stdio');
  }).catch((err) => {
    console.error('Failed to start Analytics MCP Server:', err);
    process.exit(1);
  });
}

module.exports = { createAnalyticsMcpServer };
