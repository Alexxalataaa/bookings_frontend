"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, X } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";

interface Notification {
  id: string;
  message: string;
  timestamp: string;
}

interface ToastNotification extends Notification {
  toastId: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setMounted(true);
    // Connect to WebSocket gateway
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005";
    const socket: Socket = io(socketUrl);
    
    socket.on("notification", (data: Notification) => {
      setNotifications((prev) => [data, ...prev].slice(0, 50)); // Keep last 50
      setUnreadCount((prev) => prev + 1);
      
      const toastId = Date.now().toString() + Math.random().toString();
      setToasts((prev) => {
        const newToasts = [...prev, { ...data, toastId }];
        return newToasts.slice(-5);
      });
      
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
      }, 5000);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });

  const toggleDropdown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isOpen) {
      const rect = e.currentTarget.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
      setUnreadCount(0);
    }
    setIsOpen(!isOpen);
  };

  const dismissToast = (toastId: string) => {
    setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
  };

  return (
    <>
      {mounted && createPortal(
        <div 
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 99999,
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            pointerEvents: "none"
          }}
        >
          <AnimatePresence>
            {toasts.map((toast) => (
              <motion.div
                key={toast.toastId}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                style={{
                  pointerEvents: "auto",
                  background: "white",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                  border: "1px solid #e5e7eb",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  minWidth: "300px",
                  justifyContent: "space-between"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ background: "var(--primary, #3b82f6)", color: "white", padding: "8px", borderRadius: "50%", display: "flex" }}>
                    <Bell size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "14px", color: "#111827" }}>Nueva Notificación</div>
                    <div style={{ fontSize: "13px", color: "#4b5563" }}>{toast.message}</div>
                  </div>
                </div>
                <button 
                  onClick={() => dismissToast(toast.toastId)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}
                >
                  <X size={16} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>,
        document.body
      )}

      <div className="notification-bell-container" ref={dropdownRef} style={{ position: "relative" }}>
        <button 
          onClick={toggleDropdown} 
          className="admin-avatar"
          style={{ 
            cursor: "pointer", 
            position: "relative",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Bell size={20} strokeWidth={2} />
          {unreadCount > 0 && (
            <span 
              style={{
                position: "absolute",
                top: "-4px",
                right: "-4px",
                backgroundColor: "red",
                color: "white",
                borderRadius: "50%",
                width: "20px",
                height: "20px",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                border: "2px solid white"
              }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {mounted && isOpen && createPortal(
          <div 
            style={{
              position: "fixed",
              top: `${dropdownPosition.top}px`,
              right: `${dropdownPosition.right}px`,
              width: "320px",
              backgroundColor: "white",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              borderRadius: "8px",
              zIndex: 99999,
              border: "1px solid #e5e7eb",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden"
            }}
          >
            <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb", fontWeight: "bold", color: "#374151", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Notificaciones</span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {notifications.length > 0 && (
                  <span style={{ fontSize: "12px", fontWeight: "normal", color: "#6b7280", background: "#f3f4f6", padding: "2px 8px", borderRadius: "12px" }}>
                    {notifications.length}
                  </span>
                )}
                <button 
                  onClick={() => setIsOpen(false)}
                  style={{ 
                    background: "none", 
                    border: "none", 
                    cursor: "pointer", 
                    color: "#9ca3af", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    padding: "4px",
                    borderRadius: "4px",
                    transition: "background 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f3f4f6"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div style={{ padding: "0", maxHeight: "350px", overflowY: "auto" }}>
              {notifications.length === 0 ? (
                <div style={{ padding: "32px 16px", textAlign: "center", color: "#6b7280", fontSize: "14px" }}>
                  <Bell size={24} style={{ margin: "0 auto 8px auto", opacity: 0.2 }} />
                  No hay notificaciones
                </div>
              ) : (
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {notifications.map((notif) => (
                    <li 
                      key={notif.id} 
                      style={{ 
                        padding: "16px", 
                        borderBottom: "1px solid #f3f4f6",
                        fontSize: "14px",
                        color: "#4b5563",
                        textAlign: "left",
                        display: "flex",
                        gap: "12px",
                        alignItems: "flex-start"
                      }}
                    >
                      <div style={{ background: "#eff6ff", color: "var(--primary, #3b82f6)", padding: "8px", borderRadius: "50%", display: "flex", marginTop: "2px" }}>
                        <Bell size={14} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: "500", color: "#111827", marginBottom: "4px" }}>{notif.message}</div>
                        <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                          {new Date(notif.timestamp).toLocaleString('es-ES')}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>,
          document.body
        )}
      </div>
    </>
  );
}
