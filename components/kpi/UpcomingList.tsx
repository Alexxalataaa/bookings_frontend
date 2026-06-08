import React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Booking } from '@/lib/types';

interface UpcomingListProps {
  bookings: Booking[];
}

export default function UpcomingList({ bookings }: UpcomingListProps) {
  // Filter future bookings and sort
  const upcoming = bookings
    .filter((b) => new Date(b.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  if (upcoming.length === 0) {
    return <p style={{ color: '#94a3b8' }}>No tienes citas próximas.</p>;
  }

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <h3 style={{ color: '#f8fafc', marginBottom: '0.5rem' }}>Próximas citas</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {upcoming.map((b) => (
          <li
            key={b.id}
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <CalendarIcon size={18} style={{ color: '#6366f1' }} />
            <div>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>{b.serviceName}</p>
              <p style={{ margin: 0, color: '#f8fafc' }}>{format(new Date(b.date), 'PPP p')}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
