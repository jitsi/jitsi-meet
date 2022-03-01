// @flow

import VideoLayout from '../../../modules/UI/videolayout/VideoLayout';
import { PARTICIPANT_JOINED, PARTICIPANT_LEFT } from '../base/participants';
import { MiddlewareRegistry } from '../base/redux';
import { CLIENT_RESIZED } from '../base/responsive-ui';
import { SETTINGS_UPDATED } from '../base/settings';
import {
    getCurrentLayout,
    LAYOUTS
} from '../video-layout';

import { SET_USER_FILMSTRIP_WIDTH } from './actionTypes';
import {
    setFilmstripWidth,
    setHorizontalViewDimensions,
    setTileViewDimensions,
    setVerticalViewDimensions
} from './actions';
import { DEFAULT_FILMSTRIP_WIDTH, MIN_STAGE_VIEW_WIDTH } from './constants';
import { updateRemoteParticipants, updateRemoteParticipantsOnLeave } from './functions';
import { isFilmstripResizable } from './functions.web';
import './subscriber';

/**
 * The middleware of the feature Filmstrip.
 */
MiddlewareRegistry.register(store => next => action => {
    if (action.type === PARTICIPANT_LEFT) {
        // This has to be executed before we remove the participant from features/base/participants state in order to
        // remove the related thumbnail component before we need to re-render it. If we do this after next()
        // we will be in sitation where the participant exists in the remoteParticipants array in features/filmstrip
        // but doesn't exist in features/base/participants state which will lead to rendering a thumbnail for
        // non-existing participant.
        updateRemoteParticipantsOnLeave(store, action.participant?.id);
    }

    const result = next(action);

    switch (action.type) {
    case CLIENT_RESIZED: {
        const state = store.getState();
        const layout = getCurrentLayout(state);

        switch (layout) {
        case LAYOUTS.TILE_VIEW: {
            store.dispatch(setTileViewDimensions());
            break;
        }
        case LAYOUTS.HORIZONTAL_FILMSTRIP_VIEW:
            store.dispatch(setHorizontalViewDimensions());
            break;

        case LAYOUTS.VERTICAL_FILMSTRIP_VIEW:
            store.dispatch(setVerticalViewDimensions());
            break;
        }

        if (isFilmstripResizable(state)) {
            const { width: filmstripWidth } = state['features/filmstrip'];
            const { clientWidth } = action;
            let width;

            if (filmstripWidth.current > clientWidth - MIN_STAGE_VIEW_WIDTH) {
                width = Math.max(clientWidth - MIN_STAGE_VIEW_WIDTH, DEFAULT_FILMSTRIP_WIDTH);
            } else {
                width = Math.min(clientWidth - MIN_STAGE_VIEW_WIDTH, filmstripWidth.userSet);
            }

            if (width !== filmstripWidth.current) {
                store.dispatch(setFilmstripWidth(width));
            }
        }
        break;
    }
    case PARTICIPANT_JOINED: {
        if (action.participant?.isLocalScreenShare) {
            break;
        }

        updateRemoteParticipants(store, action.participant?.id);
        break;
    }
    case SETTINGS_UPDATED: {
        if (typeof action.settings?.localFlipX === 'boolean') {
            // TODO: This needs to be removed once the large video is Reactified.
            VideoLayout.onLocalFlipXChanged();
        }
        break;
    }
    case SET_USER_FILMSTRIP_WIDTH: {
        VideoLayout.refreshLayout();
    }
    }

    return result;
});
