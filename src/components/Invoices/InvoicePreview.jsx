import React, { useRef, useState } from 'react';
import { 
  Printer, 
  Share2, 
  X, 
  Download, 
  Check, 
  CreditCard, 
  QrCode,
  Edit3
} from 'lucide-react';
import { formatINR, numberToWordsIndian, GST_STATES } from '../../data/constants';
import html2pdf from 'html2pdf.js';

// Format date to DD-MM-YYYY (handles Excel serial dates, ISO strings, YYYY-MM-DD, etc.)
export function formatDateDMY(val) {
  if (!val || String(val).trim() === '') return '-';

  // Excel serial number (e.g. 46261)
  if (typeof val === 'number' || /^\d{5}$/.test(String(val).trim())) {
    const serial = Number(val);
    const dateObj = new Date((serial - 25569) * 86400 * 1000);
    if (!isNaN(dateObj.getTime())) {
      const d = String(dateObj.getUTCDate()).padStart(2, '0');
      const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
      const y = dateObj.getUTCFullYear();
      return `${d}-${m}-${y}`;
    }
  }

  const str = String(val).trim();
  
  // DD/MM/YYYY or DD-MM-YYYY
  if (/^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(str)) {
    const parts = str.split(/[/-]/);
    const d = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    const y = parts[2];
    return `${d}-${m}-${y}`;
  }

  // YYYY-MM-DD or ISO
  if (/^\d{4}[/-]\d{1,2}[/-]\d{1,2}/.test(str)) {
    const parts = str.split(/[/-]/);
    const y = parts[0];
    const m = parts[1].padStart(2, '0');
    const d = parts[2].slice(0, 2).padStart(2, '0');
    return `${d}-${m}-${y}`;
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1990) {
    const d = String(parsed.getDate()).padStart(2, '0');
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const y = parsed.getFullYear();
    return `${d}-${m}-${y}`;
  }

  return str;
}

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

  // Safe fallback for entity
  const safeEntity = entity || {
    name: invoice.entityName || 'Business Entity',
    tradeName: invoice.entityTradeName || '',
    tagline: '',
    gstin: invoice.entityGstin || '',
    pan: invoice.entityPan || '',
    addressLine1: invoice.entityAddress || '',
    addressLine2: '',
    city: invoice.entityCity || '',
    pincode: invoice.entityPinCode || '',
    stateCode: '36',
    stateName: invoice.entityState || 'Telangana',
    email: invoice.entityEmail || '',
    phone: invoice.entityPhone || invoice.entityMobile || '',
    website: '',
    bankName: '',
    bankAccountNo: '',
    bankIfsc: '',
    bankBranch: '',
    upiId: '',
    signatory: {
      name: invoice.signatoryName || 'Authorized Signatory',
      designation: invoice.signatoryDesignation || 'Managing Partner'
    },
    termsAndConditions: [
      '1. Payment is due within 15 days from invoice date.',
      '2. TDS deducted, if any, under Section 194J/194C should be deposited with govt.',
      '3. Please cite the invoice number in all NEFT / RTGS narration.'
    ]
  };

  const supplierState = GST_STATES.find(s => s.code === safeEntity.stateCode) || { 
    code: safeEntity.stateCode || '36', 
    name: safeEntity.stateName || 'State' 
  };
  const posState = GST_STATES.find(s => s.code === invoice.placeOfSupplyStateCode) || { 
    code: invoice.placeOfSupplyStateCode || safeEntity.stateCode || '36', 
    name: invoice.placeOfSupplyStateName || safeEntity.stateName || "State" 
  };

  const isInterState = invoice.isInterState !== undefined 
    ? invoice.isInterState 
    : (String(safeEntity.stateCode || '36') !== String(invoice.placeOfSupplyStateCode || safeEntity.stateCode || '36'));

  const rawItems = Array.isArray(invoice.items) && invoice.items.length > 0 ? invoice.items : [
    {
      id: 'item-1',
      description: 'Professional Services',
      sacHsn: '998311',
      qty: 1,
      unit: 'Unit',
      rate: invoice.taxableTotal || invoice.grandTotal || 0,
      discountPercent: 0,
      taxableAmount: invoice.taxableTotal || invoice.grandTotal || 0,
      gstRate: 0
    }
  ];

  // Calculate items with strict GST rate handling (0% GST -> 0 tax)
  const safeItems = rawItems.map((item, idx) => {
    const qty = parseFloat(item.qty || item.quantity) || 1;
    const rate = parseFloat(item.rate) || 0;
    const discountPct = parseFloat(item.discountPercent || item.discount) || 0;
    
    // Check if GST is charged or 0%
    const rawRate = item.gstRate !== undefined ? item.gstRate : (item.taxRate !== undefined ? item.taxRate : 0);
    const gstRate = parseFloat(rawRate) || 0;
    const taxableAmount = item.taxableAmount !== undefined 
      ? parseFloat(item.taxableAmount) 
      : (qty * rate * (1 - discountPct / 100));

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    // Only compute GST if rate > 0 and not reverse charge
    if (gstRate > 0 && !invoice.isReverseCharge && safeEntity.gstin) {
      if (isInterState) {
        igstAmount = item.igstAmount !== undefined 
          ? parseFloat(item.igstAmount) 
          : Math.round(taxableAmount * (gstRate / 100) * 100) / 100;
      } else {
        cgstAmount = item.cgstAmount !== undefined 
          ? parseFloat(item.cgstAmount) 
          : Math.round(taxableAmount * (gstRate / 200) * 100) / 100;
        sgstAmount = item.sgstAmount !== undefined 
          ? parseFloat(item.sgstAmount) 
          : Math.round(taxableAmount * (gstRate / 200) * 100) / 100;
      }
    }

    const totalTax = cgstAmount + sgstAmount + igstAmount;
    const lineTotal = taxableAmount + totalTax;

    return {
      ...item,
      qty,
      rate,
      discountPercent: discountPct,
      gstRate,
      taxRate: gstRate,
      sacHsn: item.sacHsn || item.sacCode || item.hsnCode || '-',
      taxableAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalTax,
      lineTotal
    };
  });

  const taxableTotal = safeItems.reduce((sum, it) => sum + it.taxableAmount, 0);
  const totalCgst = safeItems.reduce((s, it) => s + it.cgstAmount, 0);
  const totalSgst = safeItems.reduce((s, it) => s + it.sgstAmount, 0);
  const totalIgst = safeItems.reduce((s, it) => s + it.igstAmount, 0);
  const grandTotal = Math.round((taxableTotal + totalCgst + totalSgst + totalIgst) * 100) / 100;
  const amountInWords = numberToWordsIndian(grandTotal);

  // Bank & UPI resolution
  const bankName = safeEntity.bankName || safeEntity.bankDetails?.bankName || '';
  const bankAccountNo = safeEntity.bankAccountNo || safeEntity.bankDetails?.accountNumber || '';
  const bankIfsc = safeEntity.bankIfsc || safeEntity.bankDetails?.ifscCode || '';
  const bankBranch = safeEntity.bankBranch || safeEntity.bankDetails?.branch || '';
  
  // UPI ID: Only consider present if explicitly set by user (no fake fallback)
  const upiId = (safeEntity.upiId || safeEntity.bankDetails?.upiId || invoice.entityUpiId || '').trim();
  const hasUpi = upiId.length > 0 && upiId.includes('@');
  const hasBankDetails = !!(bankName || bankAccountNo || bankIfsc);

  const upiPayString = hasUpi ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(safeEntity.name)}&am=${grandTotal}&cu=INR&tn=${encodeURIComponent(`Invoice ${invoice.invoiceNumber || 'INV'}`)}` : '';
  const qrCodeUrl = hasUpi ? `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(upiPayString)}&margin=4` : '';

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
          className="invoice-printable-sheet bg-white p-8 sm:p-10 text-slate-900 font-sans space-y-5 text-xs leading-relaxed"
          style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#ffffff' }}
        >
          {/* Header Top Section: Supplier Identity & Document Box */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b-2 border-slate-900 pb-5 bg-white">
            {/* Supplier Logo, Name, Full Address & Contact Details */}
            <div className="space-y-1 max-w-md text-left">
              <div className="flex items-center gap-3">
                {(safeEntity.logoUrl || invoice.entityLogoUrl) ? (
                  <img 
                    src={safeEntity.logoUrl || invoice.entityLogoUrl} 
                    alt={safeEntity.name} 
                    className="max-h-14 max-w-[140px] object-contain flex-shrink-0"
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
                  {(safeEntity.tagline || safeEntity.tradeName) && (
                    <p className="text-xs text-slate-600 font-medium">{safeEntity.tagline || safeEntity.tradeName}</p>
                  )}
                </div>
              </div>

              {/* Issuing Entity Complete Address, State & GSTIN */}
              <div className="text-[11px] text-slate-600 space-y-0.5 pt-1.5">
                {(safeEntity.addressLine1 || safeEntity.address) && (
                  <p className="leading-tight text-slate-700">
                    {safeEntity.addressLine1 || safeEntity.address}
                    {safeEntity.addressLine2 ? `, ${safeEntity.addressLine2}` : ''}
                    {safeEntity.city ? `, ${safeEntity.city}` : ''}
                    {safeEntity.pincode ? ` - ${safeEntity.pincode}` : ''}
                  </p>
                )}
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
                {/* Mobile No. & Email ID of Issuing Entity */}
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-slate-700 pt-1 font-sans">
                  {(safeEntity.phone || safeEntity.mobile) && (
                    <span><strong>Mobile:</strong> {safeEntity.phone || safeEntity.mobile}</span>
                  )}
                  {safeEntity.email && (
                    <span><strong>Email:</strong> {safeEntity.email}</span>
                  )}
                  {safeEntity.website && (
                    <span><strong>Web:</strong> {safeEntity.website}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Document Title & Invoice Meta Box */}
            <div className="text-left sm:text-right space-y-2 flex-shrink-0">
              <div className="flex sm:justify-end">
                <span 
                  className="bg-slate-900 text-white font-bold text-xs tracking-wider uppercase px-4 py-1.5 rounded-md inline-flex items-center justify-center text-center shadow-2xs"
                >
                  TAX INVOICE
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left space-y-1 font-mono text-[11px] min-w-[210px]">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500 font-sans">Invoice No:</span>
                  <span className="font-bold text-slate-900">{invoice.invoiceNumber || 'INV/24-25/101'}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500 font-sans">Invoice Date:</span>
                  <span className="font-semibold text-slate-800">{formatDateDMY(invoice.invoiceDate)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500 font-sans">Due Date:</span>
                  <span className="font-semibold text-slate-800">{formatDateDMY(invoice.dueDate)}</span>
                </div>
                {invoice.poNumber && (
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500 font-sans">PO / Ref No:</span>
                    <span className="font-semibold text-slate-800">{invoice.poNumber}</span>
                  </div>
                )}
                <div className="flex justify-between gap-4 pt-1 border-t border-slate-200 text-[10px]">
                  <span className="text-slate-500 font-sans">Reverse Charge:</span>
                  <span className={`font-bold ${invoice.isReverseCharge ? 'text-rose-600' : 'text-slate-800'}`}>
                    {invoice.isReverseCharge ? 'YES (Applicable)' : 'NO'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Bill To (Customer Details) & Place of Supply */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            {/* Recipient Bill To */}
            <div className="space-y-1 text-left">
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

            {/* Place of Supply */}
            <div className="space-y-1 text-left sm:border-l sm:border-slate-200 sm:pl-4">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 block">
                Place of Supply & Delivery Details:
              </span>
              <div className="text-[11px] text-slate-800 space-y-1.5 pt-0.5">
                <div>
                  <span className="text-slate-500">Place of Supply (POS):</span>{' '}
                  <strong className="font-semibold text-slate-900">{posState.name} ({posState.code})</strong>
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
          <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs bg-white">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1 bg-white">
            {/* Left: GST Tax Analysis Breakup */}
            <div className="space-y-2 text-left">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 block">
                GST Tax Computation Summary:
              </span>
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-left text-[10px]">
                  <thead className="bg-slate-50 text-slate-800 font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-1.5 px-2.5 font-mono">SAC</th>
                      <th className="py-1.5 px-2.5 text-right">Taxable</th>
                      {!isInterState ? (
                        <>
                          <th className="py-1.5 px-2.5 text-right">CGST</th>
                          <th className="py-1.5 px-2.5 text-right">SGST</th>
                        </>
                      ) : (
                        <th className="py-1.5 px-2.5 text-right">IGST</th>
                      )}
                      <th className="py-1.5 px-2.5 text-right">Total Tax</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-slate-700 bg-white">
                    {safeItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-1.5 px-2.5">{item.sacHsn || '-'}</td>
                        <td className="py-1.5 px-2.5 text-right">{formatINR(item.taxableAmount || 0)}</td>
                        {!isInterState ? (
                          <>
                            <td className="py-1.5 px-2.5 text-right">{formatINR(item.cgstAmount || 0)}</td>
                            <td className="py-1.5 px-2.5 text-right">{formatINR(item.sgstAmount || 0)}</td>
                          </>
                        ) : (
                          <td className="py-1.5 px-2.5 text-right">{formatINR(item.igstAmount || 0)}</td>
                        )}
                        <td className="py-1.5 px-2.5 text-right font-bold text-slate-900">{formatINR(item.totalTax || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Amount in Words */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] leading-tight">
                <span className="font-bold text-slate-700 block text-[9px] uppercase tracking-wider">Total Amount in Words:</span>
                <span className="font-semibold text-slate-900">{amountInWords}</span>
              </div>
            </div>

            {/* Right: Calculations Subtotal & Grand Total */}
            <div className="space-y-2">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-slate-700">
                  <span className="font-sans">Total Taxable Value:</span>
                  <span className="font-bold text-slate-900">{formatINR(taxableTotal)}</span>
                </div>

                {!isInterState ? (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span className="font-sans">Central Tax (CGST):</span>
                      <span className="font-semibold text-slate-900">{formatINR(totalCgst)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span className="font-sans">State Tax (SGST):</span>
                      <span className="font-semibold text-slate-900">{formatINR(totalSgst)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-slate-600">
                    <span className="font-sans">Integrated Tax (IGST):</span>
                    <span className="font-semibold text-slate-900">{formatINR(totalIgst)}</span>
                  </div>
                )}

                {invoice.roundOff !== undefined && invoice.roundOff !== null && Number(invoice.roundOff) !== 0 && (
                  <div className="flex justify-between text-slate-500 text-[10px]">
                    <span className="font-sans">Round Off:</span>
                    <span>{Number(invoice.roundOff) > 0 ? `+${Number(invoice.roundOff).toFixed(2)}` : Number(invoice.roundOff).toFixed(2)}</span>
                  </div>
                )}

                {/* Grand Total Box (Pure White & Slate) */}
                <div className="flex justify-between items-center pt-2.5 border-t-2 border-slate-900 text-sm font-sans">
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

          {/* Section 5: Bank Details, UPI QR (Only if configured) & Signatory */}
          <div className={`grid grid-cols-1 ${hasUpi && hasBankDetails ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4 pt-3 border-t-2 border-slate-900 bg-white`}>
            {/* Bank Details for NEFT/RTGS */}
            {hasBankDetails ? (
              <div className="space-y-1 text-left">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                  <CreditCard size={12} />
                  <span>Bank Payment Details</span>
                </span>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[10px] space-y-0.5 leading-tight">
                  {bankName && <div><strong>Bank:</strong> {bankName}</div>}
                  <div><strong>A/C Name:</strong> {safeEntity.name}</div>
                  {bankAccountNo && <div><strong>A/C No:</strong> <span className="font-bold text-slate-900">{bankAccountNo}</span></div>}
                  {bankIfsc && <div><strong>IFSC:</strong> <span className="font-bold text-slate-900">{bankIfsc}</span></div>}
                  {bankBranch && <div><strong>Branch:</strong> {bankBranch}</div>}
                </div>
              </div>
            ) : (
              <div className="text-left text-slate-400 text-[11px] italic">
                Bank payment details not specified.
              </div>
            )}

            {/* UPI QR Code - ONLY displayed if UPI ID is explicitly configured */}
            {hasUpi && (
              <div className="space-y-1 text-center flex flex-col items-center justify-center">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                  <QrCode size={12} />
                  <span>Scan & Pay via UPI</span>
                </span>
                <div className="p-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs inline-block">
                  <img 
                    src={qrCodeUrl} 
                    alt="UPI Payment QR Code" 
                    className="w-20 h-20 object-contain rounded-lg"
                  />
                </div>
                <span className="text-[9px] font-mono text-slate-600 font-medium">{upiId}</span>
              </div>
            )}

            {/* Authorized Signatory (Digitally Signed Badge Removed) */}
            <div className="space-y-1 text-right flex flex-col justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 block">
                For {safeEntity.name}
              </span>

              {/* Clean signature area */}
              <div className="py-2 min-h-[44px] flex items-end justify-end">
                {(safeEntity.signatureUrl || invoice.signatureUrl) ? (
                  <img 
                    src={safeEntity.signatureUrl || invoice.signatureUrl} 
                    alt="Signature" 
                    className="max-h-12 object-contain"
                  />
                ) : (
                  <div className="h-8"></div>
                )}
              </div>

              <div>
                <p className="font-bold text-xs text-slate-900">{invoice.signatoryName || safeEntity.signatory?.name || 'Authorized Signatory'}</p>
                <p className="text-[10px] text-slate-500">{invoice.signatoryDesignation || safeEntity.signatory?.designation || 'Managing Partner'}</p>
              </div>
            </div>
          </div>

          {/* Section 6: Terms & Conditions and Notes */}
          <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-600 space-y-1 bg-white text-left">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="space-y-0.5 max-w-lg">
                <span className="font-bold text-slate-900 uppercase">Terms & Conditions:</span>
                <p className="whitespace-pre-line leading-normal text-slate-600">{invoice.terms || safeEntity.termsAndConditions?.join('\n') || 'Payment due within 15 days.'}</p>
              </div>
              {invoice.notes && (
                <div className="space-y-0.5 sm:text-right max-w-xs">
                  <span className="font-bold text-slate-900 uppercase">Notes:</span>
                  <p className="leading-normal text-slate-600">{invoice.notes}</p>
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
