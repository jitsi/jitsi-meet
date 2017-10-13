// @flow

import { JitsiTrackErrors } from '../lib-jitsi-meet';
import { getLocalParticipant } from '../participants';
import { toState } from '../redux';

import {
    AVATAR_ID_COMMAND,
    AVATAR_URL_COMMAND,
    EMAIL_COMMAND
} from './constants';

/**
 * Attach a set of local tracks to a conference.
 *
 * @param {JitsiConference} conference - Conference instance.
 * @param {JitsiLocalTrack[]} localTracks - List of local media tracks.
 * @protected
 * @returns {Promise}
 */
export function _addLocalTracksToConference(
        conference: { addTrack: Function, getLocalTracks: Function },
        localTracks: Array<Object>) {
    const conferenceLocalTracks = conference.getLocalTracks();
    const promises = [];

    for (const track of localTracks) {
        // XXX The library lib-jitsi-meet may be draconian, for example, when
        // adding one and the same video track multiple times.
        if (conferenceLocalTracks.indexOf(track) === -1) {
            promises.push(
                conference.addTrack(track).catch(err => {
                    _reportError(
                        'Failed to add local track to conference',
                        err);
                }));
        }
    }

    return Promise.all(promises);
}

/**
 * Returns the current {@code JitsiConference} which is joining or joined and is
 * not leaving. Please note the contrast with merely reading the
 * {@code conference} state of the feature base/conference which is not joining
 * but may be leaving already.
 *
 * @param {Function|Object} stateful - The redux store, state, or
 * {@code getState} function.
 * @returns {JitsiConference|undefined}
 */
export function getCurrentConference(stateful: Function | Object) {
    const { conference, joining, leaving }
        = toState(stateful)['features/base/conference'];

    return (
        conference
            ? conference === leaving ? undefined : conference
            : joining);
}

/**
 * Handle an error thrown by the backend (i.e. lib-jitsi-meet) while
 * manipulating a conference participant (e.g. pin or select participant).
 *
 * @param {Error} err - The Error which was thrown by the backend while
 * manipulating a conference participant and which is to be handled.
 * @protected
 * @returns {void}
 */
export function _handleParticipantError(err: { message: ?string }) {
    // XXX DataChannels are initialized at some later point when the conference
    // has multiple participants, but code that pins or selects a participant
    // might be executed before. So here we're swallowing a particular error.
    // TODO Lib-jitsi-meet should be fixed to not throw such an exception in
    // these scenarios.
    if (err.message !== 'Data channels support is disabled!') {
        throw err;
    }
}

/**
 * Determines whether a specific string is a valid room name.
 *
 * @param {(string|undefined)} room - The name of the conference room to check
 * for validity.
 * @returns {boolean} If the specified room name is valid, then true; otherwise,
 * false.
 */
export function isRoomValid(room: ?string) {
    return typeof room === 'string' && room !== '';
}

/**
 * Remove a set of local tracks from a conference.
 *
 * @param {JitsiConference} conference - Conference instance.
 * @param {JitsiLocalTrack[]} localTracks - List of local media tracks.
 * @protected
 * @returns {Promise}
 */
export function _removeLocalTracksFromConference(
        conference: { removeTrack: Function },
        localTracks: Array<Object>) {
    return Promise.all(localTracks.map(track =>
        conference.removeTrack(track)
            .catch(err => {
                // Local track might be already disposed by direct
                // JitsiTrack#dispose() call. So we should ignore this error
                // here.
                if (err.name !== JitsiTrackErrors.TRACK_IS_DISPOSED) {
                    _reportError(
                        'Failed to remove local track from conference',
                        err);
                }
            })
    ));
}

/**
 * Reports a specific Error with a specific error message. While the
 * implementation merely logs the specified msg and err via the console at the
 * time of this writing, the intention of the function is to abstract the
 * reporting of errors and facilitate elaborating on it in the future.
 *
 * @param {string} msg - The error message to report.
 * @param {Error} err - The Error to report.
 * @private
 * @returns {void}
 */
function _reportError(msg, err) {
    // TODO This is a good point to call some global error handler when we have
    // one.
    console.error(msg, err);
}

/**
 * Sends a representation of the local participant such as her avatar (URL),
 * e-mail address, and display name to (the remote participants of) a specific
 * conference.
 *
 * @param {Function|Object} stateful - The redux store, state, or
 * {@code getState} function.
 * @param {JitsiConference} conference - The {@code JitsiConference} to which
 * the representation of the local participant is to be sent.
 * @returns {void}
 */
export function sendLocalParticipant(
        stateful: Function | Object,
        conference: { sendCommand: Function, setDisplayName: Function }) {
    const { avatarID, avatarURL, email, name } = getLocalParticipant(stateful);

    avatarID && conference.sendCommand(AVATAR_ID_COMMAND, {
        value: avatarID
    });
    avatarURL && conference.sendCommand(AVATAR_URL_COMMAND, {
        value: avatarURL
    });
    email && conference.sendCommand(EMAIL_COMMAND, {
        value: email
    });
    conference.setDisplayName(name);
}
