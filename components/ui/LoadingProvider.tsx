'use client';

import React, { createContext, useContext, useState, useEffect, useRef, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import LoadingSpinner from './LoadingSpinner';
import styles from './LoadingProvider.module.css';

interface LoadingContextProps {
  isLoading: boolean;
  showLoading: () => void;
  hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextProps | undefined>(undefined);

// Tiempo mínimo de visualización garantizado en milisegundos (1 segundo)
const MIN_VISIBILITY_MS = 1000;

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const showTimeRef = useRef<number>(0);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showLoading = () => {
    // Si ya está cargando, evitamos duplicar o sobreescribir el tiempo de inicio
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    showTimeRef.current = Date.now();
    setIsLoading(true);
  };

  const hideLoading = () => {
    if (showTimeRef.current === 0) {
      setIsLoading(false);
      return;
    }

    const elapsed = Date.now() - showTimeRef.current;
    
    // Si ha pasado menos del tiempo mínimo de visualización (1000ms),
    // programamos el apagado para que se complete el segundo exacto.
    if (elapsed < MIN_VISIBILITY_MS) {
      const remainingTime = MIN_VISIBILITY_MS - elapsed;
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      
      hideTimeoutRef.current = setTimeout(() => {
        setIsLoading(false);
        showTimeRef.current = 0;
        hideTimeoutRef.current = null;
      }, remainingTime);
    } else {
      setIsLoading(false);
      showTimeRef.current = 0;
    }
  };

  // Limpieza al desmontar el componente
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  // Interceptar clicks globales en enlaces internos para activar el loader al navegar
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      if (anchor) {
        const href = anchor.getAttribute('href');
        const targetAttr = anchor.getAttribute('target');

        // Solo interceptamos enlaces internos válidos que no abran en otra pestaña
        if (
          href &&
          href.startsWith('/') &&
          !href.startsWith('#') &&
          targetAttr !== '_blank' &&
          !e.metaKey &&
          !e.ctrlKey
        ) {
          showLoading();
        }
      }
    };

    document.addEventListener('click', handleLinkClick);
    return () => {
      document.removeEventListener('click', handleLinkClick);
    };
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading, showLoading, hideLoading }}>
      {children}
      
      {/* Componente que escucha el cambio de ruta en Next.js encapsulado en Suspense */}
      <Suspense fallback={null}>
        <NavigationWatcher />
      </Suspense>

      {/* Overlay Global del Loader */}
      <div 
        className={`${styles.overlay} ${isLoading ? styles.visible : ''}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-label="Cargando contenido"
      >
        <div className={styles.loaderContent}>
          <LoadingSpinner label="Cargando..." />
        </div>
      </div>
    </LoadingContext.Provider>
  );
}

// Subcomponente encargado de desactivar el loader cuando detecta cambios de ruta
function NavigationWatcher() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { hideLoading } = useLoading();

  useEffect(() => {
    // Al finalizar de renderizarse la nueva página (cuando cambian los parámetros o ruta), apagamos el loader
    hideLoading();
  }, [pathname, searchParams, hideLoading]);

  return null;
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading debe ser utilizado dentro de un LoadingProvider');
  }
  return context;
}
