/* eslint-disable require-jsdoc,react/no-multi-comp,camelcase*/
import io from 'socket.io-client';

import { createWaitingAreaSocketEvent, sendAnalytics } from '../../react/features/analytics';
const UNABLE_TO_CONNECT_SOCKET = 'Unable to connect Socket.IO';

export class Socket {
    constructor(options) {
        this.options = options || {};
        this.socket_host = this.options.socket_host || '';
        this.ws_token = this.options.ws_token || '';
        this.autoReconnecting = false;
        this.socketio = io(this.socket_host, {
            transports: [ 'websocket' ],
            autoConnect: false,
            reconnection: true,
            reconnectionDelay: 5000,
            reconnectionDelayMax: 7000,
            query: {
                token: this.ws_token,
                connection_attempts: 0
            }
        });
    }

    connect() {
        const connectionStatusListener = this.connectionStatusListener;
        const onMessageReceivedListener = this.onMessageReceivedListener;

        if (!this.ws_token) {
            connectionStatusListener({ error: 'no websocket token present' });

            return console.warn('no websocket token present');
        }

        if (this.socket) {
            this.socket.io.opts.query.token = this.ws_token;

            return this.socket.connect();
        }

        this.socket = this.socketio.connect();

        // this will trigger external reconnect mechanism controlled by socketConnection comp
        this.socket.on('error', reason => {
            this.autoReconnecting = false;
            connectionStatusListener({ error: reason });
            console.error(UNABLE_TO_CONNECT_SOCKET, reason);
        });

        // this will trigger internal reconnect mechanism if a connection error occurs
        this.socket.on('connect_error', reason => {
            this.autoReconnecting = true;
            connectionStatusListener({ error: reason });
            console.error(UNABLE_TO_CONNECT_SOCKET, reason);
        });

        this.socket.on('connect', () => {
            this.autoReconnecting = false;
            connectionStatusListener({ event: 'connected' });
            console.info('websocket connected');
            sendAnalytics(createWaitingAreaSocketEvent('connected'));
        });

        // this only applies to socket.io's internal reconnect mechanism
        this.socket.on('reconnect_attempt', () => {
            this.socket.io.opts.query.token = this.ws_token;
            console.info('automatically reconnecting');
        });

        this.socket.on('disconnect', () => {
            console.info('websocket disconnected');
            connectionStatusListener({ event: 'disconnected' });
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

    // external reconnect mechanism
    reconnect(ws_token) {
        // update the latest ws_token fetched from jane
        this.ws_token = ws_token;
        if (!this.socket.connected && !this.autoReconnecting) {
            this.disconnect();
            console.info('Reconnecting websocket');
            this.connect();
        }
    }

    disconnect() {
        console.info('Websocket disconnected');
        this.socket.disconnect();
    }


}


