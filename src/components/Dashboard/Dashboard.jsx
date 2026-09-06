import React from 'react';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Building2, 
  Users, 
  PlusCircle, 
  Briefcase, 
  ArrowUpRight, 
  Eye,
  Share2,
  Plus,
  Receipt,
  Layers,
  DollarSign,
  FolderTree
} from 'lucide-react';
import { formatINR } from '../../data/constants';
import { formatDateDMY } from '../Invoices/InvoicePreview';

export default function Dashboard({
  invoices,
  clients,
  engagements,
  entities,
  categories = [],
  activeEntityFilter,
  setActiveEntityFilter,
  onNavigate,
  onOpenNewInvoice,
  onOpenAddEntity,
  onOpenManageCategories,
  onViewInvoice,
  onShareInvoice,
  onRecordPayment
}) {
  const filteredInvoices = invoices.filter(inv => {
    if (activeEntityFilter !== 'all' && inv.entityId !== activeEntityFilter) {
      return false;
    }
    return true;
  });

  // Metrics
  const totalRaisedCount = filteredInvoices.length;
  const totalRaisedAmount = filteredInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
  const totalGstAmount = filteredInvoices.reduce((sum, inv) => sum + (inv.totalTaxAmount || 0), 0);

  const paidInvoices = filteredInvoices.filter(inv => inv.status === 'PAID');
  const totalPaidCount = paidInvoices.length;
  const totalPaidAmount = paidInvoices.reduce((sum, inv) => sum + (inv.amountPaid || inv.grandTotal || 0), 0);

  const pendingInvoices = filteredInvoices.filter(inv => inv.status === 'PENDING');
  const totalPendingCount = pendingInvoices.length;
  const totalPendingAmount = pendingInvoices.reduce((sum, inv) => sum + (inv.grandTotal - (inv.amountPaid || 0)), 0);

  const overdueInvoices = filteredInvoices.filter(inv => inv.status === 'OVERDUE');
  const totalOverdueCount = overdueInvoices.length;
  const totalOverdueAmount = overdueInvoices.reduce((sum, inv) => sum + (inv.grandTotal - (inv.amountPaid || 0)), 0);

  const totalTdsEstimated = filteredInvoices.reduce((sum, inv) => sum + (inv.tdsAmount || 0), 0);

  const activeQuotesCount = engagements.length;
  const totalQuotedValue = engagements.reduce((sum, e) => sum + (e.quotedFee || 0), 0);

  // Revenue by Category Analytics
  const categoryStats = React.useMemo(() => {
    const map = {};
    filteredInvoices.forEach(inv => {
      const items = Array.isArray(inv.items) ? inv.items : [];
      if (items.length > 0) {
        items.forEach(it => {
          const cat = it.category || inv.category || 'Consulting & Advisory';
          const amt = parseFloat(it.taxableAmount) || parseFloat(it.lineTotal) || (parseFloat(it.qty || 1) * parseFloat(it.rate || 0)) || 0;
          if (!map[cat]) map[cat] = { category: cat, totalAmount: 0, count: 0 };
          map[cat].totalAmount += amt;
          map[cat].count += 1;
        });
      } else {
        const cat = inv.category || 'Consulting & Advisory';
        const amt = inv.taxableTotal || inv.grandTotal || 0;
        if (!map[cat]) map[cat] = { category: cat, totalAmount: 0, count: 0 };
        map[cat].totalAmount += amt;
        map[cat].count += 1;
      }
    });
    return Object.values(map).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [filteredInvoices]);

  const quickActions = [
    { title: 'Add Entity', desc: 'New billing company', icon: Building2, action: onOpenAddEntity },
    { title: 'Create Invoice', desc: 'Bill client or customer', icon: PlusCircle, action: onOpenNewInvoice },
    { title: 'Manage Invoices', desc: `${totalRaisedCount} total invoices`, icon: FileText, action: () => onNavigate('invoices') },
    { title: 'Quotes & Proposals', desc: `${activeQuotesCount} active proposals`, icon: Briefcase, action: () => onNavigate('engagements') },
    { title: 'Clients Directory', desc: `${clients.length} registered clients`, icon: Users, action: () => onNavigate('clients') },
    { title: 'Entity Profiles', desc: `${entities.length} profiles configured`, icon: Layers, action: () => onNavigate('entities') },
  ];

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Overview
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
              Admin Portal
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Multi-entity billing overview, invoice tracking, and tax compliance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenAddEntity}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer border border-slate-200 shadow-2xs"
          >
            <Building2 size={13} className="text-slate-500" />
            <span>Add Entity</span>
          </button>

          <button
            onClick={onOpenNewInvoice}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer shadow-2xs"
          >
            <Plus size={13} />
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={item.action}
                className="p-3.5 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-2xs flex flex-col items-start text-left gap-2.5 transition cursor-pointer group"
              >
                <div className="p-2 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-slate-200 transition">
                  <Icon size={16} />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-xs">{item.title}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoiced */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Invoiced</span>
            <span className="p-1.5 rounded-md bg-slate-100 text-slate-600">
              <Receipt size={14} />
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-bold text-slate-900 font-mono tracking-tight">
              {formatINR(totalRaisedAmount)}
            </h3>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              <span>{totalRaisedCount} Invoices</span>
              <span>GST: {formatINR(totalGstAmount)}</span>
            </div>
          </div>
        </div>

        {/* Collected / Paid */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Collected / Paid</span>
            <span className="p-1.5 rounded-md bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={14} />
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-bold text-slate-900 font-mono tracking-tight">
              {formatINR(totalPaidAmount)}
            </h3>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              <span className="text-emerald-700 font-medium">{totalPaidCount} Paid</span>
              <span>TDS: {formatINR(totalTdsEstimated)}</span>
            </div>
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Outstanding</span>
            <span className="p-1.5 rounded-md bg-amber-50 text-amber-600">
              <Clock size={14} />
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-bold text-slate-900 font-mono tracking-tight">
              {formatINR(totalPendingAmount + totalOverdueAmount)}
            </h3>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              <span className="text-amber-700 font-medium">{totalPendingCount} Pending</span>
              {totalOverdueCount > 0 ? (
                <span className="text-rose-600 font-medium">{totalOverdueCount} Overdue</span>
              ) : (
                <span>0 Overdue</span>
              )}
            </div>
          </div>
        </div>

        {/* Quotes & Proposals */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Quotes Pipeline</span>
            <span className="p-1.5 rounded-md bg-slate-100 text-slate-600">
              <TrendingUp size={14} />
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-bold text-slate-900 font-mono tracking-tight">
              {formatINR(totalQuotedValue)}
            </h3>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              <span>{activeQuotesCount} Proposals</span>
              <span>{clients.length} Clients</span>
            </div>
          </div>
        </div>
      </div>

      {/* Entity Profiles Overview */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Configured Entities ({entities.length})
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Supplier entities, bank accounts, and tax registrations</p>
          </div>
          <button
            onClick={() => onNavigate('entities')}
            className="text-xs font-medium text-slate-700 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
          >
            <span>Manage Profiles</span>
            <ArrowUpRight size={13} />
          </button>
        </div>

        {entities.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
            <Building2 size={24} className="mx-auto text-slate-400" />
            <p className="text-xs font-semibold text-slate-700">No Business Entities Configured</p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">Add your company or firm details, GSTIN, and bank account to get started with invoicing.</p>
            <button
              onClick={onOpenAddEntity}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 mt-2 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer shadow-2xs"
            >
              <Plus size={13} />
              <span>Add First Entity</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {entities.map(ent => {
              const entInvoices = invoices.filter(i => i.entityId === ent.id);
              const entTotal = entInvoices.reduce((s, i) => s + (i.grandTotal || 0), 0);
              const entPaid = entInvoices.filter(i => i.status === 'PAID').reduce((s, i) => s + (i.amountPaid || i.grandTotal || 0), 0);
              const isSelectedFilter = activeEntityFilter === ent.id;

              return (
                <div 
                  key={ent.id}
                  className={`p-3.5 rounded-xl border transition ${
                    isSelectedFilter 
                      ? 'border-slate-800 bg-slate-50/70' 
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      {ent.logoUrl ? (
                        <img 
                          src={ent.logoUrl} 
                          alt={ent.name} 
                          className="w-8 h-8 rounded-lg object-contain bg-white border border-slate-200 p-0.5"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center border border-slate-200">
                          {ent.logoBadge || 'EN'}
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-xs text-slate-900 line-clamp-1">{ent.tradeName || ent.name}</h3>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {ent.gstin ? `GST: ${ent.gstin}` : 'Non-GST / Exempt'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium border border-slate-200">
                      State {ent.stateCode}
                    </span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 block font-sans">Billed</span>
                      <span className="font-medium text-slate-900">{formatINR(entTotal)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block font-sans">Collected</span>
                      <span className="font-medium text-emerald-700">{formatINR(entPaid)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Revenue by Service Category Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp size={14} className="text-emerald-600" />
              <span>Revenue by Service Category</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Track revenue generation streams across your service offerings</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
              {categoryStats.length} Active Streams
            </span>
            {onOpenManageCategories && (
              <button
                type="button"
                onClick={onOpenManageCategories}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer shadow-2xs"
              >
                <FolderTree size={13} />
                <span>Manage Categories</span>
              </button>
            )}
          </div>
        </div>

        {categoryStats.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200 space-y-2">
            <FolderTree size={20} className="mx-auto text-slate-400" />
            <p className="text-xs font-semibold text-slate-700">No categorized service revenue recorded yet</p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">Create and assign categories to invoice line items to track revenue breakdowns by domain.</p>
            {onOpenManageCategories && (
              <button
                type="button"
                onClick={onOpenManageCategories}
                className="inline-flex items-center gap-1 px-3 py-1.5 mt-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs"
              >
                <Plus size={12} />
                <span>Add / Edit Categories</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {categoryStats.map(stat => {
              const sharePct = totalRaisedAmount > 0 ? Math.round((stat.totalAmount / totalRaisedAmount) * 100) : 0;
              return (
                <div 
                  key={stat.category}
                  className="p-3 bg-slate-50/80 rounded-lg border border-slate-200 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 line-clamp-1">{stat.category}</span>
                    <span className="font-mono font-bold text-slate-900">{formatINR(stat.totalAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{stat.count} {stat.count === 1 ? 'service entry' : 'service entries'}</span>
                    <span className="font-medium text-emerald-700">{sharePct}% share</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.max(sharePct, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Recent Invoices
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Latest generated statutory invoices and receipts</p>
          </div>

          <button
            onClick={() => onNavigate('invoices')}
            className="text-xs font-medium text-slate-700 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
          >
            <span>View All ({invoices.length})</span>
            <ArrowUpRight size={13} />
          </button>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Receipt size={24} className="mx-auto text-slate-400" />
            <p className="text-xs font-semibold text-slate-700">No Invoices Created Yet</p>
            <p className="text-[11px] text-slate-500">Your created tax invoices and payment receipts will appear here.</p>
            <button
              onClick={onOpenNewInvoice}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 mt-2 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer shadow-2xs"
            >
              <Plus size={13} />
              <span>Create Invoice</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-medium text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Invoice #</th>
                  <th className="px-4 py-2.5 font-medium">Entity</th>
                  <th className="px-4 py-2.5 font-medium">Client</th>
                  <th className="px-4 py-2.5 text-right font-medium">Total</th>
                  <th className="px-4 py-2.5 text-center font-medium">Status</th>
                  <th className="px-4 py-2.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.slice(0, 6).map(inv => {
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
                        <div className="text-[10px] text-slate-400">{formatDateDMY(inv.invoiceDate)}</div>
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
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition cursor-pointer"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => onShareInvoice(inv)}
                            title="Share Invoice"
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition cursor-pointer"
                          >
                            <Share2 size={14} />
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
