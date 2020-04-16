// @flow

import _ from 'lodash';

import { JitsiTrackErrors } from '../lib-jitsi-meet';
import {
    getLocalParticipant,
    hiddenParticipantJoined,
    hiddenParticipantLeft,
    participantJoined,
    participantLeft
} from '../participants';
import { toState } from '../redux';
import { safeDecodeURIComponent } from '../util';

import {
    AVATAR_ID_COMMAND,
    AVATAR_URL_COMMAND,
    EMAIL_COMMAND,
    JITSI_CONFERENCE_URL_KEY,
    VIDEO_QUALITY_LEVELS
} from './constants';
import logger from './logger';

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
 * Logic shared between web and RN which processes the {@code USER_JOINED}
 * conference event and dispatches either {@link participantJoined} or
 * {@link hiddenParticipantJoined}.
 *
 * @param {Object} store - The redux store.
 * @param {JitsiMeetConference} conference - The conference for which the
 * {@code USER_JOINED} event is being processed.
 * @param {JitsiParticipant} user - The user who has just joined.
 * @returns {void}
 */
export function commonUserJoinedHandling(
        { dispatch }: Object,
        conference: Object,
        user: Object) {
    const id = user.getId();
    const displayName = user.getDisplayName();

    if (user.isHidden()) {
        dispatch(hiddenParticipantJoined(id, displayName));
    } else {
        dispatch(participantJoined({
            botType: user.getBotType(),
            conference,
            id,
            name: displayName,
            presence: user.getStatus(),
            role: user.getRole()
        }));
    }
}

/**
 * Logic shared between web and RN which processes the {@code USER_LEFT}
 * conference event and dispatches either {@link participantLeft} or
 * {@link hiddenParticipantLeft}.
 *
 * @param {Object} store - The redux store.
 * @param {JitsiMeetConference} conference - The conference for which the
 * {@code USER_LEFT} event is being processed.
 * @param {JitsiParticipant} user - The user who has just left.
 * @returns {void}
 */
export function commonUserLeftHandling(
        { dispatch }: Object,
        conference: Object,
        user: Object) {
    const id = user.getId();

    if (user.isHidden()) {
        dispatch(hiddenParticipantLeft(id));
    } else {
        dispatch(participantLeft(id, conference));
    }
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
 * Returns the display name of the conference.
 *
 * @param {Function | Object} stateful - Reference that can be resolved to Redux
 * state with the {@code toState} function.
 * @returns {string}
 */
export function getConferenceName(stateful: Function | Object): string {
    const state = toState(stateful);
    const { callee } = state['features/base/jwt'];
    const { callDisplayName } = state['features/base/config'];
    const { pendingSubjectChange, room, subject } = state['features/base/conference'];

    return pendingSubjectChange
        || subject
        || callDisplayName
        || (callee && callee.name)
        || safeStartCase(safeDecodeURIComponent(room));
}

/**
 * Returns the name of the conference formated for the title.
 *
 * @param {Function | Object} stateful - Reference that can be resolved to Redux state with the {@code toState}
 * function.
 * @returns {string} - The name of the conference formated for the title.
 */
export function getConferenceNameForTitle(stateful: Function | Object) {
    return safeStartCase(safeDecodeURIComponent(toState(stateful)['features/base/conference'].room));
}

/**
* Returns the UTC timestamp when the first participant joined the conference.
*
* @param {Function | Object} stateful - Reference that can be resolved to Redux
* state with the {@code toState} function.
* @returns {number}
*/
export function getConferenceTimestamp(stateful: Function | Object): number {
    const state = toState(stateful);
    const { conferenceTimestamp } = state['features/base/conference'];

    return conferenceTimestamp;
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
    const { conference, joining, leaving, passwordRequired }
        = toState(stateful)['features/base/conference'];

    // There is a precendence
    if (conference) {
        return conference === leaving ? undefined : conference;
    }

    return joining || passwordRequired;
}

/**
 * Finds the nearest match for the passed in {@link availableHeight} to am
 * enumerated value in {@code VIDEO_QUALITY_LEVELS}.
 *
 * @param {number} availableHeight - The height to which a matching video
 * quality level should be found.
 * @returns {number} The closest matching value from
 * {@code VIDEO_QUALITY_LEVELS}.
 */
export function getNearestReceiverVideoQualityLevel(availableHeight: number) {
    const qualityLevels = [
        VIDEO_QUALITY_LEVELS.HIGH,
        VIDEO_QUALITY_LEVELS.STANDARD,
        VIDEO_QUALITY_LEVELS.LOW
    ];

    let selectedLevel = qualityLevels[0];

    for (let i = 1; i < qualityLevels.length; i++) {
        const previousValue = qualityLevels[i - 1];
        const currentValue = qualityLevels[i];
        const diffWithCurrent = Math.abs(availableHeight - currentValue);
        const diffWithPrevious = Math.abs(availableHeight - previousValue);

        if (diffWithCurrent < diffWithPrevious) {
            selectedLevel = currentValue;
        }
    }

    return selectedLevel;
}

/**
 * Returns the stored room name.
 *
 * @param {Object} state - The current state of the app.
 * @returns {string}
 */
export function getRoomName(state: Object): string {
    return state['features/base/conference'].room;
}

/**
 * Handle an error thrown by the backend (i.e. {@code lib-jitsi-meet}) while
 * manipulating a conference participant (e.g. Pin or select participant).
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
    logger.error(msg, err);
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
        conference: {
            sendCommand: Function,
            setDisplayName: Function,
            setLocalParticipantProperty: Function }) {
    const {
        avatarID,
        avatarURL,
        email,
        features,
        name
    } = getLocalParticipant(stateful);

    avatarID && conference.sendCommand(AVATAR_ID_COMMAND, {
        value: avatarID
    });
    avatarURL && conference.sendCommand(AVATAR_URL_COMMAND, {
        value: avatarURL
    });
    email && conference.sendCommand(EMAIL_COMMAND, {
        value: email
    });

    if (features && features['screen-sharing'] === 'true') {
        conference.setLocalParticipantProperty('features_screen-sharing', true);
    }

    conference.setDisplayName(name);
}

/**
 * A safe implementation of lodash#startCase that doesn't deburr the string.
 *
 * NOTE: According to lodash roadmap, lodash v5 will have this function.
 *
 * Code based on https://github.com/lodash/lodash/blob/master/startCase.js.
 *
 * @param {string} s - The string to do start case on.
 * @returns {string}
 */
function safeStartCase(s = '') {
    return _.words(`${s}`.replace(/['\u2019]/g, '')).reduce(
        (result, word, index) => result + (index ? ' ' : '') + _.upperFirst(word)
        , '');
}
