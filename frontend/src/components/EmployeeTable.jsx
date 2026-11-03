import React, { useState, useEffect } from 'react';

export default function EmployeeTable({ onDataChanged, apiBase = 'http://localhost:8000/api' }) {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', department: 'Engineering',
    job_title: 'Software Engineer', location: 'San Francisco', gender: 'F',
    currency: 'USD', base_salary: 120000, bonus: 10000, hire_date: '2024-01-01'
  });

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const url = `${apiBase}/employees/?page=${page}&search=${encodeURIComponent(search)}&department=${encodeURIComponent(department)}`;
      const res = await fetch(url);
      const data = await res.json();
      setEmployees(data.results || []);
      setCount(data.count || 0);
    } catch (err) {
      console.error("Error fetching table records", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [page, department]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchEmployees();
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiBase}/employees/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowAddModal(false);
        fetchEmployees();
        if (onDataChanged) onDataChanged();
      } else {
        alert("Failed to create employee. Please check inputs.");
      }
    } catch (err) {
      console.error("Creation error", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this employee record?")) return;
    try {
      await fetch(`${apiBase}/employees/${id}/`, { method: 'DELETE' });
      fetchEmployees();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      console.error("Delete error", err);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Search name, email, title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-slate-300 px-3 py-2 text-sm rounded-lg w-72 focus:outline-indigo-500"
          />
          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 text-sm font-medium rounded-lg hover:bg-indigo-700">
            Search
          </button>
        </form>

        <div className="flex items-center gap-3">
          <select
            value={department}
            onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
            className="border border-slate-300 px-3 py-2 text-sm rounded-lg focus:outline-indigo-500"
          >
            <option value="">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Product">Product</option>
            <option value="Sales">Sales</option>
            <option value="Marketing">Marketing</option>
            <option value="Finance">Finance</option>
            <option value="People & HR">People & HR</option>
            <option value="Legal">Legal</option>
            <option value="Customer Support">Customer Support</option>
          </select>

          <a
            href={`${apiBase}/employees/export_csv/`}
            target="_blank"
            rel="noreferrer"
            className="border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-2 text-sm font-medium rounded-lg"
          >
            Export CSV
          </a>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 text-sm font-medium rounded-lg"
          >
            + Add Employee
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
            <tr>
              <th className="p-4">Employee</th>
              <th className="p-4">Department & Title</th>
              <th className="p-4">Location</th>
              <th className="p-4 text-right">Local Pay</th>
              <th className="p-4 text-right">Total Comp (USD)</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="6" className="p-8 text-center text-slate-400">Loading directory...</td></tr>
            ) : employees.length === 0 ? (
              <tr><td colSpan="6" className="p-8 text-center text-slate-400">No employees found. Seed database first!</td></tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/50">
                  <td className="p-4 font-medium text-slate-900">
                    {emp.full_name}
                    <div className="text-xs text-slate-400 font-normal">{emp.email}</div>
                  </td>
                  <td className="p-4">
                    <span className="font-medium">{emp.department}</span>
                    <div className="text-xs text-slate-500">{emp.job_title}</div>
                  </td>
                  <td className="p-4 text-slate-600">{emp.location}</td>
                  <td className="p-4 text-right font-mono text-slate-600">
                    {emp.currency} {Number(emp.base_salary).toLocaleString()}
                  </td>
                  <td className="p-4 text-right font-mono font-semibold text-slate-900">
                    ${Number(emp.salary_usd).toLocaleString()}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleDelete(emp.id)}
                      className="text-xs text-rose-500 hover:text-rose-700 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
        <span>Showing {employees.length} of {count} entries</span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Previous
          </button>
          <button
            disabled={employees.length < 25}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Add New Employee</h2>
            <form onSubmit={handleCreateEmployee} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text" placeholder="First Name" required
                  value={formData.first_name}
                  onChange={e => setFormData({...formData, first_name: e.target.value})}
                  className="border border-slate-300 rounded p-2 text-sm"
                />
                <input
                  type="text" placeholder="Last Name" required
                  value={formData.last_name}
                  onChange={e => setFormData({...formData, last_name: e.target.value})}
                  className="border border-slate-300 rounded p-2 text-sm"
                />
              </div>
              <input
                type="email" placeholder="Email" required
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full border border-slate-300 rounded p-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text" placeholder="Department" required
                  value={formData.department}
                  onChange={e => setFormData({...formData, department: e.target.value})}
                  className="border border-slate-300 rounded p-2 text-sm"
                />
                <input
                  type="text" placeholder="Job Title" required
                  value={formData.job_title}
                  onChange={e => setFormData({...formData, job_title: e.target.value})}
                  className="border border-slate-300 rounded p-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="text" placeholder="Location" required
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                  className="border border-slate-300 rounded p-2 text-sm"
                />
                <select
                  value={formData.currency}
                  onChange={e => setFormData({...formData, currency: e.target.value})}
                  className="border border-slate-300 rounded p-2 text-sm"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                  <option value="INR">INR</option>
                  <option value="SGD">SGD</option>
                </select>
                <input
                  type="number" placeholder="Base Salary" required
                  value={formData.base_salary}
                  onChange={e => setFormData({...formData, base_salary: Number(e.target.value)})}
                  className="border border-slate-300 rounded p-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
