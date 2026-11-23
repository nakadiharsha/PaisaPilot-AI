import React from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  PiggyBank, 
  TrendingUp, 
  Calendar, 
  Bell, 
  ShoppingBag, 
  Utensils, 
  Zap, 
  ArrowRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar
} from 'recharts';

const CATEGORY_COLORS = {
  'Housing': '#6366f1',
  'Food & Dining': '#ec4899',
  'Shopping': '#8b5cf6',
  'Groceries': '#10b981',
  'Utilities': '#f59e0b',
  'Travel & Commute': '#06b6d4',
  'Health & Fitness': '#14b8a6',
  'Entertainment': '#a855f7',
  'Salary': '#22c55e',
  'Investment': '#3b82f6'
};

export default function Overview({ data, setActiveTab, onAskPrompt }) {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-400">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm">Loading financial intelligence...</p>
        </div>
      </div>
    );
  }

  const {
    totalBalance,
    formattedTotalBalance,
    accounts = [],
    monthlyIncome,
    formattedIncome,
    monthlyExpenses,
    formattedExpenses,
    netSavings,
    formattedSavings,
    savingsRate,
    categoryBreakdown = [],
    trend = [],
    recentTransactions = [],
    upcomingReminders = []
  } = data;

  const quickPrompts = [
    'How much did I spend on Swiggy this month?',
    'Compare my food expenses with last month.',
    'Am I likely to exceed my shopping budget?',
    'Help me save ₹5,000 this month.'
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner: Synthetic Financial Simulation Notice */}
      <div className="bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-slate-900/40 border border-purple-500/20 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Welcome back, Aarav! November 2026 Financial Digest</h2>
            <p className="text-xs text-slate-400">
              Your automated personal finance copilot is active with 4 connected MCP servers and full audit tracking.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('copilot')}
            className="px-3.5 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 text-xs font-medium transition"
          >
            Launch Copilot
          </button>
        </div>
      </div>

      {/* 4 Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Available Balance */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Demo Balance</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{formattedTotalBalance}</div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
            <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> Healthy
            </span>
            <span>across 3 bank accounts</span>
          </div>
        </div>

        {/* Monthly Income */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">November Income</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">{formattedIncome}</div>
          <div className="mt-3 text-[11px] text-slate-400">
            <span>TechCorp India Ltd (Salary)</span>
          </div>
        </div>

        {/* Monthly Expenses */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">November Expenses</span>
            <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-200 tracking-tight">{formattedExpenses}</div>
          <div className="mt-3 text-[11px] text-slate-400">
            <span>24 days elapsed (₹{Math.round(monthlyExpenses / 24).toLocaleString('en-IN')}/day)</span>
          </div>
        </div>

        {/* Net Savings & Rate */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Net Savings</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-300 tracking-tight">{formattedSavings}</div>
          <div className="mt-3 flex items-center gap-2 text-[11px]">
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
              {savingsRate}% rate
            </span>
            <span className="text-slate-400">of salary saved</span>
          </div>
        </div>
      </div>

      {/* Suggested Natural Language AI Questions */}
      <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800">
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Ask PaisaPilot Copilot in Natural Language:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => onAskPrompt(prompt)}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-purple-600/20 hover:border-purple-500/40 border border-slate-700/60 text-slate-300 hover:text-white transition text-left flex items-center gap-1.5"
            >
              <span>"{prompt}"</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </button>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending Trend Area Chart (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Monthly Cash Flow Trend</h3>
              <p className="text-xs text-slate-400">Income vs Expenses over the last 3 months</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span className="text-slate-400">Income</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                <span className="text-slate-400">Expenses</span>
              </div>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={v => `₹${v/1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, '']}
                />
                <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#incomeGrad)" name="Income" />
                <Area type="monotone" dataKey="expenses" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#expenseGrad)" name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Chart (1 col) */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Expense Categories</h3>
              <span className="text-xs text-slate-400">Nov 2026</span>
            </div>

            <div className="h-44 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.category] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                    formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Amount']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Categories Pills */}
          <div className="space-y-1.5 mt-2">
            {categoryBreakdown.slice(0, 4).map((c, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[c.category] || '#94a3b8' }}></span>
                  <span className="text-slate-300 truncate max-w-[120px]">{c.category}</span>
                </div>
                <span className="font-semibold text-slate-200">₹{c.total.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Transactions & Upcoming Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Recent Transactions</h3>
              <p className="text-xs text-slate-400">Latest activity across demo bank accounts</p>
            </div>
            <button
              onClick={() => setActiveTab('transactions')}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-slate-800/80">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between hover:bg-slate-850/30 px-2 rounded-xl transition">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${
                    tx.type === 'CREDIT' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {tx.merchant.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200">{tx.merchant}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span>{tx.date}</span>
                      <span>•</span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">{tx.category}</span>
                      <span>•</span>
                      <span>{tx.payment_method}</span>
                    </div>
                  </div>
                </div>
                <div className={`text-xs font-bold ${tx.type === 'CREDIT' ? 'text-emerald-400' : 'text-slate-200'}`}>
                  {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Bill Reminders (1 col) */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Upcoming Bills</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Active
              </span>
            </div>

            <div className="space-y-3">
              {upcomingReminders.map((rem) => {
                const isTomorrow = rem.due_date === '2026-11-25';
                return (
                  <div key={rem.id} className="p-3 rounded-xl bg-slate-850/60 border border-slate-800 hover:border-slate-700 transition">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-200 truncate">{rem.title}</span>
                      <span className="text-xs font-bold text-slate-100">₹{rem.amount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">{rem.due_date}</span>
                      {isTomorrow ? (
                        <span className="text-[10px] font-semibold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                          Due Tomorrow
                        </span>
                      ) : (
                        <span className="text-slate-400">{rem.category}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Powered by Reminder MCP</span>
            <button
              onClick={() => onAskPrompt('Create a reminder for my electricity bill tomorrow.')}
              className="text-purple-400 hover:text-purple-300 font-medium"
            >
              + Add Bill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
