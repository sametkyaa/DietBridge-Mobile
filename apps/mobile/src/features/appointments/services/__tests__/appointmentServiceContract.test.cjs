'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '../../../../../../../');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('mobile appointment service is authenticated, client-scoped, and read-only', () => {
    const source = read('apps/mobile/src/features/appointments/services/appointmentService.js');

    assert.match(source, /supabase\.auth\.getUser\(\)/);
    assert.match(source, /if \(response\?\.error \|\| !user\?\.id\)/);
    assert.match(source, /\.from\('appointments'\)/);
    assert.match(source, /\.select\(APPOINTMENT_SELECT\)/);
    assert.match(source, /\.eq\('client_id', user\.id\)/);
    assert.match(source, /id,dietitian_id,client_id,title,date,time,duration,type,status/);
    assert.doesNotMatch(source, /\.(insert|update|delete)\s*\(/);
    assert.doesNotMatch(source, /service_role|SUPABASE_SERVICE_ROLE_KEY|mock|fallback/i);
});

test('drawer and stack expose appointments without changing bottom navigation', () => {
    const sidebar = read('apps/mobile/src/features/clients/components/dashboard/DashboardSidebar.js');
    const rootNavigator = read('apps/mobile/src/navigation/RootNavigator.js');
    const mainTabs = read('apps/mobile/src/navigation/MainTabs.js');
    const dashboard = read('apps/mobile/src/features/clients/screens/DashboardScreen.js');

    assert.match(sidebar, /key: 'Profile'[\s\S]*key: 'Appointments'[\s\S]*key: 'Settings'[\s\S]*key: 'Support'/);
    assert.match(sidebar, /key: 'Appointments', label: 'Randevular', icon: 'calendar'/);
    assert.match(rootNavigator, /Stack\.Screen name="Appointments" component=\{AppointmentsScreen\}/);
    assert.match(rootNavigator, /Stack\.Screen name="AppointmentDetail" component=\{AppointmentDetailScreen\}/);
    assert.doesNotMatch(mainTabs, /Appointments|Randevular/);
    assert.doesNotMatch(dashboard, /Randevu|Appointments/);
});

test('appointments screen has default upcoming and read-only detail navigation', () => {
    const listScreen = read('apps/mobile/src/features/appointments/screens/AppointmentsScreen.js');
    const detailScreen = read('apps/mobile/src/features/appointments/screens/AppointmentDetailScreen.js');
    const viewModel = read('apps/mobile/src/features/appointments/viewmodels/useAppointmentsViewModel.js');

    assert.match(listScreen, /useState\('upcoming'\)/);
    assert.match(listScreen, /label: 'Yaklaşan'/);
    assert.match(listScreen, /label: 'Geçmiş'/);
    assert.match(listScreen, /navigation\.navigate\('AppointmentDetail', \{ appointment \}\)/);
    assert.match(listScreen, /ErrorState/);
    assert.match(listScreen, /EmptyState/);
    assert.match(detailScreen, /Randevu Detayı/);
    assert.match(detailScreen, /formatAppointmentDate\(appointment\.date\)/);
    assert.match(detailScreen, /appointment\?\.status/);
    assert.doesNotMatch(detailScreen, /createAppointment|updateAppointment|deleteAppointment|onCancel|onReschedule/);
    assert.match(viewModel, /useFocusEffect/);
    assert.match(viewModel, /partitionAppointments\(appointments, classificationNow\)/);
    assert.match(viewModel, /setInterval\(refreshClassification, 60 \* 1000\)/);
    assert.match(listScreen, /refreshClassification\(\);/);
    assert.match(listScreen, /displayStatus/);
});
