"use client";

import { useEffect, useState } from "react";
import { getUsers, createUser, deleteUser, SystemUser } from "@/lib/api";
import { motion } from "framer-motion";
import { ShieldCheck, Plus, Trash2, Activity } from "lucide-react";

export default function AccountsPage() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);

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


    </div>
  );
}
