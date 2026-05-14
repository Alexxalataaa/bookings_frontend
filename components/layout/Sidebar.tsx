"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, Users, CreditCard, X, Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const menuItems = [
  { label: "Tablero", href: "/dashboard", icon: LayoutDashboard },
  { label: "Reservas", href: "/bookings", icon: Calendar },
  { label: "Clientes", href: "/customers", icon: Users },
  { label: "Pagos", href: "/payments", icon: CreditCard },
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

  useEffect(() => {
    const savedTheme = localStorage.getItem("app-theme") || "default";
    setActiveTheme(savedTheme);
    const savedBrightness = localStorage.getItem("app-brightness") || "dark";
    setActiveBrightness(savedBrightness);
  }, []);

  const changeTheme = (themeId: string) => {
    setActiveTheme(themeId);
    if (themeId === "default") {
      document.documentElement.removeAttribute("data-theme");
      localStorage.removeItem("app-theme");
    } else {
      document.documentElement.setAttribute("data-theme", themeId);
      localStorage.setItem("app-theme", themeId);
    }
  };

  return (
    <aside className={`admin-sidebar ${isOpen ? "admin-sidebar--open" : ""}`}>
      <div className="admin-sidebar__brand">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <div>
            <h2 className="admin-sidebar__title">BookFlow</h2>
            <p className="admin-sidebar__subtitle">Control Center</p>
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
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {themes.map(t => (
              <button 
                key={t.id}
                onClick={() => changeTheme(t.id)}
                style={{ 
                  width: "24px", height: "24px", borderRadius: "50%", 
                  background: t.color, 
                  border: activeTheme === t.id ? "2px solid var(--text)" : "2px solid transparent",
                  cursor: "pointer", padding: 0,
                  boxShadow: activeTheme === t.id ? "0 0 0 1px var(--text-muted)" : "none"
                }}
                title={t.label}
              />
            ))}
          </div>
        </div>
      </div>
      
      <div style={{ marginTop: "auto", padding: "12px", opacity: 0.4, fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em" }}>
        V1.0.4 PREMIUM EDITION
      </div>
    </aside>
  );
}