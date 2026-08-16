import { supabase } from '../../../lib/supabaseClient';
import {
    normalizeAppointment,
    sortAppointmentsChronologically,
} from '../utils/appointmentContract.cjs';

export const APPOINTMENT_LOAD_ERROR = 'Randevular yüklenemedi. Lütfen tekrar deneyin.';

export class AppointmentServiceError extends Error {
    constructor(message = APPOINTMENT_LOAD_ERROR, cause = null) {
        super(message);
        this.name = 'AppointmentServiceError';
        this.cause = cause;
    }
}

const APPOINTMENT_SELECT = 'id,dietitian_id,client_id,title,date,time,duration,type,status';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const getCurrentUserOrThrow = async () => {
    let response;
    try {
        response = await supabase.auth.getUser();
    } catch (error) {
        throw new AppointmentServiceError(APPOINTMENT_LOAD_ERROR, error);
    }

    const user = response?.data?.user;
    if (response?.error || !user?.id) {
        throw new AppointmentServiceError(APPOINTMENT_LOAD_ERROR, response?.error || null);
    }
    return user;
};

export const fetchClientAppointments = async () => {
    const user = await getCurrentUserOrThrow();
    let response;

    try {
        response = await supabase
            .from('appointments')
            .select(APPOINTMENT_SELECT)
            .eq('client_id', user.id)
            .order('date', { ascending: true })
            .order('time', { ascending: true });
    } catch (error) {
        throw new AppointmentServiceError(APPOINTMENT_LOAD_ERROR, error);
    }

    if (response?.error) {
        throw new AppointmentServiceError(APPOINTMENT_LOAD_ERROR, response.error);
    }

    try {
        return sortAppointmentsChronologically(
            (response?.data || []).map((row) => normalizeAppointment(row, user.id)),
        );
    } catch (error) {
        throw new AppointmentServiceError(APPOINTMENT_LOAD_ERROR, error);
    }
};

export const fetchClientAppointmentById = async (appointmentId) => {
    const user = await getCurrentUserOrThrow();
    if (typeof appointmentId !== 'string' || !UUID_PATTERN.test(appointmentId)) {
        throw new AppointmentServiceError(APPOINTMENT_LOAD_ERROR, new Error('Invalid appointment id'));
    }

    let response;
    try {
        response = await supabase
            .from('appointments')
            .select(APPOINTMENT_SELECT)
            .eq('client_id', user.id)
            .eq('id', appointmentId)
            .maybeSingle();
    } catch (error) {
        throw new AppointmentServiceError(APPOINTMENT_LOAD_ERROR, error);
    }

    if (response?.error) {
        throw new AppointmentServiceError(APPOINTMENT_LOAD_ERROR, response.error);
    }
    if (!response?.data) return null;

    try {
        return normalizeAppointment(response.data, user.id);
    } catch (error) {
        throw new AppointmentServiceError(APPOINTMENT_LOAD_ERROR, error);
    }
};
