'use client';

import React from 'react';
import styles from './LoadingSpinner.module.css';

export interface LoadingSpinnerProps {
  /**
   * Texto opcional a mostrar debajo del spinner.
   * Por defecto es "Cargando...". Se puede pasar una cadena vacía para ocultar el texto.
   */
  label?: string;
  
  /**
   * Clases de CSS adicionales para personalizar el contenedor.
   */
  className?: string;
}

export default function LoadingSpinner({
  label = 'Cargando...',
  className = '',
}: LoadingSpinnerProps) {
  return (
    <div className={`${styles.container} ${className}`.trim()} role="status" aria-live="polite">
      <div className={styles.spinner} aria-hidden="true" />
      {label && <span className={styles.text}>{label}</span>}
    </div>
  );
}
