import WebSocket from 'ws';

/**
 * Uses the webhook proxy service to proxy events to the testing clients.
 */
export default class WebhookProxy {
    private url;
    private secret;
    private ws: WebSocket | undefined;
    private cache = new Map();
    private listeners = new Map();
    private consumers = new Map();

    /**
     * Initializes the webhook proxy.
     * @param url
     * @param secret
     */
    constructor(url: string, secret: string) {
        this.url = url;
        this.secret = secret;
    }

    /**
     * Connects.
     */
    connect() {
        this.ws = new WebSocket(this.url, {
            headers: {
                Authorization: this.secret
            }
        });

        this.ws.on('error', console.error);

        this.ws.on('open', function open() {
            console.log('WebhookProxy connected');
        });

        this.ws.on('message', (data: any) => {
            const msg = JSON.parse(data.toString());

            if (msg.eventType) {
                let processed = false;

                if (this.consumers.has(msg.eventType)) {
                    this.consumers.get(msg.eventType)(msg);
                    this.consumers.delete(msg.eventType);

                    processed = true;
                } else {
                    this.cache.set(msg.eventType, msg);
                }

                if (this.listeners.has(msg.eventType)) {
                    this.listeners.get(msg.eventType)(msg);
                    processed = true;
                }

                if (!processed && msg.eventType === 'SETTINGS_PROVISIONING') {
                    // just in case to not be empty
                    this.ws?.send(JSON.stringify({ someField: 'someValue' }));
                }
            }
        });
    }

    /**
     * Adds event consumer. Consumers receive the event single time and we remove them from the list of consumers.
     * @param eventType
     * @param callback
     */
    addConsumer(eventType: string, callback: (deventata: any) => void) {
        if (this.cache.has(eventType)) {
            callback(this.cache.get(eventType));
            this.cache.delete(eventType);

            return;
        }

        this.consumers.set(eventType, callback);
    }

    /**
     * Clear any stored event.
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Waits for the event to be received.
     * @param eventType
     * @param timeout
     */
    async waitForEvent(eventType: string, timeout = 4000): Promise<any> {
        // we create the error here so we have a meaningful stack trace
        const error = new Error(`Timeout waiting for event:${eventType}`);

        return new Promise((resolve, reject) => {
            const waiter = setTimeout(() => reject(error), timeout);

            this.addConsumer(eventType, event => {
                clearTimeout(waiter);

                resolve(event);
            });

        });
    }

    /**
     * Adds a listener for the event type.
     * @param eventType
     * @param callback
     */
    addListener(eventType: string, callback: (data: any) => void) {
        this.listeners.set(eventType, callback);
    }

    /**
     * Adds a listener for the event type.
     * @param eventType
     */
    removeListener(eventType: string) {
        this.listeners.delete(eventType);
    }

    /**
     * Disconnects the webhook proxy.
     */
    disconnect() {
        if (this.ws) {
            this.ws.close();
            console.log('WebhookProxy disconnected');
            this.ws = undefined;
        }
    }
}
