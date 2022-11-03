import 'image-capture';
import './createImageBitmap';
import { IStore } from '../app/types';
import { getLocalVideoTrack } from '../base/tracks/functions';
import { getBaseUrl } from '../base/util/helpers';

import {
    addFaceExpression,
    clearFaceExpressionBuffer,
    faceLandmarkDetectionStopped,
    newFaceBox
} from './actions';
import {
    DETECTION_TYPES,
    DETECT_FACE,
    FACE_LANDMARK_DETECTION_ERROR_THRESHOLD,
    INIT_WORKER,
    WEBHOOK_SEND_TIME_INTERVAL
} from './constants';
import {
    getDetectionInterval,
    getFaceExpressionDuration,
    sendFaceExpressionsWebhook
} from './functions';
import logger from './logger';

/**
 * Class for face language detection.
 */
class FaceLandmarksDetector {
    private static instance: FaceLandmarksDetector;
    private initialized = false;
    private imageCapture: ImageCapture | null = null;
    private worker: Worker | null = null;
    private lastFaceExpression: string | null = null;
    private lastFaceExpressionTimestamp: number | null = null;
    private duplicateConsecutiveExpressions = 0;
    private webhookSendInterval: number | null = null;
    private detectionInterval: number | null = null;
    private recognitionActive = false;
    private canvas?: HTMLCanvasElement;
    private context?: CanvasRenderingContext2D | null;
    private errorCount = 0;

    /**
     * Constructor for class, checks if the environment supports OffscreenCanvas.
    */
    private constructor() {
        if (typeof OffscreenCanvas === 'undefined') {
            this.canvas = document.createElement('canvas');
            this.context = this.canvas.getContext('2d');
        }
    }

    /**
     * Function for retrieving the FaceLandmarksDetector instance.
     *
     * @returns {FaceLandmarksDetector} - FaceLandmarksDetector instance.
     */
    public static getInstance(): FaceLandmarksDetector {
        if (!FaceLandmarksDetector.instance) {
            FaceLandmarksDetector.instance = new FaceLandmarksDetector();
        }

        return FaceLandmarksDetector.instance;
    }

    /**
     * Returns if the detected environment is initialized.
     *
     * @returns {boolean}
     */
    isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * Initialization function: the worker is loaded and initialized, and then if possible the detection stats.
     *
     * @param {IStore} store - Redux store with dispatch and getState methods.
     * @returns {void}
    */
    init({ dispatch, getState }: IStore) {
        if (this.isInitialized()) {
            logger.info('Worker has already been initialized');

            return;
        }

        if (navigator.product === 'ReactNative') {
            logger.warn('Unsupported environment for face detection');

            return;
        }

        const baseUrl = `${getBaseUrl()}libs/`;
        let workerUrl = `${baseUrl}face-landmarks-worker.min.js`;

        // @ts-ignore
        const workerBlob = new Blob([ `importScripts("${workerUrl}");` ], { type: 'application/javascript' });

        // @ts-ignore
        workerUrl = window.URL.createObjectURL(workerBlob);
        this.worker = new Worker(workerUrl, { name: 'Face Recognition Worker' });
        this.worker.onmessage = ({ data }: MessageEvent<any>) => {
            const { faceExpression, faceBox } = data;

            if (faceExpression) {
                if (faceExpression === this.lastFaceExpression) {
                    this.duplicateConsecutiveExpressions++;
                } else {
                    if (this.lastFaceExpression && this.lastFaceExpressionTimestamp) {
                        dispatch(addFaceExpression(
                            this.lastFaceExpression,
                            getFaceExpressionDuration(getState(), this.duplicateConsecutiveExpressions + 1),
                            this.lastFaceExpressionTimestamp
                        ));
                    }
                    this.lastFaceExpression = faceExpression;
                    this.lastFaceExpressionTimestamp = Date.now();
                    this.duplicateConsecutiveExpressions = 0;
                }
            }

            if (faceBox) {
                dispatch(newFaceBox(faceBox));
            }

            APP.API.notifyFaceLandmarkDetected(faceBox, faceExpression);
        };

        const { faceLandmarks } = getState()['features/base/config'];
        const detectionTypes = [
            faceLandmarks?.enableFaceCentering && DETECTION_TYPES.FACE_BOX,
            faceLandmarks?.enableFaceExpressionsDetection && DETECTION_TYPES.FACE_EXPRESSIONS
        ].filter(Boolean);

        this.worker.postMessage({
            type: INIT_WORKER,
            baseUrl,
            detectionTypes
        });
        this.initialized = true;

        this.startDetection({
            dispatch,
            getState
        });
    }

    /**
     * The function which starts the detection process.
     *
     * @param {IStore} store - Redux store with dispatch and getState methods.
     * @param {any} track - Track from middleware; can be undefined.
     * @returns {void}
    */
    startDetection({ dispatch, getState }: IStore, track?: any) {
        if (!this.isInitialized()) {
            logger.info('Worker has not been initialized');

            return;
        }

        if (this.recognitionActive) {
            logger.log('Face detection already active.');

            return;
        }
        const state = getState();
        const localVideoTrack = track || getLocalVideoTrack(state['features/base/tracks']);

        if (localVideoTrack === undefined) {
            logger.warn('Face landmarks detection is disabled due to missing local track.');

            return;
        }
        const stream = localVideoTrack.jitsiTrack.getOriginalStream();
        const firstVideoTrack = stream.getVideoTracks()[0];

        this.imageCapture = new ImageCapture(firstVideoTrack);
        this.recognitionActive = true;
        logger.log('Start face detection');

        const { faceLandmarks } = state['features/base/config'];

        this.detectionInterval = window.setInterval(() => {

            if (this.worker && this.imageCapture) {
                this.sendDataToWorker(
                    faceLandmarks?.faceCenteringThreshold
                ).then(status => {
                    if (status) {
                        this.errorCount = 0;
                    } else if (++this.errorCount > FACE_LANDMARK_DETECTION_ERROR_THRESHOLD) {
                        /* this prevents the detection from stopping immediately after occurring an error
                         * sometimes due to the small detection interval when starting the detection some errors
                         * might occur due to the track not being ready
                        */
                        this.stopDetection({
                            dispatch,
                            getState
                        });
                    }
                });
            }
        }, getDetectionInterval(state));

        const { webhookProxyUrl } = state['features/base/config'];

        if (faceLandmarks?.enableFaceExpressionsDetection && webhookProxyUrl) {
            this.webhookSendInterval = window.setInterval(async () => {
                const result = await sendFaceExpressionsWebhook(getState());

                if (result) {
                    dispatch(clearFaceExpressionBuffer());
                }
            }, WEBHOOK_SEND_TIME_INTERVAL);
        }
    }

    /**
     * The function which stops the detection process.
     *
     * @param {IStore} store - Redux store with dispatch and getState methods.
     * @returns {void}
    */
    stopDetection({ dispatch, getState }: IStore) {
        if (!this.recognitionActive || !this.isInitialized()) {
            return;
        }

        if (this.lastFaceExpression && this.lastFaceExpressionTimestamp) {
            dispatch(
                addFaceExpression(
                    this.lastFaceExpression,
                    getFaceExpressionDuration(getState(), this.duplicateConsecutiveExpressions + 1),
                    this.lastFaceExpressionTimestamp
                )
            );
            this.duplicateConsecutiveExpressions = 0;
            this.lastFaceExpression = null;
            this.lastFaceExpressionTimestamp = null;
        }

        this.webhookSendInterval && window.clearInterval(this.webhookSendInterval);
        this.detectionInterval && window.clearInterval(this.detectionInterval);
        this.webhookSendInterval = null;
        this.detectionInterval = null;
        this.imageCapture = null;
        this.recognitionActive = false;
        dispatch(faceLandmarkDetectionStopped(Date.now()));
        logger.log('Stop face detection');
    }

    /**
     * Sends the image data a canvas from the track in the image capture to the face detection worker.
     *
     * @param {number} faceCenteringThreshold  - Movement threshold as percentage for sharing face coordinates.
     * @returns {Promise<boolean>} - True if sent, false otherwise.
     */
    private async sendDataToWorker(faceCenteringThreshold = 10): Promise<boolean> {
        if (!this.imageCapture
            || !this.worker
            || !this.imageCapture?.track
            || this.imageCapture?.track.readyState !== 'live') {
            logger.log('Environment not ready! Could not send data to worker');

            return false;
        }

        let imageBitmap;
        let image;

        try {
            imageBitmap = await this.imageCapture.grabFrame();
        } catch (err) {
            logger.log('Could not send data to worker');

            return false;
        }

        if (typeof OffscreenCanvas === 'undefined' && this.canvas && this.context) {
            this.canvas.width = imageBitmap.width;
            this.canvas.height = imageBitmap.height;
            this.context.drawImage(imageBitmap, 0, 0);
            image = this.context.getImageData(0, 0, imageBitmap.width, imageBitmap.height);
        } else {
            image = imageBitmap;
        }

        this.worker.postMessage({
            type: DETECT_FACE,
            image,
            threshold: faceCenteringThreshold
        });

        imageBitmap.close();

        return true;
    }
}

export default FaceLandmarksDetector.getInstance();

