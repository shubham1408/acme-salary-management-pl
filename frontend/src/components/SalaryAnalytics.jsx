import React, { useState, useEffect } from 'react';

export default function SalaryAnalytics({ insights, onRefresh, apiBase = 'http://localhost:8000/api' }) {
  const [bulkPct, setBulkPct] = useState(5);
  const [bulkDept, setBulkDept] = useState('');
  const [bulkMsg, setBulkMsg] = useState('');
  const [distribution, setDistribution] = useState([]);

  useEffect(() => {
    fetch(`${apiBase}/employees/salary_distribution/`)
      .then(res => res.json())
      .then(data => setDistribution(data))
      .catch(err => console.error("Error fetching distribution", err));
  }, [apiBase]);

  if (!insights) return null;

  const handleBulkAdjust = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiBase}/employees/bulk_adjust/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          percentage: bulkPct,
          department: bulkDept || undefined
        })
      });
      const data = await res.json();
      setBulkMsg(data.message || 'Updated successfully!');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      setBulkMsg('Error executing bulk adjustment');
    }
  };

  return (
    <div className="space-y-6">
      {/* Strategic Bulk Adjustment Tool */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-2">Simulate / Apply Merit Salary Increase</h3>
        <p className="text-sm text-slate-500 mb-4">
          Directly execute organizational or departmental pay raises across active employees.
        </p>
        <form onSubmit={handleBulkAdjust} className="flex flex-wrap items-center gap-3">
          <input
            type="number"
            step="0.5"
            value={bulkPct}
            onChange={(e) => setBulkPct(Number(e.target.value))}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-32"
            placeholder="Percentage %"
            required
          />
          <span className="text-sm text-slate-600">% Increase for</span>
          <select
            value={bulkDept}
            onChange={(e) => setBulkDept(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Whole Company</option>
            <option value="Engineering">Engineering</option>
            <option value="Product">Product</option>
            <option value="Sales">Sales</option>
            <option value="Marketing">Marketing</option>
            <option value="Finance">Finance</option>
            <option value="People & HR">People & HR</option>
            <option value="Legal">Legal</option>
          </select>
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            Apply Increase
          </button>
          {bulkMsg && <span className="text-sm font-medium text-emerald-600 ml-2">{bulkMsg}</span>}
        </form>
      </div>

      {/* Salary Distribution Tiers */}
      {distribution.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4">Salary Distribution Tiers (USD)</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {distribution.map(d => (
              <div key={d.tier} className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
                <div className="text-xs font-semibold text-slate-500">{d.tier}</div>
                <div className="text-xl font-bold text-slate-800 mt-1">{d.count?.toLocaleString()}</div>
                <div className="text-xs text-slate-400 mt-0.5">employees</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Department Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4">Departmental Spend & Average</h3>
          <div className="space-y-4">
            {insights.by_department?.map((dept) => (
              <div key={dept.department} className="space-y-1">
                <div className="flex justify-between text-sm font-medium">
                  <span>{dept.department} ({dept.headcount})</span>
                  <span className="font-mono text-indigo-600">${Math.round(dept.avg_salary || 0).toLocaleString()} avg</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full"
                    style={{ width: `${Math.min(100, ((dept.avg_salary || 0) / 220000) * 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Global Location Parity */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4">Geographic Distribution</h3>
          <div className="divide-y divide-slate-100">
            {insights.by_location?.map((loc) => (
              <div key={loc.location} className="py-3 flex justify-between items-center text-sm">
                <div>
                  <p className="font-medium text-slate-800">{loc.location}</p>
                  <p className="text-xs text-slate-400">{loc.headcount} employees</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-semibold text-slate-900">${Math.round(loc.avg_salary || 0).toLocaleString()} / yr</p>
                  <p className="text-xs text-slate-400 font-mono">${((loc.total_spend || 0) / 1e6).toFixed(2)}M Total</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
