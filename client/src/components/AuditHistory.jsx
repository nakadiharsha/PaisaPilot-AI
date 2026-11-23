import React, { useState, useEffect } from 'react';
import { 
  History, 
  ShieldCheck, 
  ShieldAlert, 
  Check, 
  X, 
  Server, 
  Search, 
  Filter, 
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function AuditHistory() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterServer, setFilterServer] = useState('ALL');
  const [filterApproval, setFilterApproval] = useState('ALL');

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getAuditLogs();
      if (res.success) {
        setLogs(res.data);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const handleApprove = async (id) => {
    try {
      await api.approveAction(id);
      fetchAuditLogs();
    } catch (err) {
      console.error('Error approving action:', err);
    }
  };

  const handleReject = async (id) => {
    try {
      await api.rejectAction(id, 'User manual rejection from audit log');
      fetchAuditLogs();
    } catch (err) {
      console.error('Error rejecting action:', err);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filterServer !== 'ALL' && log.server_name !== filterServer) return false;
    if (filterApproval === 'PENDING' && log.approval_status !== 'PENDING') return false;
    if (filterApproval === 'APPROVED' && log.approval_status !== 'APPROVED') return false;
    return true;
  });

  const pendingCount = logs.filter(l => l.approval_status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400 mb-1">
            <History className="w-4 h-4" />
            <span>Audit Trail & Security Governance</span>
          </div>
          <h2 className="text-xl font-bold text-white">MCP Tool Execution Logs</h2>
          <p className="text-xs text-slate-400 mt-1">
            Immutable log of every tool execution, parameters passed, output returned, and human-in-the-loop approvals.
          </p>
        </div>

        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <ShieldAlert className="w-4 h-4" />
            <span>{pendingCount} Action Pending Your Review</span>
          </div>
        )}
      </div>

      {/* Filter bar */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Filter by MCP Server</label>
            <select
              value={filterServer}
              onChange={(e) => setFilterServer(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-300 focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">All MCP Servers</option>
              <option value="banking-mcp-server">banking-mcp-server</option>
              <option value="analytics-mcp-server">analytics-mcp-server</option>
              <option value="upi-split-mcp-server">upi-split-mcp-server</option>
              <option value="reminder-mcp-server">reminder-mcp-server</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Approval State</label>
            <select
              value={filterApproval}
              onChange={(e) => setFilterApproval(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-300 focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">All Actions</option>
              <option value="PENDING">Pending Approval Only</option>
              <option value="APPROVED">Approved Actions</option>
            </select>
          </div>
        </div>

        <button
          onClick={fetchAuditLogs}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-medium transition"
        >
          Refresh Logs
        </button>
      </div>

      {/* Audit Log Entries Table / Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading audit records...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">
            No audit records match the selected filter.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isPending = log.approval_status === 'PENDING';
            const isApproved = log.approval_status === 'APPROVED';

            let parsedArgs = null;
            let parsedOutput = null;
            try {
              parsedArgs = JSON.parse(log.input_arguments);
            } catch {
              parsedArgs = log.input_arguments;
            }
            try {
              parsedOutput = JSON.parse(log.output_result);
            } catch {
              parsedOutput = log.output_result;
            }

            return (
              <div
                key={log.id}
                className={`p-4 rounded-2xl border transition ${
                  isPending
                    ? 'bg-amber-950/20 border-amber-500/40'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-purple-400">
                      <Server className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-xs">{log.tool_name}</span>
                        <span className="text-[11px] text-slate-400 font-mono">({log.server_name})</span>
                      </div>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {log.created_at} • ID: {log.id}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isPending ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      isApproved ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {log.approval_status === 'NOT_REQUIRED' ? 'AUTOMATIC_EXECUTION' : log.approval_status}
                    </span>

                    {/* Pending Action Buttons */}
                    {isPending && (
                      <div className="flex items-center gap-1.5 ml-2">
                        <button
                          onClick={() => handleApprove(log.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1 transition"
                        >
                          <Check className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleReject(log.id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 font-medium text-xs transition"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Arguments and Outputs Collapsible Preview */}
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-850">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Inputs / Arguments</span>
                    <pre className="text-slate-300 text-[11px] overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(parsedArgs, null, 2)}
                    </pre>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-850">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Output Result Summary</span>
                    <pre className="text-slate-300 text-[11px] overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(parsedOutput, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
