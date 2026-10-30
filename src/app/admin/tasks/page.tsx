'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminTasksPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/daily-reports');
  }, [router]);

  return (
    <div className="p-8 text-center text-xs text-slate-500">
      Redirecting to Daily Reports...
    </div>
  );
}
