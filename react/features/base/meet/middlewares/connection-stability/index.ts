/**
 * Connection Stability Middlewares
 *
 * These middlewares handle connection stability issues:
 * - DataChannel reconnection detection and user notifications
 * - XMPP/WebSocket connection failure handling
 * - Error handling to prevent middleware crashes
 * - Connection guard to prevent invalid events during disconnection
 */

import './middleware.error-handling';
import './middleware.reconnection';
import './middleware.datachannel';
import './middleware.connection-guard';

export {};
