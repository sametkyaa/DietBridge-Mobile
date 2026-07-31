'use strict';

// Pure render-state decision for the chat screen shell.
//
// The chat screen keeps the picked-image draft (URI, preview and caption) in
// the mounted `ActiveChatContent` subtree. Opening the system image picker
// backgrounds the app; returning fires an `AppState` -> `active` transition,
// which schedules a connection refresh in `DietitianConnectionContext`. That
// refresh briefly sets `isLoadingConnection = true`.
//
// If the screen swaps the whole chat subtree for a full-screen loader on every
// such refresh, `ActiveChatContent` unmounts and the just-picked image draft is
// destroyed before the user can reach the preview/caption step.
//
// This helper keeps the loader for the *initial* connection resolution only.
// Once an active connection exists, a background refresh keeps the chat mounted
// so an in-progress image (or text) draft survives the picker round-trip. No
// React, navigation or Expo API lives here, so the rule is unit-testable.

const CHAT_SCREEN_CONTENT = Object.freeze({
    LOADING: 'loading',
    ERROR: 'error',
    LOCKED: 'locked',
    ACTIVE: 'active',
});

// `state` mirrors the values `ChatScreen` reads from `useDietitianConnection`.
const resolveChatScreenContent = ({
    isLoadingConnection = false,
    connectionError = null,
    hasActiveDietitian = false,
    activeConnection = null,
} = {}) => {
    const hasActiveConnection = Boolean(hasActiveDietitian && activeConnection);

    // A resolved active connection keeps the chat mounted even while a
    // background refresh is in flight. This is what preserves the image draft
    // across the picker's foreground/background transition.
    if (hasActiveConnection) return CHAT_SCREEN_CONTENT.ACTIVE;

    // Without an active connection yet, the initial load still owns the screen.
    if (isLoadingConnection) return CHAT_SCREEN_CONTENT.LOADING;
    if (connectionError) return CHAT_SCREEN_CONTENT.ERROR;
    return CHAT_SCREEN_CONTENT.LOCKED;
};

module.exports = {
    CHAT_SCREEN_CONTENT,
    resolveChatScreenContent,
};
