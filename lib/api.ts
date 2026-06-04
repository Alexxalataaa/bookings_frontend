export type BookingStatus = "pending" | "confirmed" | "paid" | "cancelled";

export interface UserProfile {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
}

export interface Business {
  id: number;
  name: string;
  slug: string;
  category: string;
  description?: string;
  street?: string;
  city?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  image?: string;
  logo?: string;
  hours?: string; // JSON string
  socialLinks?: string; // JSON string
  gallery?: string; // JSON string
  rating: number;
  reviewsCount: number;
  isSuspended: boolean;
  createdAt: string;
  services?: Service[];
  owner?: UserProfile;
}

export interface Service {
  id: number;
  name: string;
  description?: string;
  price: number;
  duration: number; // in minutes
}

export interface Booking {
  id: number;
  date: string;
  time: string;
  status: BookingStatus;
  customerId: number;
  businessId: number;
  serviceName: string;
  user?: UserProfile;
  business?: Business;
  service?: Service;
}

export interface CreateBookingDto {
  date: string;
  time: string;
  status: BookingStatus;
  customerId?: number;
  businessId: number;
  serviceName: string;
  serviceId?: number;
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
  business?: Business;
}

export interface CreatePaymentDto {
  clientName: string;
  businessName: string;
  amount: number;
  method: string;
  date: string;
  status?: "pending" | "paid";
  businessId?: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Standard Auth Fetch Wrapper
async function authedFetch<T>(input: string, init: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const headers = new Headers(init.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let res: Response;

  try {
    res = await fetch(input, {
      ...init,
      headers,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch';
    throw new Error(`Network error: ${message}`);
  }

  if (res.status === 401) {
    // If unauthorized, clear local session state and redirect to login
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_name');
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

// --- BUSINESSES ---
export async function getBusinesses(): Promise<Business[]> {
  return fetch(`${API_URL}/businesses`, { cache: "no-store" }).then(res => res.json());
}

export async function getBusinessesAll(): Promise<Business[]> {
  return authedFetch<Business[]>(`${API_URL}/businesses/all`, { cache: "no-store" });
}

export async function getMyBusinesses(): Promise<Business[]> {
  return authedFetch<Business[]>(`${API_URL}/businesses/my`, { cache: "no-store" });
}

export async function getBusiness(idOrSlug: string | number): Promise<Business> {
  const res = await fetch(`${API_URL}/businesses/${idOrSlug}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Negocio no encontrado");
  return res.json();
}

export async function createBusiness(data: Partial<Business>): Promise<Business> {
  return authedFetch<Business>(`${API_URL}/businesses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateBusiness(id: number, data: Partial<Business>): Promise<Business> {
  return authedFetch<Business>(`${API_URL}/businesses/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteBusiness(id: number): Promise<void> {
  await authedFetch<void>(`${API_URL}/businesses/${id}`, { method: "DELETE" });
}

// --- SERVICES ---
export async function getServices(businessId: number): Promise<Service[]> {
  const res = await fetch(`${API_URL}/services?businessId=${businessId}`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export async function createService(data: Partial<Service> & { businessId: number }): Promise<Service> {
  return authedFetch<Service>(`${API_URL}/services`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateService(id: number, data: Partial<Service>): Promise<Service> {
  return authedFetch<Service>(`${API_URL}/services/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteService(id: number): Promise<void> {
  await authedFetch<void>(`${API_URL}/services/${id}`, { method: "DELETE" });
}

// --- APPOINTMENTS (RESERVATIONS) ---
export async function getAppointments(businessId?: number): Promise<Booking[]> {
  const url = businessId ? `${API_URL}/appointments?businessId=${businessId}` : `${API_URL}/appointments`;
  return authedFetch<Booking[]>(url, { cache: "no-store" });
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

// --- CUSTOMERS ---
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

// --- PAYMENTS ---
export async function getPayments(range?: string, businessId?: number): Promise<Payment[]> {
  let url = `${API_URL}/payments`;
  const params = new URLSearchParams();
  if (range) params.set('range', range);
  if (businessId) params.set('businessId', businessId.toString());
  
  const queryStr = params.toString();
  if (queryStr) url += `?${queryStr}`;

  return authedFetch<Payment[]>(url, { cache: "no-store" });
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

// --- PROFILE / AUTH ---
export async function getProfile(): Promise<UserProfile> {
  return authedFetch<UserProfile>(`${API_URL}/auth/profile`, { cache: "no-store" });
}

export async function updateProfile(data: { username?: string; password?: string; email?: string }): Promise<UserProfile> {
  return authedFetch<UserProfile>(`${API_URL}/auth/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// --- USERS (SUPERADMIN) ---
export interface SystemUser {
  id: number;
  fullName: string;
  email: string;
  username: string;
  role: string;
  isConfirmed: boolean;
}

export async function getUsers(): Promise<SystemUser[]> {
  return authedFetch<SystemUser[]>(`${API_URL}/users`, { cache: "no-store" });
}

export async function createUser(data: any): Promise<SystemUser> {
  return authedFetch<SystemUser>(`${API_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateUser(id: number, data: any): Promise<SystemUser> {
  return authedFetch<SystemUser>(`${API_URL}/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteUser(id: number): Promise<void> {
  await authedFetch<void>(`${API_URL}/users/${id}`, { method: "DELETE" });
}

// --- LOGS & METRICS (SUPERADMIN) ---
export interface SystemLog {
  id: number;
  action: string;
  entityName?: string;
  entityId?: string;
  userId?: number;
  details?: string;
  createdAt: string;
}

export async function getSystemLogs(limit: number = 50): Promise<SystemLog[]> {
  return authedFetch<SystemLog[]>(`${API_URL}/logs?limit=${limit}`, { cache: "no-store" });
}

export async function getSystemMetrics(): Promise<any> {
  return authedFetch<any>(`${API_URL}/logs/metrics`, { cache: "no-store" });
}
