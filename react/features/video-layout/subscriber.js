// @flow

import debounce from 'lodash/debounce';

import { StateListenerRegistry, equals } from '../base/redux';
import { isFollowMeActive } from '../follow-me';

import { setRemoteParticipantsWithScreenShare } from './actions';
import { getAutoPinSetting, updateAutoPinnedParticipant } from './functions';

/**
 * For auto-pin mode, listen for changes to the known media tracks and look
 * for updates to screen shares. The listener is debounced to avoid state
 * thrashing that might occur, especially when switching in or out of p2p.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/base/tracks'],
    /* listener */ debounce((tracks, store) => {
        if (!getAutoPinSetting() || isFollowMeActive(store)) {
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
