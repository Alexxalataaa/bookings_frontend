export type BookingStatus = "pending" | "confirmed" | "paid";

export interface Booking {
  id: number;
  date: string;
  time: string;
  status: BookingStatus;
  customerId: number;
  businessId: number;
  serviceName: string;
}

export interface CreateBookingDto {
  date: string;
  time: string;
  status: BookingStatus;
  customerId: number;
  businessId: number;
  serviceName: string;
}

export interface UpdateBookingDto {
  date?: string;
  time?: string;
  status?: BookingStatus;
  customerId?: number;
  businessId?: number;
  serviceName?: string;
}

export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  business?: string;
  createdAt: string;
}

export interface CreateCustomerDto {
  name: string;
  email?: string;
  phone?: string;
  business?: string;
}

export interface Payment {
  id: number;
  clientName: string;
  businessName: string;
  amount: number;
  method: string;
  date: string;
  status: "pending" | "paid";
  createdAt: string;
}

export interface CreatePaymentDto {
  clientName: string;
  businessName: string;
  amount: number;
  method: string;
  date: string;
  status?: "pending" | "paid";
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Appointments
export async function getAppointments(): Promise<Booking[]> {
  const res = await fetch(`${API_URL}/appointments`, { cache: "no-store" });
  if (!res.ok) throw new Error("Error al obtener las reservas");
  return res.json();
}

export async function createAppointment(data: CreateBookingDto): Promise<Booking> {
  const res = await fetch(`${API_URL}/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear la reserva");
  return res.json();
}

export async function updateAppointment(id: number, data: UpdateBookingDto): Promise<Booking> {
  const res = await fetch(`${API_URL}/appointments/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al editar la reserva");
  return res.json();
}

export async function deleteAppointment(id: number): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/appointments/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar la reserva");
  return res.json();
}

// Customers
export async function getCustomers(): Promise<Customer[]> {
  const res = await fetch(`${API_URL}/customers`, { cache: "no-store" });
  if (!res.ok) throw new Error("Error al obtener los clientes");
  return res.json();
}

export async function createCustomer(data: CreateCustomerDto): Promise<Customer> {
  const res = await fetch(`${API_URL}/customers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear el cliente");
  return res.json();
}

export async function updateCustomer(id: number, data: Partial<CreateCustomerDto>): Promise<Customer> {
  const res = await fetch(`${API_URL}/customers/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al editar el cliente");
  return res.json();
}

export async function deleteCustomer(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/customers/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar el cliente");
}

// Payments
export async function getPayments(): Promise<Payment[]> {
  const res = await fetch(`${API_URL}/payments`, { cache: "no-store" });
  if (!res.ok) throw new Error("Error al obtener los pagos");
  return res.json();
}

export async function createPayment(data: CreatePaymentDto): Promise<Payment> {
  const res = await fetch(`${API_URL}/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al registrar el pago");
  return res.json();
}

export async function updatePayment(id: number, data: Partial<CreatePaymentDto>): Promise<Payment> {
  const res = await fetch(`${API_URL}/payments/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al actualizar el pago");
  return res.json();
}

export async function deletePayment(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/payments/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar el pago");
}