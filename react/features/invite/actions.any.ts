import { IStore } from '../app/types';
import { getInviteURL } from '../base/connection/functions';
import { getLocalParticipant, getParticipantCount } from '../base/participants/functions';
import { inviteVideoRooms } from '../videosipgw/actions';

import { getDialInConferenceID, getDialInNumbers } from './_utils';
import {
    ADD_PENDING_INVITE_REQUEST,
    BEGIN_ADD_PEOPLE,
    HIDE_ADD_PEOPLE_DIALOG,
    REMOVE_PENDING_INVITE_REQUESTS,
    SET_CALLEE_INFO_VISIBLE,
    UPDATE_DIAL_IN_NUMBERS_FAILED,
    UPDATE_DIAL_IN_NUMBERS_SUCCESS
} from './actionTypes';
import { INVITE_TYPES } from './constants';
import {
    invitePeopleAndChatRooms,
    inviteSipEndpoints
} from './functions';
import logger from './logger';
import { IInvitee } from './types';

/**
 * Creates a (redux) action to signal that a click/tap has been performed on
 * {@link InviteButton} and that the execution flow for adding/inviting people
 * to the current conference/meeting is to begin.
 *
 * @returns {{
 *     type: BEGIN_ADD_PEOPLE
 * }}
 */
export function beginAddPeople() {
    return {
        type: BEGIN_ADD_PEOPLE
    };
}

/**
 * Creates a (redux) action to signal that the {@code AddPeopleDialog}
 * should close.
 *
 * @returns {{
 *     type: HIDE_ADD_PEOPLE_DIALOG
 * }}
 */
export function hideAddPeopleDialog() {
    return {
        type: HIDE_ADD_PEOPLE_DIALOG
    };
}


/**
 * Invites (i.e. Sends invites to) an array of invitees (which may be a
 * combination of users, rooms, phone numbers, and video rooms.
 *
 * @param  {Array<Object>} invitees - The recipients to send invites to.
 * @param  {Array<Object>} showCalleeInfo - Indicates whether the
 * {@code CalleeInfo} should be displayed or not.
 * @returns {Promise<Array<Object>>} A {@code Promise} resolving with an array
 * of invitees who were not invited (i.e. Invites were not sent to them).
 */
export function invite(
        invitees: IInvitee[],
        showCalleeInfo = false) {
    return (
            dispatch: IStore['dispatch'],
            getState: IStore['getState']): Promise<IInvitee[]> => {
        const state = getState();
        const participantsCount = getParticipantCount(state);
        const { calleeInfoVisible } = state['features/invite'];

        if (showCalleeInfo
                && !calleeInfoVisible
                && invitees.length === 1
                && invitees[0].type === INVITE_TYPES.USER
                && participantsCount === 1) {
            dispatch(setCalleeInfoVisible(true, invitees[0]));
        }

        const { conference, password } = state['features/base/conference'];

        if (typeof conference === 'undefined') {
            // Only keep invitees which can get an invite request from Jitsi UI
            const jitsiInvitees = invitees.filter(({ type }) => type !== INVITE_TYPES.EMAIL);

            // Invite will fail before CONFERENCE_JOIN. The request will be
            // cached in order to be executed on CONFERENCE_JOIN.
            if (jitsiInvitees.length) {
                return new Promise(resolve => {
                    dispatch(addPendingInviteRequest({
                        invitees: jitsiInvitees,
                        callback: (failedInvitees: any) => resolve(failedInvitees)
                    }));
                });
            }
        }

        let allInvitePromises: Promise<any>[] = [];
        let invitesLeftToSend = [ ...invitees ];

        const {
            callFlowsEnabled,
            inviteServiceUrl,
            inviteServiceCallFlowsUrl
        } = state['features/base/config'];
        const inviteUrl = getInviteURL(state);
        const { sipInviteUrl } = state['features/base/config'];
        const { locationURL } = state['features/base/connection'];
        const { jwt = '' } = state['features/base/jwt'];
        const { name: displayName } = getLocalParticipant(state) ?? {};

        // First create all promises for dialing out.
        const phoneNumbers
            = invitesLeftToSend.filter(({ type }) => type === INVITE_TYPES.PHONE);

        // For each number, dial out. On success, remove the number from
        // {@link invitesLeftToSend}.
        const phoneInvitePromises = typeof conference === 'undefined'
            ? []
            : phoneNumbers.map(item => {
                const numberToInvite = item.number;

                return conference.dial(numberToInvite)
                .then(() => {
                    invitesLeftToSend
                        = invitesLeftToSend.filter(
                            invitee => invitee !== item);
                })
                .catch((error: Error) =>
                    logger.error('Error inviting phone number:', error));
            });

        allInvitePromises = allInvitePromises.concat(phoneInvitePromises);

        const usersAndRooms
            = invitesLeftToSend.filter(
                ({ type }) => [ INVITE_TYPES.USER, INVITE_TYPES.EMAIL, INVITE_TYPES.ROOM ].includes(type));

        if (usersAndRooms.length) {
            // Send a request to invite all the rooms and users. On success,
            // filter all rooms and users from {@link invitesLeftToSend}.
            const peopleInvitePromise
                = invitePeopleAndChatRooms(
                    (callFlowsEnabled
                        ? inviteServiceCallFlowsUrl : inviteServiceUrl) ?? '',
                    inviteUrl,
                    usersAndRooms,
                    state)
                .then(() => {
                    invitesLeftToSend
                        = invitesLeftToSend.filter(
                            ({ type }) => ![ INVITE_TYPES.USER, INVITE_TYPES.EMAIL, INVITE_TYPES.ROOM ].includes(type));
                })
                .catch(error => {
                    dispatch(setCalleeInfoVisible(false));
                    logger.error('Error inviting people:', error);
                });

            allInvitePromises.push(peopleInvitePromise);
        }

        // Sipgw calls are fire and forget. Invite them to the conference, then
        // immediately remove them from invitesLeftToSend.
        const vrooms
            = invitesLeftToSend.filter(({ type }) => type === INVITE_TYPES.VIDEO_ROOM);

        conference
            && vrooms.length > 0
            && dispatch(inviteVideoRooms(conference, vrooms));

        invitesLeftToSend
            = invitesLeftToSend.filter(({ type }) => type !== INVITE_TYPES.VIDEO_ROOM);

        const sipEndpoints
            = invitesLeftToSend.filter(({ type }) => type === INVITE_TYPES.SIP);

        conference && inviteSipEndpoints(
            sipEndpoints,

            // @ts-ignore
            locationURL,
            sipInviteUrl,
            jwt,
            conference.options.name,
            password,
            displayName
        );

        invitesLeftToSend
            = invitesLeftToSend.filter(({ type }) => type !== INVITE_TYPES.SIP);

        return (
            Promise.all(allInvitePromises)
                .then(() => invitesLeftToSend));
    };
}

/**
 * Sends AJAX requests for dial-in numbers and conference ID.
 *
 * @returns {Function}
 */
export function updateDialInNumbers() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const { dialInConfCodeUrl, dialInNumbersUrl, hosts }
            = state['features/base/config'];
        const { numbersFetched } = state['features/invite'];
        const mucURL = hosts?.muc;

        if (numbersFetched || !dialInConfCodeUrl || !dialInNumbersUrl || !mucURL) {
            // URLs for fetching dial in numbers not defined
            return;
        }

        const { locationURL = {} } = state['features/base/connection'];
        const { room = '' } = state['features/base/conference'];

        Promise.all([
            getDialInNumbers(dialInNumbersUrl, room, mucURL), // @ts-ignore
            getDialInConferenceID(dialInConfCodeUrl, room, mucURL, locationURL)
        ])
            .then(([ dialInNumbers, { conference, id, message, sipUri } ]) => {
                if (!conference || !id) {
                    return Promise.reject(message);
                }

                dispatch({
                    type: UPDATE_DIAL_IN_NUMBERS_SUCCESS,
                    conferenceID: id,
                    dialInNumbers,
                    sipUri
                });
            })
            .catch(error => {
                dispatch({
                    type: UPDATE_DIAL_IN_NUMBERS_FAILED,
                    error
                });
            });
    };
}

/**
 * Sets the visibility of {@code CalleeInfo}.
 *
 * @param {boolean|undefined} [calleeInfoVisible] - If {@code CalleeInfo} is
 * to be displayed/visible, then {@code true}; otherwise, {@code false} or
 * {@code undefined}.
 * @param {Object|undefined} [initialCalleeInfo] - Callee information.
 * @returns {{
 *     type: SET_CALLEE_INFO_VISIBLE,
 *     calleeInfoVisible: (boolean|undefined),
 *     initialCalleeInfo
 * }}
 */
export function setCalleeInfoVisible(
        calleeInfoVisible: boolean,
        initialCalleeInfo?: Object) {
    return {
        type: SET_CALLEE_INFO_VISIBLE,
        calleeInfoVisible,
        initialCalleeInfo
    };
}

/**
 * Adds pending invite request.
 *
 * @param {Object} request - The request.
 * @returns {{
 *     type: ADD_PENDING_INVITE_REQUEST,
 *     request: Object
 * }}
 */
export function addPendingInviteRequest(
        request: { callback: Function; invitees: Array<Object>; }) {
    return {
        type: ADD_PENDING_INVITE_REQUEST,
        request
    };
}

/**
 * Removes all pending invite requests.
 *
 * @returns {{
 *     type: REMOVE_PENDING_INVITE_REQUEST
 * }}
 */
export function removePendingInviteRequests() {
    return {
        type: REMOVE_PENDING_INVITE_REQUESTS
    };
}
