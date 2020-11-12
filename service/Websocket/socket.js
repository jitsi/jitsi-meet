/* eslint-disable */
import io from 'socket.io-client';
import { checkRoomStatus } from '../../react/features/jane-waiting-area';

export class Socket {
    constructor(options) {
        this.unauthorized_count = 0;
        this.options = options || {};
        this.socket_host = this.options.socket_host || '';
        this.ws_token = this.options.ws_token || '';
        this.totalRetries = 0;
        this.socketio = io(this.socket_host, {
            transports: ['websocket'],
            autoConnect: false,
            reconnection: true,
            reconnectionDelay: 2000,
            reconnectionDelayMax: 2000,
            query: {
                token: this.ws_token,
                connection_attempts: 0
            }
        });
    }

    auth_and_connect() {
        console.info('reauthorizing websocket');
        this.reauthorizing = true;
        checkRoomStatus().then(r => (r) => {
            if (r.socket_token && r.socket_token.length > 0) {
                this.ws_token = r.socket_token;
                console.log('fresh websocket jwt fetched');
            }
            this.reauthorizing = false;
            this.connect();
        }).catch(error => {
            this.connectionStatusListener({ error });
            console.error(error);
        });
    }

    connect() {
        if (this.reauthorizing) {
            return console.warn('cannot connect websocket while reauthorizing');
        }

        if (!this.ws_token) {
            return console.warn('no websocket token present');
        }

        // if socket is already initialized, just update the token and reconnect
        if (this.socket) {
            this.socket.io.opts.query.token = this.ws_token;
            this.socket.io.opts.query.connection_attempts = this.unauthorized_count;

            return this.socket.connect();
        }

        const connectionStatusListener = this.connectionStatusListener;
        const onMessageReceivedListener = this.onMessageReceivedListener;

        this.socket = this.socketio.connect();

        // this only applies to socket.io's internal reconnect mechanism
        this.socket.on('reconnect_attempt', () => {
            console.info('websocket reconnect attempt');
            connectionStatusListener('websocket reconnect attempt');
            this.unauthorized_count = 0;
            if (this.totalRetries === 5) {
                this.socket.disconnect();
                this.socket.destroy();
                connectionStatusListener({ error: 'Unable to connect Socket.IO' });
                console.error('Unable to connect Socket.IO');
            }
            this.totalRetries++;
            this.socket.io.opts.query.token = this.ws_token;
            this.socket.io.opts.query.connection_attempts = this.unauthorized_count;
        });

        this.socket.on('error', reason => {
            if (reason == 'jwt_expired') {
                if (this.unauthorized_count == 0) {
                    console.info(
                        'websocket unauthorized. fetching fresh jwt and trying 1 more time'
                    );
                    connectionStatusListener({ error: reason });
                    this.unauthorized_count++;
                    this.socket.disconnect();
                    this.socket.destroy();
                    this.auth_and_connect();
                } else {
                    console.info(
                        'socket unauthorized on second attempt. user needs to sign in again'
                    );
                    this.unauthorized_count = 0;
                    this.socket.disconnect();
                    connectionStatusListener({ error: reason });
                    console.error('Unable to connect Socket.IO', reason);
                }
            } else {
                connectionStatusListener({ error: reason });
                console.error('Unable to connect Socket.IO', reason);
            }
        });

        this.socket.on('connect', function () {
            console.info('websocket connected');
            connectionStatusListener('websocket connected');
            this.unauthorized_count = 0;
        });

        this.socket.on('disconnect', () => {
            console.info('websocket disconnect');
            connectionStatusListener('websocket disconnect');
        });

        this.socket.on('message', payload => {
            const event_object = JSON.parse(payload);
            onMessageReceivedListener(event_object);
        });
    }

    onMessageReceivedListener(event) {
        console.log(event);
    }

    connectionStatusListener(status) {
        console.log(status);
    }

    reconnect() {
        if (!this.socket.connected) {
            this.unauthorized_count = 0;
            this.connect();
        }
    }

    disconnect() {
        console.info('real time disabled');
        this.socket.disconnect();
    }


}


