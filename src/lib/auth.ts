export interface DemoUser {
  email: string;
  password: string;
  name: string;
  role: string;
  roleTitle: string;
  redirectRoute: string;
}

export const DEMO_CREDENTIALS: DemoUser[] = [
  {
    email: 'admin@crm.com',
    password: 'Admin@123',
    name: 'Admin',
    role: 'ADMIN',
    roleTitle: 'Administrator',
    redirectRoute: '/admin',
  },
  {
    email: 'rawmaterial@crm.com',
    password: 'Raw@123',
    name: 'Raw Material Manager',
    role: 'RAW_MATERIAL',
    roleTitle: 'Raw Material Management',
    redirectRoute: '/raw-material',
  },
  {
    email: 'product@crm.com',
    password: 'Product@123',
    name: 'Product Manager',
    role: 'PRODUCT',
    roleTitle: 'Product Management',
    redirectRoute: '/product',
  },
  {
    email: 'sales@crm.com',
    password: 'Sales@123',
    name: 'Sales Manager',
    role: 'SALES',
    roleTitle: 'Sales Management',
    redirectRoute: '/sales',
  },
];
