import React, { useState } from 'react';
import { 
  Building2, 
  Save, 
  Check, 
  ShieldCheck, 
  PenTool, 
  CreditCard, 
  Plus,
  Trash2,
  Receipt,
  MessageSquare,
  Mail,
  Share2,
  RotateCcw,
  Sparkles,
  Upload,
  Image,
  Edit3,
  X,
  Phone,
  MapPin,
  QrCode,
  FolderTree,
  Tag
} from 'lucide-react';
import { GST_STATES, validateGSTIN, getStateFromGSTIN } from '../../data/constants';
import { 
  AVAILABLE_TEMPLATE_TAGS, 
  DEFAULT_WHATSAPP_TEMPLATE, 
  DEFAULT_EMAIL_SUBJECT_TEMPLATE, 
  DEFAULT_EMAIL_BODY_TEMPLATE 
} from '../../utils/templateHelper';

export default function EntitySettings({ 
  entities, 
  categories = [], 
  onSaveEntity, 
  onOpenAddEntity, 
  onOpenManageCategories 
}) {
  const [selectedEntityId, setSelectedEntityId] = useState(entities[0]?.id || 'entity-1');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const currentEntity = entities.find(e => e.id === selectedEntityId) || entities[0];

  const [formData, setFormData] = useState({
    ...currentEntity,
    logoUrl: currentEntity?.logoUrl || '',
    whatsappTemplate: currentEntity?.whatsappTemplate || DEFAULT_WHATSAPP_TEMPLATE,
    emailSubjectTemplate: currentEntity?.emailSubjectTemplate || DEFAULT_EMAIL_SUBJECT_TEMPLATE,
    emailBodyTemplate: currentEntity?.emailBodyTemplate || DEFAULT_EMAIL_BODY_TEMPLATE
  });

  const handleSelectEntity = (id) => {
    setSelectedEntityId(id);
    const target = entities.find(e => e.id === id);
    if (target) {
      setFormData({
        ...target,
        logoUrl: target.logoUrl || '',
        whatsappTemplate: target.whatsappTemplate || DEFAULT_WHATSAPP_TEMPLATE,
        emailSubjectTemplate: target.emailSubjectTemplate || DEFAULT_EMAIL_SUBJECT_TEMPLATE,
        emailBodyTemplate: target.emailBodyTemplate || DEFAULT_EMAIL_BODY_TEMPLATE
      });
    }
    setIsEditing(false);
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
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveEntity(formData);
    setSavedSuccess(true);
    setIsEditing(false); // Closes edit form immediately on save
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const handleStartEdit = () => {
    const target = entities.find(e => e.id === selectedEntityId) || entities[0];
    if (target) {
      setFormData({
        ...target,
        logoUrl: target.logoUrl || '',
        whatsappTemplate: target.whatsappTemplate || DEFAULT_WHATSAPP_TEMPLATE,
        emailSubjectTemplate: target.emailSubjectTemplate || DEFAULT_EMAIL_SUBJECT_TEMPLATE,
        emailBodyTemplate: target.emailBodyTemplate || DEFAULT_EMAIL_BODY_TEMPLATE
      });
    }
    setIsEditing(true);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Entity Profiles
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure supplier companies, GSTINs, bank accounts, UPI IDs, and authorized signatures.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-medium">
              <Check size={14} />
              <span>Saved Successfully</span>
            </div>
          )}

          <button
            type="button"
            onClick={onOpenAddEntity}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition cursor-pointer shadow-2xs"
          >
            <Plus size={14} />
            <span>Add Entity</span>
          </button>
        </div>
      </div>

      {entities.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <Building2 size={22} />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">No business entities configured</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Add your company, LLC, or proprietorship details, GSTIN, PAN, bank account, and signature to start generating compliant tax invoices.
          </p>
          <button
            type="button"
            onClick={onOpenAddEntity}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Business Entity</span>
          </button>
        </div>
      ) : (
        <>
          {/* Entity Switcher Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {entities.map((ent) => {
              const isSelected = ent.id === selectedEntityId;
              return (
                <button
                  key={ent.id}
                  type="button"
                  onClick={() => handleSelectEntity(ent.id)}
                  className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'border-slate-900 bg-slate-50 shadow-2xs ring-1 ring-slate-900'
                      : 'border-slate-200 hover:border-slate-300 bg-white shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {ent.logoUrl ? (
                      <img 
                        src={ent.logoUrl} 
                        alt={ent.name} 
                        className="w-9 h-9 rounded-lg object-contain bg-white border border-slate-200 flex-shrink-0 p-0.5"
                      />
                    ) : (
                      <div 
                        className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs bg-slate-100 text-slate-800 border border-slate-200 flex-shrink-0"
                      >
                        {ent.logoBadge || 'EN'}
                      </div>
                    )}
                    <div>
                      <h2 className="font-semibold text-xs text-slate-900 line-clamp-1">{ent.name}</h2>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {ent.gstin ? `GST: ${ent.gstin}` : 'Non-GST / Exempt'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-700 font-medium border border-slate-200 flex-shrink-0">
                    State {ent.stateCode}
                  </span>
                </button>
              );
            })}
          </div>

          {!isEditing ? (
            /* Entity Summary / Closed View */
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-6 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  {currentEntity?.logoUrl ? (
                    <img 
                      src={currentEntity.logoUrl} 
                      alt={currentEntity.name} 
                      className="w-14 h-14 rounded-xl object-contain bg-white border border-slate-200 p-1 shadow-2xs"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-100 text-slate-800 font-bold text-base flex items-center justify-center border border-slate-200">
                      {currentEntity?.logoBadge || 'EN'}
                    </div>
                  )}
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{currentEntity?.name}</h2>
                    {currentEntity?.tradeName && (
                      <p className="text-xs text-slate-600 font-medium">{currentEntity.tradeName}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                        currentEntity?.gstin 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {currentEntity?.gstin ? `GSTIN: ${currentEntity.gstin}` : 'NON-GST / UNREGISTERED'}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500">
                        State {currentEntity?.stateCode} ({currentEntity?.stateName || 'Telangana'})
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition cursor-pointer shadow-2xs"
                >
                  <Edit3 size={14} />
                  <span>Edit Profile</span>
                </button>
              </div>

              {/* Entity Overview Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Legal & Tax */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-slate-600" />
                    <span>Legal & Tax Details</span>
                  </h3>
                  <div className="space-y-1 text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">GSTIN</span>
                      <span className="font-mono font-medium text-slate-900">{currentEntity?.gstin || 'None (Exempt)'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">PAN Number</span>
                      <span className="font-mono font-medium text-slate-900">{currentEntity?.pan || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Registered Jurisdiction</span>
                      <span className="font-medium text-slate-900">{currentEntity?.stateName || 'Telangana'} (Code {currentEntity?.stateCode || '36'})</span>
                    </div>
                  </div>
                </div>

                {/* Contact & Address */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 size={14} className="text-slate-600" />
                    <span>Registered Address</span>
                  </h3>
                  <div className="space-y-1 text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Address</span>
                      <span className="font-medium text-slate-900">{currentEntity?.addressLine1 || currentEntity?.address || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">City & PIN</span>
                      <span className="font-medium text-slate-900">{currentEntity?.city ? `${currentEntity.city} - ` : ''}{currentEntity?.pincode || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Email & Phone</span>
                      <span className="font-medium text-slate-900">{currentEntity?.email || currentEntity?.phone ? `${currentEntity.email || ''} ${currentEntity.phone ? '• ' + currentEntity.phone : ''}` : '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Banking & UPI */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard size={14} className="text-slate-600" />
                    <span>Banking & Payments</span>
                  </h3>
                  <div className="space-y-1 text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Bank Name</span>
                      <span className="font-medium text-slate-900">{currentEntity?.bankName || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">A/C No & IFSC</span>
                      <span className="font-mono font-medium text-slate-900">{currentEntity?.bankAccountNo || '-'} {currentEntity?.bankIfsc ? `(${currentEntity.bankIfsc})` : ''}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">UPI ID</span>
                      <span className="font-mono font-medium text-slate-900">{currentEntity?.upiId || 'Not configured'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoicing Series & Signatory Info */}
              <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Invoice Series Prefix</span>
                    <span className="font-mono font-bold text-slate-900">{currentEntity?.invoicePrefix || 'INV/2026/'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Next Invoice Sequence</span>
                    <span className="font-mono font-bold text-slate-900">{currentEntity?.nextInvoiceNumber || 101}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Authorized Signatory</span>
                    <span className="font-semibold text-slate-900">{currentEntity?.signatory?.name || 'Managing Partner'}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 font-semibold cursor-pointer self-start sm:self-auto"
                >
                  <Edit3 size={13} />
                  <span>Modify Settings</span>
                </button>
              </div>
            </div>
          ) : (
            /* Entity Profile Form (Opened when Edit is clicked) */
            <form onSubmit={handleSubmit} className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-2xs space-y-5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Editing: {formData.name || 'Entity'}
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">Update legal identity, tax registrations, logo branding, banking and invoicing series</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-1.5 rounded-lg font-medium transition cursor-pointer shadow-2xs"
                  >
                    <Save size={14} />
                    <span>Save Profile</span>
                  </button>
                </div>
              </div>

        {/* Logo Branding */}
        <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              {formData.logoUrl ? (
                <div className="relative group">
                  <img 
                    src={formData.logoUrl} 
                    alt="Entity Logo Preview" 
                    className="w-16 h-16 rounded-xl object-contain bg-white border border-slate-300 p-1 shadow-2xs"
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
                <div className="w-16 h-16 rounded-xl bg-white border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                  <Image size={20} />
                  <span className="text-[9px] mt-0.5 font-medium">No Logo</span>
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold text-slate-900">Official Entity Logo</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  This logo will be displayed on the top of your official tax invoice copies and printed PDFs.
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Recommended: PNG or JPEG with transparent/white background (max 2MB)</p>
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

        {/* Legal & Brand Info */}
        <div className="space-y-3.5">
          <h3 className="font-semibold text-slate-900 text-xs flex items-center gap-2 border-b border-slate-100 pb-2">
            <Building2 size={14} className="text-slate-600" />
            <span>1. Legal Entity & Tax Registrations</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-slate-700 block">Legal Entity Name *</label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-1 focus:ring-slate-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700 block">Trade / Brand Name</label>
              <input
                type="text"
                value={formData.tradeName || ''}
                onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-400 focus:outline-none font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-medium text-slate-700 block">GSTIN</label>
                <span className="text-[10px] text-slate-500">Optional</span>
              </div>
              <input
                type="text"
                maxLength={15}
                value={formData.gstin || ''}
                onChange={(e) => handleGstinChange(e.target.value)}
                placeholder="Leave blank if unregistered"
                className="w-full p-2 bg-white border border-slate-300 rounded-lg uppercase font-mono font-medium text-slate-900 focus:ring-1 focus:ring-slate-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700 block">State Jurisdiction *</label>
              <select
                value={formData.stateCode || '36'}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-400 focus:outline-none font-medium text-slate-900 cursor-pointer"
              >
                {GST_STATES.map(s => (
                  <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700 block">PAN Number</label>
              <input
                type="text"
                maxLength={10}
                value={formData.pan || ''}
                onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                placeholder="AABCS1234F"
                className="w-full p-2 bg-white border border-slate-300 rounded-lg uppercase font-mono font-medium focus:ring-1 focus:ring-slate-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Address */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="font-medium text-slate-700 block">Registered Office Address</label>
              <input
                type="text"
                value={formData.addressLine1 || ''}
                onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700 block">Pincode</label>
              <input
                type="text"
                maxLength={6}
                value={formData.pincode || ''}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                placeholder="500081"
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-slate-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Banking Setup */}
        <div className="space-y-3.5 pt-2">
          <h3 className="font-semibold text-slate-900 text-xs flex items-center gap-2 border-b border-slate-100 pb-2">
            <CreditCard size={14} className="text-slate-600" />
            <span>2. Bank Account & UPI Setup (For Invoice Remittances)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-slate-700 block">Bank Name</label>
              <input
                type="text"
                value={formData.bankName || ''}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                placeholder="HDFC Bank"
                className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700 block">Account Number</label>
              <input
                type="text"
                value={formData.bankAccountNo || ''}
                onChange={(e) => setFormData({ ...formData, bankAccountNo: e.target.value })}
                placeholder="50200012345678"
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-medium text-slate-900 focus:ring-1 focus:ring-slate-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700 block">IFSC Code</label>
              <input
                type="text"
                value={formData.bankIfsc || ''}
                onChange={(e) => setFormData({ ...formData, bankIfsc: e.target.value.toUpperCase() })}
                placeholder="HDFC0001234"
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono uppercase font-medium focus:ring-1 focus:ring-slate-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700 block">UPI ID</label>
              <input
                type="text"
                value={formData.upiId || ''}
                onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                placeholder="billing@okhdfcbank"
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-slate-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Invoicing Rules & Signatory */}
        <div className="space-y-3.5 pt-2">
          <h3 className="font-semibold text-slate-900 text-xs flex items-center gap-2 border-b border-slate-100 pb-2">
            <PenTool size={14} className="text-slate-600" />
            <span>3. Invoicing Rules & Authorized Signatory</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-slate-700 block">Invoice Number Prefix</label>
              <input
                type="text"
                value={formData.invoicePrefix || 'INV/24-25/'}
                onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-medium focus:ring-1 focus:ring-slate-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700 block">Next Invoice Sequence No.</label>
              <input
                type="number"
                value={formData.nextInvoiceNumber || 101}
                onChange={(e) => setFormData({ ...formData, nextInvoiceNumber: parseInt(e.target.value) || 1 })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-medium focus:ring-1 focus:ring-slate-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700 block">Signatory Full Name</label>
              <input
                type="text"
                value={formData.signatory?.name || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  signatory: { ...(formData.signatory || {}), name: e.target.value }
                })}
                placeholder="Authorized Signatory Name"
                className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-400 focus:outline-none font-medium"
              />
            </div>
          </div>
        </div>

        {/* Pre-Defined Mobile & Email Sharing Content Templates */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
            <h3 className="font-semibold text-slate-900 text-xs flex items-center gap-2">
              <Share2 size={14} className="text-slate-600" />
              <span>4. Pre-Defined Mobile & Email Sharing Content Templates</span>
            </h3>
            <span className="text-[11px] text-slate-500">Auto-filled whenever sharing invoices via WhatsApp or Mail</span>
          </div>

          {/* Quick Insert Tags Toolbar */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
              <Sparkles size={12} className="text-slate-600" />
              <span>Available Dynamic Placeholders (Click to copy tag):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_TEMPLATE_TAGS.map(({ tag, desc }) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(tag);
                    alert(`Copied ${tag} (${desc}) to clipboard. Paste into your template.`);
                  }}
                  title={desc}
                  className="px-2 py-0.5 bg-white hover:bg-slate-200 text-slate-800 text-[10px] font-mono rounded border border-slate-300 transition cursor-pointer shadow-2xs"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* WhatsApp / SMS Template */}
            <div className="space-y-2 p-3.5 bg-white border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-xs">
                  <MessageSquare size={14} className="text-slate-700" />
                  <span>WhatsApp & SMS Template</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, whatsappTemplate: DEFAULT_WHATSAPP_TEMPLATE }))}
                  className="text-[11px] text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw size={11} />
                  <span>Reset Default</span>
                </button>
              </div>

              <textarea
                rows={10}
                value={formData.whatsappTemplate || DEFAULT_WHATSAPP_TEMPLATE}
                onChange={(e) => setFormData(prev => ({ ...prev, whatsappTemplate: e.target.value }))}
                placeholder="Enter WhatsApp template with placeholders..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] text-slate-800 leading-relaxed focus:bg-white focus:ring-1 focus:ring-slate-400 focus:outline-none"
              />
            </div>

            {/* Email Template */}
            <div className="space-y-2 p-3.5 bg-white border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-xs">
                  <Mail size={14} className="text-slate-700" />
                  <span>Email Subject & Body Template</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    emailSubjectTemplate: DEFAULT_EMAIL_SUBJECT_TEMPLATE,
                    emailBodyTemplate: DEFAULT_EMAIL_BODY_TEMPLATE 
                  }))}
                  className="text-[11px] text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw size={11} />
                  <span>Reset Default</span>
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-medium text-slate-600 block uppercase">Subject</label>
                <input
                  type="text"
                  value={formData.emailSubjectTemplate || DEFAULT_EMAIL_SUBJECT_TEMPLATE}
                  onChange={(e) => setFormData(prev => ({ ...prev, emailSubjectTemplate: e.target.value }))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-medium text-slate-600 block uppercase">Body Message</label>
                <textarea
                  rows={8}
                  value={formData.emailBodyTemplate || DEFAULT_EMAIL_BODY_TEMPLATE}
                  onChange={(e) => setFormData(prev => ({ ...prev, emailBodyTemplate: e.target.value }))}
                  placeholder="Enter email body template with placeholders..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] text-slate-800 leading-relaxed focus:bg-white focus:ring-1 focus:ring-slate-400 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-3 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-lg font-medium transition cursor-pointer text-xs shadow-2xs"
          >
            <Save size={14} />
            <span>Save Profile</span>
          </button>
        </div>
      </form>
    )}

      {/* Business Service Categories Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FolderTree size={14} className="text-slate-700" />
              <span>Business Service Categories ({categories.length})</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Categorize service offerings to track revenue streams in the dashboard without statutory clutter
            </p>
          </div>

          {onOpenManageCategories && (
            <button
              type="button"
              onClick={onOpenManageCategories}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs self-start sm:self-auto"
            >
              <Plus size={13} />
              <span>Manage / Edit Categories</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {categories.map(cat => (
            <span 
              key={cat}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 text-slate-800 border border-slate-200 rounded-lg text-xs font-medium"
            >
              <Tag size={11} className="text-slate-400" />
              <span>{cat}</span>
            </span>
          ))}
        </div>
      </div>
    </>
  )}
</div>
);
}
