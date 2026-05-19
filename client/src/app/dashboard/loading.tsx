'use client';

import { DashboardSkeleton } from '../../components/SkeletonLoader';

export default function DashboardLoading() {
  return (
    <div className="dashboard-route-loading" aria-busy="true" aria-label="Loading page">
      <DashboardSkeleton />
    </div>
  );
}
