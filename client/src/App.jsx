import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Overview from './components/Overview';
import Transactions from './components/Transactions';
import Analytics from './components/Analytics';
import Budgets from './components/Budgets';
import GroupSplit from './components/GroupSplit';
import CopilotChat from './components/CopilotChat';
import AuditHistory from './components/AuditHistory';
import AddTransactionModal from './components/AddTransactionModal';
import McpStatusModal from './components/McpStatusModal';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [overviewData, setOverviewData] = useState(null);
  const [mcpStatus, setMcpStatus] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddTxModal, setShowAddTxModal] = useState(false);
  const [showMcpModal, setShowMcpModal] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState(null);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [ovRes, mcpRes] = await Promise.all([
        api.getOverview(),
        api.getMcpStatus()
      ]);
      if (ovRes.success) setOverviewData(ovRes.data);
      if (mcpRes.success) setMcpStatus(mcpRes);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAskPrompt = (promptText) => {
    setPendingPrompt(promptText);
    setActiveTab('copilot');
  };

  return (
    <div className="flex h-screen bg-[#0b0f19] text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mcpStatus={mcpStatus}
        onOpenMcpInspector={() => setShowMcpModal(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Navbar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenAddTx={() => setShowAddTxModal(true)}
          onRefresh={loadData}
          isRefreshing={isRefreshing}
          balance={overviewData?.formattedTotalBalance}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'overview' && (
              <Overview
                data={overviewData}
                setActiveTab={setActiveTab}
                onAskPrompt={handleAskPrompt}
              />
            )}

            {activeTab === 'transactions' && (
              <Transactions
                onOpenAddTx={() => setShowAddTxModal(true)}
              />
            )}

            {activeTab === 'analytics' && (
              <Analytics
                onAskPrompt={handleAskPrompt}
              />
            )}

            {activeTab === 'budgets' && (
              <Budgets
                onAskPrompt={handleAskPrompt}
              />
            )}

            {activeTab === 'split' && (
              <GroupSplit
                onAskPrompt={handleAskPrompt}
              />
            )}

            {activeTab === 'copilot' && (
              <CopilotChat
                initialPrompt={pendingPrompt}
                onClearInitialPrompt={() => setPendingPrompt(null)}
              />
            )}

            {activeTab === 'audit' && (
              <AuditHistory />
            )}
          </div>
        </main>
      </div>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={showAddTxModal}
        onClose={() => setShowAddTxModal(false)}
        onSuccess={loadData}
      />

      {/* MCP Status Modal */}
      <McpStatusModal
        isOpen={showMcpModal}
        onClose={() => setShowMcpModal(false)}
        mcpStatus={mcpStatus}
      />
    </div>
  );
}
