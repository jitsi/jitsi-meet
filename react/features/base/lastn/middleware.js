// @flow

import { getLogger } from 'jitsi-meet-logger';

import { SET_FILMSTRIP_ENABLED } from '../../filmstrip/actionTypes';
import { APP_STATE_CHANGED } from '../../mobile/background/actionTypes';

import { SET_AUDIO_ONLY } from '../audio-only';
import { CONFERENCE_JOINED } from '../conference/actionTypes';
import { MiddlewareRegistry } from '../redux';

declare var APP: Object;
const logger = getLogger('features/base/lastn');


MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case APP_STATE_CHANGED:
    case CONFERENCE_JOINED:
    case SET_AUDIO_ONLY:
    case SET_FILMSTRIP_ENABLED:
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

    if (audioOnly || appState !== 'active') {
        lastN = 0;
    } else if (!filmStripEnabled) {
        lastN = 1;
    }

    logger.info(`Setting last N to: ${lastN}`);

    try {
        conference.setLastN(lastN);
    } catch (err) {
        logger.error(`Failed to set lastN: ${err}`);
    }
}
