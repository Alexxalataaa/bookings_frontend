export type AppointmentStatus = "pending" | "confirmed" | "paid" | "cancelled";

export type Appointment = {
  id: number;
  date: string;
  time: string;
  status: AppointmentStatus;
  customerId: number;
  clientId?: number;
  businessId: number;
  businessName?: string;
  serviceId?: number;
  serviceName: string;
  price?: number;
  spotId?: number;
};

export type Booking = Appointment;

export type PaymentStatus = "pending" | "paid";

export type Payment = {
  id: number;
  clientName: string;
  businessName: string;
  amount: number;
  method: string;
  date: string;
  status: PaymentStatus;
  createdAt?: string;
  businessId?: number;
};