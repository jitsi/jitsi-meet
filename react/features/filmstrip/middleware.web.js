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

import {
    setHorizontalViewDimensions,
    setTileViewDimensions,
    setVerticalViewDimensions
} from './actions';
import { updateRemoteParticipants, updateRemoteParticipantsOnLeave } from './functions';
import './subscriber';

/**
 * The middleware of the feature Filmstrip.
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case CLIENT_RESIZED: {
        const state = store.getState();
        const layout = getCurrentLayout(state);

        switch (layout) {
        case LAYOUTS.TILE_VIEW: {
            const { gridDimensions } = state['features/filmstrip'].tileViewDimensions;

            store.dispatch(setTileViewDimensions(gridDimensions));
            break;
        }
        case LAYOUTS.HORIZONTAL_FILMSTRIP_VIEW:
            store.dispatch(setHorizontalViewDimensions());
            break;

        case LAYOUTS.VERTICAL_FILMSTRIP_VIEW:
            store.dispatch(setVerticalViewDimensions());
            break;
        }
        break;
    }
    case PARTICIPANT_JOINED: {
        updateRemoteParticipants(store, action.participant?.id);
        break;
    }
    case PARTICIPANT_LEFT: {
        updateRemoteParticipantsOnLeave(store, action.participant?.id);
        break;
    }
    case SETTINGS_UPDATED: {
        if (typeof action.settings?.localFlipX === 'boolean') {
            // TODO: This needs to be removed once the large video is Reactified.
            VideoLayout.onLocalFlipXChanged();
        }
        break;
    }
    }

    return result;
});
