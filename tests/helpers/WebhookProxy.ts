import fs from 'node:fs';
import WebSocket from 'ws';

/**
 * Uses the webhook proxy service to proxy events to the testing clients.
 */
export default class WebhookProxy {
    private readonly url;
    private readonly secret;
    private logFile;
    private ws: WebSocket | undefined;
    private cache = new Map<string, any[]>();
    private listeners = new Map();
    private consumers = new Map<string, Array<{
        callback: (event: any) => void;
        predicate?: (event: any) => boolean;
    }>>();

    private _defaultMeetingSettings: object | undefined;

    /**
     * Initializes the webhook proxy.
     * @param url
     * @param secret
     * @param logFile
     */
    constructor(url: string, secret: string, logFile: string) {
        this.url = url;
        this.secret = secret;
        this.logFile = logFile;
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

        this.ws.on('open', () => {
            console.log('WebhookProxy connected');
            this.logInfo('connected');
        });

        this.ws.on('message', (data: any) => {
            const msg = JSON.parse(data.toString());

            this.logInfo(`${msg.eventType} event: ${JSON.stringify(msg)}`);

            if (msg.eventType) {
                let processed = false;

                if (this.consumers.has(msg.eventType)) {
                    const list = this.consumers.get(msg.eventType)!;
                    const idx = list.findIndex(c => !c.predicate || c.predicate(msg));

                    if (idx !== -1) {
                        const consumer = list[idx];

                        list.splice(idx, 1);
                        if (list.length === 0) {
                            this.consumers.delete(msg.eventType);
                        }
                        consumer.callback(msg);
                        processed = true;
                    }
                }

                if (!processed) {
                    if (!this.cache.has(msg.eventType)) {
                        this.cache.set(msg.eventType, []);
                    }
                    this.cache.get(msg.eventType)!.push(msg);
                }

                if (this.listeners.has(msg.eventType)) {
                    this.listeners.get(msg.eventType)(msg);
                    processed = true;
                }

                if (!processed && msg.eventType === 'SETTINGS_PROVISIONING') {
                    // just in case to not be empty
                    let response: any = { someField: 'someValue' };

                    if (this._defaultMeetingSettings) {
                        response = this._defaultMeetingSettings;
                    }

                    this.ws?.send(JSON.stringify(response));
                }
            }
        });
    }

    /**
     * Adds event consumer. Consumers receive the event single time and we remove them from the list of consumers.
     * @param eventType
     * @param callback
     * @param predicate Optional filter; only events for which predicate returns true are consumed.
     */
    addConsumer(eventType: string, callback: (event: any) => void, predicate?: (event: any) => boolean) {
        if (this.cache.has(eventType)) {
            const list = this.cache.get(eventType)!;
            const idx = list.findIndex(e => !predicate || predicate(e));

            if (idx !== -1) {
                const event = list[idx];

                list.splice(idx, 1);
                if (list.length === 0) {
                    this.cache.delete(eventType);
                }
                callback(event);

                return;
            }
        }

        if (!this.consumers.has(eventType)) {
            this.consumers.set(eventType, []);
        }
        this.consumers.get(eventType)!.push({ callback, predicate });
    }

    /**
     * Clear any stored event.
     */
    clearCache() {
        this.logInfo('cache cleared');
        this.cache.clear();
    }

    /**
     * Waits for the event to be received.
     * @param eventType
     * @param predicateOrTimeout Optional predicate to filter events, or a timeout in ms.
     * @param timeout
     */
    async waitForEvent(
            eventType: string,
            predicateOrTimeout?: ((event: any) => boolean) | number,
            timeout = 120000): Promise<any> {
        let predicate: ((event: any) => boolean) | undefined;
        let actualTimeout = timeout;

        if (typeof predicateOrTimeout === 'function') {
            predicate = predicateOrTimeout;
        } else if (typeof predicateOrTimeout === 'number') {
            actualTimeout = predicateOrTimeout;
        }

        // we create the error here so we have a meaningful stack trace
        const error = new Error(`Timeout waiting for event:${eventType}`);

        return new Promise((resolve, reject) => {
            const waiter = setTimeout(() => {
                this.logInfo(error.message);

                return reject(error);
            }, actualTimeout);

            this.addConsumer(eventType, event => {
                clearTimeout(waiter);

                resolve(event);
            }, predicate);

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
            this.logInfo('disconnected');
        }
    }

    /**
     * Logs a message in the logfile.
     *
     * @param {string} message - The message to add.
     * @returns {void}
     */
    logInfo(message: string) {
        try {
            // @ts-ignore
            fs.appendFileSync(this.logFile, `${new Date().toISOString()} ${message}\n`);
        } catch (err) {
            console.error(err);
        }
    }

    /**
     * Sets the settings provider.
     * @param value
     */
    set defaultMeetingSettings(value: {
        asyncTranscriptions?: boolean;
        autoAudioRecording?: boolean;
        autoTranscriptions?: boolean;
        autoVideoRecording?: boolean;
        lobbyEnabled?: boolean;
        lobbyType?: 'WAIT_FOR_APPROVAL' | 'WAIT_FOR_MODERATOR';
        maxOccupants?: number;
        outboundPhoneNo?: string;
        participantsSoftLimit?: number;
        passcode?: string;
        transcriberType?: 'GOOGLE' | 'ORACLE_CLOUD_AI_SPEECH' | 'EGHT_WHISPER';
        visitorsEnabled?: boolean;
        visitorsLive?: boolean;
    }) {
        this._defaultMeetingSettings = value;
    }
}
