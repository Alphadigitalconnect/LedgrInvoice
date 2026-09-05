import React, { useRef, useState } from 'react';
import { 
  Printer, 
  Share2, 
  X, 
  ShieldCheck, 
  Download, 
  Check, 
  CreditCard, 
  QrCode,
  Building2,
  FileText,
  Edit3
} from 'lucide-react';
import { formatINR, numberToWordsIndian, GST_STATES } from '../../data/constants';
import html2pdf from 'html2pdf.js';

export default function InvoicePreview({
  invoice,
  entity,
  client,
  onClose,
  onShare,
  onEdit
}) {
  const invoiceSheetRef = useRef(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!invoice) return null;

  // Safe fallback for entity so preview NEVER crashes
  const safeEntity = entity || {
    name: invoice.entityName || 'Business Entity',
    tradeName: invoice.entityTradeName || 'Consulting & Advisory Services',
    tagline: 'Strategic Management & Advisory',
    gstin: invoice.entityGstin || '',
    pan: invoice.entityPan || '',
    addressLine1: 'Corporate Office',
    addressLine2: '',
    pincode: '500081',
    stateCode: '36',
    stateName: 'Telangana',
    email: 'billing@firm.com',
    phone: '+91 98765 43210',
    website: 'www.firm.com',
    bankName: 'HDFC Bank',
    bankAccountNo: '50200012345678',
    bankIfsc: 'HDFC0001234',
    bankBranch: 'Main Branch',
    upiId: 'billing@okhdfcbank',
    signatory: {
      name: 'Authorized Signatory',
      designation: 'Managing Partner'
    },
    termsAndConditions: [
      '1. Payment is due within 15 days from invoice date.',
      '2. Please quote invoice reference in NEFT / RTGS narration.'
    ]
  };

  const supplierState = GST_STATES.find(s => s.code === safeEntity.stateCode) || { code: safeEntity.stateCode || '36', name: safeEntity.stateName || 'State' };
  const posState = GST_STATES.find(s => s.code === invoice.placeOfSupplyStateCode) || { code: invoice.placeOfSupplyStateCode || '36', name: invoice.placeOfSupplyStateName || "State" };

  const isInterState = invoice.isInterState !== undefined 
    ? invoice.isInterState 
    : (String(safeEntity.stateCode || '36') !== String(invoice.placeOfSupplyStateCode || '36'));

  const rawItems = Array.isArray(invoice.items) && invoice.items.length > 0 ? invoice.items : [
    {
      id: 'item-1',
      description: 'Professional Strategic & Management Advisory Consulting',
      sacHsn: '998311',
      qty: 1,
      unit: 'Project',
      rate: invoice.taxableTotal || invoice.grandTotal || 50000,
      discountPercent: 0,
      taxableAmount: invoice.taxableTotal || invoice.grandTotal || 50000,
      gstRate: 18
    }
  ];

  // Calculate items with full fallback safety
  const safeItems = rawItems.map((item, idx) => {
    const qty = parseFloat(item.qty) || 1;
    const rate = parseFloat(item.rate) || 0;
    const discountPct = parseFloat(item.discountPercent) || 0;
    const gstRate = parseFloat(item.gstRate) || 0;
    const taxableAmount = item.taxableAmount !== undefined ? parseFloat(item.taxableAmount) : (qty * rate * (1 - discountPct / 100));

    let cgstAmount = item.cgstAmount !== undefined ? parseFloat(item.cgstAmount) : 0;
    let sgstAmount = item.sgstAmount !== undefined ? parseFloat(item.sgstAmount) : 0;
    let igstAmount = item.igstAmount !== undefined ? parseFloat(item.igstAmount) : 0;

    if (!invoice.isReverseCharge) {
      if (isInterState) {
        if (item.igstAmount === undefined) igstAmount = taxableAmount * (gstRate / 100);
      } else {
        if (item.cgstAmount === undefined) {
          cgstAmount = taxableAmount * (gstRate / 200);
          sgstAmount = taxableAmount * (gstRate / 200);
        }
      }
    }

    const totalTax = item.totalTax !== undefined ? parseFloat(item.totalTax) : (cgstAmount + sgstAmount + igstAmount);
    const lineTotal = item.lineTotal !== undefined ? parseFloat(item.lineTotal) : (taxableAmount + totalTax);

    return {
      ...item,
      qty,
      rate,
      discountPercent: discountPct,
      gstRate,
      taxableAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalTax,
      lineTotal
    };
  });

  const taxableTotal = invoice.taxableTotal !== undefined 
    ? parseFloat(invoice.taxableTotal) 
    : safeItems.reduce((sum, it) => sum + it.taxableAmount, 0);

  const totalCgst = invoice.totalCgst !== undefined 
    ? parseFloat(invoice.totalCgst) 
    : (invoice.cgstAmount !== undefined ? parseFloat(invoice.cgstAmount) : safeItems.reduce((s, it) => s + it.cgstAmount, 0));

  const totalSgst = invoice.totalSgst !== undefined 
    ? parseFloat(invoice.totalSgst) 
    : (invoice.sgstAmount !== undefined ? parseFloat(invoice.sgstAmount) : safeItems.reduce((s, it) => s + it.sgstAmount, 0));

  const totalIgst = invoice.totalIgst !== undefined 
    ? parseFloat(invoice.totalIgst) 
    : (invoice.igstAmount !== undefined ? parseFloat(invoice.igstAmount) : safeItems.reduce((s, it) => s + it.igstAmount, 0));

  const grandTotal = invoice.grandTotal !== undefined 
    ? parseFloat(invoice.grandTotal) 
    : Math.round(taxableTotal + totalCgst + totalSgst + totalIgst);

  const amountInWords = numberToWordsIndian(grandTotal);

  // Bank & UPI resolution
  const bankName = safeEntity.bankName || safeEntity.bankDetails?.bankName || 'HDFC Bank';
  const bankAccountNo = safeEntity.bankAccountNo || safeEntity.bankDetails?.accountNumber || '50200012345678';
  const bankIfsc = safeEntity.bankIfsc || safeEntity.bankDetails?.ifscCode || 'HDFC0001234';
  const bankBranch = safeEntity.bankBranch || safeEntity.bankDetails?.branch || 'Main Branch';
  const upiId = safeEntity.upiId || safeEntity.bankDetails?.upiId || 'billing@okhdfcbank';

  // Dynamic UPI Payment QR URL
  const upiPayString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(safeEntity.name)}&am=${grandTotal}&cu=INR&tn=${encodeURIComponent(`Invoice ${invoice.invoiceNumber || 'INV'}`)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(upiPayString)}&margin=4`;

  // Download PDF with Pure White Exact Fidelity matching the online view
  const handleDownloadPdf = async () => {
    if (!invoiceSheetRef.current) return;
    setIsGeneratingPdf(true);

    try {
      const element = invoiceSheetRef.current;
      const sanitizedNumber = (invoice.invoiceNumber || 'INV').replace(/[\/\\?%*:|"<>]/g, '_');
      
      const opt = {
        margin: [5, 5, 5, 5],
        filename: `${sanitizedNumber}_Tax_Invoice.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2.5, 
          useCORS: true, 
          letterRendering: true,
          logging: false,
          scrollY: 0,
          backgroundColor: '#ffffff'
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait' 
        }
      };

      await html2pdf().set(opt).from(element).save();
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Error generating PDF:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex justify-center p-2 sm:p-6 no-print-bg">
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-xl overflow-hidden flex flex-col my-auto border border-slate-200">
        
        {/* Top Action Toolbar (Hidden in Print) */}
        <div className="no-print bg-white px-5 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-900">Invoice Preview</span>
            <span className="text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-mono font-medium border border-slate-200">
              {invoice.invoiceNumber || 'INV/24-25/101'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-3.5 py-1.5 rounded-lg transition disabled:opacity-60 cursor-pointer shadow-2xs"
            >
              {isGeneratingPdf ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : downloadSuccess ? (
                <>
                  <Check size={13} />
                  <span>Downloaded</span>
                </>
              ) : (
                <>
                  <Download size={13} />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 transition cursor-pointer shadow-2xs"
            >
              <Printer size={13} />
              <span>Print</span>
            </button>

            {/* Share Button */}
            {onShare && (
              <button
                onClick={() => onShare(invoice)}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 transition cursor-pointer shadow-2xs"
              >
                <Share2 size={13} />
                <span>Share</span>
              </button>
            )}

            {/* Edit Button */}
            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(invoice);
                }}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 transition cursor-pointer shadow-2xs"
              >
                <Edit3 size={13} />
                <span>Edit</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition ml-1 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Printable & Downloadable Invoice Sheet (STRICT PURE WHITE BACKGROUND ONLY) */}
        {/* ========================================================================= */}
        <div 
          ref={invoiceSheetRef}
          id="invoice-printable-area"
          className="invoice-printable-sheet bg-white p-8 sm:p-10 text-slate-900 font-sans space-y-6 text-xs leading-relaxed"
          style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#ffffff' }}
        >
          {/* Header Top Section: Supplier Identity & Document Box */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b-2 border-slate-800 pb-5 bg-white">
            {/* Supplier Logo & Identity */}
            <div className="space-y-1.5 max-w-md">
              <div className="flex items-center gap-3">
                {(safeEntity.logoUrl || invoice.entityLogoUrl) ? (
                  <img 
                    src={safeEntity.logoUrl || invoice.entityLogoUrl} 
                    alt={safeEntity.name} 
                    className="max-h-16 max-w-[150px] object-contain flex-shrink-0"
                  />
                ) : (
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-900 font-bold text-base bg-slate-100 border border-slate-200 flex-shrink-0"
                  >
                    {safeEntity.logoBadge || 'EN'}
                  </div>
                )}
                <div>
                  <h1 className="text-base font-bold text-slate-900 tracking-tight leading-tight uppercase">
                    {safeEntity.name}
                  </h1>
                  <p className="text-xs text-slate-600 font-medium">{safeEntity.tagline || safeEntity.tradeName}</p>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 space-y-0.5 pt-1">
                <p>{safeEntity.addressLine1}{safeEntity.addressLine2 ? `, ${safeEntity.addressLine2}` : ''}{safeEntity.pincode ? ` - ${safeEntity.pincode}` : ''}</p>
                <p>
                  <span className="font-semibold text-slate-900">State:</span> {supplierState.name} (State Code: <span className="font-mono font-bold text-slate-900">{supplierState.code}</span>)
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 font-mono text-[11px] text-slate-900 pt-0.5">
                  {safeEntity.gstin ? (
                    <span><strong>GSTIN:</strong> {safeEntity.gstin}</span>
                  ) : (
                    <span className="text-slate-500 font-sans italic">GST: Not Applicable / Unregistered</span>
                  )}
                  {safeEntity.pan && <span><strong>PAN:</strong> {safeEntity.pan}</span>}
                  {safeEntity.cinOrLlp && <span><strong>CIN/LLP:</strong> {safeEntity.cinOrLlp}</span>}
                </div>
                <div className="flex flex-wrap gap-x-4 text-[10px] text-slate-500 pt-0.5 font-sans">
                  {safeEntity.email && <span>Email: {safeEntity.email}</span>}
                  {safeEntity.phone && <span>Phone: {safeEntity.phone}</span>}
                  {safeEntity.website && <span>Web: {safeEntity.website}</span>}
                </div>
              </div>
            </div>

            {/* Document Title & Invoice Meta Box */}
            <div className="text-left sm:text-right space-y-2 flex-shrink-0">
              <div className="inline-block bg-slate-900 text-white px-4 py-1.5 rounded-xl text-xs font-black tracking-widest uppercase shadow-xs">
                TAX INVOICE
              </div>
              <p className="text-[9px] text-slate-500 font-semibold tracking-tight">(Section 31 CGST Act & Rule 46 Compliant)</p>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-left space-y-1 font-mono text-[11px] min-w-[210px]">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Invoice No:</span>
                  <span className="font-bold text-slate-900">{invoice.invoiceNumber || 'INV/24-25/101'}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Invoice Date:</span>
                  <span className="font-semibold text-slate-800">{invoice.invoiceDate}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Due Date:</span>
                  <span className="font-semibold text-slate-800">{invoice.dueDate}</span>
                </div>
                {invoice.poNumber && (
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">PO / Ref No:</span>
                    <span className="font-semibold text-slate-800">{invoice.poNumber}</span>
                  </div>
                )}
                <div className="flex justify-between gap-4 pt-1 border-t border-slate-200 text-[10px]">
                  <span className="text-slate-500">Reverse Charge:</span>
                  <span className={`font-bold ${invoice.isReverseCharge ? 'text-rose-600' : 'text-slate-800'}`}>
                    {invoice.isReverseCharge ? 'YES (Applicable)' : 'NO'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Bill To (Customer Details) & Place of Supply */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            {/* Recipient Bill To */}
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 block">
                Details of Receiver / Billed To:
              </span>
              <h2 className="text-xs font-bold text-slate-900 uppercase">{invoice.clientName || 'Valued Client'}</h2>
              <p className="text-[11px] text-slate-600 whitespace-pre-line leading-tight">
                {invoice.clientAddress || 'Address not specified'}
              </p>
              <div className="pt-1 font-mono text-[11px] text-slate-900 space-y-0.5">
                <div>
                  <strong>GSTIN:</strong> {invoice.clientGstin || 'UNREGISTERED / NOT APPLICABLE'}
                </div>
                {invoice.clientPan && <div><strong>PAN:</strong> {invoice.clientPan}</div>}
              </div>
            </div>

            {/* Place of Supply & Consignee */}
            <div className="space-y-1 sm:border-l sm:border-slate-200 sm:pl-4">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 block">
                Place of Supply & Delivery Details:
              </span>
              <div className="text-[11px] text-slate-800 space-y-1 pt-0.5">
                <div>
                  <span className="text-slate-500">Place of Supply (POS):</span>{' '}
                  <strong className="font-semibold text-slate-900">{posState.name} ({posState.code})</strong>
                </div>
                <div>
                  <span className="text-slate-500">Tax Type:</span>{' '}
                  <span className="font-bold font-mono px-1.5 py-0.2 bg-white rounded border border-slate-200 text-slate-900">
                    {isInterState ? 'INTER-STATE (IGST)' : 'INTRA-STATE (CGST + SGST)'}
                  </span>
                </div>
                {invoice.deliveryAddress && invoice.deliveryAddress !== invoice.clientAddress && (
                  <div className="pt-1 text-[10px] text-slate-600">
                    <span className="font-semibold">Shipped To:</span> {invoice.deliveryAddress}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Itemized Table */}
          <div className="border border-slate-200 rounded-2xl overflow-x-auto shadow-xs bg-white">
            <table className="w-full text-left text-[11px] min-w-[650px]">
              <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3">Description of Goods / Services</th>
                  <th className="py-2.5 px-3 font-mono">SAC/HSN</th>
                  <th className="py-2.5 px-3 text-right">Qty & Unit</th>
                  <th className="py-2.5 px-3 text-right">Rate (₹)</th>
                  <th className="py-2.5 px-3 text-right">Discount</th>
                  <th className="py-2.5 px-3 text-right">Taxable Value (₹)</th>
                  <th className="py-2.5 px-3 text-right">GST %</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {safeItems.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{item.description || 'Service Item'}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{item.sacHsn || '-'}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">{item.qty || 1} {item.unit || 'Unit'}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{formatINR(item.rate || 0)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                      {item.discountPercent > 0 ? `${item.discountPercent}%` : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {formatINR(item.taxableAmount || 0)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">{item.gstRate || 0}%</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {formatINR(item.lineTotal || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 4: Totals Summary & Tax Breakdown Table */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 bg-white">
            {/* Left: GST Tax Analysis Breakup */}
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 block">
                GST Tax Computation Summary:
              </span>
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                <table className="w-full text-left text-[10px]">
                  <thead className="bg-slate-50 text-slate-800 font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-1.5 px-2 font-mono">SAC</th>
                      <th className="py-1.5 px-2 text-right">Taxable</th>
                      {!isInterState ? (
                        <>
                          <th className="py-1.5 px-2 text-right">CGST</th>
                          <th className="py-1.5 px-2 text-right">SGST</th>
                        </>
                      ) : (
                        <th className="py-1.5 px-2 text-right">IGST</th>
                      )}
                      <th className="py-1.5 px-2 text-right">Total Tax</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-slate-700 bg-white">
                    {safeItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-1 px-2">{item.sacHsn || '-'}</td>
                        <td className="py-1 px-2 text-right">{formatINR(item.taxableAmount || 0)}</td>
                        {!isInterState ? (
                          <>
                            <td className="py-1 px-2 text-right">{formatINR(item.cgstAmount || 0)}</td>
                            <td className="py-1 px-2 text-right">{formatINR(item.sgstAmount || 0)}</td>
                          </>
                        ) : (
                          <td className="py-1 px-2 text-right">{formatINR(item.igstAmount || 0)}</td>
                        )}
                        <td className="py-1 px-2 text-right font-bold text-slate-900">{formatINR(item.totalTax || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Amount in Words */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] leading-tight">
                <span className="font-bold text-slate-700 block text-[9px] uppercase tracking-wider">Total Amount in Words:</span>
                <span className="font-semibold text-slate-900">{amountInWords}</span>
              </div>
            </div>

            {/* Right: Calculations Subtotal & Grand Total */}
            <div className="space-y-2">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-slate-700">
                  <span>Total Taxable Value:</span>
                  <span className="font-bold text-slate-900">{formatINR(taxableTotal)}</span>
                </div>

                {!isInterState ? (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>Central Tax (CGST):</span>
                      <span className="font-semibold text-slate-900">{formatINR(totalCgst)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>State Tax (SGST):</span>
                      <span className="font-semibold text-slate-900">{formatINR(totalSgst)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-slate-600">
                    <span>Integrated Tax (IGST):</span>
                    <span className="font-semibold text-slate-900">{formatINR(totalIgst)}</span>
                  </div>
                )}

                {invoice.roundOff !== undefined && invoice.roundOff !== null && Number(invoice.roundOff) !== 0 && (
                  <div className="flex justify-between text-slate-500 text-[10px]">
                    <span>Round Off:</span>
                    <span>{Number(invoice.roundOff) > 0 ? `+${Number(invoice.roundOff).toFixed(2)}` : Number(invoice.roundOff).toFixed(2)}</span>
                  </div>
                )}

                {/* Grand Total Box (Pure White & Slate) */}
                <div className="flex justify-between items-center pt-2.5 border-t-2 border-slate-800 text-sm font-sans">
                  <span className="font-extrabold uppercase tracking-wider text-slate-950">Grand Total:</span>
                  <span className="font-black text-slate-950 text-base font-mono">{formatINR(grandTotal)}</span>
                </div>
              </div>

              {/* TDS Deduction Reference */}
              {invoice.tdsAmount > 0 && (
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[10px] text-amber-900 flex justify-between font-mono">
                  <span>Client TDS under Sec {invoice.tdsSection || '194J'} ({invoice.tdsRate || 10}%):</span>
                  <span className="font-bold">- {formatINR(invoice.tdsAmount)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 5: Bank Details, UPI QR & Signatory */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t-2 border-slate-800 bg-white">
            {/* Bank Details for NEFT/RTGS */}
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                <CreditCard size={12} />
                <span>Bank Payment Details</span>
              </span>
              <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200 font-mono text-[10px] space-y-0.5 leading-tight">
                <div><strong>Bank:</strong> {bankName}</div>
                <div><strong>A/C Name:</strong> {safeEntity.name}</div>
                <div><strong>A/C No:</strong> <span className="font-bold text-slate-900">{bankAccountNo}</span></div>
                <div><strong>IFSC:</strong> <span className="font-bold text-slate-900">{bankIfsc}</span></div>
                {bankBranch && <div><strong>Branch:</strong> {bankBranch}</div>}
              </div>
            </div>

            {/* UPI QR Code */}
            <div className="space-y-1 text-center flex flex-col items-center justify-center">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                <QrCode size={12} />
                <span>Scan & Pay via UPI</span>
              </span>
              <div className="p-1 bg-white border border-slate-200 rounded-2xl shadow-xs inline-block">
                <img 
                  src={qrCodeUrl} 
                  alt="UPI Payment QR Code" 
                  className="w-20 h-20 object-contain rounded-xl"
                />
              </div>
              <span className="text-[9px] font-mono text-slate-500">{upiId}</span>
            </div>

            {/* Authorized Signatory */}
            <div className="space-y-1 text-right flex flex-col justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 block">
                For {safeEntity.name}
              </span>

              <div className="py-2">
                <div className="inline-block p-1.5 border border-dashed border-emerald-600 rounded-xl bg-emerald-50 text-[9px] font-mono text-emerald-800 text-center">
                  <div className="font-bold">DIGITALLY SIGNED</div>
                  <div className="text-[8px] text-emerald-600">Authorized Representative</div>
                </div>
              </div>

              <div>
                <p className="font-bold text-xs text-slate-900">{invoice.signatoryName || safeEntity.signatory?.name || 'Authorized Signatory'}</p>
                <p className="text-[10px] text-slate-500">{invoice.signatoryDesignation || safeEntity.signatory?.designation || 'Managing Partner'}</p>
              </div>
            </div>
          </div>

          {/* Section 6: Terms & Conditions and Notes */}
          <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-600 space-y-1 bg-white">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="space-y-0.5 max-w-lg">
                <span className="font-bold text-slate-900 uppercase">Terms & Conditions:</span>
                <p className="whitespace-pre-line leading-normal">{invoice.terms || safeEntity.termsAndConditions?.join('\n') || 'Payment due within 15 days.'}</p>
              </div>
              {invoice.notes && (
                <div className="space-y-0.5 sm:text-right max-w-xs">
                  <span className="font-bold text-slate-900 uppercase">Notes:</span>
                  <p className="leading-normal">{invoice.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer watermark */}
          <div className="text-center pt-2 text-[9px] text-slate-400 font-medium border-t border-slate-100 bg-white">
            This is a computer-generated tax invoice.
          </div>
        </div>

      </div>
    </div>
  );
}
