import { Client, StompSubscription } from '@stomp/stompjs';

import logger from './logger';
import { WebsocketClient } from './websocket-client';

/**
 * Websocket client impl, used for visitors list.
 * Uses STOMP for authenticating (https://stomp.github.io/).
 */
export class VisitorsListWebsocketClient extends WebsocketClient {
    private static client: VisitorsListWebsocketClient;

    private _topicSubscription: StompSubscription | undefined;
    private _queueSubscription: StompSubscription | undefined;

    /**
     * Creates a new instance of the VisitorsListWebsocketClient.
     *
     * @static
     * @returns {VisitorsListWebsocketClient}
     */
    static override getInstance(): VisitorsListWebsocketClient {
        if (!this.client) {
            this.client = new VisitorsListWebsocketClient();
        }

        return this.client;
    }

    /**
     * Connects to the visitors list with initial queue subscription, then switches to topic deltas.
     *
     * @param {string} queueServiceURL - The service URL to use.
     * @param {string} queueEndpoint - The queue endpoint for initial list.
     * @param {string} topicEndpoint - The topic endpoint for deltas.
     * @param {Function} initialCallback - Callback executed with initial visitors list.
     * @param {Function} deltaCallback - Callback executed with delta updates.
     * @param {string} token - The token to be used for authorization.
     * @param {Function?} connectCallback - Callback executed when connected.
     * @returns {void}
     */
    connectVisitorsList(queueServiceURL: string,
            queueEndpoint: string,
            topicEndpoint: string,
            initialCallback: (visitors: Array<{ n: string; r: string; }>) => void,
            deltaCallback: (updates: Array<{ n: string; r: string; s: string; }>) => void,
            token: string | undefined,
            connectCallback?: () => void) {
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
            logger.error('STOMP error received', frame);
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

            logger.debug('Connected to visitors list websocket');
            connectCallback?.();

            let initialReceived = false;
            const cachedDeltas: Array<{ n: string; r: string; s: string; }> = [];

            // Subscribe first for deltas so we don't miss any while waiting for the initial list
            this._topicSubscription = this.stompClient.subscribe(topicEndpoint, deltaMessage => {
                try {
                    const updates: Array<{ n: string; r: string; s: string; }> = JSON.parse(deltaMessage.body);

                    if (!initialReceived) {
                        cachedDeltas.push(...updates);
                    } else {
                        deltaCallback(updates);
                    }
                } catch (e) {
                    logger.error(`Error parsing visitors delta response: ${deltaMessage}`, e);
                }
            });

            // Subscribe for the initial list after topic subscription is active
            this._queueSubscription = this.stompClient.subscribe(queueEndpoint, message => {
                try {
                    const visitors: Array<{ n: string; r: string; }> = JSON.parse(message.body);

                    logger.debug(`Received initial visitors list with ${visitors.length} visitors`);
                    initialReceived = true;
                    initialCallback(visitors);

                    // Unsubscribe from queue after receiving initial list
                    if (this._queueSubscription) {
                        this._queueSubscription.unsubscribe();
                        this._queueSubscription = undefined;
                    }

                    if (cachedDeltas.length) {
                        deltaCallback(cachedDeltas);
                        cachedDeltas.length = 0;
                    }
                } catch (e) {
                    logger.error(`Error parsing initial visitors response: ${message}`, e);
                }
            });
        };

        this.stompClient.activate();
    }

    /**
     * Unsubscribes from both topic and queue subscriptions.
     *
     * @returns {void}
     */
    override unsubscribe(): void {
        if (this._topicSubscription) {
            this._topicSubscription.unsubscribe();
            logger.debug('Unsubscribed from visitors list topic');
            this._topicSubscription = undefined;
        }

        if (this._queueSubscription) {
            this._queueSubscription.unsubscribe();
            logger.debug('Unsubscribed from visitors list queue');
            this._queueSubscription = undefined;
        }
    }

    /**
     * Disconnects the current stomp client instance and clears it.
     * Unsubscribes from any active subscriptions first.
     *
     * @returns {Promise}
     */
    override disconnect(): Promise<any> {
        if (!this.stompClient) {
            return Promise.resolve();
        }

        const url = this.stompClient.brokerURL;

        // Unsubscribe first (synchronous), then disconnect
        this.unsubscribe();

        return this.stompClient.deactivate().then(() => {
            logger.debug(`disconnected from: ${url}`);
            this.stompClient = undefined;
        });
    }
}
