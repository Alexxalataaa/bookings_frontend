"use client";

import { useEffect, useState, useMemo } from "react";
import { getBusinessesAll, updateBusiness, deleteBusiness, Business } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Activity, Ban, CheckCircle, Search, AlertTriangle, X } from "lucide-react";

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [suspendTarget, setSuspendTarget] = useState<{ id: number; currentStatus: boolean } | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [errorModal, setErrorModal] = useState<string | null>(null);

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

  const handleToggleSuspendClick = (id: number, currentStatus: boolean) => {
    setSuspendTarget({ id, currentStatus });
  };

  const confirmToggleSuspend = async () => {
    if (!suspendTarget) return;
    try {
      await updateBusiness(suspendTarget.id, { isSuspended: !suspendTarget.currentStatus });
      setSuspendTarget(null);
      fetchBusinesses();
    } catch (err) {
      console.error(err);
      setSuspendTarget(null);
      setErrorModal("Error al actualizar el estado de suspensión");
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = async () => {
    if (deleteTargetId === null) return;
    try {
      await deleteBusiness(deleteTargetId);
      setDeleteTargetId(null);
      fetchBusinesses();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredBusinesses = useMemo(() => {
    if (!search.trim()) return businesses;
    const lower = search.toLowerCase();
    return businesses.filter(b =>
      b.name.toLowerCase().includes(lower) ||
      b.category.toLowerCase().includes(lower) ||
      (b.owner?.username && b.owner.username.toLowerCase().includes(lower))
    );
  }, [businesses, search]);

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
          <p>Administra todos los negocios registrados en la plataforma. Puedes suspender, reactivar o eliminar negocios.</p>
        </div>
      </section>

      {/* Buscador */}
      <section className="section-card" style={{ background: "rgba(255, 255, 255, 0.01)", border: "1px solid var(--border)" }}>
        <div style={{ position: "relative" }}>
          <Search size={18} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            type="text"
            className="input"
            placeholder="Buscar por nombre, categoría o propietario..."
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
              <th>Categoría</th>
              <th>Propietario</th>
              <th>Estado</th>
              <th style={{ textAlign: "right" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredBusinesses.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "20px" }}>No se encontraron negocios.</td>
              </tr>
            ) : (
              filteredBusinesses.map(b => (
                <tr key={b.id} style={{ opacity: b.isSuspended ? 0.65 : 1, background: b.isSuspended ? "rgba(244, 63, 94, 0.02)" : "transparent" }}>
                  <td>#{b.id}</td>
                  <td style={{ fontWeight: 600, textDecoration: b.isSuspended ? "line-through" : "none" }}>{b.name}</td>
                  <td><span className="badge badge--pending">{b.category}</span></td>
                  <td>{b.owner ? `#${b.owner.id} (${b.owner.username})` : "-"}</td>
                  <td>
                    {b.isSuspended ? (
                      <span className="badge" style={{ background: "rgba(244, 63, 94, 0.15)", color: "#f43f5e", border: "1px solid rgba(244, 63, 94, 0.2)" }}>SUSPENDIDO</span>
                    ) : (
                      <span className="badge" style={{ background: "rgba(16, 185, 129, 0.15)", color: "var(--success)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>ACTIVO</span>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "8px" }}>
                      <button 
                        className="icon-btn" 
                        style={{ 
                          background: b.isSuspended ? "rgba(16, 185, 129, 0.1)" : "rgba(244, 63, 94, 0.1)", 
                          color: b.isSuspended ? "var(--success)" : "#f43f5e", 
                          border: "1px solid",
                          borderColor: b.isSuspended ? "rgba(16, 185, 129, 0.2)" : "rgba(244, 63, 94, 0.2)",
                          cursor: "pointer", 
                          padding: "6px", 
                          borderRadius: "6px",
                          display: "flex",
                          alignItems: "center"
                        }}
                        onClick={() => handleToggleSuspendClick(b.id, b.isSuspended)}
                        title={b.isSuspended ? "Reactivar Negocio" : "Suspender Negocio"}
                      >
                        {b.isSuspended ? <CheckCircle size={16} /> : <Ban size={16} />}
                      </button>
                      <button className="icon-btn danger-btn" onClick={() => handleDeleteClick(b.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {suspendTarget !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSuspendTarget(null);
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
              <h3 className="modal-title">
                {suspendTarget.currentStatus ? "Reactivar Negocio" : "Suspender Negocio"}
              </h3>
              <p className="modal-text">
                ¿Seguro que deseas {suspendTarget.currentStatus ? "reactivar" : "suspender"} este negocio?
              </p>
              <div style={{ display: "flex", gap: 12, marginTop: 32, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setSuspendTarget(null)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={confirmToggleSuspend}
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

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
              <div className="modal-icon danger" style={{ marginBottom: 20 }}>
                <AlertTriangle size={32} color="var(--accent)" />
              </div>
              <h3 className="modal-title">Eliminar Negocio</h3>
              <p className="modal-text">
                ¿Eliminar este negocio permanentemente? Esta acción no se puede deshacer.
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
                >
                  <Trash2 size={16} />
                  Confirmar eliminación
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {errorModal !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget) setErrorModal(null);
            }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="modal-card"
            >
              <div className="modal-icon danger" style={{ marginBottom: 20 }}>
                <AlertTriangle size={32} color="var(--accent)" />
              </div>
              <h3 className="modal-title">Error</h3>
              <p className="modal-text">{errorModal}</p>
              <div style={{ display: "flex", gap: 12, marginTop: 32, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => setErrorModal(null)}
                >
                  Aceptar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
