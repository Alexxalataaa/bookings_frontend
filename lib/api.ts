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
async function authedFetch<T>(input: string, init: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const headers = new Headers(init.headers);

  // Importante: cuando se renderiza en el servidor (Server Components),
  // no hay localStorage y no podemos mandar el token.
  // En ese caso dejamos la petición sin auth y el cliente la volverá a pedir.
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(input, {
    ...init,
    headers,
  });

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    throw new Error('Unauthorized (401)');
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'Request failed');
  }
  return (await res.json()) as T;
}


export async function getAppointments(): Promise<Booking[]> {
  return authedFetch<Booking[]>(`${API_URL}/appointments`, { cache: "no-store" });
}

export async function createAppointment(data: CreateBookingDto): Promise<Booking> {
  return authedFetch<Booking>(`${API_URL}/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateAppointment(id: number, data: UpdateBookingDto): Promise<Booking> {
  return authedFetch<Booking>(`${API_URL}/appointments/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteAppointment(id: number): Promise<{ message: string }> {
  return authedFetch<{ message: string }>(`${API_URL}/appointments/${id}`, { method: "DELETE" });
}

// Customers
export async function getCustomers(): Promise<Customer[]> {
  return authedFetch<Customer[]>(`${API_URL}/customers`, { cache: "no-store" });
}

export async function createCustomer(data: CreateCustomerDto): Promise<Customer> {
  return authedFetch<Customer>(`${API_URL}/customers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateCustomer(id: number, data: Partial<CreateCustomerDto>): Promise<Customer> {
  return authedFetch<Customer>(`${API_URL}/customers/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteCustomer(id: number): Promise<void> {
  await authedFetch<void>(`${API_URL}/customers/${id}`, { method: "DELETE" });
}

// Payments
export async function getPayments(): Promise<Payment[]> {
  return authedFetch<Payment[]>(`${API_URL}/payments`, { cache: "no-store" });
}

export async function createPayment(data: CreatePaymentDto): Promise<Payment> {
  return authedFetch<Payment>(`${API_URL}/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updatePayment(id: number, data: Partial<CreatePaymentDto>): Promise<Payment> {
  return authedFetch<Payment>(`${API_URL}/payments/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deletePayment(id: number): Promise<void> {
  await authedFetch<void>(`${API_URL}/payments/${id}`, { method: "DELETE" });
}
