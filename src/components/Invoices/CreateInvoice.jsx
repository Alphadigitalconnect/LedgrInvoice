import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  User, 
  Calendar, 
  FileText, 
  Plus, 
  Trash2, 
  Check, 
  AlertCircle, 
  HelpCircle, 
  Eye, 
  Save, 
  Send, 
  Share2, 
  Sparkles, 
  ShieldCheck, 
  ArrowLeft, 
  PenTool, 
  Percent, 
  PlusCircle, 
  UserPlus, 
  Receipt 
} from 'lucide-react';
import { 
  GST_STATES, 
  COMMON_SAC_HSN_CODES, 
  UNITS_OF_MEASURE, 
  GST_RATES, 
  TDS_SECTIONS, 
  formatINR, 
  numberToWordsIndian,
  getStateFromGSTIN 
} from '../../data/constants';
import { StorageService } from '../../services/storage';
import ClientModal from '../Clients/ClientModal';

export default function CreateInvoice({
  entities,
  clients,
  engagements,
  categories: propCategories = [],
  initialEntityId,
  initialClientId,
  initialEngagementId,
  editingInvoice,
  onSaveInvoice,
  onSaveClient, // Inline adding customer
  onOpenManageCategories,
  onCancel,
  onOpenPreview
}) {
  const [selectedEntityId, setSelectedEntityId] = useState(
    editingInvoice?.entityId || initialEntityId || entities[0]?.id || 'entity-1'
  );

  const currentEntity = useMemo(() => {
    return entities.find(e => e.id === selectedEntityId) || entities[0] || {
      id: 'entity-1',
      name: 'Business Entity',
      stateCode: '36',
      stateName: 'Telangana',
      invoicePrefix: 'INV/24-25/',
      nextInvoiceNumber: 101
    };
  }, [entities, selectedEntityId]);

  // Initial client resolution
  const initialClient = useMemo(() => {
    if (editingInvoice?.clientId) {
      return clients.find(c => c.id === editingInvoice.clientId) || null;
    }
    if (initialClientId) {
      return clients.find(c => c.id === initialClientId) || null;
    }
    return clients[0] || null;
  }, [clients, editingInvoice, initialClientId]);

  const [selectedClientId, setSelectedClientId] = useState(
    editingInvoice?.clientId || initialClientId || clients[0]?.id || ''
  );

  const [selectedEngagementId, setSelectedEngagementId] = useState(
    editingInvoice?.engagementId || initialEngagementId || ''
  );

  // Quick Inline Add Customer Modal
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);

  const [invoiceNumber, setInvoiceNumber] = useState(
    editingInvoice?.invoiceNumber || `${currentEntity?.invoicePrefix || 'INV/24-25/'}${currentEntity?.nextInvoiceNumber || '101'}`
  );
  const [invoiceDate, setInvoiceDate] = useState(
    editingInvoice?.invoiceDate || new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState(
    editingInvoice?.dueDate || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  );
  const [poNumber, setPoNumber] = useState(editingInvoice?.poNumber || '');

  const [clientName, setClientName] = useState(
    editingInvoice?.clientName || initialClient?.name || ''
  );
  const [clientGstin, setClientGstin] = useState(
    editingInvoice?.clientGstin || initialClient?.gstin || ''
  );
  const [isClientRegistered, setIsClientRegistered] = useState(
    editingInvoice?.isClientRegistered !== undefined 
      ? editingInvoice.isClientRegistered 
      : (initialClient?.isGstRegistered || false)
  );
  const [clientAddress, setClientAddress] = useState(
    editingInvoice?.clientAddress || initialClient?.billingAddress || ''
  );
  const [deliveryAddress, setDeliveryAddress] = useState(
    editingInvoice?.deliveryAddress || initialClient?.shippingAddress || initialClient?.billingAddress || ''
  );
  const [placeOfSupplyStateCode, setPlaceOfSupplyStateCode] = useState(
    editingInvoice?.placeOfSupplyStateCode || initialClient?.stateCode || currentEntity?.stateCode || '36'
  );
  const [isReverseCharge, setIsReverseCharge] = useState(
    editingInvoice?.isReverseCharge || false
  );
  const [categories, setCategories] = useState(() => 
    propCategories && propCategories.length > 0 ? propCategories : StorageService.getCategories()
  );

  useEffect(() => {
    if (propCategories && propCategories.length > 0) {
      setCategories(propCategories);
    } else {
      setCategories(StorageService.getCategories());
    }
  }, [propCategories]);

  const [items, setItems] = useState(
    editingInvoice?.items || [
      {
        id: `item-${Date.now()}`,
        type: 'SERVICE',
        category: propCategories?.[0] || StorageService.getCategories()?.[0] || '',
        sacHsn: '998311',
        description: '',
        qty: 1,
        unit: 'Unit',
        rate: 0,
        discountPercent: 0,
        gstRate: currentEntity?.gstin ? 18 : 0
      }
    ]
  );

  const [tdsSectionId, setTdsSectionId] = useState(editingInvoice?.tdsSection || '194J_10');
  const [customTdsRate, setCustomTdsRate] = useState(editingInvoice?.tdsRate || 10);

  const [notes, setNotes] = useState(
    editingInvoice?.notes || currentEntity?.notesTemplate || ''
  );
  const [terms, setTerms] = useState(
    editingInvoice?.terms || (currentEntity?.termsAndConditions ? currentEntity.termsAndConditions.join('\n') : '')
  );

  const [signatoryName, setSignatoryName] = useState(
    editingInvoice?.signatoryName || currentEntity?.signatory?.name || ''
  );
  const [signatoryDesignation, setSignatoryDesignation] = useState(
    editingInvoice?.signatoryDesignation || currentEntity?.signatory?.designation || ''
  );

  useEffect(() => {
    if (!editingInvoice && currentEntity) {
      if (currentEntity.invoicePrefix) {
        setInvoiceNumber(`${currentEntity.invoicePrefix}${currentEntity.nextInvoiceNumber || '101'}`);
      }
      if (currentEntity.notesTemplate) setNotes(currentEntity.notesTemplate);
      if (currentEntity.termsAndConditions) setTerms(currentEntity.termsAndConditions.join('\n'));
      if (currentEntity.signatory?.name) setSignatoryName(currentEntity.signatory.name);
      if (currentEntity.signatory?.designation) setSignatoryDesignation(currentEntity.signatory.designation);
    }
  }, [currentEntity, editingInvoice]);

  // When selecting existing client
  const handleClientSelect = (clientId) => {
    setSelectedClientId(clientId);
    if (!clientId) return;
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setClientName(client.name);
      setClientGstin(client.gstin || '');
      setIsClientRegistered(client.isGstRegistered !== false && !!client.gstin);
      setClientAddress(`${client.billingAddress || ''}${client.pincode ? ' - ' + client.pincode : ''}`);
      setDeliveryAddress(client.shippingAddress || client.billingAddress || '');
      if (client.stateCode) {
        setPlaceOfSupplyStateCode(client.stateCode);
      }
    }
  };

  // Handle inline newly created client
  const handleInlineSaveClient = (newClient) => {
    if (onSaveClient) {
      onSaveClient(newClient);
    }
    // Automatically select the new client
    setSelectedClientId(newClient.id);
    setClientName(newClient.name);
    setClientGstin(newClient.gstin || '');
    setIsClientRegistered(newClient.isGstRegistered !== false && !!newClient.gstin);
    setClientAddress(`${newClient.billingAddress || ''}${newClient.pincode ? ' - ' + newClient.pincode : ''}`);
    setDeliveryAddress(newClient.shippingAddress || newClient.billingAddress || '');
    if (newClient.stateCode) {
      setPlaceOfSupplyStateCode(newClient.stateCode);
    }
    setIsAddClientModalOpen(false);
  };

  // When selecting engagement
  const handleEngagementSelect = (engId) => {
    setSelectedEngagementId(engId);
    if (!engId) return;
    const eng = engagements.find(e => e.id === engId);
    if (eng) {
      if (eng.clientId && !selectedClientId) {
        handleClientSelect(eng.clientId);
      }
      if (eng.entityId) {
        setSelectedEntityId(eng.entityId);
      }
      setItems([
        {
          id: `item-${Date.now()}`,
          type: 'SERVICE',
          sacHsn: eng.sacHsnCode || '998311',
          description: eng.title + (eng.scopeSummary ? ` - ${eng.scopeSummary}` : ''),
          qty: 1,
          unit: eng.unit || 'Project',
          rate: eng.quotedFee || 50000,
          discountPercent: 0,
          gstRate: eng.gstRate || 18
        }
      ]);
      if (eng.tdsSection) setTdsSectionId(eng.tdsSection);
      if (eng.tdsRate) setCustomTdsRate(eng.tdsRate);
    }
  };

  // Line item handlers
  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        type: 'SERVICE',
        category: categories[0] || '',
        sacHsn: '998311',
        description: '',
        qty: 1,
        unit: 'Project',
        rate: 10000,
        discountPercent: 0,
        gstRate: currentEntity?.gstin ? 18 : 0
      }
    ]);
  };

  const handleRemoveItem = (id) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateItem = (id, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'sacHsn') {
          const matched = COMMON_SAC_HSN_CODES.find(c => c.code === value);
          if (matched && !item.description) {
            updated.description = matched.desc || matched.description || '';
            updated.gstRate = currentEntity?.gstin ? (matched.defaultGst !== undefined ? matched.defaultGst : (matched.gstRate || 18)) : 0;
            updated.type = matched.type || 'SERVICE';
          }
        }
        return updated;
      }
      return item;
    }));
  };

  // Calculations
  const isInterState = useMemo(() => {
    return String(currentEntity?.stateCode || '36') !== String(placeOfSupplyStateCode || '36');
  }, [currentEntity, placeOfSupplyStateCode]);

  const supplierState = useMemo(() => {
    return GST_STATES.find(s => s.code === currentEntity?.stateCode) || { code: currentEntity?.stateCode || '36', name: currentEntity?.stateName || 'Telangana' };
  }, [currentEntity]);

  const posState = useMemo(() => {
    return GST_STATES.find(s => s.code === placeOfSupplyStateCode) || { code: placeOfSupplyStateCode, name: 'Other State' };
  }, [placeOfSupplyStateCode]);

  const calculatedItems = useMemo(() => {
    return items.map(item => {
      const qty = parseFloat(item.qty) || 0;
      const rate = parseFloat(item.rate) || 0;
      const discountPct = parseFloat(item.discountPercent) || 0;
      const gstRate = parseFloat(item.gstRate) || 0;

      const grossAmount = qty * rate;
      const discountAmount = grossAmount * (discountPct / 100);
      const taxableAmount = grossAmount - discountAmount;

      let cgstRate = 0;
      let cgstAmount = 0;
      let sgstRate = 0;
      let sgstAmount = 0;
      let igstRate = 0;
      let igstAmount = 0;

      // Only compute GST if rate > 0 and entity has GSTIN and not reverse charge
      if (gstRate > 0 && !isReverseCharge && currentEntity?.gstin) {
        if (isInterState) {
          igstRate = gstRate;
          igstAmount = Math.round(taxableAmount * (igstRate / 100) * 100) / 100;
        } else {
          cgstRate = gstRate / 2;
          cgstAmount = Math.round(taxableAmount * (cgstRate / 100) * 100) / 100;
          sgstRate = gstRate / 2;
          sgstAmount = Math.round(taxableAmount * (sgstRate / 100) * 100) / 100;
        }
      }

      const totalTax = cgstAmount + sgstAmount + igstAmount;
      const lineTotal = taxableAmount + totalTax;

      return {
        ...item,
        category: item.category || categories[0] || '',
        qty,
        rate,
        discountPercent: discountPct,
        gstRate,
        grossAmount,
        discountAmount,
        taxableAmount,
        cgstRate,
        cgstAmount,
        sgstRate,
        sgstAmount,
        igstRate,
        igstAmount,
        totalTax,
        lineTotal
      };
    });
  }, [items, isInterState, isReverseCharge, currentEntity, categories]);

  const taxableTotal = calculatedItems.reduce((sum, item) => sum + item.taxableAmount, 0);
  const totalCgst = calculatedItems.reduce((sum, item) => sum + item.cgstAmount, 0);
  const totalSgst = calculatedItems.reduce((sum, item) => sum + item.sgstAmount, 0);
  const totalIgst = calculatedItems.reduce((sum, item) => sum + item.igstAmount, 0);
  const totalTaxAmount = totalCgst + totalSgst + totalIgst;
  const rawGrandTotal = taxableTotal + totalTaxAmount;
  const roundOff = Math.round(rawGrandTotal) - rawGrandTotal;
  const grandTotal = Math.round(rawGrandTotal);

  // TDS Calculation
  const tdsSectionObj = TDS_SECTIONS.find(t => t.id === tdsSectionId);
  const activeTdsRate = customTdsRate !== undefined ? customTdsRate : (tdsSectionObj?.rate || 10);
  const estimatedTdsAmount = taxableTotal * (activeTdsRate / 100);
  const netReceivableAfterTds = grandTotal - estimatedTdsAmount;

  // Build full invoice object
  const buildInvoiceObject = (status = 'PENDING') => {
    const finalClientName = clientName.trim() || clients.find(c => c.id === selectedClientId)?.name || 'Customer';
    const finalInvoiceNumber = invoiceNumber.trim() || `${currentEntity?.invoicePrefix || 'INV/24-25/'}${currentEntity?.nextInvoiceNumber || '101'}`;

    return {
      id: editingInvoice?.id || `inv-${Date.now()}`,
      invoiceNumber: finalInvoiceNumber,
      invoiceDate,
      dueDate,
      poNumber: poNumber.trim(),
      entityId: selectedEntityId,
      entityName: currentEntity?.name || 'Business Entity',
      entityTradeName: currentEntity?.tradeName || '',
      entityGstin: currentEntity?.gstin || '',
      entityLogoUrl: currentEntity?.logoUrl || '',
      clientId: selectedClientId || null,
      clientName: finalClientName,
      clientGstin: clientGstin.trim().toUpperCase(),
      isClientRegistered,
      clientAddress: clientAddress.trim(),
      deliveryAddress: deliveryAddress.trim(),
      placeOfSupplyStateCode,
      placeOfSupplyStateName: posState.name,
      isInterState,
      isReverseCharge,
      engagementId: selectedEngagementId || null,
      category: calculatedItems[0]?.category || categories[0] || '',
      items: calculatedItems,
      taxableTotal,
      totalCgst,
      totalSgst,
      totalIgst,
      totalTaxAmount,
      roundOff,
      grandTotal,
      tdsSection: tdsSectionId,
      tdsRate: activeTdsRate,
      tdsAmount: estimatedTdsAmount,
      netReceivable: netReceivableAfterTds,
      amountPaid: editingInvoice?.amountPaid || 0,
      tdsDeductedByClient: editingInvoice?.tdsDeductedByClient || 0,
      status: editingInvoice?.status || status,
      notes: notes.trim(),
      terms: terms.trim(),
      signatoryName: signatoryName.trim(),
      signatoryDesignation: signatoryDesignation.trim(),
      createdAt: editingInvoice?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  };

  const handleSave = (status = 'PENDING') => {
    if (items.length === 0) {
      alert('Please add at least one line item');
      return;
    }

    const finalInvoice = buildInvoiceObject(status);
    onSaveInvoice(finalInvoice);
  };

  const handlePreview = () => {
    const previewObj = buildInvoiceObject('DRAFT');
    if (onOpenPreview) {
      onOpenPreview(previewObj);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24">
      {/* Top Header Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {editingInvoice ? 'Edit Tax Invoice' : 'Create Tax Invoice'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Generate statutory tax invoice compliant with Indian GST rules
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePreview}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer border border-slate-200 shadow-2xs"
          >
            <Eye size={14} className="text-slate-600" />
            <span>Preview</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave('DRAFT')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
          >
            <Save size={14} />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave('PENDING')}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer shadow-2xs"
          >
            <Check size={14} />
            <span>Save Invoice</span>
          </button>
        </div>
      </div>

      {/* Section 1: Issuing Entity & Invoice Metadata */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2.5">
          <Building2 size={15} className="text-slate-700" />
          <span>1. Issuing Supplier Entity & Document Details</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Select Our Issuing Entity */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 block">
              Issuing Entity (Our Company/Firm) *
            </label>
            <select
              value={selectedEntityId}
              onChange={(e) => setSelectedEntityId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer shadow-xs"
            >
              {entities.map(ent => (
                <option key={ent.id} value={ent.id}>
                  {ent.tradeName || ent.name} ({ent.stateName || 'State'})
                </option>
              ))}
            </select>
            {currentEntity && (
              <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200 flex justify-between shadow-xs">
                <span>GST: <strong className="font-mono text-slate-900">{currentEntity.gstin || 'Non-GST'}</strong></span>
                <span>State: <strong className="font-mono text-slate-900">{currentEntity.stateCode}</strong></span>
              </div>
            )}
          </div>

          {/* Invoice Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 block">
              Invoice Number *
            </label>
            <input
              type="text"
              required
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="INV/24-25/101"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-xs"
            />
            <span className="text-[10px] text-slate-500 block">Invoice serial sequence number</span>
          </div>

          {/* PO / Reference Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 block">
              Client PO / Ref No (Optional)
            </label>
            <input
              type="text"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              placeholder="e.g. PO-2024-8841"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-xs"
            />
            <span className="text-[10px] text-slate-500 block">Purchase Order or reference</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800 block">Invoice Date *</label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800 block">Payment Due Date *</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-xs"
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-bold text-slate-800 block">From Proposal / Engagement Quote</label>
            <select
              value={selectedEngagementId}
              onChange={(e) => handleEngagementSelect(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer shadow-xs"
            >
              <option value="">-- Direct Ad-Hoc Invoice (None) --</option>
              {engagements.map(eng => (
                <option key={eng.id} value={eng.id}>
                  {eng.title} ({eng.clientName} - {formatINR(eng.quotedFee)})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Section 2: Recipient / Customer Entity (With Inline Add Customer Option) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <User size={15} className="text-slate-700" />
              <span>2. Customer / Client Recipient Entity</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Select existing client or create a new customer entity on the fly</p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddClientModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition cursor-pointer"
          >
            <UserPlus size={13} className="text-slate-600" />
            <span>Add Customer</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Client Selection from Directory */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 block">
              Select Client from Directory
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => handleClientSelect(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer shadow-xs"
            >
              <option value="">-- Choose Existing Client Profile --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  👤 {c.name} {c.gstin ? `(GST: ${c.gstin})` : '(Non-GST)'}
                </option>
              ))}
            </select>
          </div>

          {/* Client Legal / Trade Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 block">
              Customer Legal / Billed Name *
            </label>
            <input
              type="text"
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Acme Innovations Private Limited or Rahul Sharma"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-xs"
            />
          </div>
        </div>

        {/* GSTIN (Optional), Place of Supply & Tax Treatment */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 block">
                Customer GSTIN
              </label>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">Optional</span>
            </div>
            <input
              type="text"
              maxLength={15}
              value={clientGstin}
              onChange={(e) => {
                const val = e.target.value.toUpperCase().trim();
                setClientGstin(val);
                if (val.length >= 2) {
                  const s = getStateFromGSTIN(val);
                  if (s) setPlaceOfSupplyStateCode(s.code);
                }
              }}
              placeholder="e.g. 29ABCDE1234F1Z5 (or leave empty)"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono uppercase font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-xs"
            />
            <span className="text-[10px] text-slate-500 block">Optional for non-GST clients / retail buyers</span>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800 block">
              Place of Supply (POS) *
            </label>
            <select
              value={placeOfSupplyStateCode}
              onChange={(e) => setPlaceOfSupplyStateCode(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer shadow-xs"
            >
              {GST_STATES.map(s => (
                <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
              ))}
            </select>
            <div className="mt-1 text-[11px]">
              {isInterState ? (
                <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  ⚡ Inter-State Supply (IGST)
                </span>
              ) : (
                <span className="text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  ✓ Intra-State Supply (CGST + SGST)
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800 block">
              Tax Flags
            </label>
            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={isReverseCharge}
                  onChange={(e) => setIsReverseCharge(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Tax Payable under Reverse Charge (RCM)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={isClientRegistered}
                  onChange={(e) => setIsClientRegistered(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Registered B2B Business</span>
              </label>
            </div>
          </div>
        </div>

        {/* Addresses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800 block">Billing Address *</label>
            <textarea
              rows={2}
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
              placeholder="Registered business address with City, Pincode"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800 block">Shipping / Delivery Address (Optional)</label>
            <textarea
              rows={2}
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Same as billing address if empty"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Billable Items & Services */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Receipt size={15} className="text-slate-700" />
              <span>3. Line Items & SAC / HSN GST Rates</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Define consulting, advisory or professional services rendered</p>
          </div>

          <button
            type="button"
            onClick={handleAddItem}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer shadow-2xs"
          >
            <Plus size={13} />
            <span>Add Item</span>
          </button>
        </div>

        {/* Items Table */}
        <div className="space-y-3">
          {items.map((item, idx) => {
            const calcItem = calculatedItems[idx] || {};
            return (
              <div 
                key={item.id}
                className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3 relative group hover:border-slate-300 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800">
                    Item #{idx + 1}
                  </span>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition cursor-pointer"
                      title="Remove Item"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {/* Category, SAC Code & Description */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-slate-700 block">Category</label>
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenManageCategories) {
                            onOpenManageCategories();
                          } else {
                            const newCat = prompt("Enter new Service Category name (e.g. Graphic Design, Financial Audit):");
                            if (newCat && newCat.trim()) {
                              const updated = StorageService.saveCategory(newCat.trim());
                              setCategories(updated);
                              handleUpdateItem(item.id, 'category', newCat.trim());
                            }
                          }
                        }}
                        className="text-[10px] text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer flex items-center gap-0.5"
                        title="Add or Edit Service Categories"
                      >
                        <Plus size={10} />
                        <span>Add / Edit</span>
                      </button>
                    </div>
                    <select
                      value={item.category || categories[0] || ''}
                      onChange={(e) => {
                        if (e.target.value === '__add_new__') {
                          if (onOpenManageCategories) {
                            onOpenManageCategories();
                          } else {
                            const newCat = prompt("Enter new Service Category name:");
                            if (newCat && newCat.trim()) {
                              const updated = StorageService.saveCategory(newCat.trim());
                              setCategories(updated);
                              handleUpdateItem(item.id, 'category', newCat.trim());
                            }
                          }
                          return;
                        }
                        handleUpdateItem(item.id, 'category', e.target.value);
                      }}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-1 focus:ring-slate-400 focus:outline-none"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="__add_new__" className="font-semibold text-emerald-700 bg-emerald-50">
                        + Add / Edit Categories...
                      </option>
                    </select>
                  </div>

                  <div className="sm:col-span-3 space-y-1">
                    <label className="text-[11px] font-medium text-slate-700 block">SAC / HSN Code</label>
                    <select
                      value={item.sacHsn}
                      onChange={(e) => handleUpdateItem(item.id, 'sacHsn', e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-medium focus:ring-1 focus:ring-slate-400 focus:outline-none"
                    >
                      {COMMON_SAC_HSN_CODES.map(sac => (
                        <option key={sac.code} value={sac.code}>
                          {sac.code} - {(sac.desc || sac.description || '').slice(0, 30)}...
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-6 space-y-1">
                    <label className="text-[11px] font-medium text-slate-700 block">Service Description *</label>
                    <input
                      type="text"
                      required
                      value={item.description}
                      onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                      placeholder="e.g. Professional Strategic & Management Advisory Consulting"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-1 focus:ring-slate-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Qty, Unit, Rate, Discount, GST */}
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-700 block">Qty</label>
                    <input
                      type="number"
                      min="0.1"
                      step="any"
                      value={item.qty}
                      onChange={(e) => handleUpdateItem(item.id, 'qty', e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-1 focus:ring-slate-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-700 block">Unit</label>
                    <select
                      value={item.unit}
                      onChange={(e) => handleUpdateItem(item.id, 'unit', e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-slate-400 focus:outline-none"
                    >
                      {UNITS_OF_MEASURE.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[11px] font-medium text-slate-700 block">Rate (₹) *</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={item.rate}
                      onChange={(e) => handleUpdateItem(item.id, 'rate', e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-medium text-slate-900 focus:ring-1 focus:ring-slate-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-700 block">Discount %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.discountPercent}
                      onChange={(e) => handleUpdateItem(item.id, 'discountPercent', e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-slate-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-700 block">GST %</label>
                    <select
                      value={item.gstRate}
                      onChange={(e) => handleUpdateItem(item.id, 'gstRate', e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-1 focus:ring-slate-400 focus:outline-none"
                    >
                      {GST_RATES.map(r => (
                        <option key={r.rate} value={r.rate}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Line Calculation Summary */}
                <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-600">
                  <div className="flex gap-4">
                    <span>Taxable: <strong className="font-mono text-slate-900">{formatINR(calcItem.taxableAmount || 0)}</strong></span>
                    {isInterState ? (
                      <span>IGST ({item.gstRate}%): <strong className="font-mono text-slate-900">{formatINR(calcItem.igstAmount || 0)}</strong></span>
                    ) : (
                      <span>CGST+SGST ({item.gstRate}%): <strong className="font-mono text-slate-900">{formatINR((calcItem.cgstAmount || 0) + (calcItem.sgstAmount || 0))}</strong></span>
                    )}
                  </div>
                  <div>
                    <span>Total: <strong className="font-mono font-bold text-slate-900">{formatINR(calcItem.lineTotal || 0)}</strong></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 4: Totals, TDS & Payment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: TDS & Signatory */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck size={14} className="text-slate-600" />
              <span>TDS Estimation</span>
            </h3>

            <div className="space-y-2 text-xs">
              <label className="font-medium text-slate-700 block">TDS Section</label>
              <select
                value={tdsSectionId}
                onChange={(e) => {
                  setTdsSectionId(e.target.value);
                  const s = TDS_SECTIONS.find(item => item.id === e.target.value);
                  if (s) setCustomTdsRate(s.rate);
                }}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-slate-400 focus:outline-none cursor-pointer"
              >
                {TDS_SECTIONS.map(s => (
                  <option key={s.id} value={s.id}>
                    Sec {s.section} - {s.description} ({s.rate}%)
                  </option>
                ))}
              </select>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Est. TDS Deducted ({activeTdsRate}%):</span>
                  <span className="font-mono font-medium text-rose-600">- {formatINR(estimatedTdsAmount)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-700 font-semibold">Net Bank Receivable:</span>
                  <span className="font-mono font-bold text-slate-900">{formatINR(netReceivableAfterTds)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Signatory Details */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <PenTool size={14} className="text-slate-600" />
              <span>Authorized Signatory</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div>
                <label className="font-medium text-slate-700 block">Signatory Name</label>
                <input
                  type="text"
                  value={signatoryName}
                  onChange={(e) => setSignatoryName(e.target.value)}
                  placeholder="Authorized Signatory Name"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-1 focus:ring-slate-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block">Designation</label>
                <input
                  type="text"
                  value={signatoryDesignation}
                  onChange={(e) => setSignatoryDesignation(e.target.value)}
                  placeholder="Managing Partner"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-slate-400 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Invoice Grand Total Breakdown */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Tax & Grand Total Summary
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Taxable Subtotal:</span>
                <span className="font-mono font-medium text-slate-900">{formatINR(taxableTotal)}</span>
              </div>

              {!isInterState ? (
                <>
                  <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                    <span>Central GST (CGST):</span>
                    <span className="font-mono font-medium text-slate-900">{formatINR(totalCgst)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                    <span>State GST (SGST):</span>
                    <span className="font-mono font-medium text-slate-900">{formatINR(totalSgst)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                  <span>Integrated GST (IGST):</span>
                  <span className="font-mono font-medium text-slate-900">{formatINR(totalIgst)}</span>
                </div>
              )}

              <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                <span>Total Tax Amount:</span>
                <span className="font-mono font-medium text-slate-900">{formatINR(totalTaxAmount)}</span>
              </div>

              {roundOff !== 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100 text-slate-500 text-[11px]">
                  <span>Round Off:</span>
                  <span className="font-mono">{roundOff > 0 ? `+${roundOff.toFixed(2)}` : roundOff.toFixed(2)}</span>
                </div>
              )}

              {/* Grand Total Box (Clean Slate) */}
              <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Invoice Total</span>
                  <p className="text-[11px] text-slate-400">Inclusive of all taxes</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-white font-mono tracking-tight">
                    {formatINR(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Amount in words */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <span className="text-slate-500 block text-[10px] font-medium uppercase">Amount in Words:</span>
                <span className="font-medium text-slate-900">{numberToWordsIndian(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Notes and Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-[11px] font-medium text-slate-700 block mb-1">Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Thank you for your business..."
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-[11px] focus:ring-1 focus:ring-slate-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-700 block mb-1">Terms & Conditions</label>
              <textarea
                rows={2}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="1. Payment is due within 15 days..."
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-[11px] focus:ring-1 focus:ring-slate-400 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 shadow-md z-40 flex items-center justify-between px-6 sm:px-12">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            Cancel
          </button>
          <span className="hidden sm:inline text-xs text-slate-500">
            Total: <strong className="font-mono text-slate-900">{formatINR(grandTotal)}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePreview}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer border border-slate-200 shadow-2xs"
          >
            <Eye size={14} className="text-slate-600" />
            <span>Preview</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave('PENDING')}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer shadow-2xs"
          >
            <Check size={14} />
            <span>Save Invoice</span>
          </button>
        </div>
      </div>

      {/* Inline Add Customer Modal */}
      {isAddClientModalOpen && (
        <ClientModal
          client={null}
          entities={entities}
          onSave={handleInlineSaveClient}
          onClose={() => setIsAddClientModalOpen(false)}
        />
      )}
    </div>
  );
}
