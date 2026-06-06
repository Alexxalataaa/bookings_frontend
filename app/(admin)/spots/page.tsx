"use client";

import { useEffect, useState, useCallback } from "react";
import { getMyBusinesses, getSpots, createSpot, updateSpot, deleteSpot, Business, Spot } from "@/lib/api";
import { LayoutGrid, Plus, Trash2, Edit3, Save, X, MapPin, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const GRID_COLS = 8;
const GRID_ROWS = 6;
const SPOT_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#3b82f6", "#a855f7", "#ec4899", "#14b8a6"];

export default function SpotsPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBizId, setSelectedBizId] = useState<number | null>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Create/Edit modal state
  const [editingSpot, setEditingSpot] = useState<Spot | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formName, setFormName] = useState("");
  const [formLabel, setFormLabel] = useState("");
  const [formColor, setFormColor] = useState(SPOT_COLORS[0]);
  const [formX, setFormX] = useState(0);
  const [formY, setFormY] = useState(0);

  // Grid drag state
  const [dragging, setDragging] = useState<number | null>(null);

  useEffect(() => {
    fetchBusinesses();
  }, []);

  useEffect(() => {
    if (selectedBizId !== null) fetchSpots(selectedBizId);
  }, [selectedBizId]);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const data = await getMyBusinesses();
      setBusinesses(data || []);
      if (data && data.length > 0) setSelectedBizId(data[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpots = useCallback(async (bizId: number) => {
    try {
      const data = await getSpots(bizId);
      setSpots(data || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const openCreate = (x: number, y: number) => {
    const existing = spots.find(s => s.posX === x && s.posY === y);
    if (existing) return openEdit(existing);
    setFormName("");
    setFormLabel(`${String.fromCharCode(65 + y)}${x + 1}`);
    setFormColor(SPOT_COLORS[spots.length % SPOT_COLORS.length]);
    setFormX(x);
    setFormY(y);
    setEditingSpot(null);
    setIsCreating(true);
  };

  const openEdit = (spot: Spot) => {
    setFormName(spot.name);
    setFormLabel(spot.label || "");
    setFormColor(spot.color || SPOT_COLORS[0]);
    setFormX(spot.posX);
    setFormY(spot.posY);
    setEditingSpot(spot);
    setIsCreating(true);
  };

  const closeModal = () => {
    setIsCreating(false);
    setEditingSpot(null);
  };

  const handleSaveSpot = async () => {
    if (!formName.trim() || selectedBizId === null) return;
    setSaving(true);
    try {
      if (editingSpot) {
        await updateSpot(editingSpot.id, {
          name: formName,
          label: formLabel,
          color: formColor,
          posX: formX,
          posY: formY,
        });
      } else {
        await createSpot({
          name: formName,
          label: formLabel,
          color: formColor,
          posX: formX,
          posY: formY,
          businessId: selectedBizId,
        });
      }
      await fetchSpots(selectedBizId);
      closeModal();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este puesto?")) return;
    try {
      await deleteSpot(id);
      if (selectedBizId) await fetchSpots(selectedBizId);
    } catch (err) {
      console.error(err);
    }
  };

  const getSpotAt = (x: number, y: number) => spots.find(s => s.posX === x && s.posY === y);

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
        <RefreshCw size={32} style={{ margin: "0 auto 16px", opacity: 0.5, animation: "spin 1s linear infinite" }} />
        <p>Cargando gestión de puestos...</p>
      </div>
    );
  }

  return (
    <div className="page-stack">
      {/* Header */}
      <section className="page-hero">
        <div>
          <h2>Mapa de Puestos</h2>
          <p>Define y organiza los puestos físicos disponibles en tu negocio para que los clientes los elijan al reservar.</p>
        </div>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {businesses.length > 1 && (
            <select
              className="select"
              value={selectedBizId || ""}
              onChange={e => setSelectedBizId(Number(e.target.value))}
              style={{ minWidth: "200px" }}
            >
              {businesses.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}
        </div>
      </section>

      {businesses.length === 0 ? (
        <section className="section-card" style={{ textAlign: "center", padding: "60px 24px" }}>
          <MapPin size={48} style={{ color: "var(--text-muted)", margin: "0 auto 16px" }} />
          <h3 style={{ marginBottom: "8px" }}>Sin Negocios</h3>
          <p style={{ color: "var(--text-muted)" }}>Necesitas tener un negocio registrado para gestionar sus puestos.</p>
        </section>
      ) : (
        <>
          {/* Legend */}
          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-muted)" }}>
              <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: "rgba(255,255,255,0.05)", border: "2px dashed rgba(255,255,255,0.15)" }} />
              Celda vacía (haz clic para añadir)
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-muted)" }}>
              <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: "var(--primary)" }} />
              Puesto definido
            </div>
            <div style={{ marginLeft: "auto", fontSize: "13px", color: "var(--text-muted)" }}>
              {spots.length} puestos definidos · {GRID_COLS * GRID_ROWS - spots.length} celdas disponibles
            </div>
          </div>

          {/* Grid Map */}
          <section className="section-card" style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--border)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <LayoutGrid size={20} style={{ color: "var(--primary)" }} />
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>Editor Visual del Mapa</h3>
              <span style={{ marginLeft: "auto", fontSize: "12px", color: "var(--text-muted)", background: "rgba(99,102,241,0.1)", padding: "4px 12px", borderRadius: "20px", border: "1px solid rgba(99,102,241,0.2)" }}>
                {GRID_COLS} × {GRID_ROWS} cuadrícula
              </span>
            </div>

            {/* Column Labels */}
            <div style={{ display: "grid", gridTemplateColumns: `32px repeat(${GRID_COLS}, 1fr)`, gap: "6px", marginBottom: "6px" }}>
              <div />
              {Array.from({ length: GRID_COLS }, (_, i) => (
                <div key={i} style={{ textAlign: "center", fontSize: "11px", color: "var(--text-muted)", fontWeight: 700 }}>{i + 1}</div>
              ))}
            </div>

            {/* Grid Rows */}
            {Array.from({ length: GRID_ROWS }, (_, rowIdx) => (
              <div key={rowIdx} style={{ display: "grid", gridTemplateColumns: `32px repeat(${GRID_COLS}, 1fr)`, gap: "6px", marginBottom: "6px" }}>
                {/* Row Label */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: "var(--text-muted)", fontWeight: 700 }}>
                  {String.fromCharCode(65 + rowIdx)}
                </div>

                {Array.from({ length: GRID_COLS }, (_, colIdx) => {
                  const spot = getSpotAt(colIdx, rowIdx);
                  return (
                    <motion.button
                      key={colIdx}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openCreate(colIdx, rowIdx)}
                      style={{
                        height: "68px",
                        borderRadius: "10px",
                        border: spot
                          ? `2px solid ${spot.color || "var(--primary)"}40`
                          : "2px dashed rgba(255,255,255,0.1)",
                        background: spot
                          ? `linear-gradient(135deg, ${spot.color || "var(--primary)"}22, ${spot.color || "var(--primary)"}08)`
                          : "rgba(255,255,255,0.02)",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "4px",
                        transition: "all 0.2s",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      {spot ? (
                        <>
                          <div style={{
                            width: "28px", height: "28px", borderRadius: "8px",
                            background: spot.color || "var(--primary)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "10px", fontWeight: 900, color: "#fff",
                            boxShadow: `0 4px 12px ${spot.color || "var(--primary)"}60`,
                          }}>
                            {spot.label || spot.name.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontSize: "9px", color: "var(--text-muted)", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "0 4px" }}>
                            {spot.name}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(spot.id); }}
                            style={{
                              position: "absolute", top: "3px", right: "3px",
                              background: "rgba(244,63,94,0.15)", border: "none",
                              borderRadius: "4px", cursor: "pointer", padding: "2px",
                              color: "#f43f5e", opacity: 0.7, display: "flex",
                            }}
                          >
                            <X size={10} />
                          </button>
                        </>
                      ) : (
                        <Plus size={18} style={{ color: "rgba(255,255,255,0.15)" }} />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            ))}
          </section>

          {/* Spots List */}
          {spots.length > 0 && (
            <section className="section-card" style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--border)" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "20px" }}>Lista de Puestos ({spots.length})</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
                {spots.map(spot => (
                  <motion.div
                    key={spot.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      display: "flex", alignItems: "center", gap: "12px",
                      padding: "14px 16px", borderRadius: "12px",
                      background: `linear-gradient(135deg, ${spot.color || "var(--primary)"}15, rgba(255,255,255,0.02))`,
                      border: `1px solid ${spot.color || "var(--primary)"}25`,
                    }}
                  >
                    <div style={{
                      width: "36px", height: "36px", borderRadius: "10px",
                      background: spot.color || "var(--primary)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "12px", fontWeight: 900, color: "#fff", flexShrink: 0,
                      boxShadow: `0 4px 12px ${spot.color || "var(--primary)"}50`,
                    }}>
                      {spot.label || spot.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: "14px", color: "var(--text)" }}>{spot.name}</p>
                      <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)" }}>
                        Fila {String.fromCharCode(65 + spot.posY)}, Col {spot.posX + 1}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button className="icon-btn" onClick={() => openEdit(spot)} title="Editar">
                        <Edit3 size={14} />
                      </button>
                      <button className="icon-btn danger-btn" onClick={() => handleDelete(spot.id)} title="Eliminar">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="modal-card"
              style={{ maxWidth: "440px", width: "100%" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h3 className="modal-title" style={{ margin: 0 }}>
                  {editingSpot ? "Editar Puesto" : "Nuevo Puesto"}
                </h3>
                <button className="icon-btn" onClick={closeModal}><X size={18} /></button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                    Nombre del Puesto *
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="ej: Camilla 1, Mesa VIP, Cabina A..."
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    autoFocus
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                    Etiqueta en el Mapa (máx. 3 caracteres)
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="ej: C1, MA, VIP..."
                    value={formLabel}
                    onChange={e => setFormLabel(e.target.value.slice(0, 3).toUpperCase())}
                    maxLength={3}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "10px" }}>
                    Color
                  </label>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {SPOT_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setFormColor(c)}
                        style={{
                          width: "32px", height: "32px", borderRadius: "50%", background: c,
                          border: formColor === c ? "3px solid white" : "3px solid transparent",
                          cursor: "pointer", boxShadow: formColor === c ? `0 0 0 2px ${c}` : "none",
                          transition: "all 0.2s",
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Columna (X)</label>
                    <input type="number" className="input" value={formX} min={0} max={GRID_COLS - 1}
                      onChange={e => setFormX(Math.max(0, Math.min(GRID_COLS - 1, Number(e.target.value))))} />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Fila (Y)</label>
                    <input type="number" className="input" value={formY} min={0} max={GRID_ROWS - 1}
                      onChange={e => setFormY(Math.max(0, Math.min(GRID_ROWS - 1, Number(e.target.value))))} />
                  </div>
                </div>

                {/* Preview */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid var(--border)" }}>
                  <div style={{
                    width: "48px", height: "48px", borderRadius: "12px", background: formColor,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "14px", fontWeight: 900, color: "#fff",
                    boxShadow: `0 4px 16px ${formColor}60`, flexShrink: 0,
                  }}>
                    {formLabel || (formName.charAt(0).toUpperCase() || "?")}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: "15px" }}>{formName || "Nombre del puesto"}</p>
                    <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>
                      Fila {String.fromCharCode(65 + formY)}, Columna {formX + 1}
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", marginTop: "8px", justifyContent: "flex-end" }}>
                  <button type="button" className="secondary-btn" onClick={closeModal}>Cancelar</button>
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={handleSaveSpot}
                    disabled={!formName.trim() || saving}
                  >
                    <Save size={16} />
                    {saving ? "Guardando..." : (editingSpot ? "Actualizar" : "Crear Puesto")}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
