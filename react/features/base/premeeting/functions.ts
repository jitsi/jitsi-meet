import { findIndex } from 'lodash-es';

import { IReduxState } from '../../app/types';

import { CONNECTION_TYPE } from './constants';
import logger from './logger';
import { IPreCallResult, PreCallTestStatus } from './types';


/**
 * The avatar size to container size ration.
 */
const ratio = 1 / 3;

/**
 * The max avatar size.
 */
const maxSize = 190;

/**
 * The window limit height over which the avatar should have the default dimension.
 */
const upperHeightLimit = 760;

/**
 * The window limit height under which the avatar should not be resized anymore.
 */
const lowerHeightLimit = 460;

/**
 * The default top margin of the avatar.
 */
const defaultMarginTop = '10%';

/**
 * The top margin of the avatar when its dimension is small.
 */
const smallMarginTop = '5%';

// loss in percentage overall the test duration
const LOSS_AUDIO_THRESHOLDS = [ 0.33, 0.05 ];
const LOSS_VIDEO_THRESHOLDS = [ 0.33, 0.1, 0.05 ];

// throughput in kbps
const THROUGHPUT_AUDIO_THRESHOLDS = [ 8, 20 ];
const THROUGHPUT_VIDEO_THRESHOLDS = [ 60, 750 ];

/**
 * Calculates avatar dimensions based on window height and position.
 *
 * @param {number} height - The window height.
 * @returns {{
 *   marginTop: string,
 *   size: number
 * }}
 */
export function calculateAvatarDimensions(height: number) {
    if (height > upperHeightLimit) {
        return {
            size: maxSize,
            marginTop: defaultMarginTop
        };
    }

    if (height > lowerHeightLimit) {
        const diff = height - lowerHeightLimit;
        const percent = diff * ratio;
        const size = Math.floor(maxSize * percent / 100);
        let marginTop = defaultMarginTop;

        if (height < 600) {
            marginTop = smallMarginTop;
        }

        return {
            size,
            marginTop
        };
    }

    return {
        size: 0,
        marginTop: '0'
    };
}

/**
 * Returns the level based on a list of thresholds.
 *
 * @param {number[]} thresholds - The thresholds array.
 * @param {number} value - The value against which the level is calculated.
 * @param {boolean} descending - The order based on which the level is calculated.
 *
 * @returns {number}
 */
function _getLevel(thresholds: number[], value: number, descending = true) {
    let predicate;

    if (descending) {
        predicate = function(threshold: number) {
            return value > threshold;
        };
    } else {
        predicate = function(threshold: number) {
            return value < threshold;
        };
    }

    const i = findIndex(thresholds, predicate);

    if (i === -1) {
        return thresholds.length;
    }

    return i;
}

/**
 * Returns the connection details from the test results.
 *
 * @param {number} testResults.fractionalLoss - Factional loss.
 * @param {number} testResults.throughput - Throughput.
 *
 * @returns {{
*   connectionType: string,
*   connectionDetails: string[]
* }}
*/
function _getConnectionDataFromTestResults({ fractionalLoss: l, throughput: t, mediaConnectivity }: IPreCallResult) {
    let connectionType = CONNECTION_TYPE.FAILED;
    const connectionDetails: Array<string> = [];

    if (!mediaConnectivity) {
        connectionType = CONNECTION_TYPE.POOR;
        connectionDetails.push('prejoin.connectionDetails.noMediaConnectivity');

        return {
            connectionType,
            connectionDetails
        };
    }

    const loss = {
        audioQuality: _getLevel(LOSS_AUDIO_THRESHOLDS, l),
        videoQuality: _getLevel(LOSS_VIDEO_THRESHOLDS, l)
    };
    const throughput = {
        audioQuality: _getLevel(THROUGHPUT_AUDIO_THRESHOLDS, t, false),
        videoQuality: _getLevel(THROUGHPUT_VIDEO_THRESHOLDS, t, false)
    };

    if (throughput.audioQuality === 0 || loss.audioQuality === 0) {
        // Calls are impossible.
        connectionType = CONNECTION_TYPE.POOR;
        connectionDetails.push('prejoin.connectionDetails.veryPoorConnection');
    } else if (
        throughput.audioQuality === 2
       && throughput.videoQuality === 2
       && loss.audioQuality === 2
       && loss.videoQuality === 3
    ) {
        // Ideal conditions for both audio and video. Show only one message.
        connectionType = CONNECTION_TYPE.GOOD;
        connectionDetails.push('prejoin.connectionDetails.goodQuality');
    } else {
        connectionType = CONNECTION_TYPE.NON_OPTIMAL;

        if (throughput.audioQuality === 1) {
            // Minimum requirements for a call are met.
            connectionDetails.push('prejoin.connectionDetails.audioLowNoVideo');
        } else {
            // There are two paragraphs: one saying something about audio and the other about video.
            if (loss.audioQuality === 1) {
                connectionDetails.push('prejoin.connectionDetails.audioClipping');
            } else {
                connectionDetails.push('prejoin.connectionDetails.audioHighQuality');
            }

            if (throughput.videoQuality === 0 || loss.videoQuality === 0) {
                connectionDetails.push('prejoin.connectionDetails.noVideo');
            } else if (throughput.videoQuality === 1) {
                connectionDetails.push('prejoin.connectionDetails.videoLowQuality');
            } else if (loss.videoQuality === 1) {
                connectionDetails.push('prejoin.connectionDetails.videoFreezing');
            } else if (loss.videoQuality === 2) {
                connectionDetails.push('prejoin.connectionDetails.videoTearing');
            } else {
                connectionDetails.push('prejoin.connectionDetails.videoHighQuality');
            }
        }
        connectionDetails.push('prejoin.connectionDetails.undetectable');
    }

    return {
        connectionType,
        connectionDetails
    };
}

/**
 * Selector for determining the connection type & details.
 *
 * @param {Object} state - The state of the app.
 * @returns {{
*   connectionType: string,
*   connectionDetails: string[]
* }}
*/
export function getConnectionData(state: IReduxState) {
    const { preCallTestState: { status, result } } = state['features/base/premeeting'];

    switch (status) {
    case PreCallTestStatus.INITIAL:
        return {
            connectionType: CONNECTION_TYPE.NONE,
            connectionDetails: []
        };
    case PreCallTestStatus.RUNNING:
        return {
            connectionType: CONNECTION_TYPE.RUNNING,
            connectionDetails: []
        };
    case PreCallTestStatus.FAILED:
        // A failed test means that something went wrong with our business logic and not necessarily
        // that the connection is bad. For instance, the endpoint providing the ICE credentials could be down.
        return {
            connectionType: CONNECTION_TYPE.FAILED,
            connectionDetails: [ 'prejoin.connectionDetails.testFailed' ]
        };
    case PreCallTestStatus.FINISHED:
        if (result) {
            return _getConnectionDataFromTestResults(result);
        }

        logger.error('Pre-call test finished but no test results were available');

        return {
            connectionType: CONNECTION_TYPE.FAILED,
            connectionDetails: [ 'prejoin.connectionDetails.testFailed' ]
        };
    default:
        return {
            connectionType: CONNECTION_TYPE.NONE,
            connectionDetails: []
        };
    }
}

/**
 * Selector for determining if the pre-call test is enabled.
 *
 * @param {Object} state - The state of the app.
 * @returns {boolean}
 */
export function isPreCallTestEnabled(state: IReduxState): boolean {
    const { prejoinConfig } = state['features/base/config'];

    return prejoinConfig?.preCallTestEnabled ?? false;
}

/**
 * Selector for retrieving the pre-call test ICE URL.
 *
 * @param {Object} state - The state of the app.
 * @returns {string | undefined}
 */
export function getPreCallICEUrl(state: IReduxState): string | undefined {
    const { prejoinConfig } = state['features/base/config'];

    return prejoinConfig?.preCallTestICEUrl;
}
