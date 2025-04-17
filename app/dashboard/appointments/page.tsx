'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';

interface Appointment {
  id: string;
  professional_id: string;
  client_id: string;
  motivation: string;
  appointment_date: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  updated_at: string;
  professional: {
    first_name: string;
    last_name: string;
    profession: string;
  };
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  extendedProps: {
    type: 'appointment' | 'calendar';
    status?: 'pending' | 'confirmed' | 'cancelled';
    professional?: {
      first_name: string;
      last_name: string;
      profession: string;
    };
    description?: string;
  };
}

export default function AppointmentsPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Get the current user
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        if (!session) {
          router.push('/auth/login');
          return;
        }

        // Fetch appointments using our API endpoint
        const appointmentsResponse = await fetch(`/api/appointments/customer/${session.user.id}`);
        if (!appointmentsResponse.ok) {
          throw new Error('Failed to fetch appointments');
        }
        const appointmentsData = await appointmentsResponse.json();

        // Fetch Google Calendar events using our API endpoint
        const calendarResponse = await fetch('/api/calendar/events');
        const calendarData = calendarResponse.ok ? await calendarResponse.json() : [];

        // Transform appointments into calendar events
        const appointmentEvents = appointmentsData.map((appointment: Appointment) => ({
          id: appointment.id,
          title: `${appointment.professional.first_name} ${appointment.professional.last_name} - ${appointment.motivation}`,
          start: appointment.appointment_date,
          end: new Date(new Date(appointment.appointment_date).getTime() + 30 * 60000).toISOString(), // 30 minutes duration
          extendedProps: {
            type: 'appointment',
            status: appointment.status,
            professional: appointment.professional,
            description: appointment.motivation
          }
        }));

        // Transform Google Calendar events
        const googleEvents = calendarData.map((event: any) => ({
          id: event.id,
          title: event.summary,
          start: event.start.dateTime,
          end: event.end.dateTime,
          extendedProps: {
            type: 'calendar',
            description: event.description
          }
        }));

        setEvents([...appointmentEvents, ...googleEvents]);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Une erreur est survenue lors du chargement des rendez-vous');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router, supabase]);

  const eventContent = (eventInfo: any) => {
    const event = eventInfo.event;
    const props = event.extendedProps;
    
    return (
      <div className="p-1">
        <div className="font-medium text-sm">{event.title}</div>
        {props.type === 'appointment' && (
          <div className="text-xs">
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
              props.status === 'confirmed' ? 'bg-green-100 text-green-800' :
              props.status === 'cancelled' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {props.status === 'confirmed' ? 'Confirmé' :
               props.status === 'cancelled' ? 'Annulé' : 'En attente'}
            </span>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement des rendez-vous...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="text-center">
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Mon agenda</h1>
          
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              events={events}
              eventContent={eventContent}
              locale={frLocale}
              slotMinTime="08:00:00"
              slotMaxTime="20:00:00"
              allDaySlot={false}
              height="auto"
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }}
              slotLabelFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }}
              eventClick={(info) => {
                // Handle event click
                console.log('Event clicked:', info.event);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 