"use client";

import { useMemo, useState } from "react";
import type {
  Booking,
  BookingStatus,
  CreateBookingDto,
  UpdateBookingDto,
  Customer,
  Business,
} from "@/lib/api";
import {
  createAppointment,
  deleteAppointment,
  updateAppointment,
  getAppointments,
  getCustomers,
  getMyBusinesses,
  getBusinesses,
} from "@/lib/api";
import { useEffect } from "react";
import { 
  Plus, 
  List, 
  Clock, 
  CheckCircle, 
  CreditCard, 
  Trash2, 
  Edit3, Search, 
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

function CalendarView({
  bookings,
  customersMap,
  onEdit,
  onDelete,
}: {
  bookings: Booking[];
  customersMap: Record<number, Customer>;
  onEdit: (b: Booking) => void;
  onDelete: (id: number) => void;
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const dayNames = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const bookingsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    bookings.forEach((b) => {
      if (!map[b.date]) map[b.date] = [];
      map[b.date].push(b);
    });
    return map;
  }, [bookings]);

  const selectedBookings = selectedDay ? (bookingsByDate[selectedDay] || []) : [];
  const todayStr = new Date().toISOString().split("T")[0];

  const statusColor: Record<string, string> = {
    pending: "#f59e0b",
    confirmed: "#6366f1",
    paid: "#22c55e",
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
      {/* Grid del calendario */}
      <div style={{ flex: "1 1 480px", minWidth: 0 }}>
        {/* Navegación de mes */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <button
            type="button"
            className="secondary-btn"
            style={{ padding: "8px 18px", fontSize: 20, lineHeight: 1 }}
            onClick={() => { setCurrentDate(new Date(year, month - 1, 1)); setSelectedDay(null); }}
          >
            ‹
          </button>
          <h4 style={{ fontWeight: 700, fontSize: 18, margin: 0 }}>
            {monthNames[month]} {year}
          </h4>
          <button
            type="button"
            className="secondary-btn"
            style={{ padding: "8px 18px", fontSize: 20, lineHeight: 1 }}
            onClick={() => { setCurrentDate(new Date(year, month + 1, 1)); setSelectedDay(null); }}
          >
            ›
          </button>
        </div>

        {/* Cabecera días */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
          {dayNames.map((d) => (
            <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", padding: "4px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {d}
            </div>
          ))}
        </div>

        {/* Celdas */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {cells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} style={{ minHeight: 70 }} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayBookings = bookingsByDate[dateStr] || [];
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDay;
            return (
              <motion.div
                key={dateStr}
                whileHover={{ scale: 1.04 }}
                onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                style={{
                  minHeight: 70,
                  borderRadius: 10,
                  padding: "8px 6px",
                  cursor: "pointer",
                  background: isSelected
                    ? "rgba(99,102,241,0.22)"
                    : isToday
                    ? "rgba(99,102,241,0.09)"
                    : "rgba(255,255,255,0.03)",
                  border: isSelected
                    ? "1.5px solid var(--primary)"
                    : isToday
                    ? "1.5px solid rgba(99,102,241,0.4)"
                    : "1.5px solid var(--border)",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: isToday ? 700 : 500, color: isToday ? "var(--primary)" : "var(--text)", marginBottom: 4 }}>
                  {day}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                  {dayBookings.slice(0, 3).map((b) => (
                    <div
                      key={b.id}
                      title={`${b.time} – ${b.serviceName}`}
                      style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor[b.status] || "#6366f1", flexShrink: 0 }}
                    />
                  ))}
                  {dayBookings.length > 3 && (
                    <span style={{ fontSize: 9, color: "var(--text-muted)", lineHeight: "8px" }}>+{dayBookings.length - 3}</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Leyenda */}
        <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
          {[
            { color: "#f59e0b", label: "Pendiente" },
            { color: "#6366f1", label: "Confirmada" },
            { color: "#22c55e", label: "Pagada" },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Panel del día seleccionado */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            style={{
              flex: "0 0 280px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: 20,
              alignSelf: "flex-start",
            }}
          >
            <h4 style={{ fontWeight: 700, fontSize: 15, margin: "0 0 16px" }}>
              {new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long" }).format(
                new Date(selectedDay + "T12:00:00")
              )}
            </h4>
            {selectedBookings.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No hay reservas este día.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {selectedBookings.map((b) => (
                  <div
                    key={b.id}
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid var(--border)",
                      borderLeft: `3px solid ${statusColor[b.status] || "#6366f1"}`,
                      borderRadius: 10,
                      padding: "10px 12px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: "var(--primary)" }}>#{b.id}</span>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{b.time}</span>
                    </div>
                    <p style={{ fontWeight: 600, fontSize: 13, margin: "2px 0" }}>{b.serviceName}</p>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0" }}>
                      {customersMap[b.customerId]?.name || ""}
                    </p>
                    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                      <button
                        type="button"
                        className="secondary-btn"
                        style={{ padding: "4px 10px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}
                        onClick={() => onEdit(b)}
                      >
                        <Edit3 size={12} /> Editar
                      </button>
                      <button
                        type="button"
                        className="secondary-btn"
                        style={{ padding: "4px 10px", fontSize: 12, color: "var(--accent)" }}
                        onClick={() => onDelete(b.id)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function BookingsClient() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [businessSearchText, setBusinessSearchText] = useState("");
  const [showBusinessDropdown, setShowBusinessDropdown] = useState(false);
  const [businessEditSearchText, setBusinessEditSearchText] = useState("");
  const [showBusinessEditDropdown, setShowBusinessEditDropdown] = useState(false);

  useEffect(() => {
    setUserRole(localStorage.getItem("user_role"));
    Promise.all([getAppointments(), getCustomers(), getBusinesses()])
      .then(([appointments, customersData, businessesData]) => {
        setBookings(appointments);
        setCustomers(customersData);
        setAllBusinesses(businessesData);
      })
      .catch((err) => console.error("Error fetching data:", err))
      .finally(() => setInitialLoading(false));
  }, []);

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
  const [search, setSearch] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const customersMap = useMemo(() => {
    const map: Record<number, Customer> = {};
    customers.forEach((c) => {
      map[c.id] = c;
    });
    return map;
  }, [customers]);

  // Derive selected customer for create and edit forms
  const selectedCustomer = useMemo(() => customers.find(c => c.id === createForm.customerId), [customers, createForm.customerId]);
  const selectedEditCustomer = useMemo(() => customers.find(c => c.id === editForm.customerId), [customers, editForm.customerId]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const filteredBookings = useMemo(() => {
    let result = bookings;
    if (statusFilter !== "all") {
      result = result.filter((booking) => booking.status === statusFilter);
    }
    if (search.trim() !== "") {
      const lower = search.toLowerCase();
      result = result.filter((booking) => {
        const cust = customersMap[booking.customerId];
        const business = cust?.business || "";
        return (
          booking.serviceName.toLowerCase().includes(lower) ||
          cust?.name?.toLowerCase().includes(lower) ||
          business.toLowerCase().includes(lower)
        );
      });
    }
    return result;
  }, [bookings, statusFilter, search, customersMap]);

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
    
    // Auto-populate the autocomplete search text for the business
    const biz = allBusinesses.find(b => b.id === booking.businessId);
    setBusinessEditSearchText(biz ? biz.name : "");
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

    // Validate client and business selection
    if (!createForm.customerId) {
      setErrorMessage('Seleccione un cliente antes de crear la reserva.');
      setLoadingCreate(false);
      return;
    }
    if (!createForm.businessId) {
      setErrorMessage('No se pudo obtener el negocio del cliente seleccionado.');
      setLoadingCreate(false);
      return;
    }
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

  if (initialLoading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
        <p>Cargando reservas...</p>
      </div>
    );
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
                {userRole !== "client" && (
                  <select
                    className="select"
                    style={{ background: "#0f1116", color: "var(--text)" }}
                    value={createForm.status}
                    onChange={(e) =>
                      updateCreateForm("status", e.target.value as BookingStatus)
                    }
                  >
                    <option style={{ background: "#0f1116", color: "var(--text)" }} value="pending">Pendiente</option>
                    <option style={{ background: "#0f1116", color: "var(--text)" }} value="confirmed">Confirmada</option>
                    <option style={{ background: "#0f1116", color: "var(--text)" }} value="paid">Pagada</option>
                  </select>
                )}
                
                {userRole !== "client" && (
                  <select
                    className="select"
                    style={{ background: "#0f1116", color: "var(--text)" }}
                    value={createForm.customerId}
                    onChange={(e) => updateCreateForm("customerId", Number(e.target.value))}
                    required
                  >
                    <option style={{ background: "#0f1116", color: "var(--text)" }} value="" disabled>Selecciona cliente</option>
                    {customers.map((c) => (
                      <option style={{ background: "#0f1116", color: "var(--text)" }} key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
                
                <div style={{ position: "relative" }}>
                  <input
                    className="input"
                    type="text"
                    placeholder="Buscar negocio..."
                    value={businessSearchText}
                    onChange={(e) => {
                      setBusinessSearchText(e.target.value);
                      setShowBusinessDropdown(true);
                      if (createForm.businessId) updateCreateForm("businessId", 0);
                    }}
                    onFocus={() => setShowBusinessDropdown(true)}
                    onBlur={() => setTimeout(() => setShowBusinessDropdown(false), 200)}
                    required
                  />
                  {showBusinessDropdown && businessSearchText && (
                    <ul style={{
                      position: "absolute", top: "100%", left: 0, right: 0,
                      background: "rgba(15,17,22,0.95)", backdropFilter: "blur(10px)",
                      border: "1px solid var(--border)", borderRadius: "8px",
                      marginTop: "4px", zIndex: 50, listStyle: "none", padding: "4px",
                      maxHeight: "200px", overflowY: "auto"
                    }}>
                      {allBusinesses.filter(b => b.name.toLowerCase().includes(businessSearchText.toLowerCase())).map(b => (
                        <li 
                          key={b.id} 
                          style={{ padding: "8px 12px", cursor: "pointer", borderRadius: "4px", fontSize: "14px" }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            updateCreateForm("businessId", b.id);
                            setBusinessSearchText(b.name);
                            setShowBusinessDropdown(false);
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "var(--primary-gradient)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        >
                          {b.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <select
                  className="select"
                  style={{ background: "#0f1116", color: "var(--text)" }}
                  value={createForm.serviceName}
                  onChange={(e) => updateCreateForm("serviceName", e.target.value)}
                  required
                >
                  <option style={{ background: "#0f1116", color: "var(--text)" }} value="" disabled>Selecciona un servicio</option>
                  {allBusinesses.find(b => b.id === createForm.businessId)?.services?.map(s => (
                    <option style={{ background: "#0f1116", color: "var(--text)" }} key={s.id} value={s.name}>
                      {s.name} ({s.price}€)
                    </option>
                  ))}
                </select>
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
                {userRole !== "client" && (
                  <select
                    className="select"
                    style={{ background: "#0f1116", color: "var(--text)" }}
                    value={editForm.status}
                    onChange={(e) =>
                      updateEditForm("status", e.target.value as BookingStatus)
                    }
                  >
                    <option style={{ background: "#0f1116", color: "var(--text)" }} value="pending">Pendiente</option>
                    <option style={{ background: "#0f1116", color: "var(--text)" }} value="confirmed">Confirmada</option>
                    <option style={{ background: "#0f1116", color: "var(--text)" }} value="paid">Pagada</option>
                  </select>
                )}

                {userRole !== "client" && (
                  <select
                    className="select"
                    style={{ background: "#0f1116", color: "var(--text)" }}
                    value={editForm.customerId}
                    onChange={(e) => updateEditForm("customerId", Number(e.target.value))}
                    required
                  >
                    <option style={{ background: "#0f1116", color: "var(--text)" }} value="" disabled>Selecciona cliente</option>
                    {customers.map((c) => (
                      <option style={{ background: "#0f1116", color: "var(--text)" }} key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}

                <div style={{ position: "relative" }}>
                  <input
                    className="input"
                    type="text"
                    placeholder="Buscar negocio..."
                    value={businessEditSearchText}
                    onChange={(e) => {
                      setBusinessEditSearchText(e.target.value);
                      setShowBusinessEditDropdown(true);
                      if (editForm.businessId) updateEditForm("businessId", 0);
                    }}
                    onFocus={() => setShowBusinessEditDropdown(true)}
                    onBlur={() => setTimeout(() => setShowBusinessEditDropdown(false), 200)}
                    required
                  />
                  {showBusinessEditDropdown && businessEditSearchText && (
                    <ul style={{
                      position: "absolute", top: "100%", left: 0, right: 0,
                      background: "rgba(15,17,22,0.95)", backdropFilter: "blur(10px)",
                      border: "1px solid var(--border)", borderRadius: "8px",
                      marginTop: "4px", zIndex: 50, listStyle: "none", padding: "4px",
                      maxHeight: "200px", overflowY: "auto"
                    }}>
                      {allBusinesses.filter(b => b.name.toLowerCase().includes(businessEditSearchText.toLowerCase())).map(b => (
                        <li 
                          key={b.id} 
                          style={{ padding: "8px 12px", cursor: "pointer", borderRadius: "4px", fontSize: "14px" }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            updateEditForm("businessId", b.id);
                            setBusinessEditSearchText(b.name);
                            setShowBusinessEditDropdown(false);
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "var(--primary-gradient)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        >
                          {b.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <select
                  className="select"
                  style={{ background: "#0f1116", color: "var(--text)" }}
                  value={editForm.serviceName}
                  onChange={(e) => updateEditForm("serviceName", e.target.value)}
                  required
                >
                  <option style={{ background: "#0f1116", color: "var(--text)" }} value="" disabled>Selecciona un servicio</option>
                  {allBusinesses.find(b => b.id === editForm.businessId)?.services?.map(s => (
                    <option style={{ background: "#0f1116", color: "var(--text)" }} key={s.id} value={s.name}>
                      {s.name} ({s.price}€)
                    </option>
                  ))}
                </select>
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
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {/* Toggle Lista / Calendario */}
            <div style={{ display: "flex", background: "rgba(255,255,255,0.03)", padding: "4px", borderRadius: "12px", border: "1px solid var(--border)" }}>
              <button
                type="button"
                style={{ padding: "8px 14px", borderRadius: "10px", border: "none", background: viewMode === "list" ? "var(--primary)" : "transparent", color: viewMode === "list" ? "white" : "var(--text-muted)", cursor: "pointer", fontWeight: 600, fontSize: "13px", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}
                onClick={() => setViewMode("list")}
              >
                <List size={14} /> Lista
              </button>
              <button
                type="button"
                style={{ padding: "8px 14px", borderRadius: "10px", border: "none", background: viewMode === "calendar" ? "var(--primary)" : "transparent", color: viewMode === "calendar" ? "white" : "var(--text-muted)", cursor: "pointer", fontWeight: 600, fontSize: "13px", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}
                onClick={() => setViewMode("calendar")}
              >
                <CalendarIcon size={14} /> Calendario
              </button>
            </div>
            <Search size={16} style={{ color: "var(--text-muted)" }} />
            <input
              className="input"
              placeholder="Buscar reservas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ marginLeft: 8, flex: 1, maxWidth: "200px" }}
            />
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

        {viewMode === "list" ? (
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
                       {customersMap[booking.customerId]?.name || ''} / {customersMap[booking.customerId]?.business || ''}
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
        ) : (
          <CalendarView
            bookings={filteredBookings}
            customersMap={customersMap}
            onEdit={openEditForm}
            onDelete={openDeleteModal}
          />
        )}
      </motion.section>
    </motion.div>
  );
}