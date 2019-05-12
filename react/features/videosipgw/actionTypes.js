/**
 * The type of (redux) action which signals that sip GW service change its
 * availability status.
 *
 * {
 *     type: SIP_GW_AVAILABILITY_CHANGED,
 *     status: string
 * }
 */
export const SIP_GW_AVAILABILITY_CHANGED
    = 'SIP_GW_AVAILABILITY_CHANGED';

/**
 * The type of the action which signals to invite room participants to the
 * conference through the SIP Jibri service.
 *
 * {
 *     type: SIP_GW_INVITE_ROOMS,
 *     conference: JitsiConference,
 *     rooms: {Immutable.List}
 * }
 */
export const SIP_GW_INVITE_ROOMS = 'SIP_GW_INVITE_ROOMS';
