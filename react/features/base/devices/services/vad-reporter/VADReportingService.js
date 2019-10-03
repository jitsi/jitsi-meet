// @flow

import EventEmitter from 'events';
import logger from '../../logger';
import TrackVADEmitter from './TrackVADEmitter';
import { VAD_SCORE_PUBLISHED, VAD_REPORT_PUBLISHED } from './Events';
import type { VADScore } from './TrackVADEmitter';
export type { VADScore };

/**
 * Sample rate used by TrackVADEmitter, this value determines how often the ScriptProcessorNode is going to call the
 * process audio function and with what sample size.
 * Basically lower values mean more callbacks with lower processing times bigger values less callbacks with longer
 * processing times. This value is somewhere in the middle, so we strike a balance between flooding with callbacks
 * and processing time. Possible values  256, 512, 1024, 2048, 4096, 8192, 16384. Passing other values will default
 * to closes neighbor.
 */
const SCRIPT_NODE_SAMPLE_RATE = 4096;

/**
 * Context that contains the emitter and additional information about the device.
 */
type VADDeviceContext = {

    /**
     * MediaDeviceInfo for associated context
     */
    deviceInfo: MediaDeviceInfo,

    /**
     * Array with VAD scores publish from the emitter.
     */
    scoreArray: Array<VADScore>,

    /**
     * TrackVADEmitter associated with media device
     */
    vadEmitter: TrackVADEmitter
};

/**
 * The structure used by VADReportingService to relay a score report
 */
export type VADReportScore = {

    /**
     * Device ID associated with the VAD score
     */
    deviceId: string,

    /**
     * The PCM score from 0 - 1 i.e. 0.60
     */
    score: number,

    /**
     * Epoch time at which PCM was recorded
     */
    timestamp: number
};


/**
 * Voice activity detection reporting service. The service create TrackVADEmitters for the provided devices and
 * publishes an average of their VAD score over the specified interval via EventEmitter.
 * The service is not reusable if destroyed a new one needs to be created, i.e. when a new device is added to the system
 * a new service needs to be created and the old discarded.
 */
export default class VADReportingService extends EventEmitter {
    /**
     * Map containing context for devices currently being monitored by the reporting service.
     */
    _contextMap: Map<string, VADDeviceContext>;

    /**
     * State flag, check if the instance was destroyed.
     */
    _destroyed: boolean = false;

    /**
     * Delay at which to publish VAD score for monitored devices.
     */
    _intervalDelay: number;

    /**
     * Identifier for the interval publishing stats on the set interval.
     */
    _intervalId: ?IntervalID;

    /**
     * Constructor.
     *
     * @param {number} intervalDelay - Delay at which to publish VAD score for monitored devices.
     * @param {Function} publishScoreCallBack - Function called on the specific interval with the calculated VAD score.
     */
    constructor(intervalDelay: number) {
        super();
        this._contextMap = new Map();
        this._intervalDelay = intervalDelay;

        logger.log(`Constructed VADReportingService with publish interval of: ${intervalDelay}`);
    }

    /**
     * Factory methods that creates the TrackVADEmitters for the associated array of devices and instantiates
     * a VADReportingService.
     *
     * @param {Array<MediaDeviceInfo>} micDeviceList - Device list that is monitored inside the service.
     * @param {number} intervalDelay - Delay at which to publish VAD score for monitored devices.
     * @param {Function} publishScoreCallBack - Function called on the specific interval with the calculated VAD score.
     *
     * @returns {Promise<VADReportingService>}
     */
    static create(micDeviceList: Array<MediaDeviceInfo>, intervalDelay: number) {
        const vadReportingService = new VADReportingService(intervalDelay);
        const emitterPromiseArray = [];

        // Create a TrackVADEmitter for each provided audioinput device.
        for (const micDevice of micDeviceList) {
            if (micDevice.kind !== 'audioinput') {
                logger.warn(`Provided device ${micDevice.label} -> ${micDevice.deviceId}, is not audioinput ignoring!`);

                return;
            }

            logger.log(`Initializing VAD context for mic: ${micDevice.label} -> ${micDevice.deviceId}`);

            const emitterPromise = TrackVADEmitter.create(micDevice.deviceId, SCRIPT_NODE_SAMPLE_RATE).then(emitter => {
                emitter.on(VAD_SCORE_PUBLISHED, vadReportingService._devicePublishVADScore.bind(vadReportingService));

                return {
                    vadEmitter: emitter,
                    deviceInfo: micDevice,
                    scoreArray: []
                };
            });

            emitterPromiseArray.push(emitterPromise);
        }

        // Once all the TrackVADEmitter promises are resolved check if all of them resolved properly if not reject
        // the promise and clear the already created emitters.
        // $FlowFixMe - allSettled is not part of flow prototype even though it's a valid Promise function
        return Promise.allSettled(emitterPromiseArray).then(outcomeArray => {
            const vadContextArray = [];
            const rejectedEmitterPromiseArray = [];

            for (const outcome of outcomeArray) {
                if (outcome.status === 'fulfilled') {
                    vadContextArray.push(outcome.value);
                } else {
                    // Promise was rejected.
                    logger.error(`Create TrackVADEmitter promise failed with ${outcome.reason}`);

                    rejectedEmitterPromiseArray.push(outcome);
                }
            }

            // Check if there were any rejected promises and clear the already created ones list.
            if (rejectedEmitterPromiseArray.length > 0) {
                logger.error('Cleaning up remaining VADDeviceContext, due to create fail!');

                for (const context of vadContextArray) {
                    context.vadEmitter.destroy();
                }

                // Reject create promise if one emitter failed to instantiate, we might one just ignore it,
                // leaving it like this for now
                throw new Error('Create VADReportingService failed due to TrackVADEmitter creation issues!');
            }

            vadReportingService._setVADContextArray(vadContextArray);
            vadReportingService._startPublish();

            return vadReportingService;
        });
    }

    /**
     * Destroy TrackVADEmitters and clear the context map.
     *
     * @returns {void}
     */
    _clearContextMap() {
        for (const vadContext of this._contextMap.values()) {
            vadContext.vadEmitter.destroy();
        }
        this._contextMap.clear();
    }

    /**
     * Set the watched device contexts.
     *
     * @param {Array<VADDeviceContext>} vadContextArray - List of mics.
     * @returns {void}
     */
    _setVADContextArray(vadContextArray: Array<VADDeviceContext>): void {
        for (const vadContext of vadContextArray) {
            this._contextMap.set(vadContext.deviceInfo.deviceId, vadContext);
        }
    }

    /**
     * Start the setInterval reporting process.
     *
     * @returns {void}.
     */
    _startPublish() {
        logger.log('VADReportingService started publishing.');
        this._intervalId = setInterval(() => {
            this._reportVadScore();
        }, this._intervalDelay);
    }

    /**
     * Function called at set interval with selected compute. The result will be published on the set callback.
     *
     * @returns {void}
     */
    _reportVadScore() {
        const vadComputeScoreArray = [];
        const computeTimestamp = Date.now();

        // Go through each device and compute cumulated VAD score.

        for (const [ deviceId, vadContext ] of this._contextMap) {
            const nrOfVADScores = vadContext.scoreArray.length;
            let vadSum = 0;

            vadContext.scoreArray.forEach(vadScore => {
                vadSum += vadScore.score;
            });

            // TODO For now we just calculate the average score for each device, more compute algorithms will be added.
            const avgVAD = vadSum / nrOfVADScores;

            vadContext.scoreArray = [];

            vadComputeScoreArray.push({
                timestamp: computeTimestamp,
                score: avgVAD,
                deviceId
            });
        }

        this.emit(VAD_REPORT_PUBLISHED, vadComputeScoreArray);
    }

    /**
     * Callback method passed to vad emitters in order to publish their score.
     *
     * @param {VADScore} vadScore - Mic publishing the score.
     * @returns {void}
     */
    _devicePublishVADScore(vadScore: VADScore) {
        const context = this._contextMap.get(vadScore.deviceId);

        if (context) {
            context.scoreArray.push(vadScore);
        }
    }

    /**
     * Destroy the VADReportingService, stops the setInterval reporting, destroys the emitters and clears the map.
     * After this call the instance is no longer usable.
     *
     * @returns {void}.
     */
    destroy() {
        if (this._destroyed) {
            return;
        }

        logger.log('Destroying VADReportingService.');

        if (this._intervalId) {
            clearInterval(this._intervalId);
            this._intervalId = null;
        }
        this._clearContextMap();
        this._destroyed = true;
    }

}
