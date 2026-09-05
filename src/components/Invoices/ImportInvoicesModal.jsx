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
  Layers
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { formatINR, getStateFromGSTIN } from '../../data/constants';

export default function ImportInvoicesModal({ 
  isOpen, 
  onClose, 
  onImportSuccess, 
  entities = [], 
  clients = [],
  activeEntityId = 'all'
}) {
  if (!isOpen) return null;

  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [importSuccess, setImportSuccess] = useState(null);

  // Download Sample Invoices Excel Template
  const handleDownloadSample = (format = 'xlsx') => {
    const defaultEntity = entities[0] || { name: "SC & Associates", gstin: "36AABCS1234F1Z5" };
    
    const sampleData = [
      {
        "Invoice Number": "INV/24-25/101",
        "Invoice Date": new Date().toISOString().slice(0, 10),
        "Due Date": new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
        "Issuing Entity Name": defaultEntity.tradeName || defaultEntity.name,
        "Issuing Entity GSTIN": defaultEntity.gstin || "",
        "Client Name": "Acme Innovations Pvt Ltd",
        "Client GSTIN": "29ABCDE1234F1Z5",
        "Client State": "Karnataka",
        "Description of Services": "Statutory Audit & Tax Filing Services Q2",
        "HSN / SAC Code": "998222",
        "Quantity": 1,
        "Taxable Amount": 50000,
        "GST Rate %": 18,
        "Status": "PAID",
        "Amount Paid": 59000
      },
      {
        "Invoice Number": "INV/24-25/102",
        "Invoice Date": new Date().toISOString().slice(0, 10),
        "Due Date": new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
        "Issuing Entity Name": defaultEntity.tradeName || defaultEntity.name,
        "Issuing Entity GSTIN": defaultEntity.gstin || "",
        "Client Name": "Global Marketing Solutions",
        "Client GSTIN": "36AABCS1234F1Z5",
        "Client State": "Telangana",
        "Description of Services": "Monthly Financial Advisory & Management Reporting",
        "HSN / SAC Code": "998311",
        "Quantity": 1,
        "Taxable Amount": 25000,
        "GST Rate %": 18,
        "Status": "PENDING",
        "Amount Paid": 0
      },
      {
        "Invoice Number": "",
        "Invoice Date": new Date().toISOString().slice(0, 10),
        "Due Date": new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        "Issuing Entity Name": defaultEntity.tradeName || defaultEntity.name,
        "Issuing Entity GSTIN": defaultEntity.gstin || "",
        "Client Name": "Sunrise Retail Enterprises",
        "Client GSTIN": "",
        "Client State": "Gujarat",
        "Description of Services": "Internal Controls & Accounting System Setup",
        "HSN / SAC Code": "998231",
        "Quantity": 1,
        "Taxable Amount": 15000,
        "GST Rate %": 18,
        "Status": "PENDING",
        "Amount Paid": 0
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoices_Template");

    if (format === 'csv') {
      XLSX.writeFile(wb, "Invoices_Import_Template.csv", { bookType: "csv" });
    } else {
      XLSX.writeFile(wb, "Invoices_Import_Template.xlsx");
    }
  };

  // Parse Excel / CSV File
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsLoading(true);
    setValidationErrors([]);
    setImportSuccess(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawJson = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          setValidationErrors(['The uploaded spreadsheet has no data rows.']);
          setParsedRows([]);
          setIsLoading(false);
          return;
        }

        const rows = [];
        const errors = [];

        rawJson.forEach((row, idx) => {
          const rowNum = idx + 2;

          // Resolve entity
          const entityNameInput = String(row['Issuing Entity Name'] || row['Entity Name'] || row['Entity'] || '').trim().toLowerCase();
          const entityGstinInput = String(row['Issuing Entity GSTIN'] || row['Entity GSTIN'] || '').trim().toUpperCase();

          let matchedEntity = null;
          if (entityGstinInput) {
            matchedEntity = entities.find(e => e.gstin && e.gstin.toUpperCase() === entityGstinInput);
          }
          if (!matchedEntity && entityNameInput) {
            matchedEntity = entities.find(e => (e.tradeName || e.name || '').toLowerCase().includes(entityNameInput));
          }
          if (!matchedEntity) {
            matchedEntity = (activeEntityId !== 'all' ? entities.find(e => e.id === activeEntityId) : entities[0]) || {
              id: 'entity-default',
              name: 'Primary Firm',
              stateName: 'Telangana',
              stateCode: '36'
            };
          }

          // Resolve Client
          const clientName = String(row['Client Name'] || row['Customer Name'] || row['Billed To'] || row['Client'] || '').trim();
          if (!clientName) {
            errors.push(`Row ${rowNum}: Client Name is required.`);
            return;
          }

          const clientGstin = String(row['Client GSTIN'] || row['Customer GSTIN'] || row['GSTIN'] || '').trim().toUpperCase();
          let clientState = String(row['Client State'] || row['Place of Supply'] || row['State'] || '').trim();

          if (!clientState && clientGstin && clientGstin.length >= 2) {
            const stateObj = getStateFromGSTIN(clientGstin);
            if (stateObj) clientState = stateObj.name;
          }
          if (!clientState) {
            clientState = matchedEntity.stateName || 'Same State';
          }

          // Resolve Invoice Number & Dates
          const invoiceNum = String(row['Invoice Number'] || row['Invoice No'] || row['Invoice #'] || '').trim() ||
            `${matchedEntity.invoicePrefix || 'INV/24-25/'}${Date.now().toString().slice(-4)}${idx + 1}`;

          const invoiceDate = String(row['Invoice Date'] || row['Date'] || '').trim() || new Date().toISOString().slice(0, 10);
          const dueDate = String(row['Due Date'] || '').trim() || new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10);

          // Line Item details
          const description = String(row['Description of Services'] || row['Description'] || row['Service'] || row['Item Name'] || 'Professional Services').trim();
          const sacCode = String(row['HSN / SAC Code'] || row['SAC Code'] || row['HSN Code'] || row['SAC'] || '998311').trim();
          const quantity = Number(row['Quantity'] || row['Qty'] || 1) || 1;
          const taxableAmount = Number(row['Taxable Amount'] || row['Rate'] || row['Unit Price'] || row['Amount'] || 0);

          if (taxableAmount <= 0) {
            errors.push(`Row ${rowNum}: Taxable Amount must be greater than 0.`);
            return;
          }

          const gstRate = Number(row['GST Rate %'] || row['GST Rate'] || row['Tax Rate'] || 18);

          // Calculate GST: Intra-state (CGST+SGST) vs Inter-state (IGST)
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
          
          // Status & Payment
          const statusInput = String(row['Status'] || 'PENDING').trim().toUpperCase();
          const amountPaidInput = Number(row['Amount Paid'] || 0);
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
                Bulk upload sales invoices with automatic GST calculation, client linking, and status tracking
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
          
          {/* Download Template Banner */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Download size={14} className="text-slate-600" />
                <span>Download Sample Invoices Template</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Includes sample columns for Invoice No, Client, Taxable Amount, GST Rate, and Payment Status.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownloadSample('xlsx')}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg transition cursor-pointer shadow-2xs"
              >
                Sample .XLSX
              </button>
              <button
                type="button"
                onClick={() => handleDownloadSample('csv')}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg transition cursor-pointer shadow-2xs"
              >
                Sample .CSV
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

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle size={14} />
                <span>Validation Notices</span>
              </div>
              <ul className="list-disc list-inside text-[11px] space-y-0.5">
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
                <span>Preview ({parsedRows.length} invoices ready to import)</span>
                <span className="text-[11px] text-slate-500 font-normal">GST calculated & clients auto-mapped</span>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-60 shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="p-2">Invoice #</th>
                      <th className="p-2">Client / Billed To</th>
                      <th className="p-2">Services Description</th>
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
                        <td className="p-2 max-w-[130px] truncate">
                          <span className="font-semibold text-slate-800">{inv.clientName}</span>
                          <div className="text-[10px] text-slate-400">{inv.clientState}</div>
                        </td>
                        <td className="p-2 max-w-[180px] truncate text-slate-600 text-[11px]" title={inv.items[0]?.description}>
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
            disabled={parsedRows.length === 0 || isLoading}
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
