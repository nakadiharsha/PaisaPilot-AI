import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Server, 
  CheckCircle, 
  Clock, 
  ShieldAlert, 
  ShieldCheck, 
  ArrowRight, 
  Copy, 
  Check, 
  QrCode, 
  Users, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';

export default function CopilotChat({ initialPrompt, onClearInitialPrompt }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: "Namaste Aarav! I'm your **PaisaPilot AI Copilot**, powered by 4 independent **Model Context Protocol (MCP)** servers. I can analyze your spending, check budgets, audit subscriptions, split expenses, and schedule bill reminders. How can I assist you today?",
      executedSteps: [],
      cardType: 'welcome',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedCommands, setSuggestedCommands] = useState([]);
  const [expandedSteps, setExpandedSteps] = useState({});
  const [copiedLink, setCopiedLink] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    async function loadPrompts() {
      try {
        const res = await api.getSuggestedPrompts();
        if (res.success) {
          setSuggestedCommands(res.commands);
        }
      } catch (err) {
        console.error('Error loading prompts:', err);
      }
    }
    loadPrompts();
  }, []);

  // Handle incoming initial prompt from other tabs/dashboards
  useEffect(() => {
    if (initialPrompt) {
      handleSendMessage(initialPrompt);
      if (onClearInitialPrompt) onClearInitialPrompt();
    }
  }, [initialPrompt]);

  const handleSendMessage = async (userText) => {
    const textToSend = userText || input;
    if (!textToSend.trim() || loading) return;

    const userMsgId = 'usr_' + Date.now();
    const userMsg = {
      id: userMsgId,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!userText) setInput('');
    setLoading(true);

    try {
      const res = await api.sendChatMessage(textToSend);
      const assistantMsg = {
        id: 'ast_' + Date.now(),
        role: 'assistant',
        text: res.text,
        intent: res.intent,
        intentDescription: res.intentDescription,
        aiProvider: res.aiProvider,
        executedSteps: res.executedSteps || [],
        cardType: res.cardType,
        cardData: res.cardData,
        requiresApproval: res.requiresApproval,
        approvalDetails: res.approvalDetails,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Error communicating with agent:', err);
      setMessages(prev => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          role: 'assistant',
          text: 'Sorry, I encountered an issue while communicating with the MCP servers. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAction = async (approvalId, msgIndex) => {
    try {
      await api.approveAction(approvalId);
      setMessages(prev => {
        const updated = [...prev];
        if (updated[msgIndex]?.approvalDetails) {
          updated[msgIndex].approvalDetails.isApproved = true;
        }
        return updated;
      });
      alert('Action approved! External UPI payment intent link is now active and verified.');
    } catch (err) {
      console.error('Error approving action:', err);
    }
  };

  const handleRejectAction = async (approvalId, msgIndex) => {
    try {
      await api.rejectAction(approvalId, 'User rejected link sharing');
      setMessages(prev => {
        const updated = [...prev];
        if (updated[msgIndex]?.approvalDetails) {
          updated[msgIndex].approvalDetails.isRejected = true;
        }
        return updated;
      });
    } catch (err) {
      console.error('Error rejecting action:', err);
    }
  };

  const toggleSteps = (id) => {
    setExpandedSteps(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyText = (txt, id) => {
    navigator.clipboard.writeText(txt);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  // Render markdown text bold formatting safely
  const renderFormattedText = (text) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Copilot Header */}
      <div className="px-6 py-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">PaisaPilot Agent Orchestrator</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                4 MCP Servers Live
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Autonomous tool coordination via official MCP SDK</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          <span>Human-in-the-Loop Active</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => (
          <div
            key={msg.id}
            className={`flex gap-3.5 max-w-4xl ${msg.role === 'user' ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md mt-1">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div className={`space-y-3 max-w-2xl ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              {/* Message Bubble */}
              <div
                className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg rounded-tr-sm ml-auto'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-sm shadow-md'
                }`}
              >
                <div className="whitespace-pre-line">{renderFormattedText(msg.text)}</div>

                {/* AI Provider & Timestamp */}
                <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                  <span>{msg.timestamp}</span>
                  {msg.aiProvider && (
                    <span className="font-mono text-purple-300 font-medium">{msg.aiProvider}</span>
                  )}
                </div>
              </div>

              {/* MCP Tool Execution Disclosure Accordion */}
              {msg.executedSteps && msg.executedSteps.length > 0 && (
                <div className="w-full bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden text-xs">
                  <button
                    onClick={() => toggleSteps(msg.id)}
                    className="w-full px-3.5 py-2 flex items-center justify-between text-[11px] font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 transition"
                  >
                    <div className="flex items-center gap-2">
                      <Server className="w-3.5 h-3.5 text-purple-400" />
                      <span>Executed {msg.executedSteps.length} MCP {msg.executedSteps.length === 1 ? 'Tool' : 'Tools'}:</span>
                      <span className="text-purple-300 font-mono">
                        {msg.executedSteps.map(s => s.toolName).join(' ➔ ')}
                      </span>
                    </div>
                    {expandedSteps[msg.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {expandedSteps[msg.id] && (
                    <div className="p-3 border-t border-slate-850 space-y-2 bg-slate-950/40">
                      {msg.executedSteps.map((step, sIdx) => (
                        <div key={sIdx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                              <CheckCircle className="w-3 h-3 text-emerald-400" />
                              <span className="font-mono text-purple-300">{step.toolName}</span>
                              <span className="text-[10px] text-slate-400 font-normal">({step.serverDisplayName})</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">{step.durationMs}ms</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono bg-slate-950 p-1.5 rounded border border-slate-850 truncate">
                            Args: {JSON.stringify(step.args)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Human-in-the-loop Approval Card for UPI Intent Links */}
              {msg.requiresApproval && msg.approvalDetails && (
                <div className={`w-full p-4 rounded-xl border text-xs space-y-3 ${
                  msg.approvalDetails.isApproved
                    ? 'bg-emerald-950/30 border-emerald-500/40'
                    : msg.approvalDetails.isRejected
                    ? 'bg-rose-950/30 border-rose-500/40'
                    : 'bg-purple-950/40 border-purple-500/40'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-purple-400" />
                      <span className="font-bold text-white">Human-in-the-Loop Approval Required</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      msg.approvalDetails.isApproved
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : msg.approvalDetails.isRejected
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {msg.approvalDetails.isApproved ? 'Approved by You' : msg.approvalDetails.isRejected ? 'Rejected' : 'Action Pending'}
                    </span>
                  </div>

                  <p className="text-slate-300 text-[11px]">
                    The AI agent generated an external UPI payment request. In accordance with security protocol, please review payee details before dispatch:
                  </p>

                  <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 space-y-1 text-[11px] font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Payee Name:</span>
                      <span className="text-white font-semibold">{msg.approvalDetails.payeeName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Payee UPI ID:</span>
                      <span className="text-purple-300">{msg.approvalDetails.payeeUpi}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Requested Amount:</span>
                      <span className="text-emerald-400 font-bold">{msg.approvalDetails.formattedAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">NPCI Intent URI:</span>
                      <span className="text-slate-400 truncate max-w-xs">{msg.approvalDetails.uri}</span>
                    </div>
                  </div>

                  {!msg.approvalDetails.isApproved && !msg.approvalDetails.isRejected && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleApproveAction(msg.approvalDetails.approvalId, idx)}
                        className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve & Enable Link</span>
                      </button>
                      <button
                        onClick={() => handleRejectAction(msg.approvalDetails.approvalId, idx)}
                        className="px-4 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 font-medium text-xs transition"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {msg.approvalDetails.isApproved && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => copyText(msg.approvalDetails.uri, msg.id)}
                        className="flex-1 py-1.5 rounded-lg bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                      >
                        {copiedLink === msg.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedLink === msg.id ? 'Copied to Clipboard!' : 'Copy NPCI UPI Intent Link'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-md mt-1">
                AS
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3 max-w-lg">
            <div className="w-8 h-8 rounded-xl bg-purple-600/30 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0 animate-tool-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 text-xs space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="font-semibold text-purple-300">Evaluating Intent & Calling MCP Tools...</span>
              </div>
              <p className="text-[11px] text-slate-400">
                PaisaPilot is invoking MCP tool endpoints over official SDK transport and computing financial metrics.
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="px-6 py-2 bg-slate-950/60 border-t border-slate-850 flex items-center gap-2 overflow-x-auto text-xs shrink-0">
        <span className="text-[11px] font-semibold text-slate-400 shrink-0">Try asking:</span>
        {suggestedCommands.slice(0, 6).map((cmd, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(cmd.prompt)}
            disabled={loading}
            className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-purple-600/20 hover:border-purple-500/40 border border-slate-800 text-slate-300 hover:text-white transition whitespace-nowrap text-[11px] shrink-0"
          >
            {cmd.prompt}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-4 bg-slate-950 border-t border-slate-800 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your spending, split bills, budgets, or set reminders..."
              disabled={loading}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition pr-10"
            />
          </div>

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-purple-600/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
