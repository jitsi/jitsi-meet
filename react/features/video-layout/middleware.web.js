// @flow

import VideoLayout from '../../../modules/UI/videolayout/VideoLayout.js';
import UIEvents from '../../../service/UI/UIEvents';

import { CONFERENCE_JOINED, CONFERENCE_WILL_LEAVE } from '../base/conference';
import { VIDEO_TYPE } from '../base/media';
import {
    DOMINANT_SPEAKER_CHANGED,
    PARTICIPANT_JOINED,
    PARTICIPANT_LEFT,
    PARTICIPANT_UPDATED,
    PIN_PARTICIPANT,
    getParticipantById
} from '../base/participants';
import { MiddlewareRegistry } from '../base/redux';
import {
    TRACK_ADDED,
    TRACK_REMOVED,
    TRACK_UPDATED,
    getTrackByJitsiTrack
} from '../base/tracks';
import { SET_FILMSTRIP_VISIBLE } from '../filmstrip';

import { SET_TILE_VIEW } from './actionTypes';
import { screenShareStreamAdded, screenShareStreamRemoved } from './actions';

import './middleware.any';

declare var APP: Object;
declare var interfaceConfig: Object;

/**
 * Middleware which intercepts actions and updates the legacy component
 * {@code VideoLayout} as needed. The purpose of this middleware is to redux-ify
 * {@code VideoLayout} without having to simultaneously react-ifying it.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
// eslint-disable-next-line no-unused-vars
MiddlewareRegistry.register(store => next => action => {
    // Purposefully perform additional actions after state update to mimic
    // being connected to the store for updates.
    const result = next(action);

    switch (action.type) {
    case CONFERENCE_JOINED:
        VideoLayout.mucJoined();
        break;

    case CONFERENCE_WILL_LEAVE:
        VideoLayout.reset();
        break;

    case PARTICIPANT_JOINED:
        if (!action.participant.local) {
            VideoLayout.addRemoteParticipantContainer(
                getParticipantById(store.getState(), action.participant.id));
        }
        break;

    case PARTICIPANT_LEFT:
        VideoLayout.removeParticipantContainer(action.participant.id);
        break;

    case PARTICIPANT_UPDATED: {
        // Look for actions that triggered a change to connectionStatus. This is
        // done instead of changing the connection status change action to be
        // explicit in order to minimize changes to other code.
        if (typeof action.participant.connectionStatus !== 'undefined') {
            VideoLayout.onParticipantConnectionStatusChanged(
                action.participant.id,
                action.participant.connectionStatus);
        }
        break;
    }

    case DOMINANT_SPEAKER_CHANGED:
        VideoLayout.onDominantSpeakerChanged(action.participant.id);
        break;

    case PIN_PARTICIPANT:
        VideoLayout.onPinChange(action.participant.id);
        APP.UI.emitEvent(
            UIEvents.PINNED_ENDPOINT,
            action.participant.id,
            Boolean(action.participant.id));
        break;

    case SET_FILMSTRIP_VISIBLE:
        VideoLayout.resizeVideoArea(true, false);
        APP.UI.emitEvent(UIEvents.TOGGLED_FILMSTRIP, action.visible);
        APP.API.notifyFilmstripDisplayChanged(action.visible);
        break;

    case SET_TILE_VIEW:
        APP.UI.emitEvent(UIEvents.TOGGLED_TILE_VIEW, action.enabled);
        break;

    case TRACK_ADDED:
        if (!action.track.local) {
            VideoLayout.onRemoteStreamAdded(action.track.jitsiTrack);
        }

        break;
    }

    return result;
});

/**
 * Middleware which listens for actions and performs updates related to the
 * auto-pin screen share feature.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    if (!interfaceConfig.AUTO_PIN_LATEST_SCREEN_SHARE) {
        return next(action);
    }

    switch (action.type) {
    case TRACK_ADDED:
        if (action.track.videoType === VIDEO_TYPE.DESKTOP) {
            // TRACK_ADDED action will have a participant ID in the action
            // itself to use.
            store.dispatch(screenShareStreamAdded(action.track.participantId));
        }

        break;

    case TRACK_REMOVED:
        if (action.track.jitsiTrack.videoType === VIDEO_TYPE.DESKTOP) {
            // TRACK_REMOVED action does not include the participant ID in the
            // action itself so find the redux representation which has the
            // participant ID.
            const track = getTrackByJitsiTrack(
                store.getState()['features/base/tracks'],
                action.track.jitsiTrack
            );

            // It's possible the track removal has already been processed by
            // redux due to duplicate events from lib-jitsi-meet. Be defensive
            // against double events by falling back to ownerEndpointId and
            // proceeding only if an ID to remove exists.
            const idToRemove = track
                ? track.participantId
                : action.track.jitsiTrack.ownerEndpointId;

            idToRemove
                && store.dispatch(screenShareStreamRemoved(idToRemove));
        }

        break;

    case TRACK_UPDATED: {
        if (!action.track.videoType) {
            break;
        }

        // The TRACK_UPDATED action may not include the participant ID for the
        // owner of the track.
        const currentTrackData = getTrackByJitsiTrack(
            store.getState()['features/base/tracks'],
            action.track.jitsiTrack
        );

        if (action.track.videoType === VIDEO_TYPE.DESKTOP) {
            store.dispatch(
                screenShareStreamAdded(currentTrackData.participantId));
        } else if (currentTrackData.videoType === VIDEO_TYPE.DESKTOP) {
            store.dispatch(
                screenShareStreamRemoved(currentTrackData.participantId));
        }

        break;
    }
    }

    return next(action);
});
