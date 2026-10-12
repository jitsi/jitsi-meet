import { createLowBandwidthModeChangedEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { IStore } from '../../app/types';

import { SET_LOW_BANDWIDTH_MODE } from './actionTypes';
import logger from './logger';


/**
 * Sets the low bandwidth mode flag for the current JitsiConference.
 *
 * @param {boolean} lowBandwidthMode - True if the conference should be in low bandwidth mode; false, otherwise.
 * @returns {{
 *     type: SET_LOW_BANDWIDTH_MODE,
 *     lowBandwidthMode: boolean
 * }}
 */
export function setLowBandwidthMode(lowBandwidthMode: boolean) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const { enabled: oldValue } = getState()['features/base/low-bandwidth-mode'];

        if (oldValue !== lowBandwidthMode) {
            sendAnalytics(createLowBandwidthModeChangedEvent(lowBandwidthMode));
            logger.log(`Low bandwidth mode ${lowBandwidthMode ? 'enabled' : 'disabled'}`);

            dispatch({
                type: SET_LOW_BANDWIDTH_MODE,
                lowBandwidthMode
            });

            if (typeof APP !== 'undefined') {
                // TODO This should be a temporary solution that lasts only until video
                // tracks and all ui is moved into react/redux on the web.
                APP.conference.onToggleLowBandwidthMode();
            }
        }
    };
}

/**
 * Toggles the low bandwidth mode flag for the current JitsiConference.
 *
 * @returns {Function}
 */
export function toggleLowBandwidthMode() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const { enabled } = getState()['features/base/low-bandwidth-mode'];

        dispatch(setLowBandwidthMode(!enabled));
    };
}
