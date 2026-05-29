"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import NotificationBell from "./NotificationBell";

export default function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<"client" | "business" | "superadmin">("business");

  useEffect(() => {
    const savedRole = localStorage.getItem("user_role") as any;
    if (savedRole) {
      setUserRole(savedRole);
    }
  }, []);

  // Determinar título y subtítulo dinámicamente según el rol y la ruta (contexto)
  let title = "BookFlow Admin";
  let subtitle = "Plataforma de gestión de reservas y cobros";

  if (userRole === "superadmin") {
    title = "BookFlow Superadmin";
    subtitle = "Consola de administración global";
    
    if (pathname.includes("/dashboard")) {
      title = "Tablero Global";
      subtitle = "Métricas globales del sistema y rendimiento general";
    } else if (pathname.includes("/bookings")) {
      title = "Logs de Actividad";
      subtitle = "Historial completo de auditoría y registros del sistema";
    } else if (pathname.includes("/profile")) {
      title = "Administradores";
      subtitle = "Gestión de accesos y configuración de plataforma";
    }
  } else if (userRole === "client") {
    title = "BookFlow Cliente";
    subtitle = "Gestión de tus reservas y citas online";
    
    if (pathname.includes("/dashboard")) {
      title = "Buscador de Servicios";
      subtitle = "Encuentra y reserva en los mejores establecimientos";
    } else if (pathname.includes("/bookings")) {
      title = "Mis Reservas";
      subtitle = "Estado e historial de tus citas concertadas";
    } else if (pathname.includes("/profile")) {
      title = "Mi Cuenta";
      subtitle = "Gestiona tus datos personales y preferencias";
    }
  } else {
    // business (default)
    title = "BookFlow Admin";
    subtitle = "Plataforma de gestión de reservas y cobros";

    if (pathname.includes("/dashboard")) {
      title = "Tablero de Negocio";
      subtitle = "Resumen de rendimiento, ventas y próximas citas";
    } else if (pathname.includes("/bookings")) {
      title = "Control de Reservas";
      subtitle = "Agenda completa y asignación de turnos";
    } else if (pathname.includes("/customers")) {
      title = "Gestión de Clientes";
      subtitle = "Fichas, historial y fidelización de usuarios";
    } else if (pathname.includes("/payments")) {
      title = "Módulo de Cobros";
      subtitle = "Control de transacciones, facturas y caja";
    } else if (pathname.includes("/profile")) {
      title = "Perfil Corporativo";
      subtitle = "Configuración del establecimiento, horarios y servicios";
    }
  }

  return (
    <header className="admin-header">
      <div style={{ display: "flex", alignItems: "center" }}>
        <button className="mobile-toggle" onClick={onToggleSidebar}>
          <Menu size={20} />
        </button>
        <div>
          <h1 className="admin-header__title">{title}</h1>
          <p className="admin-header__subtitle">{subtitle}</p>
        </div>
      </div>
      
      <div className="admin-header__actions">
        <NotificationBell />
      </div>
    </header>
  );
}