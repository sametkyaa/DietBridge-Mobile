# Mobile Notification Client Core

Phase 4A is data, state, and Realtime infrastructure only. It does not add a
Bell, badge, screen, drawer, route, toast, or other visible Mobile UI.

The provider exposes `useNotifications()` to authenticated client routes with
normalized camelCase notification models, bounded keyset pagination, separate
unseen count, all/unread mode, RPC-backed mutations, foreground refresh, and
one authenticated `mobile-notifications:<userId>` Realtime channel.

Notification metadata is the only source used for summaries. Chat message
bodies are not selected, fetched, copied, or stored in notification state.

Future Phase 4B navigation contracts:

- Chat notifications retain `conversationId` and `dietitianClientId`, but
  notification ownership is not Chat authorization. Existing authenticated
  Chat service/relationship resolution remains authoritative.
- Appointment notifications retain `appointmentId`, but the future click
  path must fetch the current appointment through the authenticated appointment
  service/RLS before navigating to `AppointmentDetail`.
- Relationship notifications retain `dietitianClientId`; no relationship
  route is introduced in Phase 4A.
