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
  Layers
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { getStateFromGSTIN } from '../../data/constants';

export default function ImportClientsModal({ isOpen, onClose, onImportSuccess, existingClients = [] }) {
  if (!isOpen) return null;

  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [importSuccess, setImportSuccess] = useState(null);

  // Download Sample Excel Template
  const handleDownloadSample = (format = 'xlsx') => {
    const sampleData = [
      {
        "Business Name": "Acme Innovations Pvt Ltd",
        "Contact Person": "Rajesh Sharma",
        "Email": "rajesh@acmeinnovations.com",
        "Phone": "9876543210",
        "GSTIN": "29ABCDE1234F1Z5",
        "PAN": "ABCDE1234F",
        "Billing Address": "Tech Park, 4th Block, Koramangala",
        "City": "Bengaluru",
        "State Name": "Karnataka",
        "PIN Code": "560034"
      },
      {
        "Business Name": "Global Marketing Solutions",
        "Contact Person": "Priya Verma",
        "Email": "priya@globalmarketingsol.com",
        "Phone": "9123456789",
        "GSTIN": "36AABCS1234F1Z5",
        "PAN": "AABCS1234F",
        "Billing Address": "Hitech City, Madhapur",
        "City": "Hyderabad",
        "State Name": "Telangana",
        "PIN Code": "500081"
      },
      {
        "Business Name": "Sunrise Retail Enterprises",
        "Contact Person": "Amit Patel",
        "Email": "amit@sunriseretail.in",
        "Phone": "9898989898",
        "GSTIN": "",
        "PAN": "ABCPA1234K",
        "Billing Address": "MG Road, Navrangpura",
        "City": "Ahmedabad",
        "State Name": "Gujarat",
        "PIN Code": "380009"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clients_Template");

    if (format === 'csv') {
      XLSX.writeFile(wb, "Clients_Import_Template.csv", { bookType: "csv" });
    } else {
      XLSX.writeFile(wb, "Clients_Import_Template.xlsx");
    }
  };

  // Handle File Upload & Parse
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
          setValidationErrors(['The uploaded file contains no data rows.']);
          setParsedRows([]);
          setIsLoading(false);
          return;
        }

        // Map and validate columns flexibly
        const rows = [];
        const errors = [];

        rawJson.forEach((row, idx) => {
          const rowNum = idx + 2; // Excel row index
          // Find fields by multiple possible aliases
          const name = row['Business Name'] || row['Client Name'] || row['Name'] || row['Company Name'] || row['businessName'] || '';
          const contactPerson = row['Contact Person'] || row['Contact Name'] || row['Person'] || row['contactPerson'] || '';
          const email = row['Email'] || row['Email ID'] || row['email'] || '';
          const phone = String(row['Phone'] || row['Mobile'] || row['Phone Number'] || row['Contact'] || row['phone'] || '');
          const gstin = String(row['GSTIN'] || row['GST No'] || row['GST'] || row['gstin'] || '').trim().toUpperCase();
          const pan = String(row['PAN'] || row['PAN No'] || row['pan'] || '').trim().toUpperCase();
          const address = row['Billing Address'] || row['Address'] || row['address'] || '';
          const city = row['City'] || row['city'] || '';
          let stateName = row['State Name'] || row['State'] || row['Place of Supply'] || row['stateName'] || '';
          const pinCode = String(row['PIN Code'] || row['Pincode'] || row['PIN'] || row['pinCode'] || '');

          if (!name.trim()) {
            errors.push(`Row ${rowNum}: Business Name / Client Name is missing.`);
            return;
          }

          // If state is not provided but valid GSTIN exists, infer state
          if (!stateName && gstin && gstin.length >= 2) {
            const stateObj = getStateFromGSTIN(gstin);
            if (stateObj) stateName = stateObj.name;
          }

          // PAN inference if not provided but GSTIN exists
          let resolvedPan = pan;
          if (!resolvedPan && gstin && gstin.length >= 12) {
            resolvedPan = gstin.substring(2, 12);
          }

          rows.push({
            id: `client-import-${Date.now()}-${idx}`,
            businessName: name.trim(),
            contactPerson: contactPerson.trim(),
            email: email.trim(),
            phone: phone.trim(),
            gstin: gstin,
            pan: resolvedPan,
            address: address.trim(),
            city: city.trim(),
            stateName: stateName.trim() || 'General',
            pinCode: pinCode.trim(),
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
                Bulk upload client directory with GSTIN, billing address, and contact details
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
                <span>Need an Excel Template?</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Download the sample spreadsheet template with the pre-formatted columns.
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
                <span className="text-xs font-bold text-slate-800">Click to upload Excel or CSV file</span>
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

          {/* Parsed Rows Preview */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                <span>Preview ({parsedRows.length} clients ready to import)</span>
                <span className="text-[11px] text-slate-500 font-normal">All columns mapped automatically</span>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-56 shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="p-2">#</th>
                      <th className="p-2">Business Name</th>
                      <th className="p-2">GSTIN / PAN</th>
                      <th className="p-2">Contact</th>
                      <th className="p-2">State / City</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2 font-mono text-slate-400 text-[10px]">{i + 1}</td>
                        <td className="p-2 font-semibold text-slate-800">{row.businessName}</td>
                        <td className="p-2 font-mono text-slate-600 text-[11px]">
                          {row.gstin || row.pan || <span className="italic text-slate-400">Non-GST</span>}
                        </td>
                        <td className="p-2 text-slate-600 text-[11px]">
                          {row.email || row.phone || '-'}
                        </td>
                        <td className="p-2 text-slate-600 text-[11px]">
                          {row.stateName || row.city || '-'}
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
            <span>Import {parsedRows.length > 0 ? `${parsedRows.length} Clients` : 'Clients'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
