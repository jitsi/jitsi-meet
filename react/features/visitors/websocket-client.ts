/* eslint-disable @typescript-eslint/naming-convention */
import { Client } from '@stomp/stompjs';

import logger from './logger';

interface QueueServiceResponse {
    conference: string;
}
export interface StateResponse extends QueueServiceResponse {
    randomDelayMs: number;
    status: string;
}

export interface VisitorResponse extends QueueServiceResponse {
    visitorsWaiting: number;
}

/**
 * Websocket client impl, used for visitors queue.
 * Uses STOMP for authenticating (https://stomp.github.io/).
 */
export class WebsocketClient {
    private stompClient: Client | undefined;

    private static instance: WebsocketClient;

    private retriesCount = 0;

    private _connectCount = 0;

    /**
     *  WebsocketClient getInstance.
     *
     * @static
     * @returns {WebsocketClient}  - WebsocketClient instance.
     */
    static getInstance(): WebsocketClient {
        if (!this.instance) {
            this.instance = new WebsocketClient();
        }

        return this.instance;
    }

    /**
     * Connect to endpoint.
     *
     * @param {string} queueServiceURL - The service URL to use.
     * @param {string} endpoint - The endpoint to subscribe to.
     * @param {Function} callback - The callback to execute when we receive a message from the endpoint.
     * @param {string} token - The token, if any, to be used for authorization.
     * @param {Function?} connectCallback - The callback to execute when successfully connected.
     *
     * @returns {void}
     */
    connect(queueServiceURL: string, // eslint-disable-line max-params
            endpoint: string,
            callback: (response: StateResponse | VisitorResponse) => void,
            token: string | undefined,
            connectCallback?: () => void): void {
        this.stompClient = new Client({
            brokerURL: queueServiceURL,
            forceBinaryWSFrames: true,
            appendMissingNULLonIncoming: true
        });

        const errorConnecting = (error: any) => {
            if (this.retriesCount > 3) {
                this.stompClient?.deactivate();
                this.stompClient = undefined;

                return;
            }

            this.retriesCount++;

            logger.error(`Error connecting to ${queueServiceURL} ${JSON.stringify(error)}`);
        };

        this.stompClient.onWebSocketError = errorConnecting;

        this.stompClient.onStompError = frame => {
            errorConnecting(frame.headers.message);
        };

        if (token) {
            this.stompClient.connectHeaders = {
                Authorization: `Bearer ${token}`
            };
        }

        this.stompClient.onConnect = () => {
            if (!this.stompClient) {
                return;
            }

            this.retriesCount = 0;

            logger.info(`Connected to:${endpoint}`);
            this._connectCount++;
            connectCallback?.();

            this.stompClient.subscribe(endpoint, message => {
                try {
                    callback(JSON.parse(message.body));
                } catch (e) {
                    logger.error(`Error parsing response: ${message}`, e);
                }
            });
        };

        this.stompClient.activate();
    }

    /**
     * Disconnects the current stomp  client instance and clears it.
     *
     * @returns {Promise}
     */
    disconnect(): Promise<any> {
        if (!this.stompClient) {
            return Promise.resolve();
        }

        const url = this.stompClient.brokerURL;

        return this.stompClient.deactivate().then(() => {
            logger.info(`disconnected from: ${url}`);
            this.stompClient = undefined;
        });
    }

    /**
     * Checks whether the instance is created and connected or in connecting state.
     *
     * @returns {boolean} Whether the connect method was executed.
     */
    isActive() {
        return this.stompClient !== undefined;
    }

    /**
     * Returns the number of connections.
     *
     * @returns {number} The number of connections for the life of the app.
     */
    get connectCount(): number {
        return this._connectCount;
    }
}
