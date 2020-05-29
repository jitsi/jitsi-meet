/* @flow */

import { jitsiLocalStorage } from 'js-utils';

import logger from '../logger';

/**
 * Gets high precision system time.
 *
 * @returns {number}
 */
function highPrecisionTime(): number {
    return window.performance
        && window.performance.now
        && window.performance.timing
        && window.performance.timing.navigationStart
        ? window.performance.now() + window.performance.timing.navigationStart
        : Date.now();
}

// Have to use string literal here, instead of Symbols,
// because these values need to be JSON-serializible.

/**
 * Types of SessionEvents.
 */
const SessionEventType = Object.freeze({
    /**
     * Start of local recording session. This is recorded when the
     * {@code RecordingController} receives the signal to start local recording,
     * before the actual adapter is engaged.
     */
    SESSION_STARTED: 'SESSION_STARTED',

    /**
     * Start of a continuous segment. This is recorded when the adapter is
     * engaged. Can happen multiple times in a local recording session,
     * due to browser reloads or switching of recording device.
     */
    SEGMENT_STARTED: 'SEGMENT_STARTED',

    /**
     * End of a continuous segment. This is recorded when the adapter unengages.
     */
    SEGMENT_ENDED: 'SEGMENT_ENDED'
});

/**
 * Represents an event during a local recording session.
 * The event can be either that the adapter started recording, or stopped
 * recording.
 */
type SessionEvent = {

    /**
     * The type of the event.
     * Should be one of the values in {@code SessionEventType}.
     */
    type: string,

    /**
     * The timestamp of the event.
     */
    timestamp: number
};

/**
 * Representation of the metadata of a segment.
 */
type SegmentInfo = {

    /**
     * The length of gap before this segment, in milliseconds.
     * mull if unknown.
     */
    gapBefore?: ?number,

    /**
     * The duration of this segment, in milliseconds.
     * null if unknown or the segment is not finished.
     */
    duration?: ?number,

    /**
     * The start time, in milliseconds.
     */
    start?: ?number,

    /**
     * The end time, in milliseconds.
     * null if unknown, the segment is not finished, or the recording is
     * interrupted (e.g. browser reload).
     */
    end?: ?number
};

/**
 * Representation of metadata of a local recording session.
 */
type SessionInfo = {

    /**
     * The session token.
     */
    sessionToken: string,

    /**
     * The start time of the session.
     */
    start: ?number,

    /**
     * The recording format.
     */
    format: string,

    /**
     * Array of segments in the session.
     */
    segments: SegmentInfo[]
}

/**
 * {@code localStorage} key.
 */
const LOCAL_STORAGE_KEY = 'localRecordingMetadataVersion1';

/**
 * SessionManager manages the metadata of each segment during each local
 * recording session.
 *
 * A segment is a continous portion of recording done using the same adapter
 * on the same microphone device.
 *
 * Browser refreshes, switching of microphone will cause new segments to be
 * created.
 *
 * A recording session can consist of one or more segments.
 */
class SessionManager {

    /**
     * The metadata.
     */
    _sessionsMetadata = {
    };

    /**
     * Constructor.
     */
    constructor() {
        this._loadMetadata();
    }

    /**
     * Loads metadata from localStorage.
     *
     * @private
     * @returns {void}
     */
    _loadMetadata() {
        const dataStr = jitsiLocalStorage.getItem(LOCAL_STORAGE_KEY);

        if (dataStr !== null) {
            try {
                const dataObject = JSON.parse(dataStr);

                this._sessionsMetadata = dataObject;
            } catch (e) {
                logger.warn('Failed to parse localStorage item.');

                return;
            }
        }
    }

    /**
     * Persists metadata to localStorage.
     *
     * @private
     * @returns {void}
     */
    _saveMetadata() {
        jitsiLocalStorage.setItem(LOCAL_STORAGE_KEY,
            JSON.stringify(this._sessionsMetadata));
    }

    /**
     * Creates a session if not exists.
     *
     * @param {string} sessionToken - The local recording session token.
     * @param {string} format - The local recording format.
     * @returns {void}
     */
    createSession(sessionToken: string, format: string) {
        if (this._sessionsMetadata[sessionToken] === undefined) {
            this._sessionsMetadata[sessionToken] = {
                format,
                events: []
            };
            this._sessionsMetadata[sessionToken].events.push({
                type: SessionEventType.SESSION_STARTED,
                timestamp: highPrecisionTime()
            });
            this._saveMetadata();
        } else {
            logger.warn(`Session ${sessionToken} already exists`);
        }
    }

    /**
     * Gets all the Sessions.
     *
     * @returns {SessionInfo[]}
     */
    getSessions(): SessionInfo[] {
        const sessionTokens = Object.keys(this._sessionsMetadata);
        const output = [];

        for (let i = 0; i < sessionTokens.length; ++i) {
            const thisSession = this._sessionsMetadata[sessionTokens[i]];
            const newSessionInfo: SessionInfo = {
                start: thisSession.events[0].timestamp,
                format: thisSession.format,
                sessionToken: sessionTokens[i],
                segments: this.getSegments(sessionTokens[i])
            };

            output.push(newSessionInfo);
        }

        output.sort((a, b) => (a.start || 0) - (b.start || 0));

        return output;
    }

    /**
     * Removes session metadata.
     *
     * @param {string} sessionToken - The session token.
     * @returns {void}
     */
    removeSession(sessionToken: string) {
        delete this._sessionsMetadata[sessionToken];
        this._saveMetadata();
    }

    /**
     * Get segments of a given Session.
     *
     * @param {string} sessionToken - The session token.
     * @returns {SegmentInfo[]}
     */
    getSegments(sessionToken: string): SegmentInfo[] {
        const thisSession = this._sessionsMetadata[sessionToken];

        if (thisSession) {
            return this._constructSegments(thisSession.events);
        }

        return [];
    }

    /**
     * Marks the start of a new segment.
     * This should be invoked by {@code RecordingAdapter}s when they need to
     * start asynchronous operations (such as switching tracks) that interrupts
     * recording.
     *
     * @param {string} sessionToken - The token of the session to start a new
     * segment in.
     * @returns {number} - Current segment index.
     */
    beginSegment(sessionToken: string): number {
        if (this._sessionsMetadata[sessionToken] === undefined) {
            logger.warn('Attempting to add segments to nonexistent'
                + ` session ${sessionToken}`);

            return -1;
        }
        this._sessionsMetadata[sessionToken].events.push({
            type: SessionEventType.SEGMENT_STARTED,
            timestamp: highPrecisionTime()
        });
        this._saveMetadata();

        return this.getSegments(sessionToken).length - 1;
    }

    /**
     * Gets the current segment index. Starting from 0 for the first
     * segment.
     *
     * @param {string} sessionToken - The session token.
     * @returns {number}
     */
    getCurrentSegmentIndex(sessionToken: string): number {
        if (this._sessionsMetadata[sessionToken] === undefined) {
            return -1;
        }
        const segments = this.getSegments(sessionToken);

        if (segments.length === 0) {
            return -1;
        }

        const lastSegment = segments[segments.length - 1];

        if (lastSegment.end) {
            // last segment is already ended
            return -1;
        }

        return segments.length - 1;
    }

    /**
     * Marks the end of the last segment in a session.
     *
     * @param {string} sessionToken - The session token.
     * @returns {void}
     */
    endSegment(sessionToken: string) {
        if (this._sessionsMetadata[sessionToken] === undefined) {
            logger.warn('Attempting to end a segment in nonexistent'
                + ` session ${sessionToken}`);
        } else {
            this._sessionsMetadata[sessionToken].events.push({
                type: SessionEventType.SEGMENT_ENDED,
                timestamp: highPrecisionTime()
            });
            this._saveMetadata();
        }
    }

    /**
     * Constructs an array of {@code SegmentInfo} from an array of
     * {@code SessionEvent}s.
     *
     * @private
     * @param {SessionEvent[]} events - The array of {@code SessionEvent}s.
     * @returns {SegmentInfo[]}
     */
    _constructSegments(events: SessionEvent[]): SegmentInfo[] {
        if (events.length === 0) {
            return [];
        }

        const output = [];
        let sessionStartTime = null;
        let currentSegment: SegmentInfo = {};

        /**
         * Helper function for adding a new {@code SegmentInfo} object to the
         * output.
         *
         * @returns {void}
         */
        function commit() {
            if (currentSegment.gapBefore === undefined
                || currentSegment.gapBefore === null) {
                if (output.length > 0 && output[output.length - 1].end) {
                    const lastSegment = output[output.length - 1];

                    if (currentSegment.start && lastSegment.end) {
                        currentSegment.gapBefore = currentSegment.start
                            - lastSegment.end;
                    } else {
                        currentSegment.gapBefore = null;
                    }
                } else if (sessionStartTime !== null && output.length === 0) {
                    currentSegment.gapBefore = currentSegment.start
                        ? currentSegment.start - sessionStartTime
                        : null;
                } else {
                    currentSegment.gapBefore = null;
                }
            }
            currentSegment.duration = currentSegment.end && currentSegment.start
                ? currentSegment.end - currentSegment.start
                : null;
            output.push(currentSegment);
            currentSegment = {};
        }

        for (let i = 0; i < events.length; ++i) {
            const currentEvent = events[i];

            switch (currentEvent.type) {
            case SessionEventType.SESSION_STARTED:
                if (sessionStartTime === null) {
                    sessionStartTime = currentEvent.timestamp;
                } else {
                    logger.warn('Unexpected SESSION_STARTED event.'
                        , currentEvent);
                }
                break;
            case SessionEventType.SEGMENT_STARTED:
                if (currentSegment.start === undefined
                    || currentSegment.start === null) {
                    currentSegment.start = currentEvent.timestamp;
                } else {
                    commit();
                    currentSegment.start = currentEvent.timestamp;
                }
                break;

            case SessionEventType.SEGMENT_ENDED:
                if (currentSegment.start === undefined
                    || currentSegment.start === null) {
                    logger.warn('Unexpected SEGMENT_ENDED event', currentEvent);
                } else {
                    currentSegment.end = currentEvent.timestamp;
                    commit();
                }
                break;

            default:
                logger.warn('Unexpected error during _constructSegments');
                break;
            }
        }
        if (currentSegment.start) {
            commit();
        }

        return output;
    }

}

/**
 * Global singleton of {@code SessionManager}.
 */
export const sessionManager = new SessionManager();

// For debug only. To remove later.
window.sessionManager = sessionManager;
