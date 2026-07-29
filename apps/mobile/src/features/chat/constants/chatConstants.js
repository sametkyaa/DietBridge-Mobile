'use strict';

// Canonical chat limits shared by the mobile chat service layer.
// Mirrors the production contract: body 1..4000 characters, keyset history
// pages of 30 with a hard ceiling of 50.

const CHAT_MESSAGE_MAX_LENGTH = 4000;
const CHAT_MESSAGE_PAGE_SIZE = 30;
const CHAT_MESSAGE_MAX_PAGE_SIZE = 50;

module.exports = {
    CHAT_MESSAGE_MAX_LENGTH,
    CHAT_MESSAGE_PAGE_SIZE,
    CHAT_MESSAGE_MAX_PAGE_SIZE,
};
