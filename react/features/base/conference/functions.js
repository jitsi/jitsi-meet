// @flow

import { JitsiTrackErrors } from '../lib-jitsi-meet';
import { getLocalParticipant } from '../participants';
import { toState } from '../redux';

import {
    AVATAR_ID_COMMAND,
    AVATAR_URL_COMMAND,
    EMAIL_COMMAND,
    JITSI_CONFERENCE_URL_KEY
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
 * Evaluates a specific predicate for each {@link JitsiConference} known to the
 * redux state features/base/conference while it returns {@code true}.
 *
 * @param {Function | Object} stateful - The redux store, state, or
 * {@code getState} function.
 * @param {Function} predicate - The predicate to evaluate for each
 * {@code JitsiConference} know to the redux state features/base/conference
 * while it returns {@code true}.
 * @returns {boolean} If the specified {@code predicate} returned {@code true}
 * for all {@code JitsiConference} instances known to the redux state
 * features/base/conference.
 */
export function forEachConference(
        stateful: Function | Object,
        predicate: (Object, URL) => boolean) {
    const state = toState(stateful)['features/base/conference'];

    for (const v of Object.values(state)) {
        // Does the value of the base/conference's property look like a
        // JitsiConference?
        if (v && typeof v === 'object') {
            // $FlowFixMe
            const url: URL = v[JITSI_CONFERENCE_URL_KEY];

            // XXX The Web version of Jitsi Meet does not utilize
            // JITSI_CONFERENCE_URL_KEY at the time of this writing. An
            // alternative is necessary then to recognize JitsiConference
            // instances and myUserId is as good as any other property.
            if ((url || typeof v.myUserId === 'function')
                    && !predicate(v, url)) {
                return false;
            }
        }
    }

    return true;
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
