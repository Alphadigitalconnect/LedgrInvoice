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
  UserPlus
} from 'lucide-react';
import { formatINR } from '../../data/constants';

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

  const filteredClients = clients.filter(c => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.name?.toLowerCase().includes(term) ||
      c.businessName?.toLowerCase().includes(term) ||
      c.gstin?.toLowerCase().includes(term) ||
      c.contactPerson?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.stateName?.toLowerCase().includes(term)
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
            Client profiles, GSTIN details, state jurisdictions, and billing history.
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
            placeholder="Search by client name, GSTIN, contact person, state..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs font-normal text-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Clients Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-slate-200 p-12 text-center shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
              <Users size={22} />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">No clients in directory</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              {clients.length === 0
                ? "Add client accounts, GSTIN information, state codes, and billing contacts to start invoicing."
                : "No clients match your search criteria."}
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
          filteredClients.map((client) => {
            const clientInvoices = invoices.filter(i => i.clientId === client.id);
            const totalBilled = clientInvoices.reduce((sum, i) => sum + (i.grandTotal || 0), 0);
            const totalPaid = clientInvoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + (i.amountPaid || i.grandTotal || 0), 0);
            const pendingBalance = totalBilled - totalPaid;

            return (
              <div 
                key={client.id}
                className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3.5 hover:border-slate-300 transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <h3 className="text-xs font-bold text-slate-900 leading-snug">{client.name}</h3>
                      {client.contactPerson && (
                        <p className="text-[11px] text-slate-500">{client.contactPerson}</p>
                      )}
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                      client.isGstRegistered && client.gstin
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {client.isGstRegistered && client.gstin ? 'GST REG' : 'NON-GST'}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    {client.gstin && (
                      <div className="font-mono text-slate-800">
                        <span className="font-medium text-slate-500 font-sans">GSTIN: </span>{client.gstin}
                      </div>
                    )}
                    {client.pan && (
                      <div className="font-mono">
                        <span className="font-medium text-slate-500 font-sans">PAN: </span>{client.pan}
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-slate-500">State: </span>{client.stateName} ({client.stateCode})
                    </div>
                    {client.email && (
                      <div className="truncate">
                        <span className="font-medium text-slate-500">Email: </span>{client.email}
                      </div>
                    )}
                    {client.phone && (
                      <div>
                        <span className="font-medium text-slate-500">Phone: </span>{client.phone}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase font-medium block font-sans">Billed</span>
                      <span className="font-semibold text-slate-900">{formatINR(totalBilled)}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase font-medium block font-sans">Pending</span>
                      <span className={`font-semibold ${pendingBalance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {formatINR(pendingBalance)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1.5">
                  <button
                    onClick={() => onCreateInvoiceForClient(client)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition cursor-pointer"
                  >
                    <FileText size={13} />
                    <span>Invoice Client</span>
                  </button>

                  <button
                    onClick={() => onEditClient(client)}
                    className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-md transition cursor-pointer border border-slate-200"
                    title="Edit Client"
                  >
                    <Edit3 size={13} />
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm(`Delete client ${client.name}?`)) {
                        onDeleteClient(client.id);
                      }
                    }}
                    className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md transition cursor-pointer border border-slate-200"
                    title="Delete Client"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
