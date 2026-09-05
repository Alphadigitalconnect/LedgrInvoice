import React, { useState } from 'react';
import { 
  Briefcase, 
  Plus, 
  Edit3, 
  Trash2, 
  X,
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight,
  User,
  Building2
} from 'lucide-react';
import { PRICING_MODELS, formatINR, COMMON_SAC_HSN_CODES } from '../../data/constants';

export default function EngagementTracker({
  engagements,
  clients,
  entities,
  onSaveEngagement,
  onDeleteEngagement,
  onCreateInvoiceFromEngagement
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEng, setEditingEng] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    clientId: clients[0]?.id || '',
    entityId: entities[0]?.id || 'entity-1',
    pricingModel: 'FIXED',
    quotedFee: 50000,
    unit: 'Project',
    sacHsnCode: '998311',
    sacDesc: 'Management consulting and advisory services',
    gstRate: 18,
    tdsSection: '194J_10',
    tdsRate: 10,
    status: 'ACTIVE',
    billingCycle: 'Monthly retainer / Milestone',
    scopeSummary: '',
    notes: ''
  });

  const handleOpenNew = () => {
    setEditingEng(null);
    setFormData({
      title: '',
      clientId: clients[0]?.id || '',
      entityId: entities[0]?.id || 'entity-1',
      pricingModel: 'FIXED',
      quotedFee: 50000,
      unit: 'Project',
      sacHsnCode: '998311',
      sacDesc: 'Management consulting and advisory services',
      gstRate: 18,
      tdsSection: '194J_10',
      tdsRate: 10,
      status: 'ACTIVE',
      billingCycle: 'Monthly retainer / Milestone',
      scopeSummary: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (eng) => {
    setEditingEng(eng);
    setFormData({
      title: eng.title || '',
      clientId: eng.clientId || '',
      entityId: eng.entityId || 'entity-1',
      pricingModel: eng.pricingModel || 'FIXED',
      quotedFee: eng.quotedFee || 0,
      unit: eng.unit || 'Project',
      sacHsnCode: eng.sacHsnCode || '998311',
      sacDesc: eng.sacDesc || '',
      gstRate: eng.gstRate || 18,
      tdsSection: eng.tdsSection || '194J_10',
      tdsRate: eng.tdsRate || 10,
      status: eng.status || 'ACTIVE',
      billingCycle: eng.billingCycle || '',
      scopeSummary: eng.scopeSummary || '',
      notes: eng.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please provide a quote/proposal title');
      return;
    }
    const clientObj = clients.find(c => c.id === formData.clientId);

    const engagementToSave = {
      id: editingEng?.id || `eng-${Date.now()}`,
      ...formData,
      clientName: clientObj?.name || 'Client',
      quotedFee: parseFloat(formData.quotedFee) || 0,
      gstRate: parseFloat(formData.gstRate) || 18,
      tdsRate: parseFloat(formData.tdsRate) || 10
    };

    onSaveEngagement(engagementToSave);
    setIsModalOpen(false);
  };

  const filteredEngagements = engagements.filter(eng => {
    if (selectedClientId !== 'ALL' && eng.clientId !== selectedClientId) {
      return false;
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const titleMatch = eng.title?.toLowerCase().includes(term);
      const clientMatch = eng.clientName?.toLowerCase().includes(term);
      if (!titleMatch && !clientMatch) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Quotes & Proposals
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Client proposals, fee structures, retainers, and 1-click invoice conversion.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white transition self-start sm:self-auto cursor-pointer shadow-2xs"
        >
          <Plus size={14} />
          <span>New Proposal</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search quotes or client name..."
          className="w-full sm:w-80 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal focus:bg-white focus:ring-1 focus:ring-slate-400 focus:outline-none"
        />

        <select
          value={selectedClientId}
          onChange={(e) => setSelectedClientId(e.target.value)}
          className="w-full sm:w-auto px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:ring-1 focus:ring-slate-400 focus:outline-none cursor-pointer"
        >
          <option value="ALL">All Clients ({clients.length})</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Engagements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEngagements.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-slate-200 p-12 text-center shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
              <Briefcase size={22} />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">No quotes or proposals found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              {engagements.length === 0
                ? "Track project quotes, rate structures, and retainers that can be converted to invoices in 1 click."
                : "No quotes match your active client filter or search terms."}
            </p>
            <button
              onClick={handleOpenNew}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition cursor-pointer"
            >
              <Plus size={14} />
              <span>New Proposal Quote</span>
            </button>
          </div>
        ) : (
          filteredEngagements.map(eng => {
            const ent = entities.find(e => e.id === eng.entityId);
            return (
              <div 
                key={eng.id}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3.5 hover:border-slate-300 transition flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {eng.status || 'ACTIVE'}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-900">
                      {formatINR(eng.quotedFee || 0)}
                    </span>
                  </div>

                  <h3 className="font-semibold text-xs text-slate-900 line-clamp-2">{eng.title}</h3>
                  <div className="text-xs text-slate-600 flex items-center gap-1.5">
                    <User size={12} className="text-slate-400" />
                    <span className="font-medium text-slate-800">{eng.clientName}</span>
                  </div>
                  {eng.scopeSummary && (
                    <p className="text-[11px] text-slate-500 line-clamp-2">{eng.scopeSummary}</p>
                  )}
                </div>

                <div className="pt-2.5 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Entity: <strong className="text-slate-800 font-medium">{ent?.tradeName || ent?.name || 'Entity'}</strong></span>
                    <span>GST: <strong>{eng.gstRate}%</strong></span>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      onClick={() => onCreateInvoiceFromEngagement(eng)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition cursor-pointer"
                    >
                      <FileText size={13} />
                      <span>Create Invoice</span>
                    </button>

                    <button
                      onClick={() => handleOpenEdit(eng)}
                      className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-md transition cursor-pointer border border-slate-200"
                      title="Edit Quote"
                    >
                      <Edit3 size={13} />
                    </button>

                    <button
                      onClick={() => {
                        if (window.confirm(`Delete proposal ${eng.title}?`)) {
                          onDeleteEngagement(eng.id);
                        }
                      }}
                      className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md transition cursor-pointer border border-slate-200"
                      title="Delete Quote"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full overflow-hidden border border-slate-200 animate-fadeIn">
            <div className="bg-white px-5 py-3.5 flex items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Briefcase size={16} className="text-slate-700" />
                <h2 className="text-sm font-bold text-slate-900">
                  {editingEng ? 'Edit Proposal Quote' : 'New Proposal Quote'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 text-xs bg-white">
              <div className="space-y-1">
                <label className="font-medium text-slate-700 block">Proposal / Service Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Annual Statutory Audit & Advisory Retainer"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-1 focus:ring-slate-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700 block">Client *</label>
                  <select
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-1 focus:ring-slate-400 focus:outline-none cursor-pointer"
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-slate-700 block">Issuing Entity *</label>
                  <select
                    value={formData.entityId}
                    onChange={(e) => setFormData({ ...formData, entityId: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-1 focus:ring-slate-400 focus:outline-none cursor-pointer"
                  >
                    {entities.map(ent => (
                      <option key={ent.id} value={ent.id}>{ent.tradeName || ent.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700 block">Quoted Fee (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.quotedFee}
                    onChange={(e) => setFormData({ ...formData, quotedFee: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-medium text-slate-900 focus:ring-1 focus:ring-slate-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-slate-700 block">GST Rate %</label>
                  <input
                    type="number"
                    value={formData.gstRate}
                    onChange={(e) => setFormData({ ...formData, gstRate: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-medium focus:ring-1 focus:ring-slate-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-slate-700 block">Pricing Model</label>
                  <select
                    value={formData.pricingModel}
                    onChange={(e) => setFormData({ ...formData, pricingModel: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-400 focus:outline-none"
                  >
                    <option value="FIXED">Fixed Fee</option>
                    <option value="RETAINER">Monthly Retainer</option>
                    <option value="HOURLY">Hourly Billing</option>
                    <option value="MILESTONE">Milestone Based</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700 block">Scope of Work</label>
                <textarea
                  rows={2}
                  value={formData.scopeSummary}
                  onChange={(e) => setFormData({ ...formData, scopeSummary: e.target.value })}
                  placeholder="Summary of deliverables..."
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-400 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium transition"
                >
                  Save Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
