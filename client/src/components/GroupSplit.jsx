import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  QrCode, 
  Check, 
  Copy, 
  ArrowRight, 
  CreditCard, 
  Sparkles, 
  ExternalLink,
  ShieldCheck,
  X
} from 'lucide-react';
import { api } from '../services/api';

export default function GroupSplit({ onAskPrompt }) {
  const [splits, setSplits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [qrModalData, setQrModalData] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Form state
  const [billTitle, setBillTitle] = useState('Dinner at Social');
  const [totalAmount, setTotalAmount] = useState('2000');
  const [splitType, setSplitType] = useState('equal'); // 'equal' or 'custom'
  const [friends, setFriends] = useState([
    { name: 'Aarav Sharma (You)', upi_id: 'aarav.sharma@okaxis', amount: '500', isSelf: true },
    { name: 'Rahul Verma', upi_id: 'rahul.verma@okhdfcbank', amount: '500', isSelf: false },
    { name: 'Priya Patel', upi_id: 'priya.patel@okicici', amount: '500', isSelf: false },
    { name: 'Rohan Das', upi_id: 'rohan.das@oksbi', amount: '500', isSelf: false }
  ]);

  const fetchSplits = async () => {
    try {
      const res = await api.getSplits();
      if (res.success) {
        setSplits(res.data);
      }
    } catch (err) {
      console.error('Error fetching splits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSplits();
  }, []);

  // Update equal amounts when totalAmount or friends change
  useEffect(() => {
    if (splitType === 'equal' && totalAmount && friends.length > 0) {
      const each = Math.round((parseFloat(totalAmount) / friends.length) * 100) / 100;
      setFriends(prev => prev.map(f => ({ ...f, amount: each.toString() })));
    }
  }, [totalAmount, friends.length, splitType]);

  const handleAddFriend = () => {
    const nextIdx = friends.length + 1;
    setFriends([...friends, { name: `Friend ${nextIdx}`, upi_id: `friend${nextIdx}@upi`, amount: '0', isSelf: false }]);
  };

  const handleRemoveFriend = (index) => {
    if (friends.length <= 2) return;
    setFriends(friends.filter((_, i) => i !== index));
  };

  const handleCreateSplit = async (e) => {
    e.preventDefault();
    try {
      await api.createSplit({
        title: billTitle,
        total_amount: parseFloat(totalAmount),
        participants: friends.map(f => ({
          name: f.name,
          upi_id: f.upi_id,
          amount: parseFloat(f.amount)
        }))
      });
      setShowCreateModal(false);
      fetchSplits();
    } catch (err) {
      console.error('Error creating split:', err);
    }
  };

  const handleSettle = async (itemId) => {
    try {
      await api.settleSplitItem(itemId);
      fetchSplits();
    } catch (err) {
      console.error('Error settling item:', err);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400 mb-1">
            <Users className="w-4 h-4" />
            <span>Group Expenses & UPI Intent Links • UPI & Split MCP</span>
          </div>
          <h2 className="text-xl font-bold text-white">Equal & Custom Bill Splitting</h2>
          <p className="text-xs text-slate-400 mt-1">
            Generate NPCI standard <code className="text-purple-300">upi://pay</code> links with dynamic QR codes and track real-time settlements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onAskPrompt('Split my ₹2,000 dinner bill between four friends.')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask AI to Split</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Split</span>
          </button>
        </div>
      </div>

      {/* Split Groups List */}
      <div className="space-y-6">
        {splits.map((group) => (
          <div key={group.id} className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
              <div>
                <h3 className="text-base font-bold text-white">{group.title}</h3>
                <p className="text-xs text-slate-400">
                  Total: <strong className="text-slate-200">₹{group.total_amount.toLocaleString('en-IN')}</strong> • Date: {group.date} • Paid by: {group.created_by}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-200">
                    Settled: ₹{group.settled.toLocaleString('en-IN')} / ₹{group.total_amount.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {group.settlementRate}% completed
                  </div>
                </div>
                <div className="w-16 bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all"
                    style={{ width: `${group.settlementRate}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Individual Members Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {group.items.map((item) => {
                const isPaid = item.status === 'PAID';
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border flex flex-col justify-between transition ${
                      isPaid
                        ? 'bg-slate-900/40 border-slate-800/60'
                        : 'bg-slate-850/70 border-slate-750 hover:border-purple-500/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-slate-200 truncate">{item.friend_name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isPaid 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mb-2">{item.friend_upi}</p>
                      <div className="text-lg font-bold text-white mb-3">
                        ₹{item.amount.toLocaleString('en-IN')}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                      {item.upi_link && !isPaid && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setQrModalData({
                              title: `${group.title} - ${item.friend_name}`,
                              amount: item.amount,
                              upiUri: item.upi_link
                            })}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs flex items-center justify-center transition"
                            title="Show UPI QR Code"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => copyToClipboard(item.upi_link, item.id)}
                            className="flex-1 px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-[11px] font-medium flex items-center justify-center gap-1 transition"
                            title="Copy UPI Payment Intent Link"
                          >
                            {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedId === item.id ? 'Copied' : 'Copy UPI Link'}</span>
                          </button>
                        </div>
                      )}

                      {!isPaid ? (
                        <button
                          onClick={() => handleSettle(item.id)}
                          className="w-full py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold transition flex items-center justify-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Mark Settled</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 block text-center py-1">
                          Settled on {item.settled_at?.split(' ')[0] || 'Nov 23'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* QR Code Modal */}
      {qrModalData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl relative">
            <button
              onClick={() => setQrModalData(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-3">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">NPCI UPI Payment Intent</h3>
            <p className="text-xs text-slate-400 mb-4">{qrModalData.title}</p>

            <div className="bg-white p-4 rounded-xl inline-block mb-3 shadow-md">
              {/* Simulated QR Code display */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrModalData.upiUri)}`}
                alt="UPI Payment QR Code"
                className="w-44 h-44 mx-auto"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><rect width="180" height="180" fill="%23eee"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" fill="%23333">UPI QR Code</text></svg>';
                }}
              />
            </div>

            <div className="text-lg font-bold text-slate-100 mb-2">₹{parseFloat(qrModalData.amount).toLocaleString('en-IN')}</div>
            <p className="text-[11px] text-slate-400 break-all bg-slate-950 p-2 rounded-lg border border-slate-800 font-mono mb-4">
              {qrModalData.upiUri}
            </p>

            <button
              onClick={() => {
                navigator.clipboard.writeText(qrModalData.upiUri);
                alert('UPI URI copied to clipboard!');
              }}
              className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition"
            >
              Copy Raw UPI Link
            </button>
          </div>
        </div>
      )}

      {/* Create New Split Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white mb-1">Create Group Split</h3>
            <p className="text-xs text-slate-400 mb-4">Split dining, trips, or shared bills with instant UPI links</p>

            <form onSubmit={handleCreateSplit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Expense Title</label>
                <input
                  type="text"
                  required
                  value={billTitle}
                  onChange={(e) => setBillTitle(e.target.value)}
                  placeholder="e.g. Dinner at Social, Koramangala"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Total Bill Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Split Type</label>
                  <select
                    value={splitType}
                    onChange={(e) => setSplitType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="equal">Equal Split</option>
                    <option value="custom">Custom Amounts</option>
                  </select>
                </div>
              </div>

              {/* Friends list */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300">Participants ({friends.length})</label>
                  <button
                    type="button"
                    onClick={handleAddFriend}
                    className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Person</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {friends.map((f, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs">
                      <input
                        type="text"
                        required
                        value={f.name}
                        onChange={(e) => {
                          const updated = [...friends];
                          updated[idx].name = e.target.value;
                          setFriends(updated);
                        }}
                        placeholder="Friend Name"
                        className="flex-1 bg-transparent border-none text-slate-200 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={f.upi_id}
                        onChange={(e) => {
                          const updated = [...friends];
                          updated[idx].upi_id = e.target.value;
                          setFriends(updated);
                        }}
                        placeholder="UPI ID"
                        className="w-36 bg-slate-900 px-2 py-1 rounded text-slate-300 focus:outline-none border border-slate-800"
                      />
                      <input
                        type="number"
                        disabled={splitType === 'equal'}
                        value={f.amount}
                        onChange={(e) => {
                          const updated = [...friends];
                          updated[idx].amount = e.target.value;
                          setFriends(updated);
                        }}
                        className="w-20 bg-slate-900 px-2 py-1 rounded text-slate-200 font-bold focus:outline-none border border-slate-800 text-right"
                      />
                      {!f.isSelf && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFriend(idx)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow"
                >
                  Create & Generate UPI Links
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
