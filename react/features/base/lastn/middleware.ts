import { debounce } from 'lodash-es';

import { IStore } from '../../app/types';
import { SET_FILMSTRIP_ENABLED } from '../../filmstrip/actionTypes';
import { APP_STATE_CHANGED } from '../../mobile/background/actionTypes';
import {
    SET_CAR_MODE,
    VIRTUAL_SCREENSHARE_REMOTE_PARTICIPANTS_UPDATED
} from '../../video-layout/actionTypes';
import { SET_AUDIO_ONLY } from '../audio-only/actionTypes';
import { CONFERENCE_JOINED } from '../conference/actionTypes';
import { getParticipantById } from '../participants/functions';
import MiddlewareRegistry from '../redux/MiddlewareRegistry';

import { setLastN } from './actions';
import logger from './logger';

/**
 * Updates the last N value in the conference based on the current state of the redux store.
 *
 * @param {Store} store - The redux store.
 * @private
 * @returns {void}
 */
const _updateLastN = debounce(({ dispatch, getState }: IStore) => {
    const state = getState();
    const { conference } = state['features/base/conference'];

    if (!conference) {
        logger.debug('There is no active conference, not updating last N');

        return;
    }

    const { enabled: audioOnly } = state['features/base/audio-only'];
    const { appState } = state['features/mobile/background'] || {};
    const { enabled: filmStripEnabled } = state['features/filmstrip'];
    const config = state['features/base/config'];
    const { carMode } = state['features/video-layout'];

    // Select the (initial) lastN value based on the following preference order.
    // 1. The last-n value from 'startLastN' if it is specified in config.js
    // 2. The last-n value from 'channelLastN' if specified in config.js.
    // 3. -1 as the default value.
    let lastNSelected = config.startLastN ?? (config.channelLastN ?? -1);

    // Because this is shared, on web appState is always undefined,
    // meaning that it is never active
    if (navigator.product === 'ReactNative' && (appState !== 'active' || carMode)) {
        lastNSelected = 0;
    } else if (audioOnly) {
        const { remoteScreenShares, tileViewEnabled } = state['features/video-layout'];
        const largeVideoParticipantId = state['features/large-video'].participantId;
        const largeVideoParticipant
            = largeVideoParticipantId ? getParticipantById(state, largeVideoParticipantId) : undefined;

        // Use tileViewEnabled state from redux here instead of determining if client should be in tile
        // view since we make an exception only for screenshare when in audio-only mode. If the user unpins
        // the screenshare, lastN will be set to 0 here. It will be set to 1 if screenshare has been auto pinned.
        if (!tileViewEnabled && largeVideoParticipant && !largeVideoParticipant.local) {
            lastNSelected = (remoteScreenShares || []).includes(largeVideoParticipantId ?? '') ? 1 : 0;
        } else {
            lastNSelected = 0;
        }
    } else if (!filmStripEnabled) {
        lastNSelected = 1;
    }

    const { lastN } = state['features/base/lastn'];

    if (lastN !== lastNSelected) {
        dispatch(setLastN(lastNSelected));
    }
}, 1000); /* Don't send this more often than once a second. */


MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case APP_STATE_CHANGED:
    case CONFERENCE_JOINED:
    case SET_AUDIO_ONLY:
    case SET_CAR_MODE:
    case SET_FILMSTRIP_ENABLED:
    case VIRTUAL_SCREENSHARE_REMOTE_PARTICIPANTS_UPDATED:
        _updateLastN(store);
        break;
    }

    return result;
});
