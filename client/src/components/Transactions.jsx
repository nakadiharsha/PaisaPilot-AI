import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, ArrowUpRight, ArrowDownLeft, Calendar, Tag, CreditCard, Plus } from 'lucide-react';
import { api } from '../services/api';

export default function Transactions({ onOpenAddTx }) {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedMethod, setSelectedMethod] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('ALL');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (selectedCategory !== 'ALL') params.category = selectedCategory;
      if (selectedType !== 'ALL') params.type = selectedType;
      if (selectedMethod !== 'ALL') params.payment_method = selectedMethod;
      if (selectedMonth !== 'ALL') params.month = selectedMonth;

      const res = await api.getTransactions(params);
      if (res.success) {
        setTransactions(res.data);
        if (res.categories) setCategories(res.categories);
        if (res.paymentMethods) setPaymentMethods(res.paymentMethods);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransactions();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, selectedCategory, selectedType, selectedMethod, selectedMonth]);

  const totalDebit = transactions.filter(t => t.type === 'DEBIT').reduce((s, t) => s + t.amount, 0);
  const totalCredit = transactions.filter(t => t.type === 'CREDIT').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Filtered Transactions</span>
          <div className="text-xl font-bold text-white mt-1">{transactions.length} records</div>
        </div>
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Total Debited</span>
          <div className="text-xl font-bold text-slate-200 mt-1">₹{totalDebit.toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Total Credited</span>
          <div className="text-xl font-bold text-emerald-400 mt-1">₹{totalCredit.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search box */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search merchant, Swiggy, rent, notes..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
            />
          </div>

          {/* Quick Add Expense button */}
          <button
            onClick={onOpenAddTx}
            className="w-full md:w-auto px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Transaction</span>
          </button>
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80 text-xs">
          {/* Category */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-300 focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-300 focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">All Types</option>
              <option value="DEBIT">Debit (Expenses)</option>
              <option value="CREDIT">Credit (Income)</option>
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Payment Method</label>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-300 focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">All Methods</option>
              {paymentMethods.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Month */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-300 focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">All Time</option>
              <option value="2026-11">November 2026</option>
              <option value="2026-10">October 2026</option>
              <option value="2026-09">September 2026</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Merchant / Details</th>
                <th className="px-5 py-3 font-semibold">Category</th>
                <th className="px-5 py-3 font-semibold">Method</th>
                <th className="px-5 py-3 font-semibold">Type</th>
                <th className="px-5 py-3 font-semibold text-right">Amount (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading ledger...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center text-slate-400">
                    No transactions match the selected filters.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-850/40 transition">
                    <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {tx.date}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-200">{tx.merchant}</div>
                      {tx.notes && <div className="text-[11px] text-slate-400 truncate max-w-xs">{tx.notes}</div>}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60 font-medium text-[11px]">
                        {tx.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap">
                      {tx.payment_method}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 font-semibold text-[11px] px-2 py-0.5 rounded-full ${
                        tx.type === 'CREDIT' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {tx.type === 'CREDIT' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-sm whitespace-nowrap">
                      <span className={tx.type === 'CREDIT' ? 'text-emerald-400' : 'text-slate-100'}>
                        {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
