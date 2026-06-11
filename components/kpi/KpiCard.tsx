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
      className="kpi-card flex flex-col items-center justify-center text-center bg-white/5 border border-white/10 rounded-[24px] px-6 py-7 relative overflow-hidden"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {icon && (
        <div className="absolute top-4 right-4 text-[#a5b4fc]">{icon}</div>
      )}
      <p className="kpi-card__label text-sm text-slate-400 mb-3">{label}</p>
      <h3 className="kpi-card__value text-4xl font-semibold text-white mb-2">{value}</h3>
      {subtitle && (
        <p className="kpi-card__subtitle text-sm text-slate-400 mt-2">{subtitle}</p>
      )}
    </motion.div>
  );
}
