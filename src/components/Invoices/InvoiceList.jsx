import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  Plus, 
  Eye, 
  Share2, 
  CreditCard, 
  Copy, 
  Trash2, 
  Edit3 
} from 'lucide-react';
import { formatINR } from '../../data/constants';

export default function InvoiceList({
  invoices,
  entities,
  clients,
  activeEntityFilter,
  setActiveEntityFilter,
  onOpenNewInvoice,
  onViewInvoice,
  onEditInvoice,
  onShareInvoice,
  onRecordPayment,
  onDeleteInvoice,
  onDuplicateInvoice
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [clientFilter, setClientFilter] = useState('ALL');

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      if (activeEntityFilter !== 'all' && inv.entityId !== activeEntityFilter) {
        return false;
      }
      if (statusFilter !== 'ALL' && inv.status !== statusFilter) {
        return false;
      }
      if (clientFilter !== 'ALL' && inv.clientId !== clientFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const numMatch = inv.invoiceNumber?.toLowerCase().includes(term);
        const nameMatch = inv.clientName?.toLowerCase().includes(term);
        const gstinMatch = inv.clientGstin?.toLowerCase().includes(term);
        const poMatch = inv.poNumber?.toLowerCase().includes(term);
        if (!numMatch && !nameMatch && !gstinMatch && !poMatch) {
          return false;
        }
      }
      return true;
    });
  }, [invoices, activeEntityFilter, statusFilter, clientFilter, searchTerm]);

  const aggregateStats = useMemo(() => {
    const totalCount = filteredInvoices.length;
    const totalAmount = filteredInvoices.reduce((sum, i) => sum + (i.grandTotal || 0), 0);
    const paidAmount = filteredInvoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + (i.amountPaid || i.grandTotal || 0), 0);
    const pendingAmount = filteredInvoices.filter(i => i.status !== 'PAID').reduce((sum, i) => sum + (i.grandTotal - (i.amountPaid || 0)), 0);
    return { totalCount, totalAmount, paidAmount, pendingAmount };
  }, [filteredInvoices]);

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Invoices
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage tax invoices, payment records, TDS tracking, and client communications.
          </p>
        </div>

        <button
          onClick={onOpenNewInvoice}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white transition self-start sm:self-auto cursor-pointer shadow-2xs"
        >
          <Plus size={14} />
          <span>New Invoice</span>
        </button>
      </div>

      {/* Quick Summary Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500">Invoices</span>
          <p className="text-lg font-bold text-slate-900 mt-0.5 font-mono">{aggregateStats.totalCount}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500">Total Billed</span>
          <p className="text-lg font-bold text-slate-900 mt-0.5 font-mono">{formatINR(aggregateStats.totalAmount)}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-medium text-emerald-600">Collected</span>
          <p className="text-lg font-bold text-emerald-700 mt-0.5 font-mono">{formatINR(aggregateStats.paidAmount)}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-medium text-amber-600">Pending</span>
          <p className="text-lg font-bold text-amber-700 mt-0.5 font-mono">{formatINR(aggregateStats.pendingAmount)}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by invoice #, client, GST..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal text-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-400 focus:outline-none"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-1 w-full md:w-auto">
          {['ALL', 'PENDING', 'PAID', 'OVERDUE', 'DRAFT'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
              <FileText size={22} />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">No invoices found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              {invoices.length === 0
                ? "You haven't created any invoices yet. Create your first professional tax invoice to get started."
                : "No invoices match your active filters or search terms."}
            </p>
            <button
              onClick={onOpenNewInvoice}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition cursor-pointer"
            >
              <Plus size={14} />
              <span>Create Invoice</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-medium text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-medium">Invoice # & Date</th>
                  <th className="px-4 py-3 font-medium">Issuing Entity</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 text-center font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map(inv => {
                  const ent = entities.find(e => e.id === inv.entityId);
                  const statusStyles = {
                    PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
                    OVERDUE: 'bg-rose-50 text-rose-700 border-rose-200',
                    DRAFT: 'bg-slate-100 text-slate-700 border-slate-200'
                  };

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3">
                        <div className="font-mono font-medium text-slate-900">{inv.invoiceNumber}</div>
                        <div className="text-[10px] text-slate-400">{inv.invoiceDate} (Due: {inv.dueDate})</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-slate-700 font-medium">{ent?.tradeName || ent?.name || 'Entity'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{inv.clientName}</div>
                        {inv.clientGstin && (
                          <div className="text-[10px] text-slate-400 font-mono">GST: {inv.clientGstin}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-slate-900">
                        {formatINR(inv.grandTotal || 0)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${statusStyles[inv.status] || statusStyles.DRAFT}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onViewInvoice(inv)}
                            title="View Invoice"
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-md transition cursor-pointer"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => onRecordPayment(inv)}
                            title="Record Payment"
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-md transition cursor-pointer"
                          >
                            <CreditCard size={14} />
                          </button>
                          <button
                            onClick={() => onDuplicateInvoice(inv)}
                            title="Duplicate"
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-md transition cursor-pointer"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            onClick={() => onEditInvoice(inv)}
                            title="Edit"
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-md transition cursor-pointer"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete invoice ${inv.invoiceNumber}?`)) {
                                onDeleteInvoice(inv.id);
                              }
                            }}
                            title="Delete"
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md transition cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
