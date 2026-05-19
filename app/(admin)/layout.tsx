"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import AdminProtected from "./admin-protected";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <AdminProtected>
      <div className="admin-shell">
        <div
          className={`sidebar-overlay ${isSidebarOpen ? "sidebar-overlay--active" : ""}`}
          onClick={() => setIsSidebarOpen(false)}
        />

        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <div className="admin-main">
          <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
          <main className="admin-content">{children}</main>
        </div>
      </div>
    </AdminProtected>
  );
}

