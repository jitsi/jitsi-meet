// import io from 'socket.io-client';
//
// export class Sockets {
//     constructor(options) {
//         this.unauthorized_count = 0;
//         this.options = options || {};
//         this.socket_host = options.socket_host || '';
//         this.ws_token = this.options.ws_token || '';
//         this.socketio = io(this.socket_host, {
//             transports: ['websocket'],
//             autoConnect: false,
//             reconnection: true,
//             reconnectionDelay: 10000,
//             reconnectionDelayMax: 60000,
//             query: {
//                 token: this.ws_token,
//                 connection_attempts: 0
//             }
//         });
//         this.callBack = options.callBack || null;
//         this.connect();
//     }
//
//     auth_and_connect() {
//         console.info('reauthorizing websocket');
//         this.reauthorizing = true;
//
//     }
//
//     connect() {
//         if (this.reauthorizing) {
//             return console.warn('cannot connect websocket while reauthorizing');
//         }
//
//         if (!this.ws_token) {
//             return console.warn('no websocket token present');
//         }
//
//         // if socket is already initialized, just update the token and reconnect
//         if (this.socket) {
//             this.socket.io.opts.query.token = this.ws_token;
//             this.socket.io.opts.query.connection_attempts = this.unauthorized_count;
//             return this.socket.connect();
//         }
//
//         this.socket = this.socketio.connect();
//
//         // this only applies to socket.io's internal reconnect mechanism
//         this.socket.on('reconnect_attempt', () => {
//             console.info('websocket reconnect attempt');
//             this.unauthorized_count = 0;
//             this.socket.io.opts.query.token = this.ws_token;
//             this.socket.io.opts.query.connection_attempts = this.unauthorized_count;
//         });
//
//         this.socket.on('error', (reason) => {
//             if (reason == 'jwt_expired') {
//                 if (this.unauthorized_count == 0) {
//                     console.info(
//                         'websocket unauthorized. fetching fresh jwt and trying 1 more time'
//                     );
//                     this.unauthorized_count++;
//                     this.socket.disconnect();
//                     this.socket.destroy();
//                     this.auth_and_connect();
//                 } else {
//                     console.info(
//                         'socket unauthorized on second attempt. user needs to sign in again'
//                     );
//                     this.unauthorized_count = 0;
//                     this.socket.disconnect();
//                     console.error('Unable to connect Socket.IO', reason);
//                     if (window.bugsnagClient) {
//                         bugsnagClient.notify(
//                             `Socket error: unauthorized on second attempt. user needs to sign in again`,
//                             {
//                                 severity: 'error'
//                             }
//                         );
//                     }
//                 }
//             } else {
//                 console.error('Unable to connect Socket.IO', reason);
//                 if (window.bugsnagClient) {
//                     bugsnagClient.notify(`Socket error: ${reason}`, {
//                         severity: 'error'
//                     });
//                 }
//             }
//
//         });
//
//         this.socket.on('connect', function () {
//             console.info('websocket connected');
//             this.unauthorized_count = 0;
//         });
//
//         this.socket.on('disconnect', function () {
//             console.info('websocket disconnect');
//         });
//
//         this.socket.on('message', (payload) => {
//             let event_object = JSON.parse(payload);
//
//             let current_session_is_originator = this.currentSessionIsOriginator(
//                 event_object.browser_session_id
//             );
//
//             this.onMessageUpdateListener(event_object);
//         });
//     }
//
//     onMessageUpdateListener(event) {
//         console.log(event);
//     }
//
//     reconnect() {
//         if (!this.socket.connected) {
//             this.unauthorized_count = 0;
//             this.connect();
//         }
//     }
//
//     disconnect() {
//         console.info('real time disabled');
//         this.socket.disconnect();
//     }
//
//     currentSessionIsOriginator(id) {
//         return id === this.browser_session_id;
//     }
//
//     publishToStore(store, model_name) {
//
//     }
// }
//
//
