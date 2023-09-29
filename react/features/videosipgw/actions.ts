import { SIP_GW_INVITE_ROOMS } from './actionTypes';

/**
 * Invites room participants to the conference through the SIP Jibri service.
 *
 * @param {JitsiMeetConference} conference - The conference to which the rooms
 * will be invited to.
 * @param {Immutable.List} rooms - The list of the "videosipgw" type items to
 * invite.
 * @returns {void}
 */
export function inviteVideoRooms(
        conference: Object,
        rooms: Object) {
    return {
        type: SIP_GW_INVITE_ROOMS,
        conference,
        rooms
    };
}
