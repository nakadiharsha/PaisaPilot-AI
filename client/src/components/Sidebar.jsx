import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  BarChart3, 
  PieChart, 
  Users, 
  Bot, 
  History, 
  ShieldCheck, 
  Server,
  Sparkles,
  Landmark
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, mcpStatus }) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'budgets', label: 'Budgets', icon: PieChart },
    { id: 'split', label: 'Group Split & UPI', icon: Users },
    { id: 'copilot', label: 'AI Copilot (MCP)', icon: Bot, badge: 'Agent' },
    { id: 'audit', label: 'Activity & Approvals', icon: History }
  ];

  const totalTools = mcpStatus?.totalTools || 16;
  const serversConnected = mcpStatus?.servers?.filter(s => s.status === 'CONNECTED')?.length || 4;

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none">
      {/* Brand Header */}
      <div>
        <div className="p-6 border-b border-slate-850 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-purple-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-white tracking-tight">PaisaPilot</span>
              <span className="text-xs px-1.5 py-0.5 font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded">AI</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">MCP Finance Copilot</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/10 text-white border border-purple-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300 border border-purple-400/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* MCP Architecture Status & User Profile */}
      <div className="p-4 border-t border-slate-800/80 space-y-3">
        {/* Live MCP Status Banner */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1.5 text-slate-300 font-medium">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <span>MCP Protocol</span>
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {serversConnected} servers connected • {totalTools} tools registered via official SDK
          </p>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/40">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs shadow">
            AS
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">Aarav Sharma</p>
            <p className="text-[10px] text-slate-400 truncate">HDFC ••••4821</p>
          </div>
          <span title="Demo Indian Fintech User" className="text-xs">🇮🇳</span>
        </div>
      </div>
    </aside>
  );
}
