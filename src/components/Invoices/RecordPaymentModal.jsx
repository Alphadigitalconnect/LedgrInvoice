import React, { useState } from 'react';
import { 
  X, 
  CreditCard, 
  Check
} from 'lucide-react';
import { formatINR } from '../../data/constants';

export default function RecordPaymentModal({ invoice, entity, onSave, onClose }) {
  const pendingBalance = Math.max(0, (invoice.grandTotal || 0) - (invoice.amountPaid || 0));

  const [amountReceived, setAmountReceived] = useState(
    invoice.netReceivable ? invoice.netReceivable : pendingBalance
  );
  const [tdsDeducted, setTdsDeducted] = useState(invoice.tdsAmount || 0);
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [paymentMode, setPaymentMode] = useState('NEFT / RTGS');
  const [paymentRef, setPaymentRef] = useState('');
  const [notes, setNotes] = useState('Payment received in full and credited to bank account.');

  if (!invoice) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const paidVal = parseFloat(amountReceived) || 0;
    const tdsVal = parseFloat(tdsDeducted) || 0;

    const totalRealized = (invoice.amountPaid || 0) + paidVal + tdsVal;
    const isFullyPaid = totalRealized >= ((invoice.grandTotal || 0) - 1);

    const updatedInvoice = {
      ...invoice,
      amountPaid: (invoice.amountPaid || 0) + paidVal,
      tdsDeductedByClient: (invoice.tdsDeductedByClient || 0) + tdsVal,
      status: isFullyPaid ? 'PAID' : 'PARTIAL',
      paymentDate,
      paymentMode,
      paymentRef: paymentRef.trim(),
      notes: notes.trim()
    };

    onSave(updatedInvoice);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200 animate-fadeIn">
        {/* Header */}
        <div className="bg-white text-slate-900 px-5 py-3.5 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <CreditCard size={18} className="text-slate-700" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Record Payment</h2>
              <p className="text-[11px] text-slate-500 font-mono">
                {invoice.invoiceNumber} • {invoice.clientName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs bg-white">
          {/* Invoice Balance Banner */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-medium text-slate-500">Invoice Total</span>
              <p className="text-sm font-bold text-slate-900 font-mono">{formatINR(invoice.grandTotal || 0)}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-medium text-amber-600">Pending Balance</span>
              <p className="text-sm font-bold text-amber-700 font-mono">{formatINR(pendingBalance)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-slate-700 block">Amount Received (₹) *</label>
              <input
                type="number"
                required
                min="0"
                step="any"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-medium text-slate-900 focus:ring-1 focus:ring-slate-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700 block">TDS Deducted (₹)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={tdsDeducted}
                onChange={(e) => setTdsDeducted(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-medium text-slate-900 focus:ring-1 focus:ring-slate-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-slate-700 block">Payment Date *</label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-1 focus:ring-slate-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700 block">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-1 focus:ring-slate-400 focus:outline-none cursor-pointer"
              >
                <option value="NEFT / RTGS">NEFT / RTGS</option>
                <option value="UPI / QR">UPI / QR Transfer</option>
                <option value="IMPS">IMPS</option>
                <option value="Cheque">Cheque</option>
                <option value="Bank Transfer">Direct Bank Transfer</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-medium text-slate-700 block">Transaction Reference / UTR</label>
            <input
              type="text"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              placeholder="e.g. UTR-HDFC982103482"
              className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-slate-400 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-slate-700 block">Note</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-slate-400 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium transition cursor-pointer"
            >
              <Check size={14} />
              <span>Save Payment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
