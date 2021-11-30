// @flow

import debounce from 'lodash/debounce';

import { SET_FILMSTRIP_ENABLED } from '../../filmstrip/actionTypes';
import { SELECT_LARGE_VIDEO_PARTICIPANT } from '../../large-video/actionTypes';
import { APP_STATE_CHANGED } from '../../mobile/background/actionTypes';
import { SCREEN_SHARE_REMOTE_PARTICIPANTS_UPDATED, SET_TILE_VIEW } from '../../video-layout/actionTypes';
import { SET_AUDIO_ONLY } from '../audio-only/actionTypes';
import { CONFERENCE_JOINED } from '../conference/actionTypes';
import {
    PARTICIPANT_JOINED,
    PARTICIPANT_KICKED,
    PARTICIPANT_LEFT
} from '../participants/actionTypes';
import {
    getParticipantById,
    getParticipantCount
} from '../participants/functions';
import { MiddlewareRegistry } from '../redux';
import { isLocalVideoTrackDesktop } from '../tracks/functions';

import { SET_CONFIG_LAST_N } from './actionTypes';
import { setAppliedLastN } from './actions';
import { limitLastN } from './functions';
import logger from './logger';

/**
 * Updates the last N value in the conference based on the current state of the redux store.
 *
 * @param {Store} store - The redux store.
 * @private
 * @returns {void}
 */
const _updateAppliedLastN = debounce(({ dispatch, getState }) => {
    const state = getState();
    const { conference } = state['features/base/conference'];

    if (!conference) {
        logger.debug('There is no active conference, not updating last N');

        return;
    }

    const { enabled: audioOnly } = state['features/base/audio-only'];
    const { appState } = state['features/background'] || {};
    const { enabled: filmStripEnabled } = state['features/filmstrip'];
    const config = state['features/base/config'];
    const { lastNLimits, configLastN } = state['features/base/lastn'];
    const participantCount = getParticipantCount(state);

    // Select the lastN value based on the following preference order.
    // 1. The last-n value in redux.
    // 2. The last-n value from 'startLastN' if it is specified in config.js
    // 3. The last-n value from 'channelLastN' if specified in config.js.
    // 4. -1 as the default value.
    let newAppliedLastN = configLastN || (config.startLastN ?? (config.channelLastN ?? -1));

    // Apply last N limit based on the # of participants and config settings.
    const limitedLastN = limitLastN(participantCount, lastNLimits);

    if (limitedLastN !== undefined) {
        newAppliedLastN = newAppliedLastN === -1 ? limitedLastN : Math.min(limitedLastN, newAppliedLastN);
    }

    if (typeof appState !== 'undefined' && appState !== 'active') {
        newAppliedLastN = isLocalVideoTrackDesktop(state) ? 1 : 0;
    } else if (audioOnly) {
        const { remoteScreenShares, tileViewEnabled } = state['features/video-layout'];
        const largeVideoParticipantId = state['features/large-video'].participantId;
        const largeVideoParticipant
            = largeVideoParticipantId ? getParticipantById(state, largeVideoParticipantId) : undefined;

        // Use tileViewEnabled state from redux here instead of determining if client should be in tile
        // view since we make an exception only for screenshare when in audio-only mode. If the user unpins
        // the screenshare, lastN will be set to 0 here. It will be set to 1 if screenshare has been auto pinned.
        if (!tileViewEnabled && largeVideoParticipant && !largeVideoParticipant.local) {
            newAppliedLastN = (remoteScreenShares || []).includes(largeVideoParticipantId) ? 1 : 0;
        } else {
            newAppliedLastN = 0;
        }
    } else if (!filmStripEnabled) {
        newAppliedLastN = 1;
    }

    dispatch(setAppliedLastN(newAppliedLastN));
}, 1000); /* Don't send this more often than once a second. */


MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case APP_STATE_CHANGED:
    case CONFERENCE_JOINED:
    case PARTICIPANT_JOINED:
    case PARTICIPANT_KICKED:
    case PARTICIPANT_LEFT:
    case SCREEN_SHARE_REMOTE_PARTICIPANTS_UPDATED:
    case SELECT_LARGE_VIDEO_PARTICIPANT:
    case SET_AUDIO_ONLY:
    case SET_FILMSTRIP_ENABLED:
    case SET_TILE_VIEW:
    case SET_CONFIG_LAST_N:
        _updateAppliedLastN(store);
        break;
    }

    return result;
});
