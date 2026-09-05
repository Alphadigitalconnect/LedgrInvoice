import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storage';
import { 
  Menu, 
  Plus, 
  LayoutDashboard, 
  FileText, 
  Users, 
  Building2, 
  Briefcase,
  PlusCircle,
  Sparkles
} from 'lucide-react';
import LedgrLogo from './components/common/LedgrLogo';

// Auth
import AuthScreen from './components/Auth/AuthScreen';
import ProfileModal from './components/Auth/ProfileModal';

// Reports & Imports
import MonthlyReportModal from './components/Reports/MonthlyReportModal';
import ImportClientsModal from './components/Clients/ImportClientsModal';
import ImportInvoicesModal from './components/Invoices/ImportInvoicesModal';

// Navigation & Layout
import Sidebar from './components/Navigation/Sidebar';

// Views
import Dashboard from './components/Dashboard/Dashboard';
import InvoiceList from './components/Invoices/InvoiceList';
import CreateInvoice from './components/Invoices/CreateInvoice';
import InvoicePreview from './components/Invoices/InvoicePreview';
import ShareModal from './components/Invoices/ShareModal';
import RecordPaymentModal from './components/Invoices/RecordPaymentModal';
import ClientList from './components/Clients/ClientList';
import ClientModal from './components/Clients/ClientModal';
import EngagementTracker from './components/Clients/EngagementTracker';
import EntitySettings from './components/Entities/EntitySettings';
import AddEntityModal from './components/Entities/AddEntityModal';

export default function App() {
  // Initialize storage
  useEffect(() => {
    StorageService.initialize();
  }, []);

  // Authentication State
  const [authUser, setAuthUser] = useState(() => StorageService.getAuthUser());
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('invoicify_admin_auth') === 'authenticated' && !!StorageService.getAuthUser();
  });

  // Application Data States
  const [entities, setEntities] = useState(() => StorageService.getEntities());
  const [clients, setClients] = useState(() => StorageService.getClients());
  const [engagements, setEngagements] = useState(() => StorageService.getEngagements());
  const [invoices, setInvoices] = useState(() => StorageService.getInvoices());

  const handleLoginSuccess = async (user) => {
    setAuthUser(user);
    StorageService.setAuthUser(user);
    setIsAuthenticated(true);

    // Pull user's Hostinger cloud data if present
    if (user && user.id) {
      const cloudData = await StorageService.loadFromHostinger(user.id);
      if (cloudData) {
        setEntities(StorageService.getEntities());
        setClients(StorageService.getClients());
        setEngagements(StorageService.getEngagements());
        setInvoices(StorageService.getInvoices());
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('invoicify_admin_auth');
    StorageService.clearAuthUser();
    setAuthUser(null);
    setIsAuthenticated(false);
  };

  const handleProfileUpdated = (updatedUser) => {
    setAuthUser(updatedUser);
    StorageService.setAuthUser(updatedUser);
  };

  const handleAccountDeleted = () => {
    StorageService.resetAllData();
    localStorage.removeItem('invoicify_admin_auth');
    StorageService.clearAuthUser();
    setAuthUser(null);
    setIsAuthenticated(false);
    setIsProfileModalOpen(false);
  };

  // Active View Tab
  const [activeTab, setActiveTab] = useState('dashboard');

  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Active Entity Filter ('all' | 'entity-1' | ...)
  const [activeEntityFilter, setActiveEntityFilterState] = useState(() => StorageService.getActiveEntityFilter());

  const setActiveEntityFilter = (val) => {
    setActiveEntityFilterState(val);
    StorageService.setActiveEntityFilter(val);
  };

  // Modals & Overlays State
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [shareInvoiceData, setShareInvoiceData] = useState(null);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState(null);
  const [clientModalData, setClientModalData] = useState(null); // null or { client: clientObj }
  const [isAddEntityModalOpen, setIsAddEntityModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMonthlyReportOpen, setIsMonthlyReportOpen] = useState(false);
  const [isImportClientsOpen, setIsImportClientsOpen] = useState(false);
  const [isImportInvoicesOpen, setIsImportInvoicesOpen] = useState(false);

  // Bulk Import Handlers
  const handleImportClientsSuccess = (importedList) => {
    importedList.forEach(client => {
      StorageService.saveClient(client);
    });
    setClients(StorageService.getClients());
  };

  const handleImportInvoicesSuccess = (importedInvoices) => {
    importedInvoices.forEach(inv => {
      // Find or create client
      let targetClient = clients.find(c => 
        (c.businessName && c.businessName.toLowerCase() === inv.clientName.toLowerCase()) ||
        (c.name && c.name.toLowerCase() === inv.clientName.toLowerCase()) ||
        (c.gstin && inv.clientGstin && c.gstin.toUpperCase() === inv.clientGstin.toUpperCase())
      );
      if (!targetClient) {
        const newCli = {
          id: `client-auto-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          businessName: inv.clientName,
          name: inv.clientName,
          gstin: inv.clientGstin || '',
          stateName: inv.clientState || '',
          createdAt: new Date().toISOString()
        };
        StorageService.saveClient(newCli);
        targetClient = newCli;
      }
      const completeInvoice = {
        ...inv,
        clientId: targetClient.id || inv.clientId
      };
      StorageService.saveInvoice(completeInvoice);
    });
    setClients(StorageService.getClients());
    setInvoices(StorageService.getInvoices());
    setEntities(StorageService.getEntities());
  };

  // Invoice creation initial props
  const [invoiceContext, setInvoiceContext] = useState({
    entityId: null,
    clientId: null,
    engagementId: null,
    editingInvoice: null
  });

  // Handlers for Invoices
  const handleOpenCreateInvoice = (ctx = {}) => {
    setInvoiceContext({
      entityId: ctx.entityId || (activeEntityFilter !== 'all' ? activeEntityFilter : entities[0]?.id),
      clientId: ctx.clientId || null,
      engagementId: ctx.engagementId || null,
      editingInvoice: ctx.editingInvoice || null
    });
    setActiveTab('create-invoice');
  };

  const handleSaveInvoice = (invoiceObj) => {
    const updated = StorageService.saveInvoice(invoiceObj);
    setInvoices(updated);
    setEntities(StorageService.getEntities()); // reload entities in case next seq changed
    // Open online preview for the newly saved invoice
    setPreviewInvoice(invoiceObj);
    setActiveTab('invoices');
  };

  const handleDeleteInvoice = (id) => {
    const updated = StorageService.deleteInvoice(id);
    setInvoices(updated);
  };

  const handleDuplicateInvoice = (invoiceToClone) => {
    const targetEntity = entities.find(e => e.id === invoiceToClone.entityId) || entities[0];
    const cloned = {
      ...invoiceToClone,
      id: `inv-${Date.now()}`,
      invoiceNumber: `${targetEntity.invoicePrefix || 'INV/24-25/'}${targetEntity.nextInvoiceNumber || '999'}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      status: 'DRAFT',
      amountPaid: 0,
      tdsDeductedByClient: 0,
      paymentDate: null,
      paymentRef: null,
      createdAt: new Date().toISOString()
    };
    const updated = StorageService.saveInvoice(cloned);
    setInvoices(updated);
    setEntities(StorageService.getEntities());
  };

  const handleRecordPaymentSave = (updatedInvoice) => {
    const updated = StorageService.saveInvoice(updatedInvoice);
    setInvoices(updated);
    setPaymentModalInvoice(null);
  };

  // Handlers for Clients
  const handleSaveClient = (clientObj) => {
    const updated = StorageService.saveClient(clientObj);
    setClients(updated);
    setClientModalData(null);
    return clientObj;
  };

  const handleDeleteClient = (id) => {
    const updated = StorageService.deleteClient(id);
    setClients(updated);
  };

  // Handlers for Engagements
  const handleSaveEngagement = (engagementObj) => {
    const updated = StorageService.saveEngagement(engagementObj);
    setEngagements(updated);
  };

  const handleDeleteEngagement = (id) => {
    const updated = StorageService.deleteEngagement(id);
    setEngagements(updated);
  };

  const handleCreateInvoiceFromEngagement = (eng) => {
    handleOpenCreateInvoice({
      entityId: eng.entityId,
      clientId: eng.clientId,
      engagementId: eng.id
    });
  };

  // Handlers for Entities
  const handleSaveEntity = (entityObj) => {
    const updated = StorageService.saveEntity(entityObj);
    setEntities(updated);
  };

  // Reset & Backup Handlers
  const handleResetData = () => {
    if (window.confirm('Clear all data and reset to a completely blank workspace?')) {
      StorageService.resetAllData();
      setEntities(StorageService.getEntities());
      setClients(StorageService.getClients());
      setEngagements(StorageService.getEngagements());
      setInvoices(StorageService.getInvoices());
      setActiveEntityFilter('all');
      alert('All data has been cleared. You now have a blank workspace.');
    }
  };

  const handleExportData = () => {
    const jsonStr = StorageService.exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoicify_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // If not authenticated, render the Mobile/Email Auth Screen
  if (!isAuthenticated) {
    return <AuthScreen onAuthSuccess={handleLoginSuccess} />;
  }

  const activeEntityObj = entities.find(e => e.id === activeEntityFilter);

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      {/* Mobile Top Navigation Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200 shadow-2xs z-30 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            aria-label="Open Navigation Menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-1.5">
            <div className="p-0.5 rounded-lg bg-slate-900 text-white">
              <LedgrLogo size={22} className="rounded-md" />
            </div>
            <span className="font-bold text-sm tracking-tight text-slate-900">LEDGR</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeEntityObj && (
            <span className="text-[10px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md border border-slate-200 max-w-[110px] truncate">
              {activeEntityObj.tradeName || activeEntityObj.name}
            </span>
          )}
          <button
            onClick={() => handleOpenCreateInvoice()}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-2xs cursor-pointer"
          >
            <Plus size={13} />
            <span>Invoice</span>
          </button>
        </div>
      </header>

      {/* Responsive Sidebar Navigation Drawer */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        entities={entities}
        activeEntityFilter={activeEntityFilter}
        setActiveEntityFilter={setActiveEntityFilter}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onResetData={handleResetData}
        onExportData={handleExportData}
        onOpenNewInvoice={() => handleOpenCreateInvoice()}
        onOpenAddEntity={() => setIsAddEntityModalOpen(true)}
        onLogout={handleLogout}
        authUser={authUser}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenMonthlyReport={() => setIsMonthlyReportOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 md:p-8 pb-24 md:pb-8">
        {/* Active Tab View */}
        {activeTab === 'dashboard' && (
          <Dashboard
            invoices={invoices}
            clients={clients}
            engagements={engagements}
            entities={entities}
            activeEntityFilter={activeEntityFilter}
            setActiveEntityFilter={setActiveEntityFilter}
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenNewInvoice={() => handleOpenCreateInvoice()}
            onOpenAddEntity={() => setIsAddEntityModalOpen(true)}
            onViewInvoice={(inv) => setPreviewInvoice(inv)}
            onShareInvoice={(inv) => setShareInvoiceData(inv)}
            onRecordPayment={(inv) => setPaymentModalInvoice(inv)}
          />
        )}

        {activeTab === 'invoices' && (
          <InvoiceList
            invoices={invoices}
            entities={entities}
            clients={clients}
            activeEntityFilter={activeEntityFilter}
            setActiveEntityFilter={setActiveEntityFilter}
            onOpenNewInvoice={() => handleOpenCreateInvoice()}
            onViewInvoice={(inv) => setPreviewInvoice(inv)}
            onEditInvoice={(inv) => handleOpenCreateInvoice({ editingInvoice: inv })}
            onShareInvoice={(inv) => setShareInvoiceData(inv)}
            onRecordPayment={(inv) => setPaymentModalInvoice(inv)}
            onDeleteInvoice={handleDeleteInvoice}
            onDuplicateInvoice={handleDuplicateInvoice}
            onOpenMonthlyReport={() => setIsMonthlyReportOpen(true)}
            onOpenImportInvoices={() => setIsImportInvoicesOpen(true)}
          />
        )}

        {activeTab === 'create-invoice' && (
          <CreateInvoice
            key={invoiceContext.editingInvoice?.id || `invoice-form-${invoiceContext.entityId || 'def'}-${invoiceContext.clientId || 'none'}`}
            entities={entities}
            clients={clients}
            engagements={engagements}
            initialEntityId={invoiceContext.entityId}
            initialClientId={invoiceContext.clientId}
            initialEngagementId={invoiceContext.engagementId}
            editingInvoice={invoiceContext.editingInvoice}
            onSaveInvoice={handleSaveInvoice}
            onSaveClient={handleSaveClient}
            onCancel={() => setActiveTab('invoices')}
            onOpenPreview={(inv) => setPreviewInvoice(inv)}
          />
        )}

        {activeTab === 'engagements' && (
          <EngagementTracker
            engagements={engagements}
            clients={clients}
            entities={entities}
            onSaveEngagement={handleSaveEngagement}
            onDeleteEngagement={handleDeleteEngagement}
            onCreateInvoiceFromEngagement={handleCreateInvoiceFromEngagement}
          />
        )}

        {activeTab === 'clients' && (
          <ClientList
            clients={clients}
            invoices={invoices}
            engagements={engagements}
            entities={entities}
            onOpenNewClient={() => setClientModalData({ client: null })}
            onEditClient={(client) => setClientModalData({ client })}
            onDeleteClient={handleDeleteClient}
            onNavigateToEngagements={() => setActiveTab('engagements')}
            onCreateInvoiceForClient={(client) => handleOpenCreateInvoice({ clientId: client.id })}
            onOpenImportClients={() => setIsImportClientsOpen(true)}
          />
        )}

        {activeTab === 'entities' && (
          <EntitySettings
            entities={entities}
            onSaveEntity={handleSaveEntity}
            onOpenAddEntity={() => setIsAddEntityModalOpen(true)}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (Fixed for quick thumb-reach) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-1.5 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] font-medium transition cursor-pointer ${
            activeTab === 'dashboard' ? 'text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <LayoutDashboard size={18} className={activeTab === 'dashboard' ? 'text-slate-900' : 'text-slate-400'} />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] font-medium transition cursor-pointer ${
            activeTab === 'invoices' ? 'text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText size={18} className={activeTab === 'invoices' ? 'text-slate-900' : 'text-slate-400'} />
          <span>Invoices</span>
        </button>

        {/* Center Prominent Create Button */}
        <button
          onClick={() => handleOpenCreateInvoice()}
          className="flex flex-col items-center justify-center -mt-4 w-11 h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-md transition cursor-pointer"
          title="Create New Invoice"
        >
          <Plus size={20} />
        </button>

        <button
          onClick={() => setActiveTab('clients')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] font-medium transition cursor-pointer ${
            activeTab === 'clients' ? 'text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users size={18} className={activeTab === 'clients' ? 'text-slate-900' : 'text-slate-400'} />
          <span>Clients</span>
        </button>

        <button
          onClick={() => setActiveTab('entities')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] font-medium transition cursor-pointer ${
            activeTab === 'entities' ? 'text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building2 size={18} className={activeTab === 'entities' ? 'text-slate-900' : 'text-slate-400'} />
          <span>Settings</span>
        </button>
      </nav>

      {/* Global User Profile & Account Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        authUser={authUser}
        onProfileUpdated={handleProfileUpdated}
        onAccountDeleted={handleAccountDeleted}
      />

      {/* Global Monthly Invoices & GST Report Modal */}
      <MonthlyReportModal
        isOpen={isMonthlyReportOpen}
        onClose={() => setIsMonthlyReportOpen(false)}
        invoices={invoices}
        entities={entities}
        clients={clients}
      />

      {/* Global Import Clients Modal */}
      <ImportClientsModal
        isOpen={isImportClientsOpen}
        onClose={() => setIsImportClientsOpen(false)}
        onImportSuccess={handleImportClientsSuccess}
        existingClients={clients}
      />

      {/* Global Import Invoices Modal */}
      <ImportInvoicesModal
        isOpen={isImportInvoicesOpen}
        onClose={() => setIsImportInvoicesOpen(false)}
        onImportSuccess={handleImportInvoicesSuccess}
        entities={entities}
        clients={clients}
        activeEntityId={activeEntityFilter}
      />

      {/* Global Invoice Preview Modal */}
      {previewInvoice && (
        <InvoicePreview
          invoice={previewInvoice}
          entity={entities.find(e => e.id === previewInvoice.entityId) || entities[0]}
          client={clients.find(c => c.id === previewInvoice.clientId)}
          onClose={() => setPreviewInvoice(null)}
          onShare={(inv) => {
            setPreviewInvoice(null);
            setShareInvoiceData(inv);
          }}
          onEdit={(inv) => {
            setPreviewInvoice(null);
            handleOpenCreateInvoice({ editingInvoice: inv });
          }}
        />
      )}

      {/* Global Add Our Entity Modal */}
      <AddEntityModal
        isOpen={isAddEntityModalOpen}
        onClose={() => setIsAddEntityModalOpen(false)}
        onSaveEntity={handleSaveEntity}
      />

      {/* Global WhatsApp / Email Share Modal */}
      {shareInvoiceData && (
        <ShareModal
          invoice={shareInvoiceData}
          entity={entities.find(e => e.id === shareInvoiceData.entityId) || entities[0]}
          client={clients.find(c => c.id === shareInvoiceData.clientId)}
          onClose={() => setShareInvoiceData(null)}
          onNavigateToSettings={() => setActiveTab('entities')}
        />
      )}

      {/* Global Record Payment Modal */}
      {paymentModalInvoice && (
        <RecordPaymentModal
          invoice={paymentModalInvoice}
          entity={entities.find(e => e.id === paymentModalInvoice.entityId) || entities[0]}
          onSave={handleRecordPaymentSave}
          onClose={() => setPaymentModalInvoice(null)}
        />
      )}

      {/* Global Add/Edit Client Modal */}
      {clientModalData && (
        <ClientModal
          client={clientModalData.client}
          entities={entities}
          onSave={handleSaveClient}
          onClose={() => setClientModalData(null)}
        />
      )}
    </div>
  );
}

