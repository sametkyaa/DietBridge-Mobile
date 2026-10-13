const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function createPushResponseController({ userId, fetchNotification, openCenter, isReady, clearResponse, onError }) {
    let disposed = false;
    let pending = null;
    let inFlight = false;
    const handled = new Set();
    const flush = async () => {
        if (disposed || inFlight || !pending || !isReady()) return;
        const response = pending;
        pending = null;
        const id = response.notification.request.content.data.notificationId;
        inFlight = true;
        try {
            // Clear before asynchronous lookup so a newer native response cannot
            // accidentally be cleared after it arrives.
            await clearResponse();
            const notification = await fetchNotification(id);
            if (!disposed && notification?.recipientId === userId && isReady()) openCenter();
        } catch {
            if (!disposed) onError();
        } finally {
            inFlight = false;
            if (!disposed && pending) void flush();
        }
    };
    const receive = response => {
        if (disposed || response?.actionIdentifier !== 'expo.modules.notifications.actions.DEFAULT') return;
        const data = response?.notification?.request?.content?.data;
        const requestId = response?.notification?.request?.identifier;
        if (data?.version !== 1 || !UUID.test(data?.notificationId ?? '') || typeof requestId !== 'string' || requestId.length > 200 || !requestId) return;
        if (handled.has(requestId)) return;
        handled.add(requestId);
        if (handled.size > 50) handled.delete(handled.values().next().value);
        pending = response;
        void flush();
    };
    return { receive, flush, dispose: () => { disposed = true; pending = null; } };
}

module.exports = { createPushResponseController };
