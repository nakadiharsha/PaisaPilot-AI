import React, { useState } from 'react';
import { X, Plus, CreditCard } from 'lucide-react';
import { api } from '../services/api';

export default function AddTransactionModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    merchant: '',
    amount: '',
    category: 'Food & Dining',
    payment_method: 'UPI',
    type: 'DEBIT',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.merchant || !formData.amount) return;

    setSubmitting(true);
    try {
      const res = await api.createTransaction(formData);
      if (res.success) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error('Error creating transaction:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-base font-bold text-white mb-1">Add Financial Transaction</h3>
        <p className="text-xs text-slate-400 mb-4">Record simulated debit or credit entry</p>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 mb-1">Merchant / Payee Name</label>
            <input
              type="text"
              required
              value={formData.merchant}
              onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
              placeholder="e.g. Swiggy, Starbucks, Amazon"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1">Amount (INR ₹)</label>
              <input
                type="number"
                required
                min="1"
                step="any"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="e.g. 650"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
              >
                <option value="DEBIT">Debit (Expense)</option>
                <option value="CREDIT">Credit (Income)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
              >
                <option value="Food & Dining">Food & Dining</option>
                <option value="Shopping">Shopping</option>
                <option value="Groceries">Groceries</option>
                <option value="Utilities">Utilities</option>
                <option value="Travel & Commute">Travel & Commute</option>
                <option value="Health & Fitness">Health & Fitness</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Housing">Housing</option>
                <option value="Salary">Salary</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Payment Method</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
              >
                <option value="UPI">UPI</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Net Banking">Net Banking</option>
                <option value="IMPS">IMPS</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Date</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Notes (Optional)</label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Dinner with colleagues"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow disabled:opacity-50"
            >
              {submitting ? 'Recording...' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
