// @flow

import logger from './logger';
import TrackVADEmitter from './TrackVADEmitter';
import type { VADScore } from './TrackVADEmitter';
export type { VADScore };

const SCRIPT_NODE_SAMPLE_RATE = 4096;

/**
 * Context that contains the emitter and additional information about the device.
 */
type VADDeviceContext = {

    /**
     * TrackVADEmitter associated with media device
     */
    vadEmitter: TrackVADEmitter,

    /**
     * MediaDeviceInfo for associated context
     */
    deviceInfo: MediaDeviceInfo,

    /**
     * Array with VAD scores publish from the emitter.
     */
    scoreArray: Array<VADScore>
};

/**
 * Voice activity detection reporting service. The service create TrackVADEmitters for the provided devices and
 * publishes an average of their VAD score over the specified interval.
 * The service is not reusable if destroyed a new one needs to be created, i.e. when a new device is added to the system
 * a new service needs to be created and the old discarded.
 */
export default class VADReportingService {
    /**
     * Map containing context for devices currently being monitored by the reporting service.
     */
    _contextMap: Map<string, VADDeviceContext>;

    /**
     * Identifier for the interval publishing stats on the set interval.
     */
    _intervalId: ?IntervalID;

    /**
     * Delay at which to publish VAD score for monitored devices.
     */
    _intervalDelay: number;

    /**
     * Callback function that publishes the VAD score of each monitored device at the specified interval.
     */
    _publishScore: Function;

    /**
     * Constructor.
     *
     * @param {number} intervalDelay - Delay at which to publish VAD score for monitored devices.
     * @param {Function} publishScoreCallBack - Function called on the specific interval with the calculated VAD score.
     */
    constructor(intervalDelay: number, publishScoreCallBack: Function) {
        this._contextMap = new Map();
        this._intervalDelay = intervalDelay;
        this._publishScore = publishScoreCallBack;

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
    static create(micDeviceList: Array<MediaDeviceInfo>, intervalDelay: number, publishScoreCallBack: Function) {
        const vadReportingService = new VADReportingService(intervalDelay, publishScoreCallBack);
        const emitterPromiseArray = [];

        // Create a TrackVADEmitter for each provided audioinput device.
        micDeviceList.forEach((micDevice: Object) => {

            if (micDevice.kind !== 'audioinput') {
                logger.warn(`Provided device ${micDevice.label} -> ${micDevice.deviceId}, is not audioinput ignoring!`);

                return;
            }

            logger.log(`Initializing VAD context for mic: ${micDevice.label} -> ${micDevice.deviceId}`);

            const emitterPromise = TrackVADEmitter.create(
                micDevice.deviceId,
                SCRIPT_NODE_SAMPLE_RATE,
                vadReportingService.devicePublishVADScore.bind(vadReportingService)
            ).then(emitter => {
                return {
                    vadEmitter: emitter,
                    deviceInfo: micDevice,
                    scoreArray: []
                };
            });

            emitterPromiseArray.push(emitterPromise);
        });

        // Once all the TrackVADEmitter promises are resolved check if all of them resolved properly if not reject
        // the promise and clear the already created emitters.
        // $FlowFixMe - allSettled is not part of flow prototype even though it's a valid Promise function
        return Promise.allSettled(emitterPromiseArray).then(outcomeArray => {
            const vadContextArray = [];
            const rejectedEmitterPromiseArray = [];

            outcomeArray.forEach(outcome => {
                if (outcome.status === 'fulfilled') {
                    vadContextArray.push(outcome.value);
                } else {
                    // Promise was rejected.
                    logger.error(`Create TrackVADEmitter promise failed with ${outcome.reason}`);

                    rejectedEmitterPromiseArray.push(outcome);
                }
            });

            // Check if there were any rejected promises and clear the already created ones list.
            if (rejectedEmitterPromiseArray.length > 0) {

                logger.error('Cleaning up remaining VADDeviceContext, due to create fail!');

                vadContextArray.forEach(context => {
                    context.vadEmitter.destroy();
                });

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
        this._contextMap.forEach(vadContext => vadContext.vadEmitter.destroy());
        this._contextMap.clear();
    }

    /**
     * Set the watched device contexts.
     *
     * @param {Array<VADDeviceContext>} vadContextArray - List of mics.
     * @returns {void}
     */
    _setVADContextArray(vadContextArray: Array<VADDeviceContext>): void {
        vadContextArray.forEach((vadContext: Object) => {
            this._contextMap.set(vadContext.deviceInfo.deviceId, vadContext);
        });
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
        this._contextMap.forEach((vadContext, deviceId) => {
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
        });
        this._publishScore(vadComputeScoreArray);
    }

    /**
     * Destroy the VADReportingService, stops the setInterval reporting, destroys the emitters and clears the map.
     * After this call the instance is no longer usable.
     * TODO add state for destroyed state check.
     *
     * @returns {void}.
     */
    destroy() {
        logger.log('Destroying VADReportingService.');

        if (this._intervalId) {
            clearInterval(this._intervalId);
            this._intervalId = null;
        }
        this._clearContextMap();
    }

    /**
     * Callback method passed to vad emitters in order to publish their score.
     *
     * @param {VADScore} vadScore - Mic publishing the score.
     * @returns {void}
     */
    devicePublishVADScore(vadScore: VADScore) {
        const context = this._contextMap.get(vadScore.deviceId);

        if (context) {
            context.scoreArray.push(vadScore);
        }
    }
}
