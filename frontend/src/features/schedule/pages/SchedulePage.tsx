import { useState, useRef, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import type { DateSelectArg, EventClickArg, EventDropArg, EventResizeDoneArg, EventInput } from '@fullcalendar/core';
import toast from 'react-hot-toast';
import { AppointmentModal } from '../components/AppointmentModal';
import { useAppointments, useCreateAppointment, useUpdateAppointment, useDeleteAppointment } from '../hooks/useAppointments';
import type { Appointment } from '../../../api/appointments';

const STATUS_COLORS: Record<string, string> = {
  scheduled: '#4263eb',
  in_progress: '#f59f00',
  completed: '#2fb344',
  cancelled: '#868e96',
};

export const SchedulePage = () => {
  const calendarRef = useRef<FullCalendar>(null);
  const [rangeStart, setRangeStart] = useState<string | undefined>();
  const [rangeEnd, setRangeEnd] = useState<string | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [defaultStart, setDefaultStart] = useState<string | undefined>();
  const [defaultEnd, setDefaultEnd] = useState<string | undefined>();

  const { data: appointments = [], isLoading } = useAppointments(rangeStart, rangeEnd);
  const createMutation = useCreateAppointment();
  const updateMutation = useUpdateAppointment();
  const deleteMutation = useDeleteAppointment();

  const events: EventInput[] = appointments.map(a => ({
    id: a.id,
    title: a.title,
    start: a.startTime,
    end: a.endTime,
    backgroundColor: STATUS_COLORS[a.status] ?? '#4263eb',
    borderColor: STATUS_COLORS[a.status] ?? '#4263eb',
    extendedProps: { appointment: a },
  }));

  const handleDatesSet = useCallback((info: { startStr: string; endStr: string }) => {
    setRangeStart(info.startStr);
    setRangeEnd(info.endStr);
  }, []);

  const handleDateSelect = useCallback((info: DateSelectArg) => {
    setSelectedAppointment(null);
    setDefaultStart(info.startStr);
    setDefaultEnd(info.endStr);
    setModalOpen(true);
  }, []);

  const handleEventClick = useCallback((info: EventClickArg) => {
    const appt = info.event.extendedProps.appointment as Appointment;
    setSelectedAppointment(appt);
    setDefaultStart(undefined);
    setDefaultEnd(undefined);
    setModalOpen(true);
  }, []);

  const handleEventDrop = useCallback(async (info: EventDropArg) => {
    const appt = info.event.extendedProps.appointment as Appointment;
    try {
      await updateMutation.mutateAsync({
        id: appt.id,
        payload: {
          startTime: info.event.startStr,
          endTime: info.event.endStr ?? info.event.startStr,
        },
      });
    } catch {
      info.revert();
      toast.error('Failed to reschedule appointment');
    }
  }, [updateMutation]);

  const handleEventResize = useCallback(async (info: EventResizeDoneArg) => {
    const appt = info.event.extendedProps.appointment as Appointment;
    try {
      await updateMutation.mutateAsync({
        id: appt.id,
        payload: {
          startTime: info.event.startStr,
          endTime: info.event.endStr ?? info.event.startStr,
        },
      });
    } catch {
      info.revert();
      toast.error('Failed to resize appointment');
    }
  }, [updateMutation]);

  const handleModalSubmit = async (payload: Parameters<typeof createMutation.mutateAsync>[0]) => {
    try {
      if (selectedAppointment) {
        await updateMutation.mutateAsync({ id: selectedAppointment.id, payload });
        toast.success('Appointment updated');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Appointment created');
      }
      setModalOpen(false);
    } catch {
      toast.error('Failed to save appointment');
    }
  };

  const handleDelete = async () => {
    if (!selectedAppointment) return;
    if (!window.confirm('Delete this appointment?')) return;
    try {
      await deleteMutation.mutateAsync(selectedAppointment.id);
      toast.success('Appointment deleted');
      setModalOpen(false);
    } catch {
      toast.error('Failed to delete appointment');
    }
  };

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h3 className="card-title mb-0">Schedule</h3>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => {
            setSelectedAppointment(null);
            setDefaultStart(undefined);
            setDefaultEnd(undefined);
            setModalOpen(true);
          }}
        >
          + New Appointment
        </button>
      </div>
      <div className="card-body p-2">
        {isLoading && (
          <div className="text-center py-3"><div className="spinner-border text-primary" /></div>
        )}
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
          }}
          events={events}
          selectable
          editable
          droppable
          datesSet={handleDatesSet}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          height="auto"
          slotMinTime="07:00:00"
          slotMaxTime="20:00:00"
          allDaySlot={false}
          nowIndicator
          businessHours={{ daysOfWeek: [1, 2, 3, 4, 5], startTime: '08:00', endTime: '18:00' }}
        />
      </div>

      {modalOpen && (
        <AppointmentModal
          appointment={selectedAppointment}
          defaultStart={defaultStart}
          defaultEnd={defaultEnd}
          onSubmit={handleModalSubmit}
          onDelete={selectedAppointment ? handleDelete : undefined}
          onClose={() => setModalOpen(false)}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
};
