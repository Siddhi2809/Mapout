'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProductProductionRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/product/orders');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
        <p className="mt-3 text-xs font-semibold text-slate-600">Loading Production / Sales Orders...</p>
      </div>
    </div>
  );
}
