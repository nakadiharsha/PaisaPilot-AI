import React from 'react';
import { X, Server, CheckCircle, ShieldCheck, Activity, Cpu, Layers } from 'lucide-react';

export default function McpStatusModal({ isOpen, onClose, mcpStatus }) {
  if (!isOpen || !mcpStatus) return null;

  const { servers = [], totalTools = 16, tools = [] } = mcpStatus;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Model Context Protocol (MCP) Topology</h3>
            <p className="text-xs text-slate-400">4 Official TypeScript SDK Servers • {totalTools} Tools Registered</p>
          </div>
        </div>

        {/* Protocol Spec pill */}
        <div className="my-4 p-3 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Transport: <strong>InMemoryTransport</strong> & <strong>StdioServerTransport</strong></span>
          </div>
          <span className="font-mono text-[11px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
            @modelcontextprotocol/sdk
          </span>
        </div>

        {/* 4 Servers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {servers.map((s, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-850/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white">{s.displayName}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {s.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">{s.name}</p>
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1 uppercase font-semibold">Exposed Tools ({s.toolsCount}):</span>
                <div className="flex flex-wrap gap-1">
                  {s.tools?.map((toolName, tIdx) => (
                    <span key={tIdx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-750 text-purple-300">
                      {toolName}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* All Tools Detailed Schema List */}
        <div>
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Registered Tool Schemas</h4>
          <div className="divide-y divide-slate-800/80 max-h-56 overflow-y-auto pr-1 bg-slate-950 p-2 rounded-xl border border-slate-850 text-xs">
            {tools.map((t, idx) => (
              <div key={idx} className="py-2 px-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-purple-300">{t.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({t.serverName})</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{t.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
