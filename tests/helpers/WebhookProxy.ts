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
    private cache = new Map();
    private listeners = new Map();
    private consumers = new Map();
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

        this.ws.on('open', function open() {
            console.log('WebhookProxy connected');
        });

        this.ws.on('message', (data: any) => {
            const msg = JSON.parse(data.toString());

            this.logInfo(`${msg.eventType} event: ${JSON.stringify(msg)}`);

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
        this.logInfo('cache cleared');
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
            const waiter = setTimeout(() => {
                this.logInfo(error.message);

                return reject(error);
            }, timeout);

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
