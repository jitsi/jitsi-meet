/**
 * Collection of middlewares to handle connection stability and user notifications.
 * - Poor connection detection when joining meetings
 * - DataChannel reconnection detection and user notifications
 * - XMPP/WebSocket connection failure handling (via lib-jitsi-meet events)
 * - Automatic reconnection when connection is lost unexpectedly
 * - Error handling to prevent middleware crashes
 * - Connection guard to prevent invalid events during disconnection
 */

import './middleware.connection-guard';
import './connection-notifications';
import './middleware.datachannel';
import './middleware.error-handling';
import './middleware.poor-connection';
import './middleware.auto-reconnect';

export { };

console.log('Connection stability middlewares loaded');