import { createAudioOnlyChangedEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { IStore } from '../../app/types';

import { SET_AUDIO_ONLY } from './actionTypes';
import logger from './logger';


/**
 * Sets the audio-only flag for the current JitsiConference.
 *
 * @param {boolean} audioOnly - True if the conference should be audio only; false, otherwise.
 * @returns {{
 *     type: SET_AUDIO_ONLY,
 *     audioOnly: boolean
 * }}
 */
export function setAudioOnly(audioOnly: boolean) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const { enabled: oldValue } = getState()['features/base/audio-only'];

        if (oldValue !== audioOnly) {
            sendAnalytics(createAudioOnlyChangedEvent(audioOnly));
            logger.log(`Audio-only ${audioOnly ? 'enabled' : 'disabled'}`);

            dispatch({
                type: SET_AUDIO_ONLY,
                audioOnly
            });

            if (typeof APP !== 'undefined') {
                // TODO This should be a temporary solution that lasts only until video
                // tracks and all ui is moved into react/redux on the web.
                APP.conference.onToggleAudioOnly();
            }
        }
    };
}

/**
 * Toggles the audio-only flag for the current JitsiConference.
 *
 * @returns {Function}
 */
export function toggleAudioOnly() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const { enabled } = getState()['features/base/audio-only'];

        dispatch(setAudioOnly(!enabled));
    };
}
