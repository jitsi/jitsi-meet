// @flow

import debounce from 'lodash/debounce';

import { getMultipleVideoSupportFeatureFlag } from '../base/config';
import { StateListenerRegistry, equals } from '../base/redux';
import { isFollowMeActive } from '../follow-me';

import { setRemoteParticipantsWithScreenShare, virtualScreenshareParticipantsUpdated } from './actions';
import { getAutoPinSetting, updateAutoPinnedParticipant } from './functions';

StateListenerRegistry.register(
    /* selector */ state => state['features/base/participants'].sortedRemoteVirtualScreenshareParticipants,
    /* listener */ (sortedRemoteVirtualScreenshareParticipants, store) => {
        if (!getAutoPinSetting() || isFollowMeActive(store) || !getMultipleVideoSupportFeatureFlag(store.getState())) {
            return;
        }

        const oldScreenSharesOrder = store.getState()['features/video-layout'].remoteScreenShares || [];
        const knownSharingParticipantIds = [ ...sortedRemoteVirtualScreenshareParticipants.keys() ];

        // Filter out any participants which are no longer screen sharing
        // by looping through the known sharing participants and removing any
        // participant IDs which are no longer sharing.
        const newScreenSharesOrder = oldScreenSharesOrder.filter(
            participantId => knownSharingParticipantIds.includes(participantId));

        // Make sure all new sharing participant get added to the end of the
        // known screen shares.
        knownSharingParticipantIds.forEach(participantId => {
            if (!newScreenSharesOrder.includes(participantId)) {
                newScreenSharesOrder.push(participantId);
            }
        });

        if (!equals(oldScreenSharesOrder, newScreenSharesOrder)) {
            store.dispatch(virtualScreenshareParticipantsUpdated(newScreenSharesOrder));

            updateAutoPinnedParticipant(oldScreenSharesOrder, store);
        }
    });


/**
 * For auto-pin mode, listen for changes to the known media tracks and look
 * for updates to screen shares. The listener is debounced to avoid state
 * thrashing that might occur, especially when switching in or out of p2p.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/base/tracks'],
    /* listener */ debounce((tracks, store) => {
        // Because of the debounce we need to handle removal of screen shares in the middleware. Otherwise it is
        // possible to have screen sharing participant that has already left in the remoteScreenShares array.
        // This can lead to rendering a thumbnails for already left participants since the remoteScreenShares
        // array is used for building the ordered list of remote participants.
        if (!getAutoPinSetting() || isFollowMeActive(store) || getMultipleVideoSupportFeatureFlag(store.getState())) {
            return;
        }

        const oldScreenSharesOrder = store.getState()['features/video-layout'].remoteScreenShares || [];
        const knownSharingParticipantIds = tracks.reduce((acc, track) => {
            if (track.mediaType === 'video' && track.videoType === 'desktop') {
                const skipTrack = getAutoPinSetting() === 'remote-only' && track.local;

                if (!skipTrack) {
                    acc.push(track.participantId);
                }
            }

            return acc;
        }, []);

        // Filter out any participants which are no longer screen sharing
        // by looping through the known sharing participants and removing any
        // participant IDs which are no longer sharing.
        const newScreenSharesOrder = oldScreenSharesOrder.filter(
            participantId => knownSharingParticipantIds.includes(participantId));

        // Make sure all new sharing participant get added to the end of the
        // known screen shares.
        knownSharingParticipantIds.forEach(participantId => {
            if (!newScreenSharesOrder.includes(participantId)) {
                newScreenSharesOrder.push(participantId);
            }
        });

        if (!equals(oldScreenSharesOrder, newScreenSharesOrder)) {
            store.dispatch(
                setRemoteParticipantsWithScreenShare(newScreenSharesOrder));

            updateAutoPinnedParticipant(oldScreenSharesOrder, store);
        }
    }, 100));
