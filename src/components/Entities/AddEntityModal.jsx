import React, { useState } from 'react';
import { X, Building2, ShieldCheck, CreditCard, PenTool, Check, Upload, Image, Trash2 } from 'lucide-react';
import { GST_STATES, validateGSTIN, getStateFromGSTIN } from '../../data/constants';
import { 
  DEFAULT_WHATSAPP_TEMPLATE, 
  DEFAULT_EMAIL_SUBJECT_TEMPLATE, 
  DEFAULT_EMAIL_BODY_TEMPLATE 
} from '../../utils/templateHelper';

export default function AddEntityModal({ isOpen, onClose, onSaveEntity }) {
  const [formData, setFormData] = useState({
    id: `entity-${Date.now()}`,
    name: '',
    tradeName: '',
    tagline: 'Strategic Management & Advisory',
    logoUrl: '',
    gstin: '',
    pan: '',
    cinOrLlp: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    stateCode: '36',
    stateName: 'Telangana',
    pincode: '',
    email: '',
    phone: '',
    website: '',
    bankName: 'HDFC Bank',
    bankAccountNo: '',
    bankIfsc: '',
    bankBranch: '',
    upiId: '',
    invoicePrefix: 'INV/24-25/',
    nextInvoiceNumber: 101,
    signatory: {
      name: '',
      designation: 'Managing Partner',
      badgeText: 'AUTHORIZED SIGNATORY'
    },
    termsAndConditions: [
      '1. Payment is due within 15 days from invoice date.',
      '2. TDS deducted, if any, under Section 194J/194C should be deposited with govt.',
      '3. Please cite the invoice number in all NEFT / RTGS narration.'
    ],
    notesTemplate: 'Thank you for your business. We appreciate the opportunity to assist your organization.',
    whatsappTemplate: DEFAULT_WHATSAPP_TEMPLATE,
    emailSubjectTemplate: DEFAULT_EMAIL_SUBJECT_TEMPLATE,
    emailBodyTemplate: DEFAULT_EMAIL_BODY_TEMPLATE
  });

  const [gstValidation, setGstValidation] = useState({ valid: true, message: '' });

  if (!isOpen) return null;

  const handleStateChange = (code) => {
    const st = GST_STATES.find(s => s.code === code);
    setFormData(prev => ({
      ...prev,
      stateCode: code,
      stateName: st ? st.name : ''
    }));
  };

  const handleGstinChange = (val) => {
    const uppercaseVal = val.toUpperCase().trim();
    let updated = { ...formData, gstin: uppercaseVal };
    if (uppercaseVal.length >= 2) {
      const stateObj = getStateFromGSTIN(uppercaseVal);
      if (stateObj) {
        updated.stateCode = stateObj.code;
        updated.stateName = stateObj.name;
      }
    }
    if (uppercaseVal.length >= 12) {
      updated.pan = uppercaseVal.substring(2, 12);
    }
    setFormData(updated);

    if (uppercaseVal.length === 15) {
      const res = validateGSTIN(uppercaseVal);
      setGstValidation(res);
    } else if (uppercaseVal.length > 0) {
      setGstValidation({ valid: false, message: 'GSTIN is usually 15 characters (Optional)' });
    } else {
      setGstValidation({ valid: true, message: '' });
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Logo image should be under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setFormData(prev => ({
        ...prev,
        logoUrl: uploadEvent.target.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({
      ...prev,
      logoUrl: ''
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Entity Business Name is required');
      return;
    }

    onSaveEntity(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full overflow-hidden border border-slate-200 animate-fadeIn">
        {/* Header */}
        <div className="bg-white text-slate-900 px-5 py-3.5 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <Building2 size={18} className="text-slate-700" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Add Business Entity</h2>
              <p className="text-[11px] text-slate-500">Configure company details, logo branding, bank accounts & optional GSTIN</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs bg-white">
          {/* Logo Branding */}
          <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                {formData.logoUrl ? (
                  <div className="relative group">
                    <img 
                      src={formData.logoUrl} 
                      alt="Entity Logo Preview" 
                      className="w-14 h-14 rounded-xl object-contain bg-white border border-slate-300 p-1 shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white p-1 rounded-full shadow-xs hover:bg-rose-700 transition cursor-pointer"
                      title="Remove Logo"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-white border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                    <Image size={18} />
                    <span className="text-[8px] mt-0.5 font-medium">No Logo</span>
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-bold text-slate-900">Official Entity Logo</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Displayed at the top of your official tax invoice copies and printed PDFs.
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">PNG or JPEG with transparent background (max 2MB)</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition cursor-pointer shadow-2xs">
                  <Upload size={13} />
                  <span>{formData.logoUrl ? 'Change Logo' : 'Upload Logo'}</span>
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp" 
                    onChange={handleLogoUpload} 
                    className="hidden" 
                  />
                </label>
                {formData.logoUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-medium text-xs transition cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Business Core Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-900 text-xs flex items-center gap-2 border-b border-slate-100 pb-2">
              <Building2 size={14} className="text-slate-600" />
              <span>1. Legal & Trade Identity</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-slate-700">Legal Entity Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Apex Enterprises LLP"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-1 focus:ring-slate-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700">Trade / Brand Name</label>
                <input
                  type="text"
                  value={formData.tradeName}
                  onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                  placeholder="e.g. Apex Advisory"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-400 focus:outline-none font-medium"
                />
              </div>
            </div>

            {/* GSTIN (Optional), State & PAN */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-slate-700">GSTIN</label>
                  <span className="text-[10px] text-slate-500">Optional</span>
                </div>
                <input
                  type="text"
                  maxLength={15}
                  value={formData.gstin}
                  onChange={(e) => handleGstinChange(e.target.value)}
                  placeholder="e.g. 36AABCS1234F1Z5"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg uppercase font-mono font-medium text-slate-900 focus:ring-1 focus:ring-slate-400 focus:outline-none"
                />
                {!gstValidation.valid && formData.gstin && (
                  <p className="text-[10px] text-amber-600 font-medium">{gstValidation.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700">State Jurisdiction *</label>
                <select
                  value={formData.stateCode}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-400 focus:outline-none font-medium text-slate-900 cursor-pointer"
                >
                  {GST_STATES.map(s => (
                    <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700">PAN Number</label>
                <input
                  type="text"
                  maxLength={10}
                  value={formData.pan}
                  onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                  placeholder="e.g. AABCS1234F"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg uppercase font-mono font-medium focus:ring-1 focus:ring-slate-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Address */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="font-medium text-slate-700">Registered Address</label>
                <input
                  type="text"
                  value={formData.addressLine1}
                  onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                  placeholder="Street, Floor, Landmark"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700">Pincode</label>
                <input
                  type="text"
                  maxLength={6}
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  placeholder="500081"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-slate-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-slate-700">Official Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="billing@firm.com"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700">Invoice Prefix</label>
                <input
                  type="text"
                  value={formData.invoicePrefix}
                  onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                  placeholder="INV/24-25/"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-medium text-slate-900 focus:ring-1 focus:ring-slate-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Banking Details */}
          <div className="space-y-3 pt-2">
            <h3 className="font-semibold text-slate-900 text-xs flex items-center gap-2 border-b border-slate-100 pb-2">
              <CreditCard size={14} className="text-slate-600" />
              <span>2. Bank Account Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-slate-700">Bank Name</label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="HDFC Bank"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700">Account Number</label>
                <input
                  type="text"
                  value={formData.bankAccountNo}
                  onChange={(e) => setFormData({ ...formData, bankAccountNo: e.target.value })}
                  placeholder="50200012345678"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-medium text-slate-900 focus:ring-1 focus:ring-slate-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700">IFSC Code</label>
                <input
                  type="text"
                  value={formData.bankIfsc}
                  onChange={(e) => setFormData({ ...formData, bankIfsc: e.target.value.toUpperCase() })}
                  placeholder="HDFC0001234"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono uppercase font-medium focus:ring-1 focus:ring-slate-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700">UPI ID</label>
                <input
                  type="text"
                  value={formData.upiId}
                  onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                  placeholder="firm@okhdfcbank"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-slate-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Signatory */}
          <div className="space-y-3 pt-2">
            <h3 className="font-semibold text-slate-900 text-xs flex items-center gap-2 border-b border-slate-100 pb-2">
              <PenTool size={14} className="text-slate-600" />
              <span>3. Authorized Signatory</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-slate-700">Signatory Full Name</label>
                <input
                  type="text"
                  value={formData.signatory.name}
                  onChange={(e) => setFormData({
                    ...formData,
                    signatory: { ...formData.signatory, name: e.target.value }
                  })}
                  placeholder="Authorized Signatory Name"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium focus:ring-1 focus:ring-slate-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700">Designation</label>
                <input
                  type="text"
                  value={formData.signatory.designation}
                  onChange={(e) => setFormData({
                    ...formData,
                    signatory: { ...formData.signatory, designation: e.target.value }
                  })}
                  placeholder="Managing Partner"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium transition cursor-pointer"
            >
              <Check size={14} />
              <span>Add Entity</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
