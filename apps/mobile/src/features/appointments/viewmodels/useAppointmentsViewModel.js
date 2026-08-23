import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { APPOINTMENT_LOAD_ERROR, fetchClientAppointments } from '../services/appointmentService';
import { partitionAppointments } from '../utils/appointmentContract.cjs';

export const useAppointmentsViewModel = () => {
    const [appointments, setAppointments] = useState([]);
    const [status, setStatus] = useState('loading');
    const [error, setError] = useState(null);
    const [classificationNow, setClassificationNow] = useState(() => new Date());
    const requestSequenceRef = useRef(0);
    const isMountedRef = useRef(true);

    useEffect(() => () => {
        isMountedRef.current = false;
        requestSequenceRef.current += 1;
    }, []);

    const loadAppointments = useCallback(({ retry = false } = {}) => {
        const requestSequence = requestSequenceRef.current + 1;
        requestSequenceRef.current = requestSequence;
        setStatus(retry ? 'retrying' : 'loading');
        setError(null);
        setAppointments([]);
        setClassificationNow(new Date());

        return fetchClientAppointments()
            .then((nextAppointments) => {
                if (!isMountedRef.current || requestSequenceRef.current !== requestSequence) return nextAppointments;
                setClassificationNow(new Date());
                setAppointments(nextAppointments);
                setStatus(nextAppointments.length > 0 ? 'success' : 'empty');
                return nextAppointments;
            })
            .catch((loadError) => {
                if (!isMountedRef.current || requestSequenceRef.current !== requestSequence) return null;
                setAppointments([]);
                setStatus('error');
                setError(loadError?.message || APPOINTMENT_LOAD_ERROR);
                return null;
            });
    }, []);

    useFocusEffect(
        useCallback(() => {
            const refreshClassification = () => setClassificationNow(new Date());
            refreshClassification();
            const timer = setInterval(refreshClassification, 60 * 1000);
            void loadAppointments();
            return () => clearInterval(timer);
        }, [loadAppointments]),
    );

    const { upcoming, past } = useMemo(
        () => partitionAppointments(appointments, classificationNow),
        [appointments, classificationNow],
    );

    const refreshClassification = useCallback(() => setClassificationNow(new Date()), []);
    const retryAppointments = useCallback(() => loadAppointments({ retry: true }), [loadAppointments]);

    return {
        appointments,
        upcomingAppointments: upcoming,
        pastAppointments: past,
        status,
        error,
        isLoading: status === 'loading' || status === 'retrying',
        refreshClassification,
        retryAppointments,
    };
};

export default useAppointmentsViewModel;
