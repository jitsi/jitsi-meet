// @flow

import { getConferenceState } from '../base/conference';
import { MiddlewareRegistry } from '../base/redux';

import { ADD_MODERATED_AUDIO_EXCEPTION, DISABLE_MODERATED_AUDIO, ENABLE_MODERATED_AUDIO } from './constants';

declare var APP: Object;

MiddlewareRegistry.register(store => next => action => {
    const { payload, type } = action;

    switch (type) {
    case ADD_MODERATED_AUDIO_EXCEPTION: {
        const { conference } = getConferenceState(store.getState());

        conference.addModeratedAudioException(payload);

        break;
    }

    case DISABLE_MODERATED_AUDIO: {
        const { conference } = getConferenceState(store.getState());

        conference.disableModeratedAudio();

        break;
    }

    case ENABLE_MODERATED_AUDIO: {
        const { conference } = getConferenceState(store.getState());

        conference.enableModeratedAudio();

        break;
    }

    default:
        break;
    }

    return next(action);
});
