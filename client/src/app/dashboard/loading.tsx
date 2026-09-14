'use client';

import { DashboardSkeleton } from '../../components/SkeletonLoader';

export default function DashboardLoading() {
  return (
    // Shared route-level skeleton shown while dashboard segments stream or hydrate.
    <div className="dashboard-route-loading" aria-busy="true" aria-label="Loading page">
      <DashboardSkeleton />
    </div>
  );
}
