import React from 'react';
import { Bot, Plus, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenAddTx, onRefresh, isRefreshing, balance }) {
  const titles = {
    overview: 'Financial Overview',
    transactions: 'Transaction Ledger',
    analytics: 'Spending Intelligence & Analytics',
    budgets: 'Monthly Budgets & Pace',
    split: 'Group Split & UPI Intent Links',
    copilot: 'PaisaPilot AI Copilot',
    audit: 'Activity Audit Log & Approvals'
  };

  return (
    <header className="h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-8 flex items-center justify-between shrink-0 sticky top-0 z-20">
      {/* Title & Section indicator */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-white tracking-tight">
          {titles[activeTab] || 'Dashboard'}
        </h1>
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>Simulated Data (INR ₹)</span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Quick Balance display */}
        {balance && (
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Demo Balance</span>
            <span className="text-sm font-bold text-slate-200">{balance}</span>
          </div>
        )}

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh Data"
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-purple-400' : ''}`} />
        </button>

        {/* Add Transaction Button */}
        <button
          onClick={onOpenAddTx}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Add Expense</span>
        </button>

        {/* Copilot Shortcut Button */}
        <button
          onClick={() => setActiveTab('copilot')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/20 border border-purple-400/30 transition transform active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ask Copilot</span>
        </button>
      </div>
    </header>
  );
}
