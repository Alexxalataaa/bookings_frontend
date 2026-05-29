"use client";

import { useEffect, useState } from "react";
import { getBusinessesAll, createBusiness, deleteBusiness, Business } from "@/lib/api";
import { motion } from "framer-motion";
import { Building, Plus, Trash2, Activity } from "lucide-react";

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "", street: "", category: "General", slug: "" });

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const data = await getBusinessesAll();
      setBusinesses(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createBusiness(formData);
      setIsModalOpen(false);
      setFormData({ name: "", description: "", street: "", category: "General", slug: "" });
      fetchBusinesses();
    } catch (err) {
      console.error(err);
      alert("Error al crear negocio");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Eliminar este negocio permanentemente?")) {
      try {
        await deleteBusiness(id);
        fetchBusinesses();
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
        <Activity size={32} style={{ margin: "0 auto 16px", opacity: 0.5 }} />
        <p>Cargando negocios (Global)...</p>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <h2>Gestión de Negocios (Global)</h2>
          <p>Administra todos los negocios registrados en la plataforma.</p>
        </div>
        <button className="primary-btn" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          <span>Nuevo Negocio</span>
        </button>
      </section>

      <div className="table-scroll-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Owner ID</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {businesses.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "20px" }}>No hay negocios registrados.</td>
              </tr>
            ) : (
              businesses.map(b => (
                <tr key={b.id}>
                  <td>#{b.id}</td>
                  <td style={{ fontWeight: 600 }}>{b.name}</td>
                  <td><span className="badge badge--pending">{b.category}</span></td>
                  <td>{b.owner ? `#${b.owner.id} (${b.owner.username})` : "-"}</td>
                  <td>
                    <button className="icon-btn danger-btn" onClick={() => handleDelete(b.id)}>
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
            <h3>Crear Negocio</h3>
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
              <div className="form-group">
                <label>Nombre del Negocio *</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-field" />
              </div>
              <div className="form-group">
                <label>Slug (URL) *</label>
                <input required value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="input-field" placeholder="mi-negocio" />
              </div>
              <div className="form-group">
                <label>Categoría</label>
                <input value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="input-field" />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="input-field" />
              </div>
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button type="button" className="secondary-btn" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="primary-btn">Guardar</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
