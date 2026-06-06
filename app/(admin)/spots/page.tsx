"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getMyBusinesses, getSpots, createSpot, updateSpot, deleteSpot, updateBusiness, Business, Spot } from "@/lib/api";
import { LayoutGrid, Plus, Trash2, Edit3, Save, X, MapPin, RefreshCw, Maximize, MousePointer2, Paintbrush, Palette } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

  // Map Config State (Optimistic sizes)
  const [configCols, setConfigCols] = useState(8);
  const [configRows, setConfigRows] = useState(6);

  // Resize State
  const [isResizingMap, setIsResizingMap] = useState(false);
  const resizeRef = useRef({
    startX: 0,
    startY: 0,
    startCols: 8,
    startRows: 6,
    currentCols: 8,
    currentRows: 6,
  });

  // Interactive Editor States
  const [editorMode, setEditorMode] = useState<"select" | "draw">("select");
  const [selectedSpotIds, setSelectedSpotIds] = useState<number[]>([]);
  
  // Lasso State
  const [isLassoing, setIsLassoing] = useState(false);
  const [lassoStart, setLassoStart] = useState<{x: number, y: number} | null>(null);
  const [lassoCurrent, setLassoCurrent] = useState<{x: number, y: number} | null>(null);

  // Computed map sizes
  const selectedBusiness = businesses.find(b => b.id === selectedBizId);
  const mapCols = selectedBusiness?.mapCols || 8;
  const mapRows = selectedBusiness?.mapRows || 6;

  // Sync config state with selected business
  useEffect(() => {
    if (selectedBusiness && !isResizingMap) {
      setConfigCols(selectedBusiness.mapCols || 8);
      setConfigRows(selectedBusiness.mapRows || 6);
    }
  }, [selectedBusiness, isResizingMap]);

  useEffect(() => {
    const handleMouseUpGlobal = () => {
      handleLassoEnd();
    };
    
    window.addEventListener("mouseup", handleMouseUpGlobal);
    return () => {
      window.removeEventListener("mouseup", handleMouseUpGlobal);
    };
  }, [isLassoing, editorMode, lassoStart, lassoCurrent, spots]);

  // Handle global mouse events for resizing
  useEffect(() => {
    const handleMouseMoveGlobal = (e: MouseEvent) => {
      if (isResizingMap) {
        // Approximate cell size is 74px (68px + 6px gap)
        const dx = e.clientX - resizeRef.current.startX;
        const dy = e.clientY - resizeRef.current.startY;
        
        const newCols = Math.max(2, Math.min(20, resizeRef.current.startCols + Math.round(dx / 74)));
        const newRows = Math.max(2, Math.min(20, resizeRef.current.startRows + Math.round(dy / 74)));
        
        setConfigCols(newCols);
        setConfigRows(newRows);
        resizeRef.current.currentCols = newCols;
        resizeRef.current.currentRows = newRows;
      }
    };

    const handleMouseUpGlobalResize = async () => {
      if (isResizingMap) {
        setIsResizingMap(false);
        if (selectedBizId && (resizeRef.current.currentCols !== resizeRef.current.startCols || resizeRef.current.currentRows !== resizeRef.current.startRows)) {
          // Optimistically update businesses state
          setBusinesses(prev => prev.map(b => 
            b.id === selectedBizId ? { ...b, mapCols: resizeRef.current.currentCols, mapRows: resizeRef.current.currentRows } : b
          ));
          try {
            await updateBusiness(selectedBizId, { 
              mapCols: resizeRef.current.currentCols, 
              mapRows: resizeRef.current.currentRows 
            });
          } catch(err) { console.error(err); }
        }
      }
    };

    if (isResizingMap) {
      window.addEventListener("mousemove", handleMouseMoveGlobal);
      window.addEventListener("mouseup", handleMouseUpGlobalResize);
    }
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMoveGlobal);
      window.removeEventListener("mouseup", handleMouseUpGlobalResize);
    };
  }, [isResizingMap, selectedBizId]);

  useEffect(() => {
    if (selectedBizId !== null) {
      fetchSpots(selectedBizId);
      setSelectedSpotIds([]); // Clear selection when changing business
    }
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
      setSelectedSpotIds(prev => prev.filter(sId => sId !== id));
      if (selectedBizId) await fetchSpots(selectedBizId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSpotIds.length === 0) return;
    if (!confirm(`¿Eliminar ${selectedSpotIds.length} puestos?`)) return;
    try {
      setSaving(true);
      await Promise.all(selectedSpotIds.map(id => deleteSpot(id)));
      setSelectedSpotIds([]);
      if (selectedBizId) await fetchSpots(selectedBizId);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleBulkColor = async (color: string) => {
    if (selectedSpotIds.length === 0) return;
    try {
      setSaving(true);
      await Promise.all(selectedSpotIds.map(id => updateSpot(id, { color })));
      if (selectedBizId) await fetchSpots(selectedBizId);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const getSpotAt = (x: number, y: number) => spots.find(s => s.posX === x && s.posY === y);

  // Interactive Handlers
  const handleSpotClick = (spot: Spot) => {
    if (editorMode === "select") {
      setSelectedSpotIds(prev => 
        prev.includes(spot.id) ? prev.filter(id => id !== spot.id) : [...prev, spot.id]
      );
    } else {
      openEdit(spot);
    }
  };

  const handleCellMouseDown = (x: number, y: number) => {
    if (editorMode === "select") {
      setIsLassoing(true);
      setLassoStart({ x, y });
      setLassoCurrent({ x, y });
      // Deselect all on click empty space
      setSelectedSpotIds([]);
    } else if (editorMode === "draw") {
      createQuickSpot(x, y);
    }
  };

  const handleCellMouseEnter = (x: number, y: number) => {
    if (isLassoing && editorMode === "select") {
      setLassoCurrent({ x, y });
    } else if (editorMode === "draw" && isLassoing) { // We can reuse isLassoing for dragging draw
      createQuickSpot(x, y);
    }
  };

  const handleLassoEnd = () => {
    if (!isLassoing) return;
    setIsLassoing(false);
    if (editorMode === "select" && lassoStart && lassoCurrent) {
      const minX = Math.min(lassoStart.x, lassoCurrent.x);
      const maxX = Math.max(lassoStart.x, lassoCurrent.x);
      const minY = Math.min(lassoStart.y, lassoCurrent.y);
      const maxY = Math.max(lassoStart.y, lassoCurrent.y);
      
      const newSelection = spots.filter(s => 
        s.posX >= minX && s.posX <= maxX && s.posY >= minY && s.posY <= maxY
      ).map(s => s.id);
      
      if (newSelection.length > 0) {
        setSelectedSpotIds(newSelection);
      }
    }
    setLassoStart(null);
    setLassoCurrent(null);
  };

  const isCellInLasso = (x: number, y: number) => {
    if (!lassoStart || !lassoCurrent || !isLassoing || editorMode !== "select") return false;
    const minX = Math.min(lassoStart.x, lassoCurrent.x);
    const maxX = Math.max(lassoStart.x, lassoCurrent.x);
    const minY = Math.min(lassoStart.y, lassoCurrent.y);
    const maxY = Math.max(lassoStart.y, lassoCurrent.y);
    return x >= minX && x <= maxX && y >= minY && y <= maxY;
  };

  const createQuickSpot = async (x: number, y: number) => {
    if (!selectedBizId || getSpotAt(x, y) || saving) return;
    // We don't await this completely to allow fast drawing, just trigger it
    const nextNum = spots.length + 1;
    const color = SPOT_COLORS[spots.length % SPOT_COLORS.length];
    
    // Optimistic local update (optional, but let's just trigger and fetch)
    try {
      await createSpot({
        name: `Puesto ${nextNum}`,
        label: `P${nextNum}`,
        color: color,
        posX: x,
        posY: y,
        businessId: selectedBizId,
      });
      fetchSpots(selectedBizId);
    } catch(err) {}
  };

  const handleDragStartSpot = (e: React.DragEvent, spotId: number) => {
    if (editorMode !== "select") e.preventDefault();
    e.dataTransfer.setData("spotId", spotId.toString());
  };

  const handleDropOnCell = async (e: React.DragEvent, x: number, y: number) => {
    e.preventDefault();
    const spotId = e.dataTransfer.getData("spotId");
    if (!spotId) return;
    
    const id = Number(spotId);
    if (!getSpotAt(x, y)) {
      try {
        await updateSpot(id, { posX: x, posY: y });
        if (selectedBizId) await fetchSpots(selectedBizId);
      } catch (err) { console.error(err); }
    }
  };

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
              {spots.length} puestos definidos · {mapCols * mapRows - spots.length} celdas disponibles
            </div>
          </div>

          {/* Grid Map */}
          <section className="section-card" style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--border)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <LayoutGrid size={20} style={{ color: "var(--primary)" }} />
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>Editor Visual del Mapa</h3>
              
              <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
                {/* Mode Toggles */}
                <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: "8px", padding: "4px" }}>
                  <button
                    onClick={() => setEditorMode("select")}
                    style={{
                      display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "6px",
                      fontSize: "12px", fontWeight: 700, cursor: "pointer", border: "none",
                      background: editorMode === "select" ? "var(--primary)" : "transparent",
                      color: editorMode === "select" ? "#fff" : "var(--text-muted)",
                      transition: "all 0.2s"
                    }}
                  >
                    <MousePointer2 size={14} /> Mover / Seleccionar
                  </button>
                  <button
                    onClick={() => { setEditorMode("draw"); setSelectedSpotIds([]); }}
                    style={{
                      display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "6px",
                      fontSize: "12px", fontWeight: 700, cursor: "pointer", border: "none",
                      background: editorMode === "draw" ? "#10b981" : "transparent",
                      color: editorMode === "draw" ? "#fff" : "var(--text-muted)",
                      transition: "all 0.2s"
                    }}
                  >
                    <Paintbrush size={14} /> Pintar Puestos
                  </button>
                </div>
              </div>
            </div>

            {/* Column Labels */}
            <div style={{ display: "grid", gridTemplateColumns: `32px repeat(${configCols}, 1fr)`, gap: "6px", marginBottom: "6px", minWidth: "max-content", transition: "all 0.1s" }}>
              <div />
              {Array.from({ length: configCols }, (_, i) => (
                <div key={i} style={{ textAlign: "center", fontSize: "11px", color: "var(--text-muted)", fontWeight: 700 }}>{i + 1}</div>
              ))}
            </div>

            {/* Grid Rows */}
            <div style={{ overflowX: "auto", paddingBottom: "12px", position: "relative" }}>
              <div style={{ display: "inline-block", position: "relative" }}>
                {Array.from({ length: configRows }, (_, rowIdx) => (
                  <div key={rowIdx} style={{ display: "grid", gridTemplateColumns: `32px repeat(${configCols}, 1fr)`, gap: "6px", marginBottom: "6px", transition: "all 0.1s" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: "var(--text-muted)", fontWeight: 700 }}>
                    {String.fromCharCode(65 + rowIdx)}
                  </div>

                  {Array.from({ length: configCols }, (_, colIdx) => {
                    const spot = getSpotAt(colIdx, rowIdx);
                    const isSelected = spot ? selectedSpotIds.includes(spot.id) : false;
                    const inLasso = isCellInLasso(colIdx, rowIdx);
                    
                    return (
                      <motion.div
                        key={colIdx}
                        whileHover={{ scale: spot ? 1.05 : 1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => spot ? handleSpotClick(spot) : openCreate(colIdx, rowIdx)}
                        onMouseDown={(e) => {
                          if (!spot) handleCellMouseDown(colIdx, rowIdx);
                        }}
                        onMouseEnter={() => handleCellMouseEnter(colIdx, rowIdx)}
                        onDragOver={(e) => { if (!spot) e.preventDefault(); }}
                        onDrop={(e) => handleDropOnCell(e, colIdx, rowIdx)}
                        draggable={!!spot && editorMode === "select"}
                        onDragStart={(e: any) => spot && handleDragStartSpot(e, spot.id)}
                        style={{
                          height: "68px",
                          borderRadius: "10px",
                          border: isSelected || inLasso 
                            ? `2px solid #fff`
                            : spot
                              ? `2px solid ${spot.color || "var(--primary)"}40`
                              : "2px dashed rgba(255,255,255,0.1)",
                          background: isSelected || inLasso
                            ? spot ? `${spot.color || "var(--primary)"}80` : "rgba(255,255,255,0.1)"
                            : spot
                              ? `linear-gradient(135deg, ${spot.color || "var(--primary)"}22, ${spot.color || "var(--primary)"}08)`
                              : "rgba(255,255,255,0.02)",
                          cursor: spot && editorMode === "select" ? "grab" : editorMode === "draw" && !spot ? "crosshair" : "pointer",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px",
                          transition: "all 0.1s",
                          position: "relative",
                          overflow: "hidden",
                          boxShadow: isSelected ? "0 0 0 3px rgba(255,255,255,0.2)" : "none",
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
                              onClick={(e) => { e.stopPropagation(); openEdit(spot); }}
                              style={{
                                position: "absolute", top: "3px", right: "3px",
                                background: "rgba(255,255,255,0.1)", border: "none",
                                borderRadius: "4px", cursor: "pointer", padding: "3px",
                                color: "#fff", display: "flex",
                              }}
                              title="Editar"
                            >
                              <Edit3 size={10} />
                            </button>
                          </>
                        ) : (
                          <Plus size={18} style={{ color: "rgba(255,255,255,0.15)", opacity: editorMode === "draw" ? 0.8 : 1 }} />
                        )}
                      </motion.div>
                    );
                  })}
                  </div>
                ))}

                {/* Resize Handle at Bottom-Right */}
                <div 
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setIsResizingMap(true);
                    resizeRef.current = {
                      startX: e.clientX,
                      startY: e.clientY,
                      startCols: configCols,
                      startRows: configRows,
                      currentCols: configCols,
                      currentRows: configRows,
                    };
                  }}
                  style={{
                    position: "absolute",
                    right: "-12px",
                    bottom: "-12px",
                    width: "24px",
                    height: "24px",
                    background: "var(--primary)",
                    borderRadius: "50%",
                    cursor: "nwse-resize",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                    zIndex: 10
                  }}
                >
                  <Maximize size={12} color="#fff" style={{ transform: "rotate(45deg)" }} />
                </div>
              </div>
            </div>
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
                    <input type="number" className="input" value={formX} min={0} max={mapCols - 1}
                      onChange={e => setFormX(Math.max(0, Math.min(mapCols - 1, Number(e.target.value))))} />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Fila (Y)</label>
                    <input type="number" className="input" value={formY} min={0} max={mapRows - 1}
                      onChange={e => setFormY(Math.max(0, Math.min(mapRows - 1, Number(e.target.value))))} />
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



      {/* Floating Bulk Actions Toolbar */}
      <AnimatePresence>
        {selectedSpotIds.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0, x: "-50%" }}
            animate={{ y: 0, opacity: 1, x: "-50%" }}
            exit={{ y: 100, opacity: 0, x: "-50%" }}
            style={{
              position: "fixed", bottom: "40px", left: "50%",
              background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.1)",
              padding: "12px 24px", borderRadius: "100px", boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
              display: "flex", alignItems: "center", gap: "24px", zIndex: 100, backdropFilter: "blur(10px)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "14px" }}>
              <div style={{ background: "var(--primary)", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: "white" }}>
                {selectedSpotIds.length}
              </div>
              Seleccionados
            </div>
            
            <div style={{ width: "1px", height: "24px", background: "rgba(255,255,255,0.1)" }} />
            
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Color:</span>
              <div style={{ display: "flex", gap: "6px" }}>
                {SPOT_COLORS.map(c => (
                  <motion.button
                    key={c}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleBulkColor(c)}
                    style={{
                      width: "20px", height: "20px", borderRadius: "50%", background: c,
                      border: "none", cursor: "pointer"
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ width: "1px", height: "24px", background: "rgba(255,255,255,0.1)" }} />

            <button
              onClick={handleBulkDelete}
              className="danger-btn"
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "20px", fontSize: "13px", border: "none", cursor: "pointer" }}
            >
              <Trash2 size={14} /> Eliminar
            </button>
            
            <button
              onClick={() => setSelectedSpotIds([])}
              style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: "4px" }}
            >
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
