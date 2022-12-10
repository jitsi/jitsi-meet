import _ from 'lodash';

import { IStore } from '../../app/types';
import { getCurrentConference } from '../conference/functions';
import {
    getMultipleVideoSendingSupportFeatureFlag
} from '../config/functions.any';
import StateListenerRegistry from '../redux/StateListenerRegistry';

import { createVirtualScreenshareParticipant, participantLeft } from './actions';
import { FakeParticipant } from './types';

StateListenerRegistry.register(
    /* selector */ state => state['features/base/tracks'],
    /* listener */(tracks, store) => _updateScreenshareParticipants(store)
);

/**
 * Handles creating and removing virtual screenshare participants.
 *
 * @param {*} store - The redux store.
 * @returns {void}
 */
function _updateScreenshareParticipants({ getState, dispatch }: IStore) {
    const state = getState();
    const conference = getCurrentConference(state);
    const tracks = state['features/base/tracks'];
    const { sortedRemoteVirtualScreenshareParticipants, localScreenShare } = state['features/base/participants'];
    const previousScreenshareSourceNames = [ ...sortedRemoteVirtualScreenshareParticipants.keys() ];

    let newLocalSceenshareSourceName;

    const currentScreenshareSourceNames = tracks.reduce((acc: string[], track) => {
        if (track.videoType === 'desktop' && !track.jitsiTrack.isMuted()) {
            const sourceName: string = track.jitsiTrack.getSourceName();

            if (track.local) {
                newLocalSceenshareSourceName = sourceName;
            } else {
                acc.push(sourceName);
            }
        }

        return acc;
    }, []);

    if (getMultipleVideoSendingSupportFeatureFlag(state)) {
        if (!localScreenShare && newLocalSceenshareSourceName) {
            dispatch(createVirtualScreenshareParticipant(newLocalSceenshareSourceName, true, conference));
        }

        if (localScreenShare && !newLocalSceenshareSourceName) {
            dispatch(participantLeft(localScreenShare.id, conference, {
                fakeParticipant: FakeParticipant.LocalScreenShare,
                isReplaced: undefined
            }));
        }
    }

    const removedScreenshareSourceNames = _.difference(previousScreenshareSourceNames, currentScreenshareSourceNames);
    const addedScreenshareSourceNames = _.difference(currentScreenshareSourceNames, previousScreenshareSourceNames);

    if (removedScreenshareSourceNames.length) {
        removedScreenshareSourceNames.forEach(id => dispatch(participantLeft(id, conference, {
            fakeParticipant: FakeParticipant.RemoteScreenShare,
            isReplaced: undefined
        })));
    }

    if (addedScreenshareSourceNames.length) {
        addedScreenshareSourceNames.forEach(id => dispatch(
            createVirtualScreenshareParticipant(id, false, conference)));
    }
}
