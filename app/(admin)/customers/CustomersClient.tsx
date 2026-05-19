"use client";

import { useState, useMemo } from "react";
import { Customer, CreateCustomerDto, createCustomer, updateCustomer, deleteCustomer, getCustomers } from "@/lib/api";
import { useEffect } from "react";
import { 
  UserPlus, 
  Search, 
  Phone, 
  Mail, 
  Building, 
  Trash2, 
  Edit3, 
  X, 
  Filter,
  Users,
  ExternalLink
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
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  show: { opacity: 1, scale: 1, y: 0 }
};

function CustomerCard({
  customer,
  onEdit,
  onDelete,
}: {
  customer: Customer;
  onEdit: (customer: Customer) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <motion.div variants={item} className="customer-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <div className="admin-avatar" style={{ borderRadius: "100%", width: "48px", height: "48px", fontSize: "18px" }}>
            {customer.name.charAt(0)}
          </div>
          <div>
            <p className="customer-name" style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>{customer.name}</p>
            <div className="customer-tag" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--primary)", marginTop: "4px", fontWeight: 600 }}>
              <Building size={12} />
              {customer.business || "Sin comercio"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
           <button onClick={() => onEdit(customer)} className="secondary-btn" style={{ padding: "10px" }}>
             <Edit3 size={14} />
           </button>
           <button onClick={() => onDelete(customer.id)} className="secondary-btn" style={{ padding: "10px", color: "var(--accent)" }}>
             <Trash2 size={14} />
           </button>
        </div>
      </div>
      
      <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "var(--text-muted)" }}>
          <Phone size={14} />
          {customer.phone || "Sin teléfono"}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "var(--text-muted)" }}>
          <Mail size={14} />
          {customer.email || "Sin email"}
        </div>
      </div>
      
      <div style={{ 
        marginTop: "24px", 
        paddingTop: "16px", 
        borderTop: "1px solid var(--border)", 
        fontSize: "12px", 
        color: "var(--text-muted)",
        display: "flex",
        justifyContent: "space-between"
      }}>
        <span>ID: #{customer.id}</span>
        <span>Registrado: {new Date(customer.createdAt).toLocaleDateString('es-ES')}</span>
      </div>
    </motion.div>
  );
}


export default function CustomersClient() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    getCustomers()
      .then(setCustomers)
      .catch((err) => console.error("Error fetching customers:", err))
      .finally(() => setInitialLoading(false));
  }, []);
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CreateCustomerDto>({
    name: "",
    email: "",
    phone: "",
    business: "",
  });
  const [loading, setLoading] = useState(false);
  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; type: 'error' | 'confirm'; message: string; onConfirm?: () => void } | null>(null);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.business && c.business.toLowerCase().includes(search.toLowerCase()))
    );
  }, [customers, search]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (formData.phone) {
      const phoneStr = formData.phone.trim();
      if (!/^\+\d{2} \d{3} \d{3} \d{3}$/.test(phoneStr)) {
        const digits = phoneStr.replace(/\D/g, "");
        if (digits.length !== 11) {
          setModalConfig({ isOpen: true, type: 'error', message: 'El numero tiene que tener 9 digitos' });
        } else {
          setModalConfig({ isOpen: true, type: 'error', message: 'El formato del numero esta mal' });
        }
        return;
      }
    }

    const isDuplicate = customers.some(c => {
      if (editingCustomer && c.id === editingCustomer.id) return false;
      return (
        c.name.toLowerCase() === formData.name.toLowerCase() ||
        (c.email && formData.email && c.email.toLowerCase() === formData.email.toLowerCase()) ||
        (c.phone && formData.phone && c.phone === formData.phone)
      );
    });

    if (isDuplicate) {
      const duplicatePhone = customers.some(c => {
        if (editingCustomer && c.id === editingCustomer.id) return false;
        return c.phone && formData.phone && c.phone === formData.phone;
      });
      if (duplicatePhone) {
        setModalConfig({ isOpen: true, type: 'error', message: 'Este numero ya existe' });
      } else {
        setModalConfig({ isOpen: true, type: 'error', message: 'Este cliente ya existe' });
      }
      return;
    }

    setLoading(true);
    try {
      if (editingCustomer) {
        const updated = await updateCustomer(editingCustomer.id, formData);
        setCustomers(customers.map((c) => (c.id === editingCustomer.id ? updated : c)));
      } else {
        const created = await createCustomer(formData);
        setCustomers([created, ...customers]);
      }
      setIsFormOpen(false);
      setEditingCustomer(null);
      setFormData({ name: "", email: "", phone: "", business: "" });
    } catch (error) {
      console.error("Error saving customer", error);
    } finally {
      setLoading(false);
    }
  }

  function handleDelete(id: number) {
    setModalConfig({
      isOpen: true,
      type: 'confirm',
      message: '¿Seguro que quieres eliminar este cliente?',
      onConfirm: async () => {
        try {
          await deleteCustomer(id);
          setCustomers((prev) => prev.filter((c) => c.id !== id));
        } catch (error) {
          console.error("Error deleting customer", error);
        }
      }
    });
  }

  function openEdit(customer: Customer) {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone || "",
      business: customer.business || "",
    });
    setIsFormOpen(true);
  }

  if (initialLoading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
        <p>Cargando clientes...</p>
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
          <h2>Directorio de Clientes</h2>
          <p>Base de datos centralizada de todos tus contactos.</p>
        </div>

        <button 
          className="primary-btn" 
          type="button" 
          onClick={() => {
            setEditingCustomer(null);
            setFormData({ name: "", email: "", phone: "", business: "" });
            setIsFormOpen(true);
          }}
        >
          <UserPlus size={18} />
          <span>Nuevo cliente</span>
        </button>
      </motion.section>

      <AnimatePresence mode="wait">
        {isFormOpen && (
          <motion.section 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="section-card"
          >
            <div className="panel-title-row">
              <h3 className="panel-title">{editingCustomer ? "Editar Cliente" : "Nuevo Cliente"}</h3>
              <button type="button" className="secondary-btn" onClick={() => setIsFormOpen(false)}>
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="page-stack" style={{ marginTop: 24, gap: 24 }}>
              <div className="form-grid">
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-muted)" }}>Nombre Completo</label>
                  <input
                    className="input"
                    placeholder="Ej. Juan Pérez"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-muted)" }}>Teléfono</label>
                  <input
                    className="input"
                    type="tel"
                    placeholder="+34 600 000 000"
                    value={formData.phone}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (val === "+" || val === "") {
                        setFormData({ ...formData, phone: val });
                        return;
                      }
                      const digits = val.replace(/\D/g, "");
                      let formatted = "";
                      if (digits.length > 0) formatted = "+" + digits.substring(0, 2);
                      if (digits.length > 2) formatted += " " + digits.substring(2, 5);
                      if (digits.length > 5) formatted += " " + digits.substring(5, 8);
                      if (digits.length > 8) formatted += " " + digits.substring(8, 11);
                      setFormData({ ...formData, phone: formatted });
                    }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-muted)" }}>Email</label>
                  <input
                    className="input"
                    type="email"
                    placeholder="juan@ejemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-muted)" }}>Comercio / Empresa</label>
                  <input
                    className="input"
                    placeholder="Nombre del negocio"
                    value={formData.business}
                    onChange={(e) => setFormData({ ...formData, business: e.target.value })}
                  />
                </div>
              </div>
              
              <div style={{ display: "flex", gap: 12 }}>
                <button className="primary-btn" type="submit" disabled={loading}>
                  {loading ? "Guardando..." : (editingCustomer ? "Actualizar Cliente" : "Crear Cliente")}
                </button>
                <button 
                  className="secondary-btn" 
                  type="button" 
                  onClick={() => setIsFormOpen(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      <motion.section variants={item} className="section-card">
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input 
              className="input" 
              style={{ paddingLeft: "48px" }}
              placeholder="Buscar por nombre o empresa..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="secondary-btn" type="button">
            <Filter size={16} />
            <span>Filtros avanzados</span>
          </button>
        </div>
      </motion.section>

      <motion.section 
        variants={container}
        initial="hidden"
        animate="show"
        className="customer-grid"
      >
        <AnimatePresence>
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((customer) => (
              <CustomerCard 
                key={customer.id} 
                customer={customer} 
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ gridColumn: "1/-1", textAlign: "center", padding: "80px 0", color: "var(--text-muted)" }}
            >
              <Users size={48} style={{ opacity: 0.1, marginBottom: "16px" }} />
              <p style={{ fontSize: "18px" }}>No se encontraron clientes que coincidan con tu búsqueda.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      <AnimatePresence>
        {modalConfig?.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            style={{ zIndex: 999999 }}
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="modal-card" 
              style={{ maxWidth: "400px", textAlign: "center", padding: "32px" }}
            >
              <h3 style={{ marginTop: 0, marginBottom: "16px", fontSize: "20px" }}>
                {modalConfig.type === 'error' ? 'Error' : 'Confirmar acción'}
              </h3>
              <p style={{ color: "var(--text-muted)", marginBottom: "24px", fontSize: "15px" }}>{modalConfig.message}</p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                {modalConfig.type === 'confirm' && (
                  <button 
                    className="secondary-btn" 
                    onClick={() => setModalConfig(null)}
                  >
                    Cancelar
                  </button>
                )}
                <button 
                  className={modalConfig.type === 'error' ? 'primary-btn' : 'danger-btn'} 
                  onClick={() => {
                    if (modalConfig.onConfirm) modalConfig.onConfirm();
                    setModalConfig(null);
                  }}
                >
                  {modalConfig.type === 'error' ? 'Entendido' : 'Eliminar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

