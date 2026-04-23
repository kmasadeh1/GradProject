'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const SEVERITY_COLORS = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#eab308',
  Low: '#22c55e',
};

export default function DashboardOverview() {
  const [activeWaiversCount, setActiveWaiversCount] = useState(0);
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch waivers
  useEffect(() => {
    async function fetchWaivers() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const res = await fetch('/api/risks/exceptions', {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          });
          if (res.ok) {
            const data = await res.json();
            const active = Array.isArray(data) ? data.filter(d => d.status === 'Approved').length : 0;
            setActiveWaiversCount(active);
          }
        }
      } catch (err) {
        console.error('Failed to fetch waivers:', err);
      }
    }
    fetchWaivers();
  }, []);

  // Fetch risks
  useEffect(() => {
    async function fetchRisks() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        const res = await fetch('/api/risks', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch risks');
        const data = await res.json();
        setRisks(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching risks:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchRisks();
  }, []);

  // Computed metrics (case-insensitive severity matching)
  const safeData = Array.isArray(risks) ? risks : [];
  const total = safeData.length;
  const criticalCount = safeData.filter(r => (r.severity || '').toLowerCase() === 'critical').length;
  const highCount = safeData.filter(r => (r.severity || '').toLowerCase() === 'high').length;
  const mediumCount = safeData.filter(r => (r.severity || '').toLowerCase() === 'medium').length;
  const lowCount = safeData.filter(r => (r.severity || '').toLowerCase() === 'low').length;
  const mitigatedCount = safeData.filter(r => r.status === 'Mitigated' || r.status === 'Resolved').length;

  // Donut chart — format exactly how Recharts likes it, with inline colors
  const pieData = [
    { name: 'Critical', value: criticalCount, color: '#ef4444' },
    { name: 'High',     value: highCount,     color: '#f97316' },
    { name: 'Medium',   value: mediumCount,   color: '#eab308' },
    { name: 'Low',      value: lowCount,      color: '#22c55e' },
  ].filter(item => item.value > 0);

  // Keep severityChartData alias for any remaining references
  const severityChartData = pieData;

  // Bar chart data — group by category, fallback to source value, then status
  const groupCounts = safeData.reduce((acc, r) => {
    const key = r.category || r.source || r.status || 'Unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const barChartData = Object.entries(groupCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const groupLabel = safeData.some(r => r.category) ? 'category'
    : safeData.some(r => r.source) ? 'source'
    : 'status';

  const metricCards = [
    { label: 'Total Risks',    value: loading ? '…' : total,          icon: 'fa-shield',             bg: 'bg-blue-50',    color: 'text-blue-600',    id: 'stat-total'     },
    { label: 'Critical Risks', value: loading ? '…' : criticalCount,  icon: 'fa-circle-exclamation', bg: 'bg-red-50',     color: 'text-red-600',     id: 'stat-critical'  },
    { label: 'High Risks',     value: loading ? '…' : highCount,      icon: 'fa-arrow-trend-up',     bg: 'bg-orange-50',  color: 'text-orange-600',  id: 'stat-high'      },
    { label: 'Mitigated',      value: loading ? '…' : mitigatedCount, icon: 'fa-circle-check',       bg: 'bg-emerald-50', color: 'text-emerald-600', id: 'stat-mitigated' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
          <p className="text-gray-500 text-sm">Overview of your organization&apos;s risk posture</p>
        </div>
        {activeWaiversCount > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 px-4 py-2 rounded-lg flex items-center shadow-sm">
            <i className="fa-solid fa-file-shield text-yellow-600 mr-2"></i>
            <span className="text-sm font-medium text-yellow-800">
              {activeWaiversCount} risk{activeWaiversCount !== 1 ? 's' : ''} excluded due to active waivers
            </span>
          </div>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {metricCards.map(card => (
          <div key={card.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{card.label}</p>
              <h3 className="text-3xl font-bold mt-2 text-gray-800" id={card.id}>{card.value}</h3>
            </div>
            <div className={`p-2 ${card.bg} rounded-lg ${card.color} h-10 w-10 flex items-center justify-center flex-shrink-0`}>
              <i className={`fa-solid ${card.icon}`}></i>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Donut Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h4 className="font-semibold text-gray-700 mb-1">Risk Distribution</h4>
          <p className="text-xs text-gray-400 mb-2">Breakdown by severity level</p>
          {loading ? (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              <i className="fa-solid fa-spinner fa-spin mr-2"></i> Loading…
            </div>
          ) : (
            <div className="h-[250px] mt-4">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend iconType="circle" formatter={(value) => <span style={{ fontSize: 12, color: '#4b5563' }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  No risk data yet
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h4 className="font-semibold text-gray-700 mb-1">Risks by Category</h4>
          <p className="text-xs text-gray-400 mb-4">Grouped by {groupLabel}</p>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-gray-400">
              <i className="fa-solid fa-spinner fa-spin mr-2"></i> Loading…
            </div>
          ) : barChartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No risk data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barChartData} layout="vertical" margin={{ left: 12, right: 24 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120}
                  tickFormatter={(v) => v.length > 16 ? v.slice(0, 16) + '…' : v} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" barSize={40} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
