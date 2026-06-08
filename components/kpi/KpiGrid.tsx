import React from 'react';
import { motion } from 'framer-motion';

interface KpiGridProps {
  children: React.ReactNode;
}

export default function KpiGrid({ children }: KpiGridProps) {
  return (
    <motion.div
      className="kpi-grid"
      whileHover={{}}
      style={{
        display: 'grid',
        gap: '1.5rem',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        marginTop: '2rem',
      }}
    >
      {children}
    </motion.div>
  );
}
