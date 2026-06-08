import React from 'react';
import { motion } from 'framer-motion';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  subtitle?: string;
}

export default function KpiCard({ label, value, icon, subtitle }: KpiCardProps) {
  return (
    <motion.div
      className="kpi-card"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '12px',
        padding: '16px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {icon && (
        <div style={{ position: 'absolute', top: '12px', right: '12px', color: '#6366f1' }}>{icon}</div>
      )}
      <p className="kpi-card__label" style={{ color: '#94a3b8', marginBottom: '4px' }}>{label}</p>
      <h3 className="kpi-card__value" style={{ color: '#f8fafc', margin: '0' }}>{value}</h3>
      {subtitle && (
        <p className="kpi-card__subtitle" style={{ color: '#94a3b8', marginTop: '4px', fontSize: '0.85rem' }}>{subtitle}</p>
      )}
    </motion.div>
  );
}
