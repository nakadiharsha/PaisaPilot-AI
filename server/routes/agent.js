const express = require('express');
const router = express.Router();
const orchestrator = require('../agent/orchestrator');

// AI Copilot Query execution
router.post('/chat', async (req, res) => {
  try {
    const { message, sessionId = 'session_default' } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: 'Query message is required' });
    }

    const response = await orchestrator.processQuery({ message, sessionId });
    res.json(response);
  } catch (err) {
    console.error('Agent chat error:', err);
    res.status(500).json({
      success: false,
      error: err.message,
      text: 'Sorry, I encountered an error while coordinating with the MCP servers.'
    });
  }
});

// Suggested prompt commands
router.get('/suggested', (req, res) => {
  res.json({
    success: true,
    commands: [
      {
        title: 'Swiggy Spending',
        prompt: 'How much did I spend on Swiggy this month?',
        category: 'Banking MCP',
        icon: 'ShoppingBag'
      },
      {
        title: 'Compare Food Expenses',
        prompt: 'Compare my food expenses with last month.',
        category: 'Analytics MCP',
        icon: 'ArrowUpDown'
      },
      {
        title: 'Recurring Subscriptions',
        prompt: 'Find my recurring subscriptions.',
        category: 'Analytics MCP',
        icon: 'Repeat'
      },
      {
        title: 'Budget Overspend Check',
        prompt: 'Am I likely to exceed my shopping budget?',
        category: 'Analytics MCP',
        icon: 'AlertTriangle'
      },
      {
        title: 'Save ₹5,000 Target',
        prompt: 'Help me save ₹5,000 this month.',
        category: 'Multi-Step MCP',
        icon: 'PiggyBank'
      },
      {
        title: 'Split Dinner Bill',
        prompt: 'Split my ₹2,000 dinner bill between four friends.',
        category: 'UPI & Split MCP',
        icon: 'Users'
      },
      {
        title: 'Top 5 Biggest Expenses',
        prompt: 'Show my five biggest expenses.',
        category: 'Banking MCP',
        icon: 'TrendingUp'
      },
      {
        title: 'Electricity Bill Reminder',
        prompt: 'Create a reminder for my electricity bill tomorrow.',
        category: 'Reminder MCP',
        icon: 'Bell'
      }
    ]
  });
});

module.exports = router;
