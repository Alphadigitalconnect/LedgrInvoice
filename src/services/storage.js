import { ApiService } from './api';

const KEY_AUTH_USER = 'invoicify_auth_user';

// Helper to get user-scoped key
function getUserKey(keyName, customUserId) {
  let uid = customUserId;
  if (!uid) {
    const user = StorageService.getAuthUser();
    uid = user?.id || 'guest';
  }
  return `invoicify_u_${uid}_${keyName}`;
}

// Safe JSON parser
function safeGet(key, defaultVal) {
  try {
    const data = localStorage.getItem(key);
    return data !== null ? JSON.parse(data) : defaultVal;
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

// Debounced auto-sync to Hostinger per user
let syncTimeout = null;
function triggerCloudSync(storageInstance) {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    const user = storageInstance.getAuthUser();
    if (!user || !user.id) return;
    const userId = user.id;
    const payload = {
      entities: storageInstance.getEntities(),
      clients: storageInstance.getClients(),
      engagements: storageInstance.getEngagements(),
      invoices: storageInstance.getInvoices(),
      activeEntityId: storageInstance.getActiveEntityFilter()
    };
    ApiService.syncToHostinger(payload, userId);
  }, 300);
}

// Storage API
export const StorageService = {
  // Init store
  initialize() {
    const user = this.getAuthUser();
    if (user && user.id) {
      const entKey = getUserKey('entities', user.id);
      if (localStorage.getItem(entKey) === null) {
        safeSet(entKey, []);
        safeSet(getUserKey('clients', user.id), []);
        safeSet(getUserKey('engagements', user.id), []);
        safeSet(getUserKey('invoices', user.id), []);
        safeSet(getUserKey('active_entity', user.id), "all");
      }
    }
  },

  // Auth User
  getAuthUser() {
    return safeGet(KEY_AUTH_USER, null);
  },
  setAuthUser(user) {
    safeSet(KEY_AUTH_USER, user);
  },
  clearAuthUser() {
    localStorage.removeItem(KEY_AUTH_USER);
  },

  // Pull data from Hostinger cloud on sign-in
  async loadFromHostinger(userId) {
    if (!userId) return null;
    const cloudData = await ApiService.fetchFromHostinger(userId);
    if (cloudData) {
      const entities = Array.isArray(cloudData.entities) ? cloudData.entities : [];
      const clients = Array.isArray(cloudData.clients) ? cloudData.clients : [];
      const engagements = Array.isArray(cloudData.engagements) ? cloudData.engagements : [];
      const invoices = Array.isArray(cloudData.invoices) ? cloudData.invoices : [];
      const activeEntityId = cloudData.activeEntityId || "all";

      safeSet(getUserKey('entities', userId), entities);
      safeSet(getUserKey('clients', userId), clients);
      safeSet(getUserKey('engagements', userId), engagements);
      safeSet(getUserKey('invoices', userId), invoices);
      safeSet(getUserKey('active_entity', userId), activeEntityId);

      return { entities, clients, engagements, invoices, activeEntityId };
    }
    return null;
  },

  // Active Entity Filter State
  getActiveEntityFilter() {
    return safeGet(getUserKey('active_entity'), "all");
  },
  setActiveEntityFilter(id) {
    safeSet(getUserKey('active_entity'), id);
    triggerCloudSync(this);
  },

  // Entities
  getEntities() {
    return safeGet(getUserKey('entities'), []);
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
    safeSet(getUserKey('entities'), updated);
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
    safeSet(getUserKey('entities'), updated);
    triggerCloudSync(this);
    return updated;
  },

  // Clients
  getClients() {
    return safeGet(getUserKey('clients'), []);
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
    safeSet(getUserKey('clients'), updated);
    triggerCloudSync(this);
    return updated;
  },
  deleteClient(id) {
    const list = this.getClients().filter(c => c.id !== id);
    safeSet(getUserKey('clients'), list);
    triggerCloudSync(this);
    return list;
  },

  // Engagements
  getEngagements() {
    return safeGet(getUserKey('engagements'), []);
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
    safeSet(getUserKey('engagements'), updated);
    triggerCloudSync(this);
    return updated;
  },
  deleteEngagement(id) {
    const list = this.getEngagements().filter(e => e.id !== id);
    safeSet(getUserKey('engagements'), list);
    triggerCloudSync(this);
    return list;
  },

  // Invoices
  getInvoices() {
    return safeGet(getUserKey('invoices'), []);
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
    safeSet(getUserKey('invoices'), updated);
    triggerCloudSync(this);
    return updated;
  },
  deleteInvoice(id) {
    const list = this.getInvoices().filter(inv => inv.id !== id);
    safeSet(getUserKey('invoices'), list);
    triggerCloudSync(this);
    return list;
  },

  // Reset to Factory Defaults (Blank)
  resetAllData() {
    safeSet(getUserKey('entities'), []);
    safeSet(getUserKey('clients'), []);
    safeSet(getUserKey('engagements'), []);
    safeSet(getUserKey('invoices'), []);
    safeSet(getUserKey('active_entity'), "all");
    triggerCloudSync(this);
    return true;
  },

  // Export full JSON backup
  exportBackup() {
    const backup = {
      version: "2.0",
      timestamp: new Date().toISOString(),
      user: this.getAuthUser(),
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
      if (parsed.entities) safeSet(getUserKey('entities'), parsed.entities);
      if (parsed.clients) safeSet(getUserKey('clients'), parsed.clients);
      if (parsed.engagements) safeSet(getUserKey('engagements'), parsed.engagements);
      if (parsed.invoices) safeSet(getUserKey('invoices'), parsed.invoices);
      triggerCloudSync(this);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
};
