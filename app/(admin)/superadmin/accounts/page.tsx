"use client";

import { useEffect, useState, useMemo } from "react";
import { getUsers, deleteUser, SystemUser } from "@/lib/api";
import { Trash2, Activity, Search, AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AccountsPage() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = async () => {
    if (deleteTargetId === null) return;
    setDeletingUserId(deleteTargetId);
    try {
      await deleteUser(deleteTargetId);
      setDeleteTargetId(null);
      fetchUsers();
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingUserId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const lower = search.toLowerCase();
    return users.filter(u =>
      u.fullName.toLowerCase().includes(lower) ||
      u.username.toLowerCase().includes(lower) ||
      u.email.toLowerCase().includes(lower) ||
      u.role.toLowerCase().includes(lower)
    );
  }, [users, search]);

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
        <Activity size={32} style={{ margin: "0 auto 16px", opacity: 0.5 }} />
        <p>Cargando cuentas...</p>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <h2>Gestión de Cuentas</h2>
          <p>Administra las cuentas con acceso al panel.</p>
        </div>
      </section>

      {/* Buscador */}
      <section className="section-card" style={{ background: "rgba(255, 255, 255, 0.01)", border: "1px solid var(--border)" }}>
        <div style={{ position: "relative" }}>
          <Search size={18} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            type="text"
            className="input"
            placeholder="Buscar por nombre, usuario, email o rol..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: "48px" }}
          />
        </div>
      </section>

      <div className="table-scroll-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Usuario</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "20px" }}>No se encontraron usuarios.</td>
              </tr>
            ) : (
              filteredUsers.map(u => (
                <tr key={u.id}>
                  <td>#{u.id}</td>
                  <td style={{ fontWeight: 600 }}>{u.fullName}</td>
                  <td>@{u.username}</td>
                  <td>{u.email}</td>
                  <td><span className={`badge badge--${u.role === 'superadmin' ? 'confirmed' : 'pending'}`}>{u.role}</span></td>
                  <td>
                    <button className="icon-btn danger-btn" onClick={() => handleDeleteClick(u.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {deleteTargetId !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget) setDeleteTargetId(null);
            }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="modal-card"
            >
              <div className="modal-icon warning" style={{ marginBottom: 20 }}>
                <AlertTriangle size={32} color="var(--warning)" />
              </div>
              <h3 className="modal-title">Eliminar Cuenta</h3>
              <p className="modal-text">
                ¿Seguro que quieres eliminar este usuario administrador? Esta acción no se puede deshacer.
              </p>
              <div style={{ display: "flex", gap: 12, marginTop: 32, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setDeleteTargetId(null)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="danger-btn"
                  onClick={confirmDelete}
                  disabled={deletingUserId === deleteTargetId}
                >
                  <Trash2 size={16} />
                  {deletingUserId === deleteTargetId ? "Eliminando..." : "Confirmar eliminación"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
