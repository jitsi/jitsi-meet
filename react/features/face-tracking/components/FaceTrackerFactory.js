import FaceTracker from './FaceTracker';

/**
 * Class to manage a collection of FaceTracker instances.
 */
class FaceTrackerFactory {
    /**
     * Initializes the collection of FaceTracker instances.
     */
    constructor() {
        this._faceTrackers = new Map();
    }

    /**
     * Whether the factory holds a FaceTracker object, whose key
     * is videoElement.
     *
     * @param {Object} videoElement - The video element for face tracking.
     * @returns {boolean}
     */
    hasFaceTracker(videoElement) {
        return this._faceTrackers.has(videoElement);
    }

    /**
     * Adds a FaceTracker instance with input parameters.
     *
     * @param {Object} videoElement - The video element for face tracking.
     * @param {Object} options - The options for FaceTracker.
     * @returns {void}
     */
    addFaceTracker(videoElement, options) {
        this._faceTrackers.set(videoElement, new FaceTracker(options));
    }

    /**
     * Gets the FaceTracker instance whose key is videoElement.
     *
     * @param {Object} videoElement - The video element for face tracking.
     * @returns {Object}
     */
    getFaceTracker(videoElement) {
        return this._faceTrackers.get(videoElement);
    }
}

export default FaceTrackerFactory;
