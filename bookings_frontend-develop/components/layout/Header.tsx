import { Menu } from "lucide-react";
import NotificationBell from "./NotificationBell";

export default function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  return (
    <header className="admin-header">
      <div style={{ display: "flex", alignItems: "center" }}>
        <button className="mobile-toggle" onClick={onToggleSidebar}>
          <Menu size={20} />
        </button>
        <div>
          <h1 className="admin-header__title">BookFlow Admin</h1>
          <p className="admin-header__subtitle">
            Plataforma de gestión de reservas y cobros
          </p>
        </div>
      </div>
      
      <div className="admin-header__actions">
        <NotificationBell />
      </div>
    </header>
  );
}