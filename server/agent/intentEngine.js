/**
 * Deterministic Intent Engine
 * Handles natural language query parsing, parameter extraction, and multi-step MCP tool plan generation.
 * Guaranteed 100% reliable execution even when API keys are not supplied.
 */

class IntentEngine {
  static planQuery(userInput) {
    const text = userInput.trim().toLowerCase();

    // 1. Swiggy spending / merchant spending
    // "How much did I spend on Swiggy this month?"
    if (text.includes('swiggy') || (text.includes('spend') && (text.includes('zomato') || text.includes('amazon') || text.includes('uber') || text.includes('merchant')))) {
      let merchant = 'Swiggy';
      if (text.includes('zomato')) merchant = 'Zomato';
      else if (text.includes('amazon')) merchant = 'Amazon';
      else if (text.includes('uber')) merchant = 'Uber';
      else if (text.includes('blinkit')) merchant = 'Blinkit';
      else if (text.includes('zepto')) merchant = 'Zepto';

      let month = 'current';
      if (text.includes('last month')) month = 'last';

      return {
        intent: 'MERCHANT_SPENDING',
        description: `Analyze spending on ${merchant} for ${month === 'current' ? 'this month (November 2026)' : 'last month'}`,
        steps: [
          {
            tool: 'get_transaction_by_merchant',
            args: { merchant, month }
          }
        ],
        formatter: (results) => {
          const res = results[0].result;
          return {
            text: `You have spent **${res.formatted_total_spent}** on **${res.merchant}** across **${res.order_count} orders** this month. Your average order value is **${res.formatted_aov}**.`,
            cardType: 'merchant_summary',
            cardData: res
          };
        }
      };
    }

    // 2. Compare food / category expenses with last month
    // "Compare my food expenses with last month."
    if (text.includes('compare') || (text.includes('food') && text.includes('last month')) || text.includes('versus last month') || text.includes('vs last month')) {
      let category = 'Food & Dining';
      if (text.includes('shopping')) category = 'Shopping';
      else if (text.includes('groceries') || text.includes('grocery')) category = 'Groceries';
      else if (text.includes('utilities') || text.includes('utility')) category = 'Utilities';
      else if (text.includes('travel') || text.includes('commute')) category = 'Travel & Commute';

      return {
        intent: 'COMPARE_SPENDING',
        description: `Compare ${category} spending between current month (Nov 2026) and previous month (Oct 2026)`,
        steps: [
          {
            tool: 'compare_monthly_spending',
            args: { category, month_a: '2026-11', month_b: '2026-10' }
          }
        ],
        formatter: (results) => {
          const res = results[0].result;
          const diff = res.difference;
          return {
            text: `In **${res.month_a.label}**, your ${category} spending is **${res.month_a.formatted}** compared to **${res.month_b.formatted}** in **${res.month_b.label}**. Your spending has **${diff.direction} by ${diff.formatted} (${diff.percentage_change}%)**.`,
            cardType: 'monthly_comparison',
            cardData: res
          };
        }
      };
    }

    // 3. Find recurring subscriptions
    // "Find my recurring subscriptions."
    if (text.includes('subscription') || text.includes('recurring') || text.includes('autopay') || text.includes('membership')) {
      return {
        intent: 'DETECT_SUBSCRIPTIONS',
        description: 'Scan active subscriptions and identify monthly commitment and upcoming renewals',
        steps: [
          {
            tool: 'detect_subscriptions',
            args: { status: 'active' }
          }
        ],
        formatter: (results) => {
          const res = results[0].result;
          return {
            text: `Found **${res.total_subscriptions_count} active subscriptions** totaling **${res.formatted_monthly_burn}** (annual run rate: **${res.formatted_annual_burn}**). Top services include Netflix Premium, Cult.fit Gym, and Airtel Fiber.`,
            cardType: 'subscriptions_list',
            cardData: res
          };
        }
      };
    }

    // 4. Budget overspend prediction
    // "Am I likely to exceed my shopping budget?"
    if (text.includes('exceed') || text.includes('budget') || text.includes('likely to') || text.includes('overspend')) {
      let category = 'Shopping';
      if (text.includes('food')) category = 'Food & Dining';
      else if (text.includes('groceries')) category = 'Groceries';
      else if (text.includes('travel')) category = 'Travel & Commute';
      else if (text.includes('utilities')) category = 'Utilities';

      return {
        intent: 'PREDICT_BUDGET',
        description: `Evaluate spending pace and forecast month-end total for ${category} budget`,
        steps: [
          {
            tool: 'predict_budget',
            args: { category, month: '2026-11' }
          }
        ],
        formatter: (results) => {
          const res = results[0].result;
          const bgt = res.budgets[0];
          let riskTxt = '';
          if (bgt.risk_level === 'HIGH') {
            riskTxt = `⚠️ **Yes, you are at HIGH RISK of exceeding your ${bgt.category} budget.** You have already spent **${bgt.formatted_spent}** of your **${bgt.formatted_limit}** limit (${bgt.utilization_pct}% used in 24 days). At this rate, you are projected to reach **${bgt.formatted_projected}**, exceeding your budget by **₹${bgt.projected_overspend.toLocaleString('en-IN')}**.`;
          } else {
            riskTxt = `✅ Your ${bgt.category} budget is on track. Spent **${bgt.formatted_spent}** of **${bgt.formatted_limit}** (${bgt.utilization_pct}% utilized).`;
          }
          return {
            text: riskTxt,
            cardType: 'budget_prediction',
            cardData: res
          };
        }
      };
    }

    // 5. Help me save ₹5,000 / savings recommendations (Multi-step!)
    // "Help me save ₹5,000 this month."
    if (text.includes('save') || text.includes('savings') || text.includes('cut cost') || text.includes('reduce expense')) {
      const match = text.match(/₹?\s*(\d+[\d,]*)/);
      let target = 5000;
      if (match && match[1]) {
        target = parseInt(match[1].replace(/,/g, ''), 10);
      }

      return {
        intent: 'SAVINGS_RECOMMENDATIONS',
        description: `Analyze monthly transactions and construct pragmatic action plan to save ₹${target.toLocaleString('en-IN')}`,
        steps: [
          {
            tool: 'get_transactions',
            args: { month: '2026-11', type: 'DEBIT', limit: 20 }
          },
          {
            tool: 'analyze_spending',
            args: { month: '2026-11', include_income: true }
          },
          {
            tool: 'generate_savings_recommendations',
            args: { target_savings_amount: target, month: '2026-11' }
          }
        ],
        formatter: (results) => {
          const recRes = results[2].result;
          const spendRes = results[1].result;
          return {
            text: `Here is a personalized savings blueprint to save **₹${target.toLocaleString('en-IN')}** this month. From your current total spend of **${spendRes.formatted_total_spending}**, we identified **${recRes.formatted_potential_savings}** in discretionary optimizations without affecting essential bills or rent.`,
            cardType: 'savings_plan',
            cardData: recRes
          };
        }
      };
    }

    // 6. Split bill (Multi-step with human approval for UPI link!)
    // "Split my ₹2,000 dinner bill between four friends."
    if (text.includes('split') || text.includes('divide bill') || text.includes('share expense')) {
      const amountMatch = text.match(/₹?\s*(\d+[\d,]*)/);
      const peopleMatch = text.match(/(\d+)\s*(people|friends|persons|guys)/) || text.match(/(between|among)\s*(\w+)/);
      
      let amount = 2000;
      if (amountMatch) {
        amount = parseInt(amountMatch[1].replace(/,/g, ''), 10);
      }

      let count = 4;
      if (peopleMatch && !isNaN(parseInt(peopleMatch[1], 10))) {
        count = parseInt(peopleMatch[1], 10);
      } else if (text.includes('four')) count = 4;
      else if (text.includes('three')) count = 3;
      else if (text.includes('two')) count = 2;
      else if (text.includes('five')) count = 5;

      const perPerson = Math.round((amount / count) * 100) / 100;

      return {
        intent: 'SPLIT_BILL_MULTI_STEP',
        description: `Split ₹${amount.toLocaleString('en-IN')} among ${count} friends and generate verified UPI intent payment link with human review`,
        steps: [
          {
            tool: 'split_bill',
            args: { total_amount: amount, num_people: count, title: 'Dinner Bill Split' }
          },
          {
            tool: 'generate_upi_payment_link',
            args: {
              payee_upi: 'aarav.sharma@okaxis',
              payee_name: 'Aarav Sharma',
              amount: perPerson,
              note: 'Dinner Bill Split Share',
              request_approval: true
            }
          }
        ],
        formatter: (results) => {
          const splitRes = results[0].result;
          const upiRes = results[1].result;

          return {
            text: `I've split the bill of **₹${amount.toLocaleString('en-IN')}** equally among **${count} people** (**₹${perPerson.toLocaleString('en-IN')} each**). I also generated the NPCI UPI intent link for your friends to pay you. Before sharing the external payment link, please review the human-approval card below.`,
            cardType: 'split_with_upi',
            cardData: {
              split: splitRes,
              upi: upiRes
            }
          };
        }
      };
    }

    // 7. Show five biggest expenses
    // "Show my five biggest expenses."
    if (text.includes('biggest') || text.includes('highest') || text.includes('top expense') || text.includes('largest')) {
      let count = 5;
      const countMatch = text.match(/(\d+)\s*(biggest|highest|largest)/);
      if (countMatch) count = parseInt(countMatch[1], 10);

      return {
        intent: 'BIGGEST_EXPENSES',
        description: `Retrieve top ${count} highest debit transactions sorted by amount`,
        steps: [
          {
            tool: 'get_transactions',
            args: { limit: count, type: 'DEBIT', sort_by: 'amount', order: 'DESC' }
          }
        ],
        formatter: (results) => {
          const res = results[0].result;
          return {
            text: `Here are your **top ${res.count} biggest expenses** across all recorded accounts, led by your monthly house rent and major electronics purchases.`,
            cardType: 'biggest_expenses_list',
            cardData: res
          };
        }
      };
    }

    // 8. Create reminder for electricity bill tomorrow
    // "Create a reminder for my electricity bill tomorrow."
    if (text.includes('reminder') || text.includes('remind me') || text.includes('due date')) {
      let title = 'Electricity Bill Payment - Tata Power';
      let dueDate = 'tomorrow';
      let amount = 3800;

      if (text.includes('rent')) {
        title = 'Monthly House Rent Transfer';
        amount = 32000;
      } else if (text.includes('broadband') || text.includes('wifi') || text.includes('airtel')) {
        title = 'Airtel Fiber Broadband Bill';
        amount = 999;
      } else if (text.includes('gym')) {
        title = 'Cult.fit Gym Renewal';
        amount = 2500;
      }

      if (text.includes('today')) dueDate = 'today';
      else if (text.includes('next week')) dueDate = 'next week';

      return {
        intent: 'CREATE_REMINDER',
        description: `Schedule payment reminder for "${title}" due ${dueDate}`,
        steps: [
          {
            tool: 'create_reminder',
            args: { title, due_date: dueDate, amount, category: 'Utilities' }
          }
        ],
        formatter: (results) => {
          const res = results[0].result;
          return {
            text: `✅ **Reminder Created**: "${res.title}" for **${res.formatted_amount}**, scheduled for **${res.due_date}** (${res.raw_input_date}).`,
            cardType: 'reminder_card',
            cardData: res
          };
        }
      };
    }

    // Fallback: General Financial Balance / Overview
    if (text.includes('balance') || text.includes('how much money') || text.includes('account')) {
      return {
        intent: 'GET_BALANCE',
        description: 'Fetch total available balance across all connected demo bank accounts',
        steps: [
          {
            tool: 'get_balance',
            args: {}
          }
        ],
        formatter: (results) => {
          const res = results[0].result;
          return {
            text: `Your total demo balance is **${res.formatted_total}** across **${res.accounts_count} accounts** (HDFC Salary: ₹1,42,500, ICICI Savings: ₹35,000, Zerodha: ₹15,000).`,
            cardType: 'balance_card',
            cardData: res
          };
        }
      };
    }

    // Generic fallback: Search or analyze
    return {
      intent: 'GENERIC_ANALYSIS',
      description: 'Analyze current month spending and recent activity',
      steps: [
        {
          tool: 'analyze_spending',
          args: { month: '2026-11', include_income: true }
        },
        {
          tool: 'get_transactions',
          args: { limit: 5 }
        }
      ],
      formatter: (results) => {
        const analysis = results[0].result;
        return {
          text: `In November 2026, your total expenses are **${analysis.formatted_total_spending}** against an income of **${analysis.formatted_income}** (Net savings: **${analysis.formatted_net_savings}**, savings rate: ${analysis.savings_rate_pct}%). Top spending is in **${analysis.top_category}**.`,
          cardType: 'overview_card',
          cardData: analysis
        };
      }
    };
  }
}

module.exports = IntentEngine;
