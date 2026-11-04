export interface DemoUser {
  id?: string;
  email: string;
  password: string;
  name: string;
  role: string;
  roleTitle: string;
  redirectRoute: string;
  phone?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  isIndividualSales?: boolean;
}

export const DEMO_CREDENTIALS: DemoUser[] = [
  {
    id: 'usr_admin',
    email: 'admin@crm.com',
    password: 'Admin@123',
    name: 'Administrator',
    role: 'ADMIN',
    roleTitle: 'Chief Executive Administrator',
    redirectRoute: '/admin',
    phone: '+91 98200 11223',
    status: 'ACTIVE',
    isIndividualSales: false,
  },
  {
    id: 'usr_sales_1',
    email: 'rajesh@crm.com',
    password: 'Rajesh@123',
    name: 'Rajesh Kumar',
    role: 'SALES',
    roleTitle: 'Senior Sales Executive',
    redirectRoute: '/sales',
    phone: '+91 98401 22334',
    status: 'ACTIVE',
    isIndividualSales: true,
  },
  {
    id: 'usr_sales_2',
    email: 'priya@crm.com',
    password: 'Priya@123',
    name: 'Priya Sharma',
    role: 'SALES',
    roleTitle: 'Key Account Manager',
    redirectRoute: '/sales',
    phone: '+91 98402 33445',
    status: 'ACTIVE',
    isIndividualSales: true,
  },
  {
    id: 'usr_sales_3',
    email: 'amit@crm.com',
    password: 'Amit@123',
    name: 'Amit Verma',
    role: 'SALES',
    roleTitle: 'B2B Sales Representative',
    redirectRoute: '/sales',
    phone: '+91 98403 44556',
    status: 'ACTIVE',
    isIndividualSales: true,
  },
  {
    id: 'usr_sales_4',
    email: 'sneha@crm.com',
    password: 'Sneha@123',
    name: 'Sneha Patel',
    role: 'SALES',
    roleTitle: 'Field Sales Specialist',
    redirectRoute: '/sales',
    phone: '+91 98404 55667',
    status: 'ACTIVE',
    isIndividualSales: true,
  },
  {
    id: 'usr_sales_mgr',
    email: 'sales@crm.com',
    password: 'Sales@123',
    name: 'Sales Manager',
    role: 'SALES',
    roleTitle: 'General Sales Manager',
    redirectRoute: '/sales',
    phone: '+91 98400 99887',
    status: 'ACTIVE',
    isIndividualSales: false,
  },
  {
    id: 'usr_raw_material',
    email: 'rawmaterial@crm.com',
    password: 'Raw@123',
    name: 'Raw Material Manager',
    role: 'RAW_MATERIAL',
    roleTitle: 'Raw Material Management',
    redirectRoute: '/raw-material',
    phone: '+91 98405 66778',
    status: 'ACTIVE',
    isIndividualSales: false,
  },
  {
    id: 'usr_product',
    email: 'product@crm.com',
    password: 'Product@123',
    name: 'Product Manager',
    role: 'PRODUCT',
    roleTitle: 'Product Management',
    redirectRoute: '/product',
    phone: '+91 98406 77889',
    status: 'ACTIVE',
    isIndividualSales: false,
  },
];

/**
 * Retrieve all active users combining DEMO_CREDENTIALS and Admin-managed users from localStorage
 */
export function getAllUsers(): DemoUser[] {
  if (typeof window === 'undefined') return DEMO_CREDENTIALS;

  try {
    const stored = localStorage.getItem('admin_managed_users_v1');
    if (stored) {
      const parsed: any[] = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge: take all from stored, and any from DEMO_CREDENTIALS not in stored
        const storedEmails = new Set(parsed.map((u) => (u.email || '').toLowerCase()));
        const missingDefaults = DEMO_CREDENTIALS.filter(
          (u) => !storedEmails.has(u.email.toLowerCase())
        );
        return [...parsed, ...missingDefaults];
      }
    }
  } catch (err) {
    console.warn('Error reading admin_managed_users_v1:', err);
  }

  return DEMO_CREDENTIALS;
}

/**
 * Authenticate credentials against both stored and default users
 */
export function findUserForLogin(emailInput: string, passwordInput: string): { user: DemoUser | null; error?: string } {
  const cleanEmail = emailInput.trim().toLowerCase();
  const all = getAllUsers();

  const found = all.find((u) => u.email.toLowerCase() === cleanEmail);
  if (!found) {
    return { user: null, error: 'User account with this email not found.' };
  }

  if (found.status === 'INACTIVE') {
    return { user: null, error: 'This user account is inactive. Please contact the Administrator.' };
  }

  if (found.password !== passwordInput) {
    return { user: null, error: 'Incorrect password. Please verify credentials.' };
  }

  return { user: found };
}

/**
 * Return list of salespersons for assignment dropdowns
 */
export function getSalespersonNames(): string[] {
  const all = getAllUsers();
  const salesUsers = all.filter((u) => u.role === 'SALES' && u.status !== 'INACTIVE');
  const names = Array.from(new Set(salesUsers.map((u) => u.name)));
  if (names.length === 0) return ['Rajesh Kumar', 'Priya Sharma', 'Amit Verma', 'Sneha Patel'];
  return names;
}
