"use client";

import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { Booking, Payment } from '@/lib/api';
import { motion } from 'framer-motion';

interface AnalyticsChartsProps {
  bookings: Booking[];
  payments: Payment[];
}

const DEMO_PAYMENTS: Payment[] = Array.from({ length: 40 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * 30));
  return {
    id: i,
    clientName: 'Demo Client',
    businessName: 'Demo Business',
    amount: Math.floor(Math.random() * 200) + 50,
    method: 'card',
    date: d.toISOString().split('T')[0],
    status: 'paid',
    createdAt: d.toISOString()
  };
});

const DEMO_BOOKINGS: Booking[] = Array.from({ length: 50 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * 30));
  const services = ['Fisioterapia', 'Odontología', 'Psicología', 'Nutrición', 'Entrenamiento'];
  return {
    id: i,
    date: d.toISOString().split('T')[0],
    time: '10:00',
    status: 'confirmed',
    customerId: 1,
    businessId: 1,
    serviceName: services[Math.floor(Math.random() * services.length)]
  };
});

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function AnalyticsCharts({ bookings, payments }: AnalyticsChartsProps) {
  // Use demo data if real data is empty to showcase the feature
  const activePayments = payments.length > 0 ? payments : DEMO_PAYMENTS;
  const activeBookings = bookings.length > 0 ? bookings : DEMO_BOOKINGS;

  // 1. Revenue by week/month processing
  const revenueData = useMemo(() => {
    // Group by day for the last 7 days for a nice trend
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const dayPayments = activePayments.filter(p => p.date === date && p.status === 'paid');
      const total = Number(dayPayments.reduce((sum, p) => sum + Number(p.amount), 0).toFixed(2));

      // Format date for X-axis (e.g., "14 May")
      const d = new Date(date);
      const label = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

      return { name: label, total };
    });
  }, [activePayments]);

  // 2. Bookings by business type
  const distributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    activeBookings.forEach(b => {
      const type = b.serviceName || 'Otros';
      counts[type] = (counts[type] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5
  }, [activeBookings]);

  // 3. Monthly Comparison
  const comparisonData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentTotal = activePayments
      .filter(p => {
        const d = new Date(p.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && p.status === 'paid';
      })
      .reduce((sum, p) => sum + Number(p.amount), 0);
    
    const currentTotalRounded = Number(currentTotal.toFixed(2));

    const prevTotal = activePayments
      .filter(p => {
        const d = new Date(p.date);
        return d.getMonth() === prevMonth && d.getFullYear() === prevYear && p.status === 'paid';
      })
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const prevTotalRounded = Number(prevTotal.toFixed(2));

    return [
      { name: 'Mes Anterior', value: prevTotalRounded },
      { name: 'Mes Actual', value: currentTotalRounded },
    ];
  }, [activePayments]);

  const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f59e0b'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          padding: '12px',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-md)',
          backdropFilter: 'blur(10px)'
        }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>{label}</p>
          <p style={{ margin: 0, color: 'var(--primary)', fontWeight: 700, fontSize: '16px' }}>
            {`${Number(payload[0].value).toFixed(2)} €`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="analytics-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
      {/* Revenue Trend Chart */}
      <motion.div variants={item} className="section-card" style={{ gridColumn: 'span 2' }}>
        <h3 className="panel-title" style={{ marginBottom: '24px' }}>Tendencia de Ingresos (7 Días)</h3>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                tickFormatter={(value) => `${value}€`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="var(--primary)"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorTotal)"
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Bookings Distribution Chart */}
      <motion.div variants={item} className="section-card">
        <h3 className="panel-title" style={{ marginBottom: '24px' }}>Distribución de Servicios</h3>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={distributionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                animationDuration={1000}
              >
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' }}
                itemStyle={{ color: 'var(--text)' }}
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Monthly Comparison */}
      <motion.div variants={item} className="section-card">
        <h3 className="panel-title" style={{ marginBottom: '24px' }}>Comparativa Mensual</h3>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                content={<CustomTooltip />}
              />
              <Bar
                dataKey="value"
                radius={[8, 8, 0, 0]}
                animationDuration={1200}
              >
                {comparisonData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--text-muted)' : 'var(--primary-gradient)'} fillOpacity={index === 0 ? 0.3 : 1} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
