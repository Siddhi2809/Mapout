import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';

export const metadata = {
  title: 'Admin ERP/CRM Centralized Control | MapOut',
  description: 'Centralized Administrative Command Center for CRM, Sales, Products, Raw Materials, Inventory, and Analytics.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
