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
    getDigitsOnly,
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

/**
 * Send invites for a list of items (may be a combination of users, rooms, phone
 * numbers, and video rooms).
 *
 * @param  {Array<Object>} invites - Items for which invites should be sent.
 * @returns {Promise} Promise containing the list of invites that were not sent.
 */
export function sendInvitesForItems(invites: Array<Object>) {
    return (
            dispatch: Dispatch<*>,
            getState: Function): Promise<Array<Object>> => {
        let allInvitePromises = [];
        let invitesLeftToSend = [ ...invites ];
        const state = getState();
        const { conference } = state['features/base/conference'];
        const { inviteServiceUrl } = state['features/base/config'];
        const inviteUrl = getInviteURL(state);
        const jwt = state['features/base/jwt'].jwt;

        // First create all promises for dialing out.
        if (conference) {
            const phoneNumbers
                = invitesLeftToSend.filter(({ type }) => type === 'phone');

            // For each number, dial out. On success, remove the number from
            // {@link invitesLeftToSend}.
            const phoneInvitePromises = phoneNumbers.map(item => {
                const numberToInvite = getDigitsOnly(item.number);

                return conference.dial(numberToInvite)
                     .then(() => {
                         invitesLeftToSend
                             = invitesLeftToSend.filter(invite =>
                                 invite !== item);
                     })
                     .catch(error => logger.error(
                         'Error inviting phone number:', error));
            });

            allInvitePromises = allInvitePromises.concat(phoneInvitePromises);
        }

        const usersAndRooms = invitesLeftToSend.filter(item =>
            item.type === 'user' || item.type === 'room');

        if (usersAndRooms.length) {
            // Send a request to invite all the rooms and users. On success,
            // filter all rooms and users from {@link invitesLeftToSend}.
            const peopleInvitePromise = invitePeopleAndChatRooms(
                inviteServiceUrl,
                inviteUrl,
                jwt,
                usersAndRooms)
                .then(() => {
                    invitesLeftToSend = invitesLeftToSend.filter(item =>
                        item.type !== 'user' && item.type !== 'room');
                })
                .catch(error => logger.error(
                    'Error inviting people:', error));

            allInvitePromises.push(peopleInvitePromise);
        }

        // Sipgw calls are fire and forget. Invite them to the conference
        // then immediately remove them from {@link invitesLeftToSend}.
        const vrooms = invitesLeftToSend.filter(item =>
            item.type === 'videosipgw');

        conference
            && vrooms.length > 0
            && dispatch(inviteVideoRooms(conference, vrooms));

        invitesLeftToSend = invitesLeftToSend.filter(item =>
            item.type !== 'videosipgw');

        return (
            Promise.all(allInvitePromises)
                .then(() => invitesLeftToSend)
        );
    };
}
