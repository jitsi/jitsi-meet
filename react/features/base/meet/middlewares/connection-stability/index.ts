/**
 * Connection Stability Middlewares
 *
 * These middlewares handle connection stability issues:
 * - Poor connection detection when joining meetings
 * - DataChannel reconnection detection and user notifications
 * - XMPP/WebSocket connection failure handling
 * - Error handling to prevent middleware crashes
 * - Connection guard to prevent invalid events during disconnection
 */

import './middleware.error-handling';
import './middleware.reconnection';
import './middleware.datachannel';
import './middleware.connection-guard';
import './middleware.poor-connection';

export {};
