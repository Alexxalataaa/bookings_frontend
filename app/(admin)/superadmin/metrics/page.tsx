"use client";

import { useEffect, useState } from "react";
import { getSystemMetrics, getSystemLogs, SystemLog } from "@/lib/api";
import { motion } from "framer-motion";
import { Activity, Users, Building, Calendar } from "lucide-react";

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [metricsData, logsData] = await Promise.all([
        getSystemMetrics(),
        getSystemLogs(20)
      ]);
      setMetrics(metricsData);
      setLogs(logsData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !metrics) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
        <Activity size={32} style={{ margin: "0 auto 16px", opacity: 0.5 }} />
        <p>Cargando métricas globales...</p>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <h2>Métricas Globales (Superadmin)</h2>
          <p>Visión general del estado de toda la plataforma BookFlow.</p>
        </div>
      </section>

      <section className="kpi-grid">
        <motion.div className="kpi-card">
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <p className="kpi-card__label">Total Usuarios (Cuentas)</p>
              <h3 className="kpi-card__value">{metrics.totalUsers}</h3>
            </div>
            <Users size={24} style={{ color: "var(--primary)" }} />
          </div>
        </motion.div>
        <motion.div className="kpi-card">
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <p className="kpi-card__label">Total Clientes</p>
              <h3 className="kpi-card__value">{metrics.totalCustomers}</h3>
            </div>
            <Users size={24} style={{ color: "var(--primary)" }} />
          </div>
        </motion.div>
        <motion.div className="kpi-card">
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <p className="kpi-card__label">Total Negocios</p>
              <h3 className="kpi-card__value">{metrics.totalBusinesses}</h3>
            </div>
            <Building size={24} style={{ color: "var(--primary)" }} />
          </div>
        </motion.div>
        <motion.div className="kpi-card">
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <p className="kpi-card__label">Total Reservas</p>
              <h3 className="kpi-card__value">{metrics.totalAppointments}</h3>
            </div>
            <Calendar size={24} style={{ color: "var(--primary)" }} />
          </div>
        </motion.div>
      </section>

      <div className="dashboard-grid" style={{ gridTemplateColumns: "1fr" }}>
        <motion.div className="section-card">
          <div className="panel-title-row">
            <h3 className="panel-title">Últimos Registros del Sistema (Logs)</h3>
            <Activity size={16} />
          </div>
          <div className="table-scroll-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha/Hora</th>
                  <th>Acción</th>
                  <th>Entidad</th>
                  <th>ID Entidad</th>
                  <th>ID Usuario</th>
                  <th>Detalles</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan={6} style={{textAlign: "center"}}>No hay logs registrados</td></tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.id}>
                      <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{new Date(log.createdAt).toLocaleString()}</td>
                      <td><span className="badge badge--confirmed">{log.action}</span></td>
                      <td>{log.entityName || "-"}</td>
                      <td>{log.entityId || "-"}</td>
                      <td>{log.userId ? `#${log.userId}` : "-"}</td>
                      <td style={{ fontSize: "12px" }}>{log.details || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
