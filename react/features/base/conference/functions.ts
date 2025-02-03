import { sha512_256 as sha512 } from 'js-sha512';
import { upperFirst, words } from 'lodash-es';

import { getName } from '../../app/functions';
import { IReduxState, IStore } from '../../app/types';
import { determineTranscriptionLanguage } from '../../transcribing/functions';
import { IStateful } from '../app/types';
import { JitsiTrackErrors } from '../lib-jitsi-meet';
import {
    participantJoined,
    participantLeft
} from '../participants/actions';
import { getLocalParticipant } from '../participants/functions';
import { toState } from '../redux/functions';
import {
    appendURLParam,
    getBackendSafePath,
    safeDecodeURIComponent
} from '../util/uri';

import { setObfuscatedRoom } from './actions';
import {
    AVATAR_URL_COMMAND,
    EMAIL_COMMAND,
    JITSI_CONFERENCE_URL_KEY
} from './constants';
import logger from './logger';
import { IJitsiConference } from './reducer';

/**
 * Returns root conference state.
 *
 * @param {IReduxState} state - Global state.
 * @returns {Object} Conference state.
 */
export const getConferenceState = (state: IReduxState) => state['features/base/conference'];

/**
 * Attach a set of local tracks to a conference.
 *
 * @param {JitsiConference} conference - Conference instance.
 * @param {JitsiLocalTrack[]} localTracks - List of local media tracks.
 * @protected
 * @returns {Promise}
 */
export function _addLocalTracksToConference(
        conference: IJitsiConference,
        localTracks: Array<Object>) {
    const conferenceLocalTracks = conference.getLocalTracks();
    const promises = [];

    for (const track of localTracks) {
        // XXX The library lib-jitsi-meet may be draconian, for example, when
        // adding one and the same video track multiple times.
        if (conferenceLocalTracks.indexOf(track) === -1) {
            promises.push(
                conference.addTrack(track).catch((err: Error) => {
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
        { dispatch }: { dispatch: IStore['dispatch']; },
        conference: IJitsiConference,
        user: any) {
    const id = user.getId();
    const displayName = user.getDisplayName();

    if (!user.isHidden()) {
        const isReplacing = user?.isReplacing();
        const isPromoted = conference?.getMetadataHandler().getMetadata()?.visitors?.promoted?.[id];

        // the identity and avatar come from jwt and never change in the presence
        dispatch(participantJoined({
            avatarURL: user.getIdentity()?.user?.avatar,
            botType: user.getBotType(),
            conference,
            id,
            name: displayName,
            presence: user.getStatus(),
            role: user.getRole(),
            isPromoted,
            isReplacing,
            sources: user.getSources()
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
        { dispatch }: { dispatch: IStore['dispatch']; },
        conference: IJitsiConference,
        user: any) {
    const id = user.getId();

    if (!user.isHidden()) {
        const isReplaced = user.isReplaced?.();

        dispatch(participantLeft(id, conference, { isReplaced }));
    }
}

/**
 * Evaluates a specific predicate for each {@link JitsiConference} known to the
 * redux state features/base/conference while it returns {@code true}.
 *
 * @param {IStateful} stateful - The redux store, state, or
 * {@code getState} function.
 * @param {Function} predicate - The predicate to evaluate for each
 * {@code JitsiConference} know to the redux state features/base/conference
 * while it returns {@code true}.
 * @returns {boolean} If the specified {@code predicate} returned {@code true}
 * for all {@code JitsiConference} instances known to the redux state
 * features/base/conference.
 */
export function forEachConference(
        stateful: IStateful,
        predicate: (a: any, b: URL) => boolean) {
    const state = getConferenceState(toState(stateful));

    for (const v of Object.values(state)) {
        // Does the value of the base/conference's property look like a
        // JitsiConference?
        if (v && typeof v === 'object') {
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
 * @param {IStateful} stateful - Reference that can be resolved to Redux
 * state with the {@code toState} function.
 * @returns {string}
 */
export function getConferenceName(stateful: IStateful): string {
    const state = toState(stateful);
    const { callee } = state['features/base/jwt'];
    const { callDisplayName } = state['features/base/config'];
    const { localSubject, pendingSubjectChange, room, subject } = getConferenceState(state);

    return (localSubject
        || pendingSubjectChange
        || subject
        || callDisplayName
        || callee?.name
        || (room && safeStartCase(safeDecodeURIComponent(room)))) ?? '';
}

/**
 * Returns the name of the conference formatted for the title.
 *
 * @param {IStateful} stateful - Reference that can be resolved to Redux state with the {@code toState}
 * function.
 * @returns {string} - The name of the conference formatted for the title.
 */
export function getConferenceNameForTitle(stateful: IStateful) {
    return safeStartCase(safeDecodeURIComponent(getConferenceState(toState(stateful)).room ?? ''));
}

/**
 * Returns an object aggregating the conference options.
 *
 * @param {IStateful} stateful - The redux store state.
 * @returns {Object} - Options object.
 */
export function getConferenceOptions(stateful: IStateful) {
    const state = toState(stateful);

    const config = state['features/base/config'];
    const { locationURL } = state['features/base/connection'];
    const { defaultTranscriptionLanguage } = state['features/dynamic-branding'];
    const { tenant } = state['features/base/jwt'];
    const { email, name: nick } = getLocalParticipant(state) ?? {};
    const options: any = { ...config };

    if (tenant) {
        options.siteID = tenant;
    }

    if (options.enableDisplayNameInStats && nick) {
        options.statisticsDisplayName = nick;
    }

    if (options.enableEmailInStats && email) {
        options.statisticsId = email;
    }

    if (locationURL) {
        options.confID = `${locationURL.host}${getBackendSafePath(locationURL.pathname)}`;
    }

    options.applicationName = getName();
    options.transcriptionLanguage
        = defaultTranscriptionLanguage ?? determineTranscriptionLanguage(options);

    // Disable analytics, if requested.
    if (options.disableThirdPartyRequests) {
        delete config.analytics?.scriptURLs;
        delete config.analytics?.amplitudeAPPKey;
    }

    return options;
}

/**
 * Returns the restored conference options if anything is available to be restored or undefined.
 *
 * @param {IStateful} stateful - The redux store state.
 * @returns {Object?}
 */
export function restoreConferenceOptions(stateful: IStateful) {
    const config = toState(stateful)['features/base/config'];

    if (config.oldConfig) {
        return {
            hosts: {
                domain: config.oldConfig.hosts.domain,
                muc: config.oldConfig.hosts.muc
            },
            focusUserJid: config.oldConfig.focusUserJid,
            disableFocus: false,
            bosh: config.oldConfig.bosh,
            websocket: config.oldConfig.websocket,
            oldConfig: undefined
        };
    }

    // nothing to return
    return;
}

/**
 * Override the global config (that is, window.config) with XMPP configuration required to join as a visitor.
 *
 * @param {IStateful} stateful - The redux store state.
 * @param {string|undefined} vnode - The received parameters.
 * @param {string} focusJid - The received parameters.
 * @param {string|undefined} username - The received parameters.
 * @returns {Object}
 */
export function getVisitorOptions(stateful: IStateful, vnode: string, focusJid: string, username: string) {
    const config = toState(stateful)['features/base/config'];

    if (!config?.hosts) {
        logger.warn('Wrong configuration, missing hosts.');

        return;
    }

    if (!vnode) {
        // this is redirecting back to main, lets restore config
        // not updating disableFocus, as if the room capacity is full the promotion to the main room will fail
        // and the visitor will be redirected back to a vnode from jicofo
        if (config.oldConfig && username) {
            return {
                hosts: config.oldConfig.hosts,
                focusUserJid: focusJid,
                disableLocalStats: false,
                bosh: config.oldConfig.bosh && appendURLParam(config.oldConfig.bosh, 'customusername', username),
                p2p: config.oldConfig.p2p,
                websocket: config.oldConfig.websocket
                    && appendURLParam(config.oldConfig.websocket, 'customusername', username),
                oldConfig: undefined // clears it up
            };
        }

        return;
    }

    const oldConfig = {
        hosts: {
            domain: ''
        },
        focusUserJid: config.focusUserJid,
        bosh: config.bosh,
        p2p: config.p2p,
        websocket: config.websocket
    };

    // copy original hosts, to make sure we do not use a modified one later
    Object.assign(oldConfig.hosts, config.hosts);

    const domain = `${vnode}.meet.jitsi`;

    return {
        oldConfig,
        hosts: {
            domain,
            muc: config.hosts.muc.replace(oldConfig.hosts.domain, domain)
        },
        focusUserJid: focusJid,
        disableFocus: true, // This flag disables sending the initial conference request
        disableLocalStats: true,
        bosh: config.bosh && appendURLParam(config.bosh, 'vnode', vnode),
        p2p: {
            ...config.p2p,
            enabled: false
        },
        websocket: config.websocket && appendURLParam(config.websocket, 'vnode', vnode)
    };
}

/**
* Returns the UTC timestamp when the first participant joined the conference.
*
* @param {IStateful} stateful - Reference that can be resolved to Redux
* state with the {@code toState} function.
* @returns {number}
*/
export function getConferenceTimestamp(stateful: IStateful) {
    const state = toState(stateful);
    const { conferenceTimestamp } = getConferenceState(state);

    return conferenceTimestamp;
}

/**
 * Returns the current {@code JitsiConference} which is joining or joined and is
 * not leaving. Please note the contrast with merely reading the
 * {@code conference} state of the feature base/conference which is not joining
 * but may be leaving already.
 *
 * @param {IStateful} stateful - The redux store, state, or
 * {@code getState} function.
 * @returns {JitsiConference|undefined}
 */
export function getCurrentConference(stateful: IStateful): IJitsiConference | undefined {
    const { conference, joining, leaving, membersOnly, passwordRequired }
        = getConferenceState(toState(stateful));

    // There is a precedence
    if (conference) {
        return conference === leaving ? undefined : conference;
    }

    return joining || passwordRequired || membersOnly;
}

/**
 * Returns whether the current conference is a P2P connection.
 * Will return `false` if it's a JVB one, and `null` if there is no conference.
 *
 * @param {IStateful} stateful - The redux store, state, or
 * {@code getState} function.
 * @returns {boolean|null}
 */
export function isP2pActive(stateful: IStateful): boolean | null {
    const conference = getCurrentConference(toState(stateful));

    if (!conference) {
        return null;
    }

    return conference.isP2PActive();
}

/**
 * Returns whether the current conference has audio recording property which is on.
 *
 * @param {IStateful} stateful - The redux store, state, or {@code getState} function.
 * @returns {boolean|null}
 */
export function isConferenceAudioRecordingOn(stateful: IStateful): boolean | null {
    const state = getConferenceState(toState(stateful));

    // @ts-ignore
    return state.properties?.['audio-recording-enabled'] === 'true';
}

/**
 * Returns the stored room name.
 *
 * @param {IReduxState} state - The current state of the app.
 * @returns {string}
 */
export function getRoomName(state: IReduxState) {
    return getConferenceState(state).room;
}

/**
 * Get an obfuscated room name or create and persist it if it doesn't exists.
 *
 * @param {IReduxState} state - The current state of the app.
 * @param {Function} dispatch - The Redux dispatch function.
 * @returns {string} - Obfuscated room name.
 */
export function getOrCreateObfuscatedRoomName(state: IReduxState, dispatch: IStore['dispatch']) {
    let { obfuscatedRoom } = getConferenceState(state);
    const { obfuscatedRoomSource } = getConferenceState(state);
    const room = getRoomName(state);

    if (!room) {
        return;
    }

    // On native mobile the store doesn't clear when joining a new conference so we might have the obfuscatedRoom
    // stored even though a different room was joined.
    // Check if the obfuscatedRoom was already computed for the current room.
    if (!obfuscatedRoom || (obfuscatedRoomSource !== room)) {
        obfuscatedRoom = sha512(room);
        dispatch(setObfuscatedRoom(obfuscatedRoom, room));
    }

    return obfuscatedRoom;
}

/**
 * Analytics may require an obfuscated room name, this functions decides based on a config if the normal or
 * obfuscated room name should be returned.
 *
 * @param {IReduxState} state - The current state of the app.
 * @param {Function} dispatch - The Redux dispatch function.
 * @returns {string} - Analytics room name.
 */
export function getAnalyticsRoomName(state: IReduxState, dispatch: IStore['dispatch']) {
    const { analysis: { obfuscateRoomName = false } = {} } = state['features/base/config'];

    if (obfuscateRoomName) {
        return getOrCreateObfuscatedRoomName(state, dispatch);
    }

    return getRoomName(state);
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
export function _handleParticipantError(err: Error) {
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
export function isRoomValid(room?: string) {
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
        conference: IJitsiConference,
        localTracks: Array<Object>) {
    return Promise.all(localTracks.map(track =>
        conference.removeTrack(track)
            .catch((err: Error) => {
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
function _reportError(msg: string, err: Error) {
    // TODO This is a good point to call some global error handler when we have
    // one.
    logger.error(msg, err);
}

/**
 * Sends a representation of the local participant such as her avatar (URL),
 * email address, and display name to (the remote participants of) a specific
 * conference.
 *
 * @param {Function|Object} stateful - The redux store, state, or
 * {@code getState} function.
 * @param {JitsiConference} conference - The {@code JitsiConference} to which
 * the representation of the local participant is to be sent.
 * @returns {void}
 */
export function sendLocalParticipant(
        stateful: IStateful,
        conference?: IJitsiConference) {
    const {
        avatarURL,
        email,
        features,
        name
    } = getLocalParticipant(stateful) ?? {};

    avatarURL && conference?.sendCommand(AVATAR_URL_COMMAND, {
        value: avatarURL
    });
    email && conference?.sendCommand(EMAIL_COMMAND, {
        value: email
    });

    if (features && features['screen-sharing'] === 'true') {
        conference?.setLocalParticipantProperty('features_screen-sharing', true);
    }

    conference?.setDisplayName(name);
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
    return words(`${s}`.replace(/['\u2019]/g, '')).reduce(
        (result, word, index) => result + (index ? ' ' : '') + upperFirst(word)
        , '');
}
