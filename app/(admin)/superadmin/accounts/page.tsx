"use client";

import { useEffect, useState } from "react";
import { getUsers, createUser, deleteUser, SystemUser } from "@/lib/api";
import { motion } from "framer-motion";
import { ShieldCheck, Plus, Trash2, Activity } from "lucide-react";

export default function AccountsPage() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ fullName: "", email: "", username: "", password: "", role: "superadmin" });

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUser(formData);
      setIsModalOpen(false);
      setFormData({ fullName: "", email: "", username: "", password: "", role: "superadmin" });
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("Error al crear cuenta. (Revisa si el usuario/email ya existen)");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Eliminar este usuario administrador?")) {
      try {
        await deleteUser(id);
        fetchUsers();
      } catch (err) {
        console.error(err);
      }
    }
  };

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
        <button className="primary-btn" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          <span>Nuevo Administrador</span>
        </button>
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
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "20px" }}>No hay usuarios registrados.</td>
              </tr>
            ) : (
              users.map(u => (
                <tr key={u.id}>
                  <td>#{u.id}</td>
                  <td style={{ fontWeight: 600 }}>{u.fullName}</td>
                  <td>@{u.username}</td>
                  <td>{u.email}</td>
                  <td><span className={`badge badge--${u.role === 'superadmin' ? 'confirmed' : 'pending'}`}>{u.role}</span></td>
                  <td>
                    <button className="icon-btn danger-btn" onClick={() => handleDelete(u.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <motion.div className="modal-content" initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
            <h3>Nueva Cuenta Administrativa</h3>
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
              <div className="form-group">
                <label>Nombre Completo *</label>
                <input required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="input-field" />
              </div>
              <div className="form-group">
                <label>Correo Electrónico *</label>
                <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="input-field" />
              </div>
              <div className="form-group">
                <label>Nombre de Usuario *</label>
                <input required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="input-field" />
              </div>
              <div className="form-group">
                <label>Contraseña *</label>
                <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="input-field" minLength={6} />
              </div>
              <div className="form-group">
                <label>Rol</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="input-field">
                  <option value="business">BUSINESS</option>
                  <option value="superadmin">SUPERADMIN</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button type="button" className="secondary-btn" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="primary-btn">Crear Cuenta</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
