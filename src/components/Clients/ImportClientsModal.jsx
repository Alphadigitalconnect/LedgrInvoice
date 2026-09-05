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
  FileText,
  HelpCircle,
  Layers,
  Building2,
  AlertTriangle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { getStateFromGSTIN, validateGSTIN, GST_STATES } from '../../data/constants';
import { downloadClientsTemplate } from '../../services/excelTemplateService';

export default function ImportClientsModal({ 
  isOpen, 
  onClose, 
  onImportSuccess, 
  existingClients = [], 
  entities = [],
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

  // Download Sample Excel Template
  const handleDownloadExcelTemplate = async () => {
    try {
      await downloadClientsTemplate();
    } catch (err) {
      console.error('Error generating Clients Excel template:', err);
      alert('Could not generate Excel template. Please try again.');
    }
  };

  const handleDownloadCsvTemplate = () => {
    // Clean CSV headers template (NO dummy data rows)
    const headerCols = [
      "Business Name / Client Name",
      "Contact Person",
      "Email ID",
      "Phone / Mobile",
      "GSTIN (15 Digits)",
      "PAN (10 Digits)",
      "Billing Address",
      "City",
      "State Name / Place of Supply",
      "PIN Code"
    ];

    const csvContent = "data:text/csv;charset=utf-8," + headerCols.join(",") + "\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Clients_Import_Template_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle File Upload & Parse
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!hasEntities) {
      setValidationErrors(['Cannot import clients: No Entity profiles found. Please create an Issuing Entity first in Entity Profiles.']);
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
        const wsName = wb.SheetNames.includes('Clients_Data') ? 'Clients_Data' : wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawJson = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          setValidationErrors(['The uploaded spreadsheet contains no data rows. Please add client records and upload again.']);
          setParsedRows([]);
          setIsLoading(false);
          return;
        }

        // Map and validate columns flexibly
        const rows = [];
        const errors = [];

        rawJson.forEach((row, idx) => {
          const rowNum = idx + 2; // Excel row index

          // Skip empty rows
          const hasAnyValue = Object.values(row).some(v => String(v).trim() !== '');
          if (!hasAnyValue) return;

          // Find fields by multiple possible aliases
          const name = String(row['Business Name / Client Name *'] || row['Business Name'] || row['Client Name'] || row['Name'] || row['Company Name'] || row['businessName'] || '').trim();
          const contactPerson = String(row['Contact Person'] || row['Contact Name'] || row['Person'] || row['contactPerson'] || '').trim();
          const email = String(row['Email ID'] || row['Email'] || row['email'] || '').trim();
          const phone = String(row['Phone / Mobile'] || row['Phone'] || row['Mobile'] || row['Phone Number'] || row['Contact'] || row['phone'] || '').trim();
          const gstin = String(row['GSTIN (15 Digits)'] || row['GSTIN'] || row['GST No'] || row['GST'] || row['gstin'] || '').trim().toUpperCase();
          const pan = String(row['PAN (10 Digits)'] || row['PAN'] || row['PAN No'] || row['pan'] || '').trim().toUpperCase();
          const address = String(row['Billing Address *'] || row['Billing Address'] || row['Address'] || row['address'] || '').trim();
          const city = String(row['City *'] || row['City'] || row['city'] || '').trim();
          let stateName = String(row['State Name / Place of Supply *'] || row['State Name'] || row['State'] || row['Place of Supply'] || row['stateName'] || '').trim();
          const pinCode = String(row['PIN Code'] || row['Pincode'] || row['PIN'] || row['pinCode'] || '').trim();

          if (!name) {
            errors.push(`Row ${rowNum}: Business Name / Client Name is required.`);
            return;
          }

          // GSTIN format and state validation
          let resolvedPan = pan;
          if (gstin) {
            const gstValidation = validateGSTIN(gstin);
            if (!gstValidation.valid) {
              errors.push(`Row ${rowNum}: Invalid GSTIN "${gstin}" (${gstValidation.message}).`);
            } else {
              if (!stateName && gstValidation.state) {
                stateName = gstValidation.state.name;
              }
              if (!resolvedPan && gstin.length >= 12) {
                resolvedPan = gstin.substring(2, 12);
              }
            }
          }

          // Infer state code
          let stateCode = '';
          if (stateName) {
            const foundState = GST_STATES.find(s => s.name.toLowerCase() === stateName.toLowerCase());
            if (foundState) {
              stateCode = foundState.code;
              stateName = foundState.name;
            }
          }

          rows.push({
            id: `client-import-${Date.now()}-${idx}`,
            name: name,
            businessName: name,
            contactPerson: contactPerson,
            email: email,
            phone: phone,
            gstin: gstin,
            pan: resolvedPan,
            address: address,
            city: city,
            stateName: stateName || 'General',
            stateCode: stateCode,
            pinCode: pinCode,
            isGstRegistered: !!gstin,
            createdAt: new Date().toISOString()
          });
        });

        setParsedRows(rows);
        setValidationErrors(errors);
      } catch (err) {
        console.error('Error parsing Excel file:', err);
        setValidationErrors(['Failed to read file. Please ensure it is a valid .xlsx or .csv file.']);
        setParsedRows([]);
      } finally {
        setIsLoading(false);
      }
    };

    reader.readAsBinaryString(selectedFile);
  };

  // Perform Import
  const handleConfirmImport = () => {
    if (parsedRows.length === 0) return;

    if (onImportSuccess) {
      onImportSuccess(parsedRows);
    }

    setImportSuccess(`Successfully imported ${parsedRows.length} clients.`);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-scaleIn">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-white border border-slate-700">
              <FileSpreadsheet size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Import Clients from Excel / CSV</h2>
              <p className="text-[11px] text-slate-400">
                Bulk upload client directory with GSTIN, billing address, state dropdowns, and contact details
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
                    You have not created any Issuing Entity profiles yet. Please create your business entity first in Entity Profiles before importing client records.
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
                    Pre-formatted columns with Indian State dropdowns, Billing Address, City, PIN Code, and GSTIN/PAN.
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
                    <span className="text-xs font-bold text-slate-800">Click to upload Excel or CSV file</span>
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

          {/* Parsed Rows Preview */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                <span>Preview ({parsedRows.length} clients ready to import)</span>
                <span className="text-[11px] text-slate-500 font-normal">Address & GST details mapped</span>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-56 shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="p-2">#</th>
                      <th className="p-2">Business Name</th>
                      <th className="p-2">GSTIN / PAN</th>
                      <th className="p-2">Contact</th>
                      <th className="p-2">Billing Address & State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2 font-mono text-slate-400 text-[10px]">{i + 1}</td>
                        <td className="p-2 font-semibold text-slate-800">{row.name}</td>
                        <td className="p-2 font-mono text-slate-600 text-[11px]">
                          {row.gstin || row.pan || <span className="italic text-slate-400">Non-GST</span>}
                        </td>
                        <td className="p-2 text-slate-600 text-[11px]">
                          {row.email || row.phone || '-'}
                        </td>
                        <td className="p-2 text-slate-600 text-[11px] max-w-[200px] truncate" title={`${row.address}, ${row.city}, ${row.stateName} - ${row.pinCode}`}>
                          {row.address ? `${row.address}, ` : ''}{row.city ? `${row.city}, ` : ''}{row.stateName}
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
            <span>Import {parsedRows.length > 0 ? `${parsedRows.length} Clients` : 'Clients'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}

