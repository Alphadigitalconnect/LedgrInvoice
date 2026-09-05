import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  X, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Calculator,
  Layers,
  Building2,
  AlertTriangle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { formatINR, getStateFromGSTIN, validateGSTIN, GST_STATES } from '../../data/constants';
import { downloadInvoicesTemplate } from '../../services/excelTemplateService';

export default function ImportInvoicesModal({ 
  isOpen, 
  onClose, 
  onImportSuccess, 
  entities = [], 
  clients = [],
  activeEntityId = 'all',
  onNavigateToEntities
}) {
  if (!isOpen) return null;

  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [importSuccess, setImportSuccess] = useState(null);

  const hasEntities = entities && entities.length > 0;

  // Download Sample Invoices Excel Template
  const handleDownloadExcelTemplate = async () => {
    try {
      await downloadInvoicesTemplate(entities);
    } catch (err) {
      console.error('Error generating Excel template:', err);
      alert('Could not generate Excel template. Please try again.');
    }
  };

  const handleDownloadCsvTemplate = () => {
    const defaultEntity = entities[0] || { name: "SC & Associates", gstin: "36AABCS1234F1Z5" };
    // Blank headers template (NO dummy rows)
    const headerCols = [
      "Invoice Number",
      "Invoice Date (YYYY-MM-DD)",
      "Due Date (YYYY-MM-DD)",
      "Issuing Entity Name",
      "Client Name",
      "Client GSTIN",
      "Client State / Place of Supply",
      "Billing Address",
      "City",
      "PIN Code",
      "Description of Services",
      "HSN / SAC Code",
      "Quantity",
      "Taxable Amount",
      "GST Rate %",
      "Status",
      "Amount Paid"
    ];

    const csvContent = "data:text/csv;charset=utf-8," + headerCols.join(",") + "\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Invoices_Import_Template_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse Excel / CSV File
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!hasEntities) {
      setValidationErrors(['Cannot import invoices: No Entity profiles found. Please create an Issuing Entity first in Entity Profiles.']);
      return;
    }

    setFile(selectedFile);
    setIsLoading(true);
    setValidationErrors([]);
    setImportSuccess(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        
        // Find sheet (prefer Invoices_Data or first sheet)
        const wsName = wb.SheetNames.includes('Invoices_Data') 
          ? 'Invoices_Data' 
          : wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawJson = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          setValidationErrors(['The uploaded spreadsheet has no data rows. Please fill in your invoice details and upload again.']);
          setParsedRows([]);
          setIsLoading(false);
          return;
        }

        const rows = [];
        const errors = [];

        rawJson.forEach((row, idx) => {
          const rowNum = idx + 2;

          // Skip completely empty rows
          const hasAnyValue = Object.values(row).some(v => String(v).trim() !== '');
          if (!hasAnyValue) return;

          // 1. STRICT ENTITY VALIDATION: Must match an existing created entity
          const entityNameInput = String(row['Issuing Entity Name *'] || row['Issuing Entity Name'] || row['Entity Name'] || row['Entity'] || '').trim();
          const entityGstinInput = String(row['Issuing Entity GSTIN'] || row['Entity GSTIN'] || '').trim().toUpperCase();

          let matchedEntity = null;
          if (entityGstinInput) {
            matchedEntity = entities.find(e => e.gstin && e.gstin.toUpperCase() === entityGstinInput);
          }
          if (!matchedEntity && entityNameInput) {
            matchedEntity = entities.find(e => 
              (e.tradeName && e.tradeName.toLowerCase() === entityNameInput.toLowerCase()) ||
              (e.name && e.name.toLowerCase() === entityNameInput.toLowerCase()) ||
              (e.tradeName && e.tradeName.toLowerCase().includes(entityNameInput.toLowerCase())) ||
              (e.name && e.name.toLowerCase().includes(entityNameInput.toLowerCase()))
            );
          }

          if (!matchedEntity) {
            const availableNames = entities.map(e => `"${e.tradeName || e.name}"`).join(', ');
            errors.push(
              `Row ${rowNum}: Issuing Entity "${entityNameInput || 'Blank'}" does not match any created entity profile. Available entities: [${availableNames}]. You must create the entity in Entity Profiles first.`
            );
            return;
          }

          // 2. Resolve Client Name & Address Details
          const clientName = String(row['Client Name *'] || row['Client Name'] || row['Customer Name'] || row['Billed To'] || row['Client'] || '').trim();
          if (!clientName) {
            errors.push(`Row ${rowNum}: Client Name is required.`);
            return;
          }

          const clientGstin = String(row['Client GSTIN'] || row['Customer GSTIN'] || row['GSTIN (15 Digits)'] || row['GSTIN'] || '').trim().toUpperCase();
          let clientState = String(row['Client State / Place of Supply *'] || row['Client State'] || row['Place of Supply'] || row['State'] || '').trim();
          const address = String(row['Billing Address'] || row['Address'] || '').trim();
          const city = String(row['City'] || '').trim();
          const pinCode = String(row['PIN Code'] || row['Pincode'] || '').trim();

          // 3. GSTIN Validation
          if (clientGstin) {
            const gstValidation = validateGSTIN(clientGstin);
            if (!gstValidation.valid) {
              errors.push(`Row ${rowNum}: Client GSTIN "${clientGstin}" is invalid (${gstValidation.message}).`);
            } else if (!clientState && gstValidation.state) {
              clientState = gstValidation.state.name;
            }
          }

          if (!clientState) {
            clientState = matchedEntity.stateName || 'Same State';
          }

          // 4. Resolve Invoice Number & Dates
          const invoiceNum = String(row['Invoice Number'] || row['Invoice No'] || row['Invoice #'] || '').trim() ||
            `${matchedEntity.invoicePrefix || 'INV/24-25/'}${Date.now().toString().slice(-4)}${idx + 1}`;

          const invoiceDate = String(row['Invoice Date (YYYY-MM-DD)'] || row['Invoice Date'] || row['Date'] || '').trim() || new Date().toISOString().slice(0, 10);
          const dueDate = String(row['Due Date (YYYY-MM-DD)'] || row['Due Date'] || '').trim() || new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10);

          // 5. Line Item details
          const description = String(row['Description of Services *'] || row['Description of Services'] || row['Description'] || row['Service'] || row['Item Name'] || 'Professional Services').trim();
          const sacCode = String(row['HSN / SAC Code'] || row['SAC Code'] || row['HSN Code'] || row['SAC'] || '998311').trim();
          const quantity = Number(row['Quantity'] || row['Qty'] || 1) || 1;
          const taxableAmount = Number(row['Taxable Amount (₹) *'] || row['Taxable Amount'] || row['Rate'] || row['Unit Price'] || row['Amount'] || 0);

          if (taxableAmount <= 0) {
            errors.push(`Row ${rowNum}: Taxable Amount must be a positive number greater than 0.`);
            return;
          }

          const rawGstRate = row['GST Rate % *'] || row['GST Rate %'] || row['GST Rate'] || row['Tax Rate'] || 18;
          const gstRate = Number(String(rawGstRate).replace('%', '').trim()) || 18;

          // 6. Automatic GST Calculation: Intra-state (CGST+SGST) vs Inter-state (IGST)
          const isInterState = clientState && matchedEntity.stateName && 
            clientState.toLowerCase() !== matchedEntity.stateName.toLowerCase();

          let cgstAmount = 0;
          let sgstAmount = 0;
          let igstAmount = 0;
          let totalTax = 0;

          if (isInterState) {
            igstAmount = Math.round((taxableAmount * gstRate) / 100 * 100) / 100;
            totalTax = igstAmount;
          } else {
            cgstAmount = Math.round((taxableAmount * (gstRate / 2)) / 100 * 100) / 100;
            sgstAmount = Math.round((taxableAmount * (gstRate / 2)) / 100 * 100) / 100;
            totalTax = cgstAmount + sgstAmount;
          }

          const grandTotal = Math.round((taxableAmount + totalTax) * 100) / 100;
          
          // 7. Status & Payment
          const statusInput = String(row['Status *'] || row['Status'] || 'PENDING').trim().toUpperCase();
          const amountPaidInput = Number(row['Amount Paid (₹)'] || row['Amount Paid'] || 0);
          const isPaid = statusInput === 'PAID' || (amountPaidInput >= grandTotal && grandTotal > 0);
          const resolvedStatus = isPaid ? 'PAID' : (statusInput === 'DRAFT' ? 'DRAFT' : 'SENT');
          const resolvedAmountPaid = isPaid ? (amountPaidInput > 0 ? amountPaidInput : grandTotal) : amountPaidInput;

          rows.push({
            id: `inv-import-${Date.now()}-${idx}`,
            invoiceNumber: invoiceNum,
            invoiceDate: invoiceDate,
            dueDate: dueDate,
            entityId: matchedEntity.id,
            entityName: matchedEntity.tradeName || matchedEntity.name,
            entityGstin: matchedEntity.gstin,
            entityState: matchedEntity.stateName,
            clientName: clientName,
            clientGstin: clientGstin,
            clientState: clientState,
            clientAddress: address,
            clientCity: city,
            clientPinCode: pinCode,
            items: [
              {
                id: `item-${Date.now()}-${idx}`,
                description: description,
                sacCode: sacCode,
                quantity: quantity,
                rate: taxableAmount / quantity,
                amount: taxableAmount,
                taxRate: gstRate
              }
            ],
            taxableAmount: taxableAmount,
            subtotal: taxableAmount,
            cgstAmount: cgstAmount,
            sgstAmount: sgstAmount,
            igstAmount: igstAmount,
            totalTax: totalTax,
            grandTotal: grandTotal,
            totalAmount: grandTotal,
            status: resolvedStatus,
            amountPaid: resolvedAmountPaid,
            createdAt: new Date().toISOString()
          });
        });

        setParsedRows(rows);
        setValidationErrors(errors);
      } catch (err) {
        console.error('Error parsing Invoices file:', err);
        setValidationErrors(['Failed to read file. Please ensure it is a valid .xlsx or .csv file.']);
        setParsedRows([]);
      } finally {
        setIsLoading(false);
      }
    };

    reader.readAsBinaryString(selectedFile);
  };

  // Perform Invoice Import
  const handleConfirmImport = () => {
    if (parsedRows.length === 0) return;

    if (onImportSuccess) {
      onImportSuccess(parsedRows);
    }

    setImportSuccess(`Successfully imported ${parsedRows.length} invoices.`);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-scaleIn">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-white border border-slate-700">
              <FileSpreadsheet size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Import Invoices from Excel / CSV</h2>
              <p className="text-[11px] text-slate-400">
                Bulk upload invoices with automatic GST calculation, state dropdowns, client address, and entity validation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Prerequisite Check: Entity Profiles */}
          {!hasEntities ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-amber-900">Issuing Entity Required Before Importing</h3>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    You have not created any Issuing Entity profiles yet. Invoices can only be imported for entities that exist in your Entity Profiles. Please create your entity first.
                  </p>
                </div>
              </div>
              <div className="pl-7">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onNavigateToEntities) onNavigateToEntities();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold rounded-lg transition cursor-pointer shadow-2xs"
                >
                  <Building2 size={13} />
                  <span>Go to Entity Profiles & Create Entity</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Download Template Banner */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Download size={14} className="text-slate-600" />
                    <span>Download Clean Excel Template (No Sample Data)</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Includes dropdowns for your registered entities, Indian states, GST rates, status, and automatic GST calculation formulas.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadExcelTemplate}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 text-xs font-bold rounded-lg transition cursor-pointer shadow-2xs flex items-center gap-1.5"
                  >
                    <Download size={13} />
                    <span>Download .XLSX</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadCsvTemplate}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium rounded-lg transition cursor-pointer shadow-2xs"
                  >
                    <span>Download .CSV</span>
                  </button>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
                  file ? 'border-slate-900 bg-slate-50/50' : 'border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50/30'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".xlsx, .xls, .csv" 
                  className="hidden" 
                />
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center mx-auto mb-2">
                  <Upload size={18} />
                </div>
                {file ? (
                  <div>
                    <span className="text-xs font-bold text-slate-900">{file.name}</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Click to choose a different spreadsheet file</p>
                  </div>
                ) : (
                  <div>
                    <span className="text-xs font-bold text-slate-800">Click to upload Excel or CSV Invoices file</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Supported formats: .xlsx, .xls, .csv</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle size={14} />
                <span>Validation Notices ({validationErrors.length})</span>
              </div>
              <ul className="list-disc list-inside text-[11px] space-y-0.5 max-h-40 overflow-y-auto">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Import Success Message */}
          {importSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-medium">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
              <span>{importSuccess}</span>
            </div>
          )}

          {/* Parsed Invoices Preview */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                <span>Preview ({parsedRows.length} valid invoices ready to import)</span>
                <span className="text-[11px] text-slate-500 font-normal">Entities verified & GST calculated</span>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-60 shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="p-2">Invoice #</th>
                      <th className="p-2">Issuing Entity</th>
                      <th className="p-2">Client & State</th>
                      <th className="p-2">Description</th>
                      <th className="p-2 text-right">Taxable (₹)</th>
                      <th className="p-2 text-right">Total (₹)</th>
                      <th className="p-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((inv, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2 whitespace-nowrap">
                          <span className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</span>
                          <div className="text-[10px] text-slate-400">{inv.invoiceDate}</div>
                        </td>
                        <td className="p-2 whitespace-nowrap">
                          <span className="font-medium text-slate-800">{inv.entityName}</span>
                        </td>
                        <td className="p-2 max-w-[140px] truncate">
                          <span className="font-semibold text-slate-800">{inv.clientName}</span>
                          <div className="text-[10px] text-slate-400">
                            {inv.clientState} {inv.clientGstin ? `• ${inv.clientGstin}` : ''}
                          </div>
                        </td>
                        <td className="p-2 max-w-[160px] truncate text-slate-600 text-[11px]" title={inv.items[0]?.description}>
                          {inv.items[0]?.description}
                        </td>
                        <td className="p-2 text-right font-mono text-slate-700 whitespace-nowrap">
                          {formatINR(inv.taxableAmount)}
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          {formatINR(inv.grandTotal)}
                        </td>
                        <td className="p-2 text-center whitespace-nowrap">
                          {inv.status === 'PAID' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              PAID
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              PENDING
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={parsedRows.length === 0 || isLoading || !hasEntities}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition disabled:opacity-40 cursor-pointer shadow-2xs"
          >
            <Check size={14} />
            <span>Import {parsedRows.length > 0 ? `${parsedRows.length} Invoices` : 'Invoices'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}

