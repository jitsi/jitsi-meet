import { IReduxState } from '../../app/types';

import { CONFERENCE_INFO } from './constants';

/**
 * Retrieves the conference info labels based on config values and defaults.
 *
 * @param {Object} state - The redux state.
 * @returns {Object} The conferenceInfo object.
 */
export const getConferenceInfo = (state: IReduxState) => {
    const { conferenceInfo } = state['features/base/config'];

    if (conferenceInfo) {
        return {
            alwaysVisible: conferenceInfo.alwaysVisible ?? CONFERENCE_INFO.alwaysVisible,
            autoHide: conferenceInfo.autoHide ?? CONFERENCE_INFO.autoHide
        };
    }

    return CONFERENCE_INFO;
};
