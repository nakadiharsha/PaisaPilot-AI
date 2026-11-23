import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  Cell 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Repeat, 
  AlertCircle, 
  CheckCircle, 
  ShoppingBag, 
  Tv, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';

const COLORS = ['#8b5cf6', '#ec4899', '#6366f1', '#10b981', '#f59e0b', '#06b6d4', '#14b8a6', '#a855f7'];

export default function Analytics({ onAskPrompt }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getAnalytics();
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Error loading analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-400">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm">Calculating spending intelligence...</p>
        </div>
      </div>
    );
  }

  const {
    totalExpense,
    categoryBreakdown = [],
    merchantBreakdown = [],
    comparison = [],
    subscriptions = [],
    budgets = []
  } = data;

  const totalMonthlySubscriptions = subscriptions.reduce((sum, s) => {
    return sum + (s.billing_cycle === 'yearly' ? Math.round(s.amount / 12) : s.amount);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Top AI Insights Banner */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900/50 border border-indigo-500/30 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2 text-indigo-300 font-semibold text-xs uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>AI Spending Intelligence • Analytics MCP Server</span>
        </div>
        <p className="text-sm text-slate-200">
          In November 2026, your food delivery and dining out expenses decreased by <strong className="text-emerald-400">34.0%</strong> compared to October, but online shopping on Amazon & Flipkart is pacing ahead of schedule at <strong className="text-amber-400">94.7%</strong> utilization.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => onAskPrompt('Am I likely to exceed my shopping budget?')}
            className="text-xs px-3 py-1 rounded-xl bg-slate-800/80 hover:bg-purple-600/20 text-slate-300 hover:text-white border border-slate-700 transition"
          >
            Check Shopping Budget Pace →
          </button>
          <button
            onClick={() => onAskPrompt('Help me save ₹5,000 this month.')}
            className="text-xs px-3 py-1 rounded-xl bg-slate-800/80 hover:bg-purple-600/20 text-slate-300 hover:text-white border border-slate-700 transition"
          >
            Generate ₹5,000 Savings Plan →
          </button>
        </div>
      </div>

      {/* Grid: Category Bar Chart & Month-over-Month Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Chart */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">November Category Spending</h3>
              <p className="text-xs text-slate-400">Total recorded expenses: ₹{totalExpense.toLocaleString('en-IN')}</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBreakdown} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                <XAxis type="number" stroke="#64748b" fontSize={10} tickFormatter={v => `₹${v/1000}k`} />
                <YAxis dataKey="category" type="category" stroke="#94a3b8" fontSize={11} width={100} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Amount']}
                />
                <Bar dataKey="total" radius={[0, 8, 8, 0]}>
                  {categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Month-over-Month Comparison */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Month-over-Month Comparison</h3>
                <p className="text-xs text-slate-400">November 2026 vs October 2026</p>
              </div>
              <button
                onClick={() => onAskPrompt('Compare my food expenses with last month.')}
                className="text-xs text-purple-400 hover:text-purple-300 font-medium"
              >
                Deep Compare →
              </button>
            </div>

            <div className="space-y-3">
              {comparison.slice(0, 5).map((comp, idx) => {
                const isDecreased = comp.diff < 0;
                return (
                  <div key={idx} className="p-3 rounded-xl bg-slate-850/60 border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-200">{comp.category}</p>
                      <p className="text-[11px] text-slate-400">
                        Nov: ₹{comp.current_month.toLocaleString('en-IN')} vs Oct: ₹{comp.last_month.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`flex items-center gap-1 text-xs font-bold ${isDecreased ? 'text-emerald-400' : 'text-pink-400'}`}>
                        {isDecreased ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                        <span>{isDecreased ? '-' : '+'}₹{Math.abs(comp.diff).toLocaleString('en-IN')}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {isDecreased ? 'Saved' : 'Increased'} {Math.abs(comp.pctChange)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Subscriptions Detector & Merchant Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recurring Subscriptions Detector */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Repeat className="w-4 h-4 text-purple-400" />
              <div>
                <h3 className="text-sm font-semibold text-white">Recurring Subscriptions</h3>
                <p className="text-xs text-slate-400">Active autopay & subscription mandates</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-purple-300">₹{totalMonthlySubscriptions.toLocaleString('en-IN')}/mo</span>
              <p className="text-[10px] text-slate-400">₹{(totalMonthlySubscriptions * 12).toLocaleString('en-IN')}/year</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="p-3 rounded-xl bg-slate-850/50 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center font-bold text-xs">
                    {sub.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200">{sub.name}</p>
                    <p className="text-[10px] text-slate-400">{sub.payment_method} • Next: {sub.renewal_date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-200">₹{sub.amount.toLocaleString('en-IN')}</span>
                  <span className="text-[10px] text-slate-400 block capitalize">{sub.billing_cycle}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Merchant Breakdown */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-blue-400" />
              <div>
                <h3 className="text-sm font-semibold text-white">Top Merchants (Nov 2026)</h3>
                <p className="text-xs text-slate-400">Where your money goes the most</p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-800/80">
            {merchantBreakdown.map((m, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-slate-400 font-mono text-[11px] w-4">{idx + 1}</span>
                  <span className="font-semibold text-slate-200">{m.merchant}</span>
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                    {m.count} {m.count === 1 ? 'order' : 'orders'}
                  </span>
                </div>
                <span className="font-bold text-slate-200">₹{m.total.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
