import React, { useState, useEffect } from 'react';
import DashboardMetrics from './components/DashboardMetrics';
import EmployeeTable from './components/EmployeeTable';
import SalaryAnalytics from './components/SalaryAnalytics';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('directory');
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchInsights = async () => {
    try {
      const res = await fetch(`${API_BASE}/employees/insights/`);
      const data = await res.json();
      setInsights(data);
    } catch (err) {
      console.error("Failed to load insights", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xl font-bold tracking-tight text-indigo-600">ACME</span>
            <span className="text-slate-300">|</span>
            <span className="text-sm font-medium text-slate-600">HR Compensation Console (PostgreSQL)</span>
          </div>
          <nav className="flex space-x-1">
            <button
              onClick={() => setActiveTab('directory')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'directory' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Directory & CRUD
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'analytics' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Pay Intelligence & Simulation
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <DashboardMetrics insights={insights} loading={loading} />
        
        {activeTab === 'directory' ? (
          <div className="mt-8">
            <EmployeeTable onDataChanged={fetchInsights} apiBase={API_BASE} />
          </div>
        ) : (
          <div className="mt-8">
            <SalaryAnalytics insights={insights} onRefresh={fetchInsights} apiBase={API_BASE} />
          </div>
        )}
      </main>
    </div>
  );
}
