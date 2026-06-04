"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, Users, CreditCard, X, Sun, Moon, User, Search, History, Settings, FileCode2, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const clientMenuItems = [
  { label: "Buscador", href: "/dashboard", icon: Search },
  { label: "Mis Reservas", href: "/bookings", icon: History },
  { label: "Mi Perfil", href: "/profile", icon: User },
];

const businessMenuItems = [
  { label: "Tablero", href: "/dashboard", icon: LayoutDashboard },
  { label: "Reservas", href: "/bookings", icon: Calendar },
  { label: "Clientes", href: "/customers", icon: Users },
  { label: "Pagos", href: "/payments", icon: CreditCard },
  { label: "Perfil Negocio", href: "/profile", icon: User },
];

const superadminMenuItems = [
  { label: "Dashboard", href: "/superadmin/dashboard", icon: LayoutDashboard },
  { label: "Métricas Globales", href: "/superadmin/metrics", icon: TrendingUp },
  { label: "Gestión Negocios", href: "/superadmin/businesses", icon: FileCode2 },
  { label: "Cuentas", href: "/superadmin/accounts", icon: Settings },
  { label: "Mi Perfil", href: "/profile", icon: User },
];

const themes = [
  { id: "default", color: "#6366f1", label: "Default" },
  { id: "pink", color: "#ec4899", label: "Rosa" },
  { id: "green", color: "#10b981", label: "Verde" },
  { id: "blue", color: "#3b82f6", label: "Azul" },
  { id: "orange", color: "#f59e0b", label: "Naranja" },
];

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const pathname = usePathname();
  const [activeTheme, setActiveTheme] = useState("default");
  const [activeBrightness, setActiveBrightness] = useState("dark");
  const [userRole, setUserRole] = useState<"client" | "business" | "superadmin">("business");
  const [customColor, setCustomColor] = useState("#a855f7");

  useEffect(() => {
    const savedTheme = localStorage.getItem("app-theme") || "default";
    const savedCustomColor = localStorage.getItem("app-theme-custom");
    if (savedTheme === "custom" && savedCustomColor) {
      setActiveTheme("custom");
      setCustomColor(savedCustomColor);
      document.documentElement.style.setProperty("--primary", savedCustomColor);
      document.documentElement.style.setProperty("--primary-gradient", `linear-gradient(135deg, ${savedCustomColor} 0%, #a855f7 100%)`);
    } else {
      setActiveTheme(savedTheme);
      if (savedTheme !== "default") {
        document.documentElement.setAttribute("data-theme", savedTheme);
      }
    }
    
    const savedBrightness = localStorage.getItem("app-brightness") || "dark";
    setActiveBrightness(savedBrightness);

    const savedRole = localStorage.getItem("user_role") as any;
    if (savedRole) {
      setUserRole(savedRole);
    }
  }, []);

  const changeTheme = (themeId: string) => {
    setActiveTheme(themeId);
    document.documentElement.style.removeProperty("--primary");
    document.documentElement.style.removeProperty("--primary-gradient");
    if (themeId === "default") {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("app-theme", "default");
    } else {
      document.documentElement.setAttribute("data-theme", themeId);
      localStorage.setItem("app-theme", themeId);
    }
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setActiveTheme("custom");
    setCustomColor(newColor);
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.style.setProperty("--primary", newColor);
    document.documentElement.style.setProperty("--primary-gradient", `linear-gradient(135deg, ${newColor} 0%, #a855f7 100%)`);
    localStorage.setItem("app-theme", "custom");
    localStorage.setItem("app-theme-custom", newColor);
  };

  const menuItems = 
    userRole === "client" 
      ? clientMenuItems 
      : userRole === "superadmin" 
        ? superadminMenuItems 
        : businessMenuItems;

  return (
    <aside className={`admin-sidebar ${isOpen ? "admin-sidebar--open" : ""}`} style={{ overflowY: "auto", overflowX: "hidden" }}>
      <div className="admin-sidebar__brand">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <img src="/krono_logo.png" alt="Krono Logo" style={{ width: "32px", height: "32px", borderRadius: "8px" }} />
              <h2 className="admin-sidebar__title">Krono</h2>
            </div>
            <p className="admin-sidebar__subtitle" style={{ fontSize: "11px", color: "var(--primary)", fontWeight: "bold" }}>
              {userRole === "client" ? "Panel Cliente" : userRole === "superadmin" ? "Super Panel" : "Panel Negocio"}
            </p>
          </div>
          </div>
          <button className="mobile-toggle" onClick={onClose} style={{ marginRight: 0 }}>
            <X size={20} />
          </button>
        </div>
      </div>

      <nav className="admin-sidebar__nav">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-sidebar__link ${isActive ? "admin-sidebar__link--active" : ""}`}
              onClick={() => {
                if (window.innerWidth <= 1024) onClose();
              }}
            >
              <motion.span 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="admin-sidebar__icon"
                style={{ display: "flex", alignItems: "center" }}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </motion.span>
              <span>{item.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="active-pill"
                  className="active-indicator"
                  style={{ 
                    marginLeft: "auto", 
                    width: "4px", 
                    height: "18px", 
                    background: "var(--primary)",
                    borderRadius: "4px"
                  }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div style={{ marginTop: "32px", paddingLeft: "12px", display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* Brightness Control */}
        <div>
          <p style={{ fontSize: "12px", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.05em", margin: "0 0 10px 0" }}>Apariencia</p>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => {
                setActiveBrightness("dark");
                document.documentElement.setAttribute("data-brightness", "dark");
                localStorage.setItem("app-brightness", "dark");
              }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: "36px", height: "36px", borderRadius: "8px",
                background: activeBrightness === "dark" ? "rgba(255,255,255,0.1)" : "transparent",
                color: activeBrightness === "dark" ? "var(--text)" : "var(--text-muted)",
                border: "1px solid",
                borderColor: activeBrightness === "dark" ? "var(--border-focus)" : "transparent",
                cursor: "pointer", padding: 0
              }}
              title="Modo Oscuro"
            >
              <Moon size={18} />
            </button>
            <button
              onClick={() => {
                setActiveBrightness("light");
                document.documentElement.setAttribute("data-brightness", "light");
                localStorage.setItem("app-brightness", "light");
              }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: "36px", height: "36px", borderRadius: "8px",
                background: activeBrightness === "light" ? "rgba(0,0,0,0.05)" : "transparent",
                color: activeBrightness === "light" ? "var(--text)" : "var(--text-muted)",
                border: "1px solid",
                borderColor: activeBrightness === "light" ? "var(--border-focus)" : "transparent",
                cursor: "pointer", padding: 0
              }}
              title="Modo Claro"
            >
              <Sun size={18} />
            </button>
          </div>
        </div>

        {/* Theme Control */}
        <div>
          <p style={{ fontSize: "12px", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.05em", margin: "0 0 10px 0" }}>Color</p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "nowrap", overflowX: "auto", paddingBottom: "8px" }} className="hide-scrollbar">
            {themes.map(t => (
              <button 
                key={t.id}
                onClick={() => changeTheme(t.id)}
                style={{ 
                  width: "24px", height: "24px", borderRadius: "50%", 
                  background: t.color, 
                  border: activeTheme === t.id ? "2px solid var(--text)" : "2px solid transparent",
                  cursor: "pointer", padding: 0,
                  boxShadow: activeTheme === t.id ? "0 0 0 1px var(--text-muted)" : "none",
                  flexShrink: 0
                }}
                title={t.label}
              />
            ))}
            
            {/* Custom Color Picker */}
            <div 
              style={{ 
                position: "relative", width: "24px", height: "24px", borderRadius: "50%", 
                overflow: "hidden", flexShrink: 0, 
                border: activeTheme === "custom" ? "2px solid var(--text)" : "2px solid transparent",
                boxShadow: activeTheme === "custom" ? "0 0 0 1px var(--text-muted)" : "none",
                background: "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)",
                cursor: "pointer", padding: 0
              }}
              title="Personalizado"
            >
              <input 
                type="color"
                value={customColor}
                onChange={handleCustomColorChange}
                style={{ opacity: 0, position: "absolute", top: 0, left: 0, width: "100%", height: "100%", cursor: "pointer" }}
              />
            </div>
          </div>
        </div>
      </div>
      
      <div style={{ marginTop: "auto", padding: "12px", opacity: 0.4, fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em" }}>
        V1.0.4 PREMIUM EDITION
      </div>
    </aside>
  );
}