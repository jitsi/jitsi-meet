// @flow

import { SET_FILMSTRIP_ENABLED } from '../../filmstrip/actionTypes';
import { SELECT_LARGE_VIDEO_PARTICIPANT } from '../../large-video/actionTypes';
import { APP_STATE_CHANGED } from '../../mobile/background/actionTypes';
import { SCREEN_SHARE_PARTICIPANTS_UPDATED, SET_TILE_VIEW } from '../../video-layout/actionTypes';
import { SET_AUDIO_ONLY } from '../audio-only/actionTypes';
import { CONFERENCE_JOINED } from '../conference/actionTypes';
import { getParticipantById } from '../participants/functions';
import { MiddlewareRegistry } from '../redux';

import logger from './logger';

declare var APP: Object;


MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case APP_STATE_CHANGED:
    case CONFERENCE_JOINED:
    case SCREEN_SHARE_PARTICIPANTS_UPDATED:
    case SELECT_LARGE_VIDEO_PARTICIPANT:
    case SET_AUDIO_ONLY:
    case SET_FILMSTRIP_ENABLED:
    case SET_TILE_VIEW:
        _updateLastN(store);
        break;
    }

    return result;
});

/**
 * Updates the last N value in the conference based on the current state of the redux store.
 *
 * @param {Store} store - The redux store.
 * @private
 * @returns {void}
 */
function _updateLastN({ getState }) {
    const state = getState();
    const { conference } = state['features/base/conference'];
    const { enabled: audioOnly } = state['features/base/audio-only'];
    const { appState } = state['features/background'];
    const { enabled: filmStripEnabled } = state['features/filmstrip'];
    const config = state['features/base/config'];

    if (!conference) {
        logger.debug('There is no active conference, not updating last N');

        return;
    }

    const defaultLastN = typeof config.channelLastN === 'undefined' ? -1 : config.channelLastN;
    let lastN = defaultLastN;

    if (appState !== 'active') {
        lastN = 0;
    } else if (audioOnly) {
        const { screenShares, tileViewEnabled } = state['features/video-layout'];
        const largeVideoParticipantId = state['features/large-video'].participantId;
        const largeVideoParticipant
            = largeVideoParticipantId ? getParticipantById(state, largeVideoParticipantId) : undefined;

        if (!tileViewEnabled && largeVideoParticipant && !largeVideoParticipant.local) {
            lastN = (screenShares || []).includes(largeVideoParticipantId) ? 1 : 0;
        } else {
            lastN = 0;
        }
    } else if (!filmStripEnabled) {
        lastN = 1;
    }

    if (conference.getLastN() === lastN) {
        return;
    }

    logger.info(`Setting last N to: ${lastN}`);

    try {
        conference.setLastN(lastN);
    } catch (err) {
        logger.error(`Failed to set lastN: ${err}`);
    }
}
