import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Briefcase, 
  FileText, 
  Phone, 
  Mail, 
  MapPin,
  UserPlus,
  Eye,
  X,
  CreditCard,
  Building2,
  Receipt,
  CheckCircle2,
  Clock,
  ExternalLink
} from 'lucide-react';
import { formatINR } from '../../data/constants';
import { formatDateDMY } from '../Invoices/InvoicePreview';

export default function ClientList({
  clients,
  invoices,
  engagements,
  entities,
  onOpenNewClient,
  onEditClient,
  onDeleteClient,
  onNavigateToEngagements,
  onCreateInvoiceForClient,
  onOpenImportClients
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientDetail, setSelectedClientDetail] = useState(null);

  const filteredClients = clients.filter(c => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.name?.toLowerCase().includes(term) ||
      c.businessName?.toLowerCase().includes(term) ||
      c.gstin?.toLowerCase().includes(term) ||
      c.contactPerson?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.stateName?.toLowerCase().includes(term) ||
      c.city?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Clients Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Client profiles, GSTIN registrations, billing history, and status tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onOpenImportClients && (
            <button
              onClick={onOpenImportClients}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer shadow-2xs"
              title="Import Clients from Excel / CSV"
            >
              <span>Import Clients</span>
            </button>
          )}

          <button
            onClick={onOpenNewClient}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer shadow-2xs"
          >
            <UserPlus size={14} />
            <span>Add Client</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search clients by name, GSTIN, contact person, city, state..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs font-normal text-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-400 focus:outline-none"
          />
        </div>
        <span className="text-xs text-slate-500 font-mono">
          {filteredClients.length} {filteredClients.length === 1 ? 'Client' : 'Clients'}
        </span>
      </div>

      {/* Line-by-Line Clients Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredClients.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
              <Users size={22} />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">No clients in directory</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              {clients.length === 0
                ? "Add client accounts, GSTIN details, state codes, and billing contacts to start invoicing."
                : "No clients match your search query."}
            </p>
            <button
              onClick={onOpenNewClient}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition cursor-pointer"
            >
              <UserPlus size={14} />
              <span>Add Client</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-medium text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-medium">Client Name & Contact</th>
                  <th className="px-4 py-3 font-medium">GSTIN / Type</th>
                  <th className="px-4 py-3 font-medium">State & City</th>
                  <th className="px-4 py-3 text-right font-medium">Total Billed</th>
                  <th className="px-4 py-3 text-right font-medium">Pending Balance</th>
                  <th className="px-4 py-3 text-center font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClients.map((client) => {
                  const clientInvoices = invoices.filter(i => i.clientId === client.id || (i.clientName && i.clientName.toLowerCase() === client.name?.toLowerCase()));
                  const totalBilled = clientInvoices.reduce((sum, i) => sum + (i.grandTotal || 0), 0);
                  const totalPaid = clientInvoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + (i.amountPaid || i.grandTotal || 0), 0);
                  const pendingBalance = totalBilled - totalPaid;
                  
                  const isPaidClear = totalBilled > 0 && pendingBalance <= 0;
                  const hasPending = pendingBalance > 0;
                  const isNew = totalBilled === 0;

                  return (
                    <tr 
                      key={client.id} 
                      onClick={() => setSelectedClientDetail(client)}
                      className="hover:bg-slate-50/80 transition cursor-pointer group"
                    >
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900 text-xs group-hover:text-emerald-700 transition">
                          {client.name}
                        </div>
                        {client.contactPerson && (
                          <div className="text-[11px] text-slate-500 mt-0.5">{client.contactPerson}</div>
                        )}
                        {client.email && (
                          <div className="text-[10px] text-slate-400 mt-0.5">{client.email}</div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded border mb-1 ${
                          client.isGstRegistered && client.gstin
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {client.isGstRegistered && client.gstin ? 'GST REG' : 'NON-GST'}
                        </span>
                        {client.gstin && (
                          <div className="font-mono text-[10px] text-slate-600">{client.gstin}</div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-slate-800 font-medium">{client.stateName || 'Telangana'}</div>
                        <div className="text-[10px] text-slate-400">
                          {client.city ? `${client.city}, ` : ''}{client.stateCode ? `Code ${client.stateCode}` : ''}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-medium text-slate-900">
                        {formatINR(totalBilled)}
                        <div className="text-[10px] text-slate-400 font-sans">{clientInvoices.length} invoices</div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-semibold">
                        <span className={pendingBalance > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                          {formatINR(pendingBalance)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          isPaidClear 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : hasPending
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {isPaidClear ? 'ALL PAID' : hasPending ? 'PENDING' : 'NO INVOICES'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedClientDetail(client)}
                            title="View Status & History"
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-md transition cursor-pointer"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => onCreateInvoiceForClient(client)}
                            title="Create Invoice for Client"
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-md transition cursor-pointer"
                          >
                            <FileText size={14} />
                          </button>
                          <button
                            onClick={() => onEditClient(client)}
                            title="Edit Client"
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-md transition cursor-pointer"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete client ${client.name}?`)) {
                                onDeleteClient(client.id);
                              }
                            }}
                            title="Delete Client"
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

      {/* Client Status & Detail Modal */}
      {selectedClientDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200 text-xs my-auto">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-white border-b border-slate-100 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">{selectedClientDetail.name}</h2>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                    selectedClientDetail.isGstRegistered && selectedClientDetail.gstin
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {selectedClientDetail.isGstRegistered && selectedClientDetail.gstin ? 'GST REGISTERED' : 'NON-GST / UNREGISTERED'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Client Profile, Tax Information, and Billing Ledger
                </p>
              </div>

              <button
                onClick={() => setSelectedClientDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Financial Status KPI Summary */}
              {(() => {
                const clientInvoices = invoices.filter(i => i.clientId === selectedClientDetail.id || (i.clientName && i.clientName.toLowerCase() === selectedClientDetail.name?.toLowerCase()));
                const totalBilled = clientInvoices.reduce((sum, i) => sum + (i.grandTotal || 0), 0);
                const totalPaid = clientInvoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + (i.amountPaid || i.grandTotal || 0), 0);
                const pendingBalance = totalBilled - totalPaid;

                return (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Invoiced</span>
                      <span className="text-sm font-bold font-mono text-slate-900 mt-0.5 block">{formatINR(totalBilled)}</span>
                      <span className="text-[10px] text-slate-400">{clientInvoices.length} invoices</span>
                    </div>

                    <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-center">
                      <span className="text-[10px] text-emerald-700 uppercase font-semibold block">Collected / Paid</span>
                      <span className="text-sm font-bold font-mono text-emerald-800 mt-0.5 block">{formatINR(totalPaid)}</span>
                      <span className="text-[10px] text-emerald-600">Settled</span>
                    </div>

                    <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-center">
                      <span className="text-[10px] text-amber-700 uppercase font-semibold block">Outstanding Pending</span>
                      <span className={`text-sm font-bold font-mono mt-0.5 block ${pendingBalance > 0 ? 'text-amber-800' : 'text-slate-800'}`}>
                        {formatINR(pendingBalance)}
                      </span>
                      <span className="text-[10px] text-amber-600">{pendingBalance > 0 ? 'Payment Due' : 'Zero Due'}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Client Profile Information */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Contact & Registration Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700 text-xs">
                  {selectedClientDetail.contactPerson && (
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Contact Person</span>
                      <span className="font-medium text-slate-900">{selectedClientDetail.contactPerson}</span>
                    </div>
                  )}
                  {selectedClientDetail.email && (
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Email</span>
                      <span className="font-medium text-slate-900">{selectedClientDetail.email}</span>
                    </div>
                  )}
                  {selectedClientDetail.phone && (
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Phone</span>
                      <span className="font-medium text-slate-900">{selectedClientDetail.phone}</span>
                    </div>
                  )}
                  {selectedClientDetail.gstin && (
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">GSTIN</span>
                      <span className="font-mono font-medium text-slate-900">{selectedClientDetail.gstin}</span>
                    </div>
                  )}
                  {selectedClientDetail.pan && (
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">PAN</span>
                      <span className="font-mono font-medium text-slate-900">{selectedClientDetail.pan}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">State / Place of Supply</span>
                    <span className="font-medium text-slate-900">{selectedClientDetail.stateName || 'Telangana'} ({selectedClientDetail.stateCode || '36'})</span>
                  </div>
                  {(selectedClientDetail.billingAddress || selectedClientDetail.address) && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Billing Address</span>
                      <span className="font-medium text-slate-900">{selectedClientDetail.billingAddress || selectedClientDetail.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Invoices History Table */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Invoices History
                </h3>
                {(() => {
                  const clientInvoices = invoices.filter(i => i.clientId === selectedClientDetail.id || (i.clientName && i.clientName.toLowerCase() === selectedClientDetail.name?.toLowerCase()));
                  if (clientInvoices.length === 0) {
                    return (
                      <p className="text-[11px] text-slate-500 italic p-3 bg-slate-50 rounded-lg border border-slate-200">
                        No invoices generated for this client yet.
                      </p>
                    );
                  }

                  return (
                    <div className="rounded-lg border border-slate-200 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-medium text-[10px] uppercase border-b border-slate-200">
                          <tr>
                            <th className="px-3 py-2 font-medium">Invoice #</th>
                            <th className="px-3 py-2 font-medium">Date</th>
                            <th className="px-3 py-2 text-right font-medium">Amount</th>
                            <th className="px-3 py-2 text-center font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {clientInvoices.map(inv => (
                            <tr key={inv.id} className="hover:bg-slate-50">
                              <td className="px-3 py-2 font-mono font-medium text-slate-900">{inv.invoiceNumber}</td>
                              <td className="px-3 py-2 text-slate-500">{formatDateDMY(inv.invoiceDate)}</td>
                              <td className="px-3 py-2 text-right font-mono font-medium text-slate-900">{formatINR(inv.grandTotal || 0)}</td>
                              <td className="px-3 py-2 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                  inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  {inv.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedClientDetail(null)}
                className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-medium transition cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const targetClient = selectedClientDetail;
                    setSelectedClientDetail(null);
                    onEditClient(targetClient);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs"
                >
                  <Edit3 size={13} />
                  <span>Edit Client</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const targetClient = selectedClientDetail;
                    setSelectedClientDetail(null);
                    onCreateInvoiceForClient(targetClient);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs"
                >
                  <FileText size={13} />
                  <span>Invoice Client</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

