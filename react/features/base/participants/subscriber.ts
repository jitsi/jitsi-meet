
import { difference } from 'lodash-es';
import { batch } from 'react-redux';

import { IStore } from '../../app/types';
import { hideNotification, showNotification } from '../../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE, RAISE_HAND_NOTIFICATION_ID } from '../../notifications/constants';
import { getCurrentConference } from '../conference/functions';
import {
    getDisableNextSpeakerNotification,
    getSsrcRewritingFeatureFlag,
    hasBeenNotified,
    isNextToSpeak } from '../config/functions.any';
import { VIDEO_TYPE } from '../media/constants';
import StateListenerRegistry from '../redux/StateListenerRegistry';

import { NOTIFIED_TO_SPEAK } from './actionTypes';
import { createVirtualScreenshareParticipant, participantLeft } from './actions';
import {
    getParticipantById,
    getRemoteScreensharesBasedOnPresence,
    getVirtualScreenshareParticipantOwnerId
} from './functions';
import { FakeParticipant } from './types';

StateListenerRegistry.register(
    /* selector */ state => state['features/base/tracks'],
    /* listener */(tracks, store) => _updateScreenshareParticipants(store)
);

StateListenerRegistry.register(
    /* selector */ state => state['features/base/participants'].remoteVideoSources,
    /* listener */(remoteVideoSources, store) => getSsrcRewritingFeatureFlag(store.getState())
        && _updateScreenshareParticipantsBasedOnPresence(store)
);

StateListenerRegistry.register(
    /* selector */ state => state['features/base/participants'].raisedHandsQueue,
    /* listener */ (raisedHandsQueue, store) => {
        if (raisedHandsQueue.length
            && isNextToSpeak(store.getState())
            && !hasBeenNotified(store.getState())
            && !getDisableNextSpeakerNotification(store.getState())
            && !store.getState()['features/visitors'].iAmVisitor) { // visitors raise hand to be promoted
            _notifyNextSpeakerInRaisedHandQueue(store);
        }
        if (!raisedHandsQueue[0]) {
            store.dispatch(hideNotification(RAISE_HAND_NOTIFICATION_ID));
        }
    }
);

/**
 * Compares the old and new screenshare lists provided and creates/removes the virtual screenshare participant
 * tiles accordingly.
 *
 * @param {Array<string>} oldScreenshareSourceNames - List of old screenshare source names.
 * @param {Array<string>} newScreenshareSourceNames - Current list of screenshare source names.
 * @param {Object} store - The redux store.
 * @returns {void}
 */
function _createOrRemoveVirtualParticipants(
        oldScreenshareSourceNames: string[],
        newScreenshareSourceNames: string[],
        store: IStore): void {
    const { dispatch, getState } = store;
    const conference = getCurrentConference(getState());
    const removedScreenshareSourceNames = difference(oldScreenshareSourceNames, newScreenshareSourceNames);
    const addedScreenshareSourceNames = difference(newScreenshareSourceNames, oldScreenshareSourceNames);

    if (removedScreenshareSourceNames.length) {
        removedScreenshareSourceNames.forEach(id => dispatch(participantLeft(id, conference, {
            fakeParticipant: FakeParticipant.RemoteScreenShare
        })));
    }

    if (addedScreenshareSourceNames.length) {
        addedScreenshareSourceNames.forEach(id => dispatch(
            createVirtualScreenshareParticipant(id, false, conference)));
    }
}

/**
 * Handles creating and removing virtual screenshare participants.
 *
 * @param {*} store - The redux store.
 * @returns {void}
 */
function _updateScreenshareParticipants(store: IStore): void {
    const { dispatch, getState } = store;
    const state = getState();
    const conference = getCurrentConference(state);
    const tracks = state['features/base/tracks'];
    const { sortedRemoteVirtualScreenshareParticipants, localScreenShare } = state['features/base/participants'];
    const previousScreenshareSourceNames = [ ...sortedRemoteVirtualScreenshareParticipants.keys() ];

    let newLocalSceenshareSourceName;

    const currentScreenshareSourceNames = tracks.reduce((acc: string[], track) => {
        if (track.videoType === VIDEO_TYPE.DESKTOP && !track.jitsiTrack.isMuted()) {
            const sourceName: string = track.jitsiTrack.getSourceName();

            // Ignore orphan tracks in ssrc-rewriting mode.
            if (!sourceName && getSsrcRewritingFeatureFlag(state)) {
                return acc;
            }
            if (track.local) {
                newLocalSceenshareSourceName = sourceName;
            } else if (getParticipantById(state, getVirtualScreenshareParticipantOwnerId(sourceName))) {
                acc.push(sourceName);
            }
        }

        return acc;
    }, []);

    if (!localScreenShare && newLocalSceenshareSourceName) {
        dispatch(createVirtualScreenshareParticipant(newLocalSceenshareSourceName, true, conference));
    }

    if (localScreenShare && !newLocalSceenshareSourceName) {
        dispatch(participantLeft(localScreenShare.id, conference, {
            fakeParticipant: FakeParticipant.LocalScreenShare
        }));
    }

    if (getSsrcRewritingFeatureFlag(state)) {
        return;
    }

    _createOrRemoveVirtualParticipants(previousScreenshareSourceNames, currentScreenshareSourceNames, store);
}

/**
 * Handles the creation and removal of remote virtual screenshare participants when ssrc-rewriting is enabled.
 *
 * @param {Object} store - The redux store.
 * @returns {void}
 */
function _updateScreenshareParticipantsBasedOnPresence(store: IStore): void {
    const { getState } = store;
    const state = getState();
    const { sortedRemoteVirtualScreenshareParticipants } = state['features/base/participants'];
    const previousScreenshareSourceNames = [ ...sortedRemoteVirtualScreenshareParticipants.keys() ];
    const currentScreenshareSourceNames = getRemoteScreensharesBasedOnPresence(state);

    _createOrRemoveVirtualParticipants(previousScreenshareSourceNames, currentScreenshareSourceNames, store);
}

/**
 * Handles notifying the next speaker in the raised hand queue.
 *
 * @param {*} store - The redux store.
 * @returns {void}
 */
function _notifyNextSpeakerInRaisedHandQueue(store: IStore): void {
    const { dispatch } = store;

    batch(() => {
        dispatch(showNotification({
            titleKey: 'notify.nextToSpeak',
            maxLines: 2
        }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));
        dispatch({
            type: NOTIFIED_TO_SPEAK
        });
    });
}
