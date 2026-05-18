"use client";

import { useMemo, useState } from "react";
import type {
  Booking,
  BookingStatus,
  CreateBookingDto,
  UpdateBookingDto,
} from "@/lib/api";
import {
  createAppointment,
  deleteAppointment,
  updateAppointment,
} from "@/lib/api";
import { 
  Plus, 
  List, 
  Clock, 
  CheckCircle, 
  CreditCard, 
  Trash2, 
  Edit3, 
  X,
  AlertTriangle,
  Filter,
  Calendar as CalendarIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

function StatusBadge({ status }: { status: BookingStatus }) {
  const label =
    status === "pending"
      ? "Pendiente"
      : status === "confirmed"
        ? "Confirmada"
        : "Pagada";

  return <span className={`badge badge--${status}`}>{label}</span>;
}

function formatDate(date: string) {
  try {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date));
  } catch {
    return date;
  }
}

export default function BookingsClient({
  initialBookings,
}: {
  initialBookings: Booking[];
}) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);

  const emptyForm: CreateBookingDto = {
    date: "",
    time: "",
    status: "pending",
    customerId: 1,
    businessId: 1,
    serviceName: "",
  };

  const [createForm, setCreateForm] = useState<CreateBookingDto>(emptyForm);
  const [editForm, setEditForm] = useState<CreateBookingDto>(emptyForm);

  const [statusFilter, setStatusFilter] = useState<"all" | BookingStatus>("all");
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [deletingBookingId, setDeletingBookingId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const filteredBookings = useMemo(() => {
    if (statusFilter === "all") return bookings;
    return bookings.filter((booking) => booking.status === statusFilter);
  }, [bookings, statusFilter]);

  const totalCount = bookings.length;
  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;
  const paidCount = bookings.filter((b) => b.status === "paid").length;

  function updateCreateForm<K extends keyof CreateBookingDto>(
    key: K,
    value: CreateBookingDto[K]
  ) {
    setCreateForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function updateEditForm<K extends keyof CreateBookingDto>(
    key: K,
    value: CreateBookingDto[K]
  ) {
    setEditForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function resetCreateForm() {
    setCreateForm(emptyForm);
  }

  function resetEditForm() {
    setEditForm(emptyForm);
  }

  function openCreateForm() {
    setErrorMessage("");
    setSuccessMessage("");
    setEditingBookingId(null);
    setDeleteTargetId(null);
    resetEditForm();
    setIsCreateOpen(true);
  }

  function closeCreateForm() {
    setErrorMessage("");
    resetCreateForm();
    setIsCreateOpen(false);
  }

  function openEditForm(booking: Booking) {
    setErrorMessage("");
    setSuccessMessage("");
    setIsCreateOpen(false);
    setDeleteTargetId(null);
    setEditingBookingId(booking.id);
    setEditForm({
      date: booking.date,
      time: booking.time,
      status: booking.status,
      customerId: booking.customerId,
      businessId: booking.businessId,
      serviceName: booking.serviceName,
    });
  }

  function closeEditForm() {
    setErrorMessage("");
    setEditingBookingId(null);
    resetEditForm();
  }

  function openDeleteModal(id: number) {
    setErrorMessage("");
    setSuccessMessage("");
    setDeleteTargetId(id);
  }

  function closeDeleteModal() {
    setDeleteTargetId(null);
  }

  async function handleCreateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoadingCreate(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const created = await createAppointment(createForm);
      setBookings((prev) => [created, ...prev]);
      resetCreateForm();
      setIsCreateOpen(false);
      setSuccessMessage("Reserva creada correctamente.");
    } catch {
      setErrorMessage("No se pudo crear la reserva. Revisa los datos o el backend.");
    } finally {
      setLoadingCreate(false);
    }
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!editingBookingId) return;

    setLoadingEdit(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const payload: UpdateBookingDto = {
        date: editForm.date,
        time: editForm.time,
        status: editForm.status,
        customerId: editForm.customerId,
        businessId: editForm.businessId,
        serviceName: editForm.serviceName,
      };

      const updated = await updateAppointment(editingBookingId, payload);

      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === editingBookingId ? updated : booking
        )
      );

      setEditingBookingId(null);
      resetEditForm();
      setSuccessMessage("Reserva actualizada correctamente.");
    } catch {
      setErrorMessage("No se pudo actualizar la reserva.");
    } finally {
      setLoadingEdit(false);
    }
  }

  async function confirmDelete() {
    if (deleteTargetId === null) return;

    setDeletingBookingId(deleteTargetId);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      await deleteAppointment(deleteTargetId);
      setBookings((prev) => prev.filter((booking) => booking.id !== deleteTargetId));

      if (editingBookingId === deleteTargetId) {
        closeEditForm();
      }

      setSuccessMessage("Reserva eliminada correctamente.");
      closeDeleteModal();
    } catch {
      setErrorMessage("No se pudo eliminar la reserva.");
    } finally {
      setDeletingBookingId(null);
    }
  }

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="page-stack"
    >
      <motion.section variants={item} className="page-hero">
        <div>
          <h2>Gestión de Reservas</h2>
          <p>Administra, filtra y edita todas las citas del centro.</p>
        </div>

        <button className="primary-btn" type="button" onClick={openCreateForm}>
          <Plus size={18} />
          <span>Nueva reserva</span>
        </button>
      </motion.section>

      <section className="kpi-grid">
        <motion.div variants={item} className="kpi-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <p className="kpi-card__label">Total reservas</p>
            <div className="kpi-icon-wrapper">
              <List size={20} />
            </div>
          </div>
          <h3 className="kpi-card__value">{totalCount}</h3>
          <p className="kpi-card__meta">Registros totales</p>
        </motion.div>

        <motion.div variants={item} className="kpi-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <p className="kpi-card__label">Pendientes</p>
            <div className="kpi-icon-wrapper warning">
              <Clock size={20} />
            </div>
          </div>
          <h3 className="kpi-card__value">{pendingCount}</h3>
          <p className="kpi-card__meta kpi-card__meta--warning">Requieren seguimiento</p>
        </motion.div>

        <motion.div variants={item} className="kpi-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <p className="kpi-card__label">Confirmadas</p>
            <div className="kpi-icon-wrapper positive">
              <CheckCircle size={20} />
            </div>
          </div>
          <h3 className="kpi-card__value">{confirmedCount}</h3>
          <p className="kpi-card__meta kpi-card__meta--positive">Estado activo</p>
        </motion.div>

        <motion.div variants={item} className="kpi-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <p className="kpi-card__label">Pagadas</p>
            <div className="kpi-icon-wrapper info">
              <CreditCard size={20} />
            </div>
          </div>
          <h3 className="kpi-card__value">{paidCount}</h3>
          <p className="kpi-card__meta">Reservas cerradas</p>
        </motion.div>
      </section>

      <AnimatePresence>
        {isCreateOpen && (
          <motion.section 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="section-card"
          >
            <div className="panel-title-row">
              <h3 className="panel-title">Nueva reserva</h3>
              <button type="button" className="secondary-btn" onClick={closeCreateForm}>
                <X size={16} />
                Cancelar
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="page-stack" style={{ gap: 24, marginTop: 24 }}>
              <div className="form-grid">
                <input
                  className="input"
                  type="date"
                  value={createForm.date}
                  onChange={(e) => updateCreateForm("date", e.target.value)}
                  required
                />
                <input
                  className="input"
                  type="time"
                  value={createForm.time}
                  onChange={(e) => updateCreateForm("time", e.target.value)}
                  required
                />
                <select
                  className="select"
                  value={createForm.status}
                  onChange={(e) =>
                    updateCreateForm("status", e.target.value as BookingStatus)
                  }
                >
                  <option value="pending">Pendiente</option>
                  <option value="confirmed">Confirmada</option>
                  <option value="paid">Pagada</option>
                </select>
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={createForm.customerId}
                  onChange={(e) =>
                    updateCreateForm("customerId", Number(e.target.value))
                  }
                  placeholder="Nº de cliente"
                  required
                />
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={createForm.businessId}
                  onChange={(e) =>
                    updateCreateForm("businessId", Number(e.target.value))
                  }
                  placeholder="Nº de negocio"
                  required
                />
                <input
                  className="input"
                  type="text"
                  value={createForm.serviceName}
                  onChange={(e) => updateCreateForm("serviceName", e.target.value)}
                  placeholder="Nombre del Servicio"
                  required
                />
              </div>

              {errorMessage && <div className="message-error">{errorMessage}</div>}

              <button className="primary-btn" type="submit" disabled={loadingCreate}>
                {loadingCreate ? "Guardando..." : "Crear reserva"}
              </button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingBookingId !== null && (
          <motion.section 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="section-card"
          >
            <div className="panel-title-row">
              <h3 className="panel-title">Editar reserva #{editingBookingId}</h3>
              <button type="button" className="secondary-btn" onClick={closeEditForm}>
                <X size={16} />
                Cancelar
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="page-stack" style={{ gap: 24, marginTop: 24 }}>
              <div className="form-grid">
                <input
                  className="input"
                  type="date"
                  value={editForm.date}
                  onChange={(e) => updateEditForm("date", e.target.value)}
                  required
                />
                <input
                  className="input"
                  type="time"
                  value={editForm.time}
                  onChange={(e) => updateEditForm("time", e.target.value)}
                  required
                />
                <select
                  className="select"
                  value={editForm.status}
                  onChange={(e) =>
                    updateEditForm("status", e.target.value as BookingStatus)
                  }
                >
                  <option value="pending">Pendiente</option>
                  <option value="confirmed">Confirmada</option>
                  <option value="paid">Pagada</option>
                </select>
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={editForm.customerId}
                  onChange={(e) =>
                    updateEditForm("customerId", Number(e.target.value))
                  }
                  placeholder="Nº de cliente"
                  required
                />
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={editForm.businessId}
                  onChange={(e) =>
                    updateEditForm("businessId", Number(e.target.value))
                  }
                  placeholder="Nº de negocio"
                  required
                />
                <input
                  className="input"
                  type="text"
                  value={editForm.serviceName}
                  onChange={(e) => updateEditForm("serviceName", e.target.value)}
                  placeholder="Nombre del Servicio"
                  required
                />
              </div>

              {errorMessage && <div className="message-error">{errorMessage}</div>}

              <button className="primary-btn" type="submit" disabled={loadingEdit}>
                {loadingEdit ? "Guardando..." : "Guardar cambios"}
              </button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTargetId !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget) closeDeleteModal();
            }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="modal-card"
            >
              <div className="modal-icon warning" style={{ marginBottom: 20 }}>
                <AlertTriangle size={32} color="var(--warning)" />
              </div>
              <h3 className="modal-title">Eliminar reserva</h3>
              <p className="modal-text">
                ¿Seguro que quieres eliminar la reserva <strong>#{deleteTargetId}</strong>? Esta acción no se puede deshacer.
              </p>
              <div style={{ display: "flex", gap: 12, marginTop: 32, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={closeDeleteModal}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="danger-btn"
                  onClick={confirmDelete}
                  disabled={deletingBookingId === deleteTargetId}
                >
                  <Trash2 size={16} />
                  {deletingBookingId === deleteTargetId ? "Eliminando..." : "Confirmar eliminación"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.section variants={item} className="section-card">
        <div className="panel-title-row" style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h3 className="panel-title">Listado de Reservas</h3>
            <div className="badge" style={{ background: "rgba(255,255,255,0.05)", textTransform: "none" }}>
              {filteredBookings.length} resultados
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Filter size={16} style={{ color: "var(--text-muted)" }} />
            <div className="filter-row" style={{ background: "rgba(255,255,255,0.03)", padding: "4px", borderRadius: "12px", border: "1px solid var(--border)" }}>
              {["all", "pending", "confirmed", "paid"].map((f) => (
                <button 
                  key={f}
                  type="button" 
                  className={`filter-pill ${statusFilter === f ? "active" : ""}`}
                  style={{ 
                    padding: "8px 16px", 
                    borderRadius: "10px", 
                    border: "none",
                    background: statusFilter === f ? "var(--primary)" : "transparent",
                    color: statusFilter === f ? "white" : "var(--text-muted)",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "13px",
                    transition: "all 0.3s"
                  }}
                  onClick={() => setStatusFilter(f as any)}
                >
                  {f === "all" ? "Todas" : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {successMessage && <div className="message-success" style={{ marginBottom: 20 }}>{successMessage}</div>}
        {errorMessage && <div className="message-error" style={{ marginBottom: 20 }}>{errorMessage}</div>}

        <div className="table-scroll-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha / Hora</th>
                <th>Servicio</th>
                <th>Cliente / Negocio</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <motion.tr layout key={booking.id}>
                  <td style={{ fontWeight: 700, color: "var(--primary)" }}>#{booking.id}</td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
                        <CalendarIcon size={14} style={{ opacity: 0.5 }} />
                        {formatDate(booking.date)}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-muted)" }}>
                        <Clock size={14} style={{ opacity: 0.5 }} />
                        {booking.time}
                      </div>
                    </div>
                  </td>
                  <td style={{ fontWeight: 500 }}>{booking.serviceName}</td>
                  <td>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      C: {booking.customerId} / B: {booking.businessId}
                    </span>
                  </td>
                  <td><StatusBadge status={booking.status} /></td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button type="button" className="secondary-btn" style={{ padding: "8px 12px" }} onClick={() => openEditForm(booking)}>
                        <Edit3 size={14} />
                      </button>
                      <button type="button" className="secondary-btn" style={{ padding: "8px 12px", color: "var(--accent)" }} onClick={() => openDeleteModal(booking.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.section>
    </motion.div>
  );
}