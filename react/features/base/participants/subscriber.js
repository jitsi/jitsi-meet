// @flow

import _ from 'lodash';

import { StateListenerRegistry } from '../../base/redux';
import { getCurrentConference } from '../conference';
import { getMultipleVideoSupportFeatureFlag } from '../config';

import { createFakeScreenShareParticipant, participantLeft } from './actions';

StateListenerRegistry.register(
    /* selector */ state => state['features/base/tracks'],
    /* listener */(tracks, store) => _updateScreenshareParticipants(store)
);

/**
 * Handles creating and removing screen share participants.
 *
 * @param {*} store - The redux store.
 * @returns {void}
 */
function _updateScreenshareParticipants({ getState, dispatch }) {
    const state = getState();

    if (!getMultipleVideoSupportFeatureFlag(state)) {
        return;
    }

    const conference = getCurrentConference(state);
    const tracks = state['features/base/tracks'];
    const { sortedRemoteFakeScreenShareParticipants, localScreenShare } = state['features/base/participants'];
    const previousScreenshareSourceNames = [ ...sortedRemoteFakeScreenShareParticipants.keys() ];

    let newLocalSceenshareSourceName;

    const currentScreenshareSourceNames = tracks.reduce((acc, track) => {
        if (track.videoType === 'desktop' && !track.jitsiTrack.isMuted()) {
            const sourceName = track.jitsiTrack.getSourceName();

            if (track.local) {
                newLocalSceenshareSourceName = sourceName;
            } else {
                acc.push(sourceName);
            }
        }

        return acc;
    }, []);

    if (!localScreenShare && newLocalSceenshareSourceName) {
        dispatch(createFakeScreenShareParticipant(newLocalSceenshareSourceName, true));
    }

    if (localScreenShare && !newLocalSceenshareSourceName) {
        dispatch(participantLeft(localScreenShare.id, conference));
    }

    const removedScreenshareSourceNames = _.difference(previousScreenshareSourceNames, currentScreenshareSourceNames);
    const addedScreenshareSourceNames = _.difference(currentScreenshareSourceNames, previousScreenshareSourceNames);

    if (removedScreenshareSourceNames.length) {
        removedScreenshareSourceNames.forEach(id => dispatch(participantLeft(id, conference)));
    }

    if (addedScreenshareSourceNames.length) {
        addedScreenshareSourceNames.forEach(id => dispatch(createFakeScreenShareParticipant(id, false)));

    }
}
