import React, { useState } from 'react';
import { X, User, Building2, MapPin, Mail, Phone, Check } from 'lucide-react';
import { GST_STATES, validateGSTIN, getStateFromGSTIN } from '../../data/constants';

export default function ClientModal({ client, entities, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: client?.name || '',
    contactPerson: client?.contactPerson || '',
    email: client?.email || '',
    phone: client?.phone || '',
    whatsapp: client?.whatsapp || client?.phone || '',
    isGstRegistered: client?.isGstRegistered !== undefined ? client.isGstRegistered : false,
    gstin: client?.gstin || '',
    pan: client?.pan || '',
    billingAddress: client?.billingAddress || '',
    shippingAddress: client?.shippingAddress || '',
    stateCode: client?.stateCode || '36',
    stateName: client?.stateName || 'Telangana',
    pincode: client?.pincode || '',
    preferredEntityId: client?.preferredEntityId || entities[0]?.id || 'entity-1'
  });

  const [gstValidation, setGstValidation] = useState({ valid: true, message: '' });

  const handleStateChange = (code) => {
    const s = GST_STATES.find(item => item.code === code);
    setFormData(prev => ({
      ...prev,
      stateCode: code,
      stateName: s ? s.name : ''
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
        updated.isGstRegistered = true;
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Client / Customer Name is required');
      return;
    }
    onSave({
      id: client?.id || `client-${Date.now()}`,
      ...formData,
      shippingAddress: formData.shippingAddress || formData.billingAddress
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-fadeIn">
        {/* Header */}
        <div className="bg-white text-slate-900 px-5 py-3.5 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <User size={18} className="text-slate-700" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {client ? 'Edit Client Profile' : 'New Client Profile'}
              </h2>
              <p className="text-[11px] text-slate-500">Add B2B companies or individuals (GST is optional)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs bg-white">
          {/* GST Toggle */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-900">GST Registration Status</span>
              <p className="text-[11px] text-slate-500">Is this client registered under GST?</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-800">
                <input
                  type="radio"
                  name="gstStatus"
                  checked={formData.isGstRegistered}
                  onChange={() => setFormData({ ...formData, isGstRegistered: true })}
                  className="text-slate-900 focus:ring-slate-400"
                />
                <span>Registered (GST)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-800">
                <input
                  type="radio"
                  name="gstStatus"
                  checked={!formData.isGstRegistered}
                  onChange={() => setFormData({ ...formData, isGstRegistered: false, gstin: '' })}
                  className="text-slate-900 focus:ring-slate-400"
                />
                <span>Unregistered</span>
              </label>
            </div>
          </div>

          {/* Client Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-slate-700">Client / Company Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Acme Corporation or Ramesh Rao"
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-1 focus:ring-slate-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700">Contact Person (Optional)</label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="e.g. John Doe (Finance Head)"
                className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-400 focus:outline-none"
              />
            </div>
          </div>

          {/* GSTIN (Optional) and State */}
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
                placeholder="e.g. 29ABCDE1234F1Z5"
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
                placeholder="e.g. ABCDE1234F"
                className="w-full p-2 bg-white border border-slate-300 rounded-lg uppercase font-mono font-medium focus:ring-1 focus:ring-slate-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-slate-700">Official Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="finance@acme.com"
                className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700">Phone / WhatsApp</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value, whatsapp: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Address */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="font-medium text-slate-700">Billing Address</label>
              <textarea
                rows={2}
                value={formData.billingAddress}
                onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                placeholder="Office or residence address, landmark, city"
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
                placeholder="560001"
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-medium focus:ring-1 focus:ring-slate-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Preferred Billing Entity */}
          <div className="space-y-1 pt-1">
            <label className="font-medium text-slate-700">Default Issuing Entity</label>
            <select
              value={formData.preferredEntityId}
              onChange={(e) => setFormData({ ...formData, preferredEntityId: e.target.value })}
              className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-400 focus:outline-none font-medium text-slate-900 cursor-pointer"
            >
              {entities.map(ent => (
                <option key={ent.id} value={ent.id}>
                  {ent.tradeName || ent.name} ({ent.stateName || 'State'})
                </option>
              ))}
            </select>
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
              <span>Save Client</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
