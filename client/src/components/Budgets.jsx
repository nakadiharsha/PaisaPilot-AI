import React, { useState, useEffect } from 'react';
import { PieChart, Plus, AlertTriangle, CheckCircle, Edit2, TrendingUp, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export default function Budgets({ onAskPrompt }) {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ category: 'Food & Dining', monthly_limit: '' });

  const fetchBudgets = async () => {
    try {
      const res = await api.getBudgets();
      if (res.success) {
        setBudgets(res.data);
      }
    } catch (err) {
      console.error('Error fetching budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    if (!formData.monthly_limit || isNaN(formData.monthly_limit)) return;
    try {
      await api.saveBudget({
        category: formData.category,
        monthly_limit: parseFloat(formData.monthly_limit),
        month: '2026-11'
      });
      setShowModal(false);
      setFormData({ category: 'Food & Dining', monthly_limit: '' });
      fetchBudgets();
    } catch (err) {
      console.error('Error saving budget:', err);
    }
  };

  const totalLimit = budgets.reduce((sum, b) => sum + b.monthly_limit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const overallUtilization = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner & Summary */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400 mb-1">
            <PieChart className="w-4 h-4" />
            <span>Monthly Budget Guard • November 2026</span>
          </div>
          <h2 className="text-xl font-bold text-white">
            ₹{totalSpent.toLocaleString('en-IN')} <span className="text-slate-400 font-normal text-sm">spent of ₹{totalLimit.toLocaleString('en-IN')} allocated ({overallUtilization}%)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            24 of 30 days elapsed (80% of month passed).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onAskPrompt('Am I likely to exceed my shopping budget?')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pace Forecast</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Set Budget</span>
          </button>
        </div>
      </div>

      {/* Overspend Alert Highlight if Shopping >= 90% */}
      {budgets.some(b => b.status === 'WARNING' || b.status === 'EXCEEDED') && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-semibold text-amber-300">Budget Warning: High Spending Velocity Detected</p>
            <p className="text-slate-300 mt-0.5">
              Your <strong>Shopping</strong> budget has utilized ₹14,200 of ₹15,000 (94.7%) in 24 days. At this pace, you are projected to exceed the limit by ₹2,750 before the month ends.
            </p>
          </div>
        </div>
      )}

      {/* Budget Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {budgets.map((b) => {
          const isWarning = b.status === 'WARNING';
          const isExceeded = b.status === 'EXCEEDED';

          let barColor = 'bg-indigo-500';
          if (isExceeded) barColor = 'bg-rose-500';
          else if (isWarning) barColor = 'bg-amber-400';
          else barColor = 'bg-emerald-400';

          return (
            <div key={b.id} className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-100 text-sm">{b.category}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isExceeded ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                    isWarning ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {b.status === 'EXCEEDED' ? 'Exceeded' : b.status === 'WARNING' ? 'Near Limit' : 'On Track'}
                  </span>
                </div>

                <div className="flex items-baseline justify-between mt-3 mb-1.5">
                  <span className="text-xl font-bold text-white">₹{b.spent.toLocaleString('en-IN')}</span>
                  <span className="text-xs text-slate-400">of ₹{b.monthly_limit.toLocaleString('en-IN')}</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${Math.min(100, b.utilization)}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{b.utilization}% utilized</span>
                  <span>
                    {isExceeded 
                      ? `Over by ₹${b.overspent.toLocaleString('en-IN')}` 
                      : `₹${b.remaining.toLocaleString('en-IN')} left`}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">Nov 2026</span>
                <button
                  onClick={() => {
                    setFormData({ category: b.category, monthly_limit: b.monthly_limit });
                    setShowModal(true);
                  }}
                  className="text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit Limit</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Set/Edit Budget Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Set Category Budget</h3>
            <p className="text-xs text-slate-400 mb-4">Define monthly spending limit for November 2026</p>

            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="Food & Dining">Food & Dining</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Groceries">Groceries</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Travel & Commute">Travel & Commute</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Health & Fitness">Health & Fitness</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Monthly Limit (INR ₹)</label>
                <input
                  type="number"
                  required
                  min="500"
                  step="500"
                  value={formData.monthly_limit}
                  onChange={(e) => setFormData({ ...formData, monthly_limit: e.target.value })}
                  placeholder="e.g. 15000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow"
                >
                  Save Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
