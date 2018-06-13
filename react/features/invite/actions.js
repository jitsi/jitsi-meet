// @flow

import { getInviteURL } from '../base/connection';
import { inviteVideoRooms } from '../videosipgw';

import {
    BEGIN_ADD_PEOPLE,
    UPDATE_DIAL_IN_NUMBERS_FAILED,
    UPDATE_DIAL_IN_NUMBERS_SUCCESS
} from './actionTypes';
import {
    getDialInConferenceID,
    getDialInNumbers,
    invitePeopleAndChatRooms
} from './functions';

const logger = require('jitsi-meet-logger').getLogger(__filename);

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
 * Invites (i.e. sends invites to) an array of invitees (which may be a
 * combination of users, rooms, phone numbers, and video rooms).
 *
 * @param  {Array<Object>} invitees - The recepients to send invites to.
 * @returns {Promise<Array<Object>>} A {@code Promise} resolving with an array
 * of invitees who were not invited (i.e. invites were not sent to them).
 */
export function invite(invitees: Array<Object>) {
    return (
            dispatch: Dispatch<*>,
            getState: Function): Promise<Array<Object>> => {
        let allInvitePromises = [];
        let invitesLeftToSend = [ ...invitees ];

        const state = getState();
        const { conference } = state['features/base/conference'];
        const {
            callFlowsEnabled,
            inviteServiceUrl,
            inviteServiceCallFlowsUrl
        } = state['features/base/config'];
        const inviteUrl = getInviteURL(state);
        const { jwt } = state['features/base/jwt'];

        // First create all promises for dialing out.
        if (conference) {
            const phoneNumbers
                = invitesLeftToSend.filter(({ type }) => type === 'phone');

            // For each number, dial out. On success, remove the number from
            // {@link invitesLeftToSend}.
            const phoneInvitePromises = phoneNumbers.map(item => {
                const numberToInvite = item.number;

                return conference.dial(numberToInvite)
                    .then(() => {
                        invitesLeftToSend
                            = invitesLeftToSend.filter(
                                invitee => invitee !== item);
                    })
                    .catch(error =>
                        logger.error('Error inviting phone number:', error));
            });

            allInvitePromises = allInvitePromises.concat(phoneInvitePromises);
        }

        const usersAndRooms
            = invitesLeftToSend.filter(
                ({ type }) => type === 'user' || type === 'room');

        if (usersAndRooms.length) {
            // Send a request to invite all the rooms and users. On success,
            // filter all rooms and users from {@link invitesLeftToSend}.
            const peopleInvitePromise
                = invitePeopleAndChatRooms(
                    callFlowsEnabled
                        ? inviteServiceCallFlowsUrl : inviteServiceUrl,
                    inviteUrl,
                    jwt,
                    usersAndRooms)
                .then(() => {
                    invitesLeftToSend
                        = invitesLeftToSend.filter(
                            ({ type }) => type !== 'user' && type !== 'room');
                })
                .catch(error => logger.error('Error inviting people:', error));

            allInvitePromises.push(peopleInvitePromise);
        }

        // Sipgw calls are fire and forget. Invite them to the conference, then
        // immediately remove them from invitesLeftToSend.
        const vrooms
            = invitesLeftToSend.filter(({ type }) => type === 'videosipgw');

        conference
            && vrooms.length > 0
            && dispatch(inviteVideoRooms(conference, vrooms));

        invitesLeftToSend
            = invitesLeftToSend.filter(({ type }) => type !== 'videosipgw');

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
    return (dispatch: Dispatch<*>, getState: Function) => {
        const state = getState();
        const { dialInConfCodeUrl, dialInNumbersUrl, hosts }
            = state['features/base/config'];
        const mucURL = hosts && hosts.muc;

        if (!dialInConfCodeUrl || !dialInNumbersUrl || !mucURL) {
            // URLs for fetching dial in numbers not defined
            return;
        }

        const { room } = state['features/base/conference'];

        Promise.all([
            getDialInNumbers(dialInNumbersUrl),
            getDialInConferenceID(dialInConfCodeUrl, room, mucURL)
        ])
            .then(([ dialInNumbers, { conference, id, message } ]) => {
                if (!conference || !id) {
                    return Promise.reject(message);
                }

                dispatch({
                    type: UPDATE_DIAL_IN_NUMBERS_SUCCESS,
                    conferenceID: id,
                    dialInNumbers
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
