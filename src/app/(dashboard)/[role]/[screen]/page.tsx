"use client";
import { useParams } from 'next/navigation';
import { screenMap } from '@/components/screenMapping';
import { Suspense } from 'react';
import { LoadingFallback } from '@/components/LoadingFallback';

// DESIGN SANDBOX — role guard removed so any screen is accessible freely.

export default function ScreenPage() {
  const { role, screen } = useParams();

  const Component = screenMap[role as string]?.[screen as string];

  if (!Component) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        <div className="text-center">
          <p className="text-lg font-medium">Screen not found</p>
          <p className="text-sm mt-1 text-slate-400">
            <code>{role}/{screen}</code> is not in the screen map
          </p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Component />
    </Suspense>
  );
}
