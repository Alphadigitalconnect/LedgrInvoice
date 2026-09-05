import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Briefcase, 
  Building2, 
  PlusCircle, 
  Receipt,
  Download,
  RotateCcw,
  Lock,
  LogOut,
  Plus,
  Sliders,
  X
} from 'lucide-react';
import LedgrLogo from '../common/LedgrLogo';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  entities, 
  activeEntityFilter, 
  setActiveEntityFilter,
  isOpen = false,
  onClose,
  onResetData,
  onExportData,
  onOpenNewInvoice,
  onOpenAddEntity,
  onLogout
}) {
  const currentEntity = entities.find(e => e.id === activeEntityFilter);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create-invoice', label: 'Create Invoice', icon: PlusCircle, badge: 'New', action: onOpenNewInvoice },
    { id: 'invoices', label: 'Manage Invoices', icon: FileText },
    { id: 'engagements', label: 'Quotes & Proposals', icon: Briefcase },
    { id: 'clients', label: 'Clients Directory', icon: Users },
    { id: 'entities', label: 'Entity Profiles & Templates', icon: Building2, count: entities.length }
  ];

  const handleNavClick = (item) => {
    if (item.action) {
      item.action();
    } else {
      setActiveTab(item.id);
    }
    if (onClose) onClose();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white text-slate-700 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-1 rounded-xl bg-slate-900 text-white flex items-center justify-center">
            <LedgrLogo size={28} className="rounded-lg" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-bold text-slate-900 tracking-tight font-sans">
                LEDGR
              </h1>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                HUB
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-normal">Multi-Entity Invoicing</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onLogout}
            title="Lock Session / Logout"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <LogOut size={16} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              title="Close Menu"
              className="md:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Multi-Entity Switcher Widget */}
      <div className="p-3 bg-slate-50/80 border-b border-slate-200">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Active Entity</span>
          <button
            onClick={() => {
              onOpenAddEntity();
              if (onClose) onClose();
            }}
            title="Add New Entity Profile"
            className="text-[10px] px-2 py-0.5 rounded-md bg-white hover:bg-slate-100 text-slate-700 font-medium border border-slate-200 flex items-center gap-1 transition cursor-pointer shadow-2xs"
          >
            <Plus size={10} />
            <span>Add</span>
          </button>
        </div>
        <select 
          value={activeEntityFilter}
          onChange={(e) => setActiveEntityFilter(e.target.value)}
          className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-slate-400 focus:outline-none transition cursor-pointer shadow-2xs"
        >
          <option value="all">All Entities Combined</option>
          {entities.map((ent) => (
            <option key={ent.id} value={ent.id}>
              {ent.tradeName || ent.name} ({ent.stateName || 'State'})
            </option>
          ))}
        </select>

        {currentEntity && (
          <div className="mt-2 text-[11px] bg-white rounded-lg p-2 border border-slate-200 flex items-center justify-between shadow-2xs">
            <span className="text-slate-600 truncate max-w-[130px]">
              {currentEntity.gstin ? (
                <>GSTIN: <span className="font-mono text-slate-800 font-semibold">{currentEntity.gstin}</span></>
              ) : (
                <span className="text-slate-500 italic">Non-GST / Exempt</span>
              )}
            </span>
            <span className="px-1.5 py-0.5 text-[10px] rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              State {currentEntity.stateCode}
            </span>
          </div>
        )}
      </div>

      {/* Primary Action Button */}
      <div className="p-3">
        <button
          onClick={() => {
            onOpenNewInvoice();
            if (onClose) onClose();
          }}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2 px-3 rounded-lg transition shadow-2xs cursor-pointer"
        >
          <Plus size={14} />
          <span>Create Invoice</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                isActive
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon size={16} className={isActive ? 'text-slate-900' : 'text-slate-500'} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded font-medium border border-emerald-200">
                  {item.badge}
                </span>
              )}
              {item.count !== undefined && (
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Utility Tools */}
      <div className="p-3 border-t border-slate-200 space-y-1 bg-slate-50/50">
        <button
          onClick={() => {
            onExportData();
            if (onClose) onClose();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-white transition cursor-pointer"
        >
          <Download size={13} className="text-slate-500" />
          <span>Export Backup</span>
        </button>
        <button
          onClick={() => {
            onResetData();
            if (onClose) onClose();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-600 hover:text-rose-600 hover:bg-white transition cursor-pointer"
        >
          <RotateCcw size={13} className="text-slate-400" />
          <span>Clear All Data</span>
        </button>
        <button
          onClick={() => {
            onLogout();
            if (onClose) onClose();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-white transition cursor-pointer"
        >
          <Lock size={13} className="text-slate-400" />
          <span>Lock Admin Session</span>
        </button>
      </div>

      {/* Footer */}
      <div className="px-3 py-2 bg-white border-t border-slate-100 text-[10px] text-slate-400 font-medium">
        <span>LEDGR Portal • v1.0</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col flex-shrink-0 min-h-screen border-r border-slate-200 shadow-xs">
        {sidebarContent}
      </aside>

      {/* Mobile Off-Canvas Drawer Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden transition-opacity"
        />
      )}

      {/* Mobile Off-Canvas Drawer */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl md:hidden transform transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
}
