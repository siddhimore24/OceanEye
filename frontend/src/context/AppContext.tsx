import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, UserRole, ClassifiedIntelItem, AuditLogEntry, 
  SpillIncident, VesselAttribution, PageId 
} from '../types';
import { INITIAL_USERS, INITIAL_CLASSIFIED_INTEL, INITIAL_AUDIT_LOGS, ADMIN_CREDENTIALS } from '../data/mockAuth';
import { MOCK_INCIDENTS } from '../data/mockIncidents';

interface AppContextType {
  // Auth state
  currentUser: User;
  users: User[];
  isAdmin: boolean;
  isAnalyst: boolean;
  authError: string | null;
  clearAuthError: () => void;
  login: (email: string, password?: string) => boolean;
  loginAsRole: (role: UserRole) => void;
  logout: () => void;
  register: (name: string, email: string, role: UserRole, agency: string, title: string) => void;
  updateUserRole: (userId: string, newRole: UserRole) => void;

  // Classified Intel (Admin only)
  classifiedIntel: ClassifiedIntelItem[];
  addClassifiedIntel: (item: Omit<ClassifiedIntelItem, 'id' | 'timestamp'>) => void;
  deleteClassifiedIntel: (id: string) => void;

  // Audit logs
  auditLogs: AuditLogEntry[];
  addAuditLog: (action: string, details: string, targetId?: string) => void;

  // Incident state & Data management (Admin write, Analyst/Public read)
  incidents: SpillIncident[];
  activeIncident: SpillIncident;
  setActiveIncident: (incident: SpillIncident) => void;
  addIncident: (newIncident: SpillIncident) => void;
  updateIncident: (id: string, updates: Partial<SpillIncident>) => void;
  deleteIncident: (id: string) => void;
  updateVesselAttribution: (
    incidentId: string, 
    mmsi: string, 
    updates: Partial<VesselAttribution>
  ) => void;

  // Navigation helper
  currentPage: PageId;
  setCurrentPage: (page: PageId) => void;
  navigateTo: (page: PageId) => void;

  // Reset to original data
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CURRENT_USER: 'oceaneye_current_user_v1',
  USERS: 'oceaneye_users_v1',
  INCIDENTS: 'oceaneye_incidents_v1',
  CLASSIFIED: 'oceaneye_classified_v1',
  AUDIT: 'oceaneye_audit_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state with LocalStorage or defaults
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Ensure Pranav Naik is always in users list
          const hasPranav = parsed.some(
            u => u && typeof u.email === 'string' && u.email.toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase()
          );
          if (!hasPranav) {
            return [INITIAL_USERS[0], ...parsed];
          }
          return parsed;
        }
      }
      return INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [authError, setAuthError] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed;
      }
      return INITIAL_USERS[0]; // Pranav Naik (Admin)
    } catch {
      return INITIAL_USERS[0];
    }
  });

  const [incidents, setIncidents] = useState<SpillIncident[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INCIDENTS);
      return saved ? JSON.parse(saved) : MOCK_INCIDENTS;
    } catch {
      return MOCK_INCIDENTS;
    }
  });

  const [activeIncident, setActiveIncident] = useState<SpillIncident>(() => {
    return incidents[0] || MOCK_INCIDENTS[0];
  });

  const [classifiedIntel, setClassifiedIntel] = useState<ClassifiedIntelItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CLASSIFIED);
      return saved ? JSON.parse(saved) : INITIAL_CLASSIFIED_INTEL;
    } catch {
      return INITIAL_CLASSIFIED_INTEL;
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUDIT);
      return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });

  const [currentPage, setCurrentPage] = useState<PageId>('overview');

  // Persistence effects
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    } catch {
      // Ignore storage quota
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch {}
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.INCIDENTS, JSON.stringify(incidents));
    } catch {}
  }, [incidents]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CLASSIFIED, JSON.stringify(classifiedIntel));
    } catch {}
  }, [classifiedIntel]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(auditLogs));
    } catch {}
  }, [auditLogs]);

  // Keep activeIncident in sync if incidents update
  useEffect(() => {
    const found = incidents.find(i => i.id === activeIncident.id);
    if (found) {
      setActiveIncident(found);
    } else if (incidents.length > 0) {
      setActiveIncident(incidents[0]);
    }
  }, [incidents]);

  const isAdmin = currentUser.role === 'admin';
  const isAnalyst = currentUser.role === 'analyst' || currentUser.role === 'admin';

  const addAuditLog = (action: string, details: string, targetId?: string) => {
    const newEntry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      details,
      targetId,
    };
    setAuditLogs(prev => [newEntry, ...prev]);
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  const login = (email?: string, password?: string): boolean => {
    setAuthError(null);
    if (!email || typeof email !== 'string') {
      setAuthError('Please enter an operational email address.');
      return false;
    }
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPass = (password || '').trim();

    // Check specific Admin credentials requested by user
    if (trimmedEmail === ADMIN_CREDENTIALS.email.toLowerCase()) {
      if (trimmedPass !== ADMIN_CREDENTIALS.password) {
        setAuthError(`Invalid administrator password. Security passkey verification failed.`);
        return false;
      }
      let adminUser = users.find(
        u => u && typeof u.email === 'string' && u.email.toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase()
      );
      if (!adminUser) {
        adminUser = INITIAL_USERS[0];
        setUsers(prev => [adminUser!, ...prev]);
      }
      const updatedUser: User = { 
        ...adminUser, 
        role: 'admin', 
        clearanceLevel: 5,
        lastLogin: new Date().toISOString() 
      };
      setCurrentUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      addAuditLog('ADMIN_AUTHENTICATION_SUCCESS', `Administrator Pranav Naik (${ADMIN_CREDENTIALS.email}) authenticated with Level-5 Top Secret clearance.`);
      return true;
    }

    const user = users.find(
      u => u && typeof u.email === 'string' && u.email.trim().toLowerCase() === trimmedEmail
    );
    if (user) {
      const updatedUser = { ...user, lastLogin: new Date().toISOString() };
      setCurrentUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
      addAuditLog('USER_AUTHENTICATION', `User ${user.name} logged in with clearance level ${user.clearanceLevel}.`);
      return true;
    }

    setAuthError('Unrecognized maritime officer email address. Check credentials or use quick-select options.');
    return false;
  };

  const loginAsRole = (role: UserRole) => {
    const target = users.find(u => u.role === role) || INITIAL_USERS.find(u => u.role === role);
    if (target) {
      const updatedUser = { ...target, lastLogin: new Date().toISOString() };
      setCurrentUser(updatedUser);
      addAuditLog('ROLE_SWITCH_OVERRIDE', `Switched active operational profile to ${target.name} (${role.toUpperCase()}).`);
    }
  };

  const logout = () => {
    // Drop to public observer role
    const publicUser = users.find(u => u.role === 'public') || INITIAL_USERS[2];
    setCurrentUser(publicUser);
    addAuditLog('USER_LOGOUT', `Officer ${currentUser.name} signed out of operational console.`);
  };

  const register = (name: string, email: string, role: UserRole, agency: string, title: string) => {
    const clearanceLevel = role === 'admin' ? 5 : role === 'analyst' ? 3 : 1;
    const newUser: User = {
      id: `usr-${Date.now()}`,
      email: email.trim(),
      name: name.trim(),
      role,
      clearanceLevel,
      agency: agency.trim() || 'Maritime Environmental Registry',
      title: title.trim() || 'Surveillance Operator',
      badgeNumber: `REG-${Math.floor(1000 + Math.random() * 9000)}`,
      lastLogin: new Date().toISOString(),
    };
    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    addAuditLog('USER_REGISTRATION', `New user registered: ${name} (${email}) with role ${role.toUpperCase()}.`);
  };

  const updateUserRole = (userId: string, newRole: UserRole) => {
    if (!isAdmin) return;
    const newClearance = newRole === 'admin' ? 5 : newRole === 'analyst' ? 3 : 1;
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, role: newRole, clearanceLevel: newClearance };
      }
      return u;
    }));
    if (currentUser.id === userId) {
      setCurrentUser(prev => ({ ...prev, role: newRole, clearanceLevel: newClearance }));
    }
    addAuditLog('CLEARANCE_MODIFIED', `Admin modified user ${userId} clearance to ${newRole.toUpperCase()}.`, userId);
  };

  const addIncident = (newIncident: SpillIncident) => {
    setIncidents(prev => [newIncident, ...prev]);
    setActiveIncident(newIncident);
    addAuditLog('INCIDENT_CREATED', `Created new incident record ${newIncident.code}: ${newIncident.name}.`, newIncident.id);
  };

  const updateIncident = (id: string, updates: Partial<SpillIncident>) => {
    if (!isAdmin && !isAnalyst) return;
    setIncidents(prev => prev.map(inc => {
      if (inc.id === id) {
        const merged = { ...inc, ...updates };
        if (updates.characteristics) {
          merged.characteristics = { ...inc.characteristics, ...updates.characteristics };
        }
        if (updates.satellite) {
          merged.satellite = { ...inc.satellite, ...updates.satellite };
        }
        if (updates.drift) {
          merged.drift = { ...inc.drift, ...updates.drift };
        }
        if (updates.weather) {
          merged.weather = { ...inc.weather, ...updates.weather };
        }
        return merged;
      }
      return inc;
    }));
    addAuditLog('INCIDENT_MODIFIED', `Modified parameters for incident ${id}.`, id);
  };

  const deleteIncident = (id: string) => {
    if (!isAdmin) return;
    setIncidents(prev => {
      const filtered = prev.filter(inc => inc.id !== id);
      if (activeIncident.id === id && filtered.length > 0) {
        setActiveIncident(filtered[0]);
      }
      return filtered;
    });
    addAuditLog('INCIDENT_DELETED', `Admin deleted/archived incident record ${id}.`, id);
  };

  const updateVesselAttribution = (
    incidentId: string, 
    mmsi: string, 
    updates: Partial<VesselAttribution>
  ) => {
    if (!isAdmin) return;
    setIncidents(prev => prev.map(inc => {
      if (inc.id === incidentId) {
        const updatedVessels = inc.vessels.map(v => {
          if (v.mmsi === mmsi) {
            const merged = { ...v, ...updates };
            if (updates.evidence) {
              merged.evidence = { ...v.evidence, ...updates.evidence };
            }
            return merged;
          }
          return v;
        });
        return { ...inc, vessels: updatedVessels };
      }
      return inc;
    }));
    addAuditLog('VESSEL_ATTRIBUTION_OVERRIDE', `Admin modified attribution data for vessel MMSI ${mmsi}.`, mmsi);
  };

  const addClassifiedIntel = (item: Omit<ClassifiedIntelItem, 'id' | 'timestamp'>) => {
    if (!isAdmin) return;
    const newIntel: ClassifiedIntelItem = {
      ...item,
      id: `intel-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    setClassifiedIntel(prev => [newIntel, ...prev]);
    addAuditLog('CLASSIFIED_INTEL_DISPATCHED', `Admin filed intelligence note: "${item.title}".`, item.incidentId);
  };

  const deleteClassifiedIntel = (id: string) => {
    if (!isAdmin) return;
    setClassifiedIntel(prev => prev.filter(item => item.id !== id));
    addAuditLog('CLASSIFIED_INTEL_PURGED', `Admin purged intelligence dispatch ${id}.`, id);
  };

  const navigateTo = (page: PageId) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetAllData = () => {
    setIncidents(MOCK_INCIDENTS);
    setActiveIncident(MOCK_INCIDENTS[0]);
    setClassifiedIntel(INITIAL_CLASSIFIED_INTEL);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    localStorage.removeItem(STORAGE_KEYS.INCIDENTS);
    localStorage.removeItem(STORAGE_KEYS.CLASSIFIED);
    localStorage.removeItem(STORAGE_KEYS.AUDIT);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        isAdmin,
        isAnalyst,
        authError,
        clearAuthError,
        login,
        loginAsRole,
        logout,
        register,
        updateUserRole,
        classifiedIntel,
        addClassifiedIntel,
        deleteClassifiedIntel,
        auditLogs,
        addAuditLog,
        incidents,
        activeIncident,
        setActiveIncident,
        addIncident,
        updateIncident,
        deleteIncident,
        updateVesselAttribution,
        currentPage,
        setCurrentPage,
        navigateTo,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
