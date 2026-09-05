import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Printer, 
  X, 
  Calendar, 
  Building2, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  CreditCard,
  Layers,
  ArrowDownToLine
} from 'lucide-react';
import { formatINR } from '../../data/constants';

export default function MonthlyReportModal({ isOpen, onClose, invoices = [], entities = [], clients = [] }) {
  if (!isOpen) return null;

  // Available months extracted from invoices
  const availableMonths = useMemo(() => {
    const monthsSet = new Set();
    invoices.forEach(inv => {
      if (inv.invoiceDate) {
        const monthKey = inv.invoiceDate.slice(0, 7); // YYYY-MM
        monthsSet.add(monthKey);
      }
    });
    // Ensure current month is included
    const currentMonth = new Date().toISOString().slice(0, 7);
    monthsSet.add(currentMonth);
    return Array.from(monthsSet).sort().reverse();
  }, [invoices]);

  const [selectedMonth, setSelectedMonth] = useState('all'); // 'all' | 'YYYY-MM'
  const [selectedEntityId, setSelectedEntityId] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Format month key to readable string e.g. "2026-09" -> "September 2026"
  const formatMonthLabel = (mKey) => {
    if (mKey === 'all') return 'All Months Combined';
    try {
      const [year, month] = mKey.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    } catch (e) {
      return mKey;
    }
  };

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      // Month filter
      if (selectedMonth !== 'all') {
        const invMonth = (inv.invoiceDate || '').slice(0, 7);
        if (invMonth !== selectedMonth) return false;
      }
      // Entity filter
      if (selectedEntityId !== 'all') {
        if (inv.entityId !== selectedEntityId) return false;
      }
      // Status filter
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'PENDING') {
          if (inv.status === 'PAID' || inv.status === 'CANCELLED') return false;
        } else if (inv.status !== selectedStatus) {
          return false;
        }
      }
      return true;
    });
  }, [invoices, selectedMonth, selectedEntityId, selectedStatus]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalGst = 0;
    let totalGross = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let pendingCount = 0;
    let paidCount = 0;

    filteredInvoices.forEach(inv => {
      const taxable = Number(inv.taxableAmount || inv.subtotal || 0);
      const cgst = Number(inv.cgstAmount || 0);
      const sgst = Number(inv.sgstAmount || 0);
      const igst = Number(inv.igstAmount || 0);
      const gst = cgst + sgst + igst || Number(inv.totalTax || 0);
      const gross = Number(inv.totalAmount || inv.grandTotal || taxable + gst);
      const paid = Number(inv.amountPaid || 0);
      const balance = Math.max(0, gross - paid);

      totalTaxable += taxable;
      totalCgst += cgst;
      totalSgst += sgst;
      totalIgst += igst;
      totalGst += gst;
      totalGross += gross;
      totalPaid += paid;
      totalPending += balance;

      if (inv.status === 'PAID' || (gross > 0 && balance === 0)) {
        paidCount++;
      } else {
        pendingCount++;
      }
    });

    return {
      count: filteredInvoices.length,
      totalTaxable,
      totalCgst,
      totalSgst,
      totalIgst,
      totalGst,
      totalGross,
      totalPaid,
      totalPending,
      paidCount,
      pendingCount
    };
  }, [filteredInvoices]);

  // Generate and Download CSV/Excel report
  const handleExportCSV = () => {
    const headers = [
      'Sl No',
      'Invoice Date',
      'Invoice Number',
      'Issuing Entity Name',
      'Issuing Entity GSTIN',
      'Issuing Entity State',
      'Client Name',
      'Client GSTIN',
      'Client State / POS',
      'Description of Services',
      'Taxable Value (INR)',
      'CGST Amount (INR)',
      'SGST Amount (INR)',
      'IGST Amount (INR)',
      'Total GST Amount (INR)',
      'Total Invoice Value (INR)',
      'Amount Paid (INR)',
      'Balance Due / Pending (INR)',
      'Payment Status',
      'Payment Date / Ref'
    ];

    const rows = filteredInvoices.map((inv, idx) => {
      const ent = entities.find(e => e.id === inv.entityId) || {};
      const cli = clients.find(c => c.id === inv.clientId) || {};
      
      // Combine description of services
      const descriptions = (inv.items || [])
        .map(i => i.description || i.itemDescription || '')
        .filter(Boolean)
        .join(' | ') || (inv.notes || 'Professional Services');

      const taxable = Number(inv.taxableAmount || inv.subtotal || 0).toFixed(2);
      const cgst = Number(inv.cgstAmount || 0).toFixed(2);
      const sgst = Number(inv.sgstAmount || 0).toFixed(2);
      const igst = Number(inv.igstAmount || 0).toFixed(2);
      const totalGst = (Number(cgst) + Number(sgst) + Number(igst)).toFixed(2);
      const gross = Number(inv.totalAmount || inv.grandTotal || 0).toFixed(2);
      const paid = Number(inv.amountPaid || 0).toFixed(2);
      const balance = Math.max(0, Number(gross) - Number(paid)).toFixed(2);

      const statusText = inv.status === 'PAID' ? 'PAID' : (Number(balance) > 0 ? 'PENDING' : inv.status);
      const paymentInfo = inv.paymentDate ? `${inv.paymentDate} (${inv.paymentRef || 'Settled'})` : '-';

      return [
        idx + 1,
        `"${inv.invoiceDate || ''}"`,
        `"${inv.invoiceNumber || ''}"`,
        `"${(ent.tradeName || ent.name || '').replace(/"/g, '""')}"`,
        `"${ent.gstin || 'Non-GST'}"`,
        `"${ent.stateName || ''}"`,
        `"${(cli.businessName || cli.name || '').replace(/"/g, '""')}"`,
        `"${cli.gstin || 'Unregistered'}"`,
        `"${cli.placeOfSupply || cli.stateName || ''}"`,
        `"${descriptions.replace(/"/g, '""')}"`,
        taxable,
        cgst,
        sgst,
        igst,
        totalGst,
        gross,
        paid,
        balance,
        statusText,
        `"${paymentInfo}"`
      ];
    });

    // Add summary row
    rows.push([]);
    rows.push([
      'TOTAL',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      `"${metrics.count} Invoices"`,
      metrics.totalTaxable.toFixed(2),
      metrics.totalCgst.toFixed(2),
      metrics.totalSgst.toFixed(2),
      metrics.totalIgst.toFixed(2),
      metrics.totalGst.toFixed(2),
      metrics.totalGross.toFixed(2),
      metrics.totalPaid.toFixed(2),
      metrics.totalPending.toFixed(2),
      `"${metrics.paidCount} Paid / ${metrics.pendingCount} Pending"`,
      ''
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const monthFileName = selectedMonth !== 'all' ? selectedMonth : 'all_months';
    link.setAttribute('download', `LEDGR_Invoices_Report_${monthFileName}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print view
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-scaleIn">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-white border border-slate-700">
              <FileSpreadsheet size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Monthly Invoices & GST Report Export</h2>
              <p className="text-[11px] text-slate-400">
                Detailed schedule of all raised invoices, taxable values, GST breakdown, and payment status
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition cursor-pointer shadow-2xs"
              title="Download Excel / CSV format"
            >
              <ArrowDownToLine size={14} />
              <span>Export CSV / Excel</span>
            </button>
            <button
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition cursor-pointer border border-slate-700"
              title="Print Summary Report"
            >
              <Printer size={14} />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs flex-shrink-0">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Month Selector */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
              <Calendar size={13} className="text-slate-500" />
              <span className="font-semibold text-slate-700 text-[11px]">Month:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer text-xs"
              >
                <option value="all">All Months</option>
                {availableMonths.map(m => (
                  <option key={m} value={m}>{formatMonthLabel(m)}</option>
                ))}
              </select>
            </div>

            {/* Entity Selector */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
              <Building2 size={13} className="text-slate-500" />
              <span className="font-semibold text-slate-700 text-[11px]">Entity:</span>
              <select
                value={selectedEntityId}
                onChange={(e) => setSelectedEntityId(e.target.value)}
                className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer text-xs max-w-[150px] truncate"
              >
                <option value="all">All Issuing Entities</option>
                {entities.map(e => (
                  <option key={e.id} value={e.id}>{e.tradeName || e.name}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
              <Filter size={13} className="text-slate-500" />
              <span className="font-semibold text-slate-700 text-[11px]">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer text-xs"
              >
                <option value="all">All Statuses</option>
                <option value="PAID">Paid Only</option>
                <option value="PENDING">Pending / Due Only</option>
                <option value="SENT">Sent Invoices</option>
                <option value="DRAFT">Drafts</option>
              </select>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            Showing <strong className="text-slate-900 font-mono">{filteredInvoices.length}</strong> invoices
          </div>
        </div>

        {/* Financial KPI Summary Cards */}
        <div className="p-3.5 bg-white border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-shrink-0">
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Taxable Value</div>
            <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
              {formatINR(metrics.totalTaxable)}
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total GST (Tax)</div>
            <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
              {formatINR(metrics.totalGst)}
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5 font-mono">
              C:{formatINR(metrics.totalCgst)} | S:{formatINR(metrics.totalSgst)} | I:{formatINR(metrics.totalIgst)}
            </div>
          </div>

          <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-xs">
            <div className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">Gross Invoiced</div>
            <div className="text-sm font-bold text-white font-mono mt-0.5">
              {formatINR(metrics.totalGross)}
            </div>
            <div className="text-[9px] text-slate-300 mt-0.5">
              {metrics.count} total raised
            </div>
          </div>

          <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200">
            <div className="text-[10px] font-semibold text-rose-700 uppercase tracking-wider">Pending / Outstanding</div>
            <div className="text-sm font-bold text-rose-800 font-mono mt-0.5">
              {formatINR(metrics.totalPending)}
            </div>
            <div className="text-[9px] text-rose-600 mt-0.5">
              {metrics.pendingCount} unpaid / partial
            </div>
          </div>
        </div>

        {/* Scrollable Data Table */}
        <div className="flex-1 overflow-auto p-3.5">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileSpreadsheet size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-medium">No invoices found matching selected month and filters.</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Date & No.</th>
                    <th className="p-2.5">Issuing Entity</th>
                    <th className="p-2.5">Billed To (Client)</th>
                    <th className="p-2.5">Services / Items</th>
                    <th className="p-2.5 text-right">Taxable</th>
                    <th className="p-2.5 text-right">GST</th>
                    <th className="p-2.5 text-right font-bold text-slate-900">Total (₹)</th>
                    <th className="p-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map((inv) => {
                    const ent = entities.find(e => e.id === inv.entityId) || {};
                    const cli = clients.find(c => c.id === inv.clientId) || {};
                    const taxable = Number(inv.taxableAmount || inv.subtotal || 0);
                    const cgst = Number(inv.cgstAmount || 0);
                    const sgst = Number(inv.sgstAmount || 0);
                    const igst = Number(inv.igstAmount || 0);
                    const gst = cgst + sgst + igst || Number(inv.totalTax || 0);
                    const gross = Number(inv.totalAmount || inv.grandTotal || taxable + gst);
                    const paid = Number(inv.amountPaid || 0);
                    const balance = Math.max(0, gross - paid);

                    const isPaid = inv.status === 'PAID' || (gross > 0 && balance === 0);

                    // Service descriptions
                    const serviceDesc = (inv.items || [])
                      .map(i => i.description || i.itemDescription)
                      .filter(Boolean)
                      .join(', ') || inv.notes || 'Professional Services';

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-2.5 whitespace-nowrap">
                          <div className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</div>
                          <div className="text-[10px] text-slate-400">{inv.invoiceDate}</div>
                        </td>

                        <td className="p-2.5 max-w-[140px] truncate">
                          <div className="font-semibold text-slate-800 truncate">{ent.tradeName || ent.name || 'Entity'}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{ent.gstin || 'Non-GST'}</div>
                        </td>

                        <td className="p-2.5 max-w-[140px] truncate">
                          <div className="font-semibold text-slate-800 truncate">{cli.businessName || cli.name || 'Client'}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{cli.gstin || 'Unregistered'}</div>
                        </td>

                        <td className="p-2.5 max-w-[180px] truncate text-slate-600 text-[11px]" title={serviceDesc}>
                          {serviceDesc}
                        </td>

                        <td className="p-2.5 text-right font-mono text-slate-700 whitespace-nowrap">
                          {formatINR(taxable)}
                        </td>

                        <td className="p-2.5 text-right font-mono text-slate-700 whitespace-nowrap">
                          {formatINR(gst)}
                        </td>

                        <td className="p-2.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          {formatINR(gross)}
                        </td>

                        <td className="p-2.5 text-center whitespace-nowrap">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={10} />
                              <span>PAID</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock size={10} />
                              <span>PENDING ({formatINR(balance)})</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs flex-shrink-0">
          <div className="text-[11px] text-slate-500">
            Report generated for <strong className="text-slate-800">{formatMonthLabel(selectedMonth)}</strong> • Ready for GST & CA filing
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-slate-600 hover:text-slate-800 font-medium cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition cursor-pointer shadow-2xs"
            >
              <Download size={13} />
              <span>Download Excel / CSV</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
