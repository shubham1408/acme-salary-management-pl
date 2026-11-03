import React from 'react';

export default function DashboardMetrics({ insights, loading }) {
  if (loading || !insights) {
    return <div className="animate-pulse h-24 bg-slate-200 rounded-xl"></div>;
  }

  const { overview } = insights;
  const metrics = [
    { label: 'Total Headcount', val: overview.headcount?.toLocaleString() },
    { label: 'Total Annual Payroll (USD)', val: `$${((overview.total_spend || 0) / 1e6).toFixed(1)}M` },
    { label: 'Average Compensation', val: `$${Math.round(overview.avg_salary || 0).toLocaleString()}` },
    { label: 'Salary Range (USD)', val: `$${Math.round(overview.min_salary || 0).toLocaleString()} - $${Math.round(overview.max_salary || 0).toLocaleString()}` }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
      {metrics.map((m, idx) => (
        <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{m.label}</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{m.val}</div>
        </div>
      ))}
    </div>
  );
}
