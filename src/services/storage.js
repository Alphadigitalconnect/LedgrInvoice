import { INITIAL_ENTITIES, INITIAL_CLIENTS, INITIAL_ENGAGEMENTS, INITIAL_INVOICES } from '../data/mockData';
import { ApiService } from './api';

const KEYS = {
  ENTITIES: 'invoicify_entities_v2',
  CLIENTS: 'invoicify_clients_v2',
  ENGAGEMENTS: 'invoicify_engagements_v2',
  INVOICES: 'invoicify_invoices_v2',
  ACTIVE_ENTITY: 'invoicify_active_entity_id_v2',
  AUTH_USER: 'invoicify_auth_user'
};

// Safe JSON parser
function safeGet(key, defaultVal) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultVal;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage:`, e);
    return defaultVal;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to localStorage:`, e);
  }
}

// Debounced auto-sync to Hostinger
let syncTimeout = null;
function triggerCloudSync(storageInstance) {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    const user = storageInstance.getAuthUser();
    const userId = user?.id || 'default_workspace';
    const payload = {
      entities: storageInstance.getEntities(),
      clients: storageInstance.getClients(),
      engagements: storageInstance.getEngagements(),
      invoices: storageInstance.getInvoices(),
      activeEntityId: storageInstance.getActiveEntityFilter()
    };
    ApiService.syncToHostinger(payload, userId);
  }, 400);
}

// Storage API
export const StorageService = {
  // Init store with seed data if not present
  initialize() {
    // Clear old v1 keys if any
    localStorage.removeItem('invoicify_entities_v1');
    localStorage.removeItem('invoicify_clients_v1');
    localStorage.removeItem('invoicify_engagements_v1');
    localStorage.removeItem('invoicify_invoices_v1');
    localStorage.removeItem('invoicify_active_entity_id_v1');

    if (!localStorage.getItem(KEYS.ENTITIES)) {
      safeSet(KEYS.ENTITIES, INITIAL_ENTITIES);
    }
    if (!localStorage.getItem(KEYS.CLIENTS)) {
      safeSet(KEYS.CLIENTS, INITIAL_CLIENTS);
    }
    if (!localStorage.getItem(KEYS.ENGAGEMENTS)) {
      safeSet(KEYS.ENGAGEMENTS, INITIAL_ENGAGEMENTS);
    }
    if (!localStorage.getItem(KEYS.INVOICES)) {
      safeSet(KEYS.INVOICES, INITIAL_INVOICES);
    }
    if (!localStorage.getItem(KEYS.ACTIVE_ENTITY)) {
      safeSet(KEYS.ACTIVE_ENTITY, "all");
    }
  },

  // Auth User
  getAuthUser() {
    return safeGet(KEYS.AUTH_USER, null);
  },
  setAuthUser(user) {
    safeSet(KEYS.AUTH_USER, user);
  },
  clearAuthUser() {
    localStorage.removeItem(KEYS.AUTH_USER);
  },

  // Pull data from Hostinger cloud on sign-in
  async loadFromHostinger(userId) {
    if (!userId) return null;
    const cloudData = await ApiService.fetchFromHostinger(userId);
    if (cloudData) {
      if (Array.isArray(cloudData.entities)) safeSet(KEYS.ENTITIES, cloudData.entities);
      if (Array.isArray(cloudData.clients)) safeSet(KEYS.CLIENTS, cloudData.clients);
      if (Array.isArray(cloudData.engagements)) safeSet(KEYS.ENGAGEMENTS, cloudData.engagements);
      if (Array.isArray(cloudData.invoices)) safeSet(KEYS.INVOICES, cloudData.invoices);
      if (cloudData.activeEntityId) safeSet(KEYS.ACTIVE_ENTITY, cloudData.activeEntityId);
      return cloudData;
    }
    return null;
  },

  // Active Entity Filter State
  getActiveEntityFilter() {
    return safeGet(KEYS.ACTIVE_ENTITY, "all");
  },
  setActiveEntityFilter(id) {
    safeSet(KEYS.ACTIVE_ENTITY, id);
    triggerCloudSync(this);
  },

  // Entities
  getEntities() {
    return safeGet(KEYS.ENTITIES, INITIAL_ENTITIES);
  },
  getEntityById(id) {
    const list = this.getEntities();
    return list.find(e => e.id === id) || list[0] || null;
  },
  saveEntity(entity) {
    const list = this.getEntities();
    const index = list.findIndex(e => e.id === entity.id);
    let updated;
    if (index >= 0) {
      updated = [...list];
      updated[index] = entity;
    } else {
      updated = [...list, { ...entity, id: entity.id || `entity-${Date.now()}` }];
    }
    safeSet(KEYS.ENTITIES, updated);
    triggerCloudSync(this);
    return updated;
  },

  // Increment entity's invoice sequence
  incrementEntityInvoiceSeq(entityId) {
    const entities = this.getEntities();
    const updated = entities.map(ent => {
      if (ent.id === entityId) {
        return { ...ent, nextInvoiceNumber: (ent.nextInvoiceNumber || 100) + 1 };
      }
      return ent;
    });
    safeSet(KEYS.ENTITIES, updated);
    triggerCloudSync(this);
    return updated;
  },

  // Clients
  getClients() {
    return safeGet(KEYS.CLIENTS, INITIAL_CLIENTS);
  },
  getClientById(id) {
    return this.getClients().find(c => c.id === id) || null;
  },
  saveClient(client) {
    const list = this.getClients();
    const index = list.findIndex(c => c.id === client.id);
    let updated;
    if (index >= 0) {
      updated = [...list];
      updated[index] = { ...client, updatedAt: new Date().toISOString() };
    } else {
      const newClient = {
        ...client,
        id: client.id || `client-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      updated = [newClient, ...list];
    }
    safeSet(KEYS.CLIENTS, updated);
    triggerCloudSync(this);
    return updated;
  },
  deleteClient(id) {
    const list = this.getClients().filter(c => c.id !== id);
    safeSet(KEYS.CLIENTS, list);
    triggerCloudSync(this);
    return list;
  },

  // Engagements
  getEngagements() {
    return safeGet(KEYS.ENGAGEMENTS, INITIAL_ENGAGEMENTS);
  },
  getEngagementsByClient(clientId) {
    return this.getEngagements().filter(e => e.clientId === clientId);
  },
  saveEngagement(engagement) {
    const list = this.getEngagements();
    const index = list.findIndex(e => e.id === engagement.id);
    let updated;
    if (index >= 0) {
      updated = [...list];
      updated[index] = { ...engagement, updatedAt: new Date().toISOString() };
    } else {
      const newEng = {
        ...engagement,
        id: engagement.id || `eng-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      updated = [newEng, ...list];
    }
    safeSet(KEYS.ENGAGEMENTS, updated);
    triggerCloudSync(this);
    return updated;
  },
  deleteEngagement(id) {
    const list = this.getEngagements().filter(e => e.id !== id);
    safeSet(KEYS.ENGAGEMENTS, list);
    triggerCloudSync(this);
    return list;
  },

  // Invoices
  getInvoices() {
    return safeGet(KEYS.INVOICES, INITIAL_INVOICES);
  },
  getInvoiceById(id) {
    return this.getInvoices().find(inv => inv.id === id) || null;
  },
  saveInvoice(invoice) {
    const list = this.getInvoices();
    const index = list.findIndex(inv => inv.id === invoice.id);
    let updated;
    if (index >= 0) {
      updated = [...list];
      updated[index] = { ...invoice, updatedAt: new Date().toISOString() };
    } else {
      const newInvoice = {
        ...invoice,
        id: invoice.id || `inv-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      updated = [newInvoice, ...list];
      // Increment entity next sequence if newly created
      if (invoice.entityId) {
        this.incrementEntityInvoiceSeq(invoice.entityId);
      }
    }
    safeSet(KEYS.INVOICES, updated);
    triggerCloudSync(this);
    return updated;
  },
  deleteInvoice(id) {
    const list = this.getInvoices().filter(inv => inv.id !== id);
    safeSet(KEYS.INVOICES, list);
    triggerCloudSync(this);
    return list;
  },

  // Reset to Factory Defaults (Blank)
  resetAllData() {
    safeSet(KEYS.ENTITIES, []);
    safeSet(KEYS.CLIENTS, []);
    safeSet(KEYS.ENGAGEMENTS, []);
    safeSet(KEYS.INVOICES, []);
    safeSet(KEYS.ACTIVE_ENTITY, "all");
    triggerCloudSync(this);
    return true;
  },

  // Export full JSON backup
  exportBackup() {
    const backup = {
      version: "2.0",
      timestamp: new Date().toISOString(),
      entities: this.getEntities(),
      clients: this.getClients(),
      engagements: this.getEngagements(),
      invoices: this.getInvoices()
    };
    return JSON.stringify(backup, null, 2);
  },

  // Import JSON backup
  importBackup(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.entities) safeSet(KEYS.ENTITIES, parsed.entities);
      if (parsed.clients) safeSet(KEYS.CLIENTS, parsed.clients);
      if (parsed.engagements) safeSet(KEYS.ENGAGEMENTS, parsed.engagements);
      if (parsed.invoices) safeSet(KEYS.INVOICES, parsed.invoices);
      triggerCloudSync(this);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
};

