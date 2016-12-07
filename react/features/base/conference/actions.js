import JitsiMeetJS from '../lib-jitsi-meet';
import {
    changeParticipantEmail,
    dominantSpeakerChanged,
    participantJoined,
    participantLeft,
    participantRoleChanged
} from '../participants';
import { trackAdded, trackRemoved } from '../tracks';

import {
    CONFERENCE_JOINED,
    CONFERENCE_LEFT,
    CONFERENCE_WILL_LEAVE,
    SET_ROOM
} from './actionTypes';
import { EMAIL_COMMAND } from './constants';
import { _addLocalTracksToConference } from './functions';
import './middleware';
import './reducer';

const JitsiConferenceEvents = JitsiMeetJS.events.conference;

/**
 * Initializes a new conference.
 *
 * @returns {Function}
 */
export function createConference() {
    return (dispatch, getState) => {
        const state = getState();
        const connection = state['features/base/connection'].jitsiConnection;
        const room = state['features/base/conference'].room;

        if (!connection) {
            throw new Error('Cannot create conference without connection');
        }
        if (typeof room === 'undefined' || room === '') {
            throw new Error('Cannot join conference without room name');
        }

        // TODO Take options from config.
        const conference
            = connection.initJitsiConference(room, { openSctp: true });

        _setupConferenceListeners(conference, dispatch);

        conference.join();
    };
}

/**
 * Attach any pre-existing local media to the conference once the conference has
 * been joined.
 *
 * @param {JitsiConference} conference - The JitsiConference instance which was
 * joined by the local participant.
 * @returns {Function}
 */
function _conferenceJoined(conference) {
    return (dispatch, getState) => {
        const localTracks
            = getState()['features/base/tracks']
                .filter(t => t.local)
                .map(t => t.jitsiTrack);

        if (localTracks.length) {
            _addLocalTracksToConference(conference, localTracks);
        }

        dispatch({
            type: CONFERENCE_JOINED,
            conference: {
                jitsiConference: conference
            }
        });
    };
}

/**
 * Signal that we have left the conference.
 *
 * @param {JitsiConference} conference - The JitsiConference instance which was
 * left by the local participant.
 * @returns {{
 *      type: CONFERENCE_LEFT,
 *      conference: {
 *          jitsiConference: JitsiConference
 *      }
 *  }}
 */
function _conferenceLeft(conference) {
    return {
        type: CONFERENCE_LEFT,
        conference: {
            jitsiConference: conference
        }
    };
}

/**
 * Signal the intention of the application to have the local participant leave a
 * specific conference. Similar in fashion to CONFERENCE_LEFT. Contrary to it
 * though, it's not guaranteed because CONFERENCE_LEFT may be triggered by
 * lib-jitsi-meet and not the application.
 *
 * @param {JitsiConference} conference - The JitsiConference instance which will
 * be left by the local participant.
 * @returns {{
 *      type: CONFERENCE_LEFT,
 *      conference: {
 *          jitsiConference: JitsiConference
 *      }
 *  }}
 */
export function conferenceWillLeave(conference) {
    return {
        type: CONFERENCE_WILL_LEAVE,
        conference: {
            jitsiConference: conference
        }
    };
}

/**
 * Sets (the name of) the room of the conference to be joined.
 *
 * @param {(string|undefined)} room - The name of the room of the conference to
 * be joined.
 * @returns {{
 *      type: SET_ROOM,
 *      room: string
 *  }}
 */
export function setRoom(room) {
    return {
        type: SET_ROOM,
        room
    };
}

/**
 * Setup various conference event handlers.
 *
 * @param {JitsiConference} conference - The JitsiConference instance.
 * @param {Dispatch} dispatch - The Redux dispatch function.
 * @private
 * @returns {void}
 */
function _setupConferenceListeners(conference, dispatch) {
    conference.on(
            JitsiConferenceEvents.CONFERENCE_JOINED,
            () => dispatch(_conferenceJoined(conference)));
    conference.on(
            JitsiConferenceEvents.CONFERENCE_LEFT,
            () => dispatch(_conferenceLeft(conference)));

    conference.on(
            JitsiConferenceEvents.DOMINANT_SPEAKER_CHANGED,
            id => dispatch(dominantSpeakerChanged(id)));

    conference.on(
            JitsiConferenceEvents.TRACK_ADDED,
            t => t && !t.isLocal() && dispatch(trackAdded(t)));
    conference.on(
            JitsiConferenceEvents.TRACK_REMOVED,
            t => t && !t.isLocal() && dispatch(trackRemoved(t)));

    conference.on(
            JitsiConferenceEvents.USER_JOINED,
            (id, user) => dispatch(participantJoined({
                id,
                name: user.getDisplayName(),
                role: user.getRole()
            })));
    conference.on(
            JitsiConferenceEvents.USER_LEFT,
            id => dispatch(participantLeft(id)));
    conference.on(
            JitsiConferenceEvents.USER_ROLE_CHANGED,
            (id, role) => dispatch(participantRoleChanged(id, role)));

    conference.addCommandListener(
            EMAIL_COMMAND,
            (data, id) => dispatch(changeParticipantEmail(id, data.value)));
}
