import { IStore } from '../app/types';
import { CONFERENCE_JOIN_IN_PROGRESS } from '../base/conference/actionTypes';
import { IJitsiConference } from '../base/conference/reducer';
import {
    JitsiConferenceEvents,
    JitsiSIPVideoGWStatus
} from '../base/lib-jitsi-meet';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import {
    showErrorNotification,
    showNotification,
    showWarningNotification
} from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';

import {
    SIP_GW_AVAILABILITY_CHANGED,
    SIP_GW_INVITE_ROOMS
} from './actionTypes';
import logger from './logger';
import { ISipRoom, ISipSessionChangedEvent } from './types';

/**
 * Middleware that captures conference video sip gw events and stores
 * the global sip gw availability in redux or show appropriate notification
 * for sip gw sessions.
 * Captures invitation actions that create sip gw sessions or display
 * appropriate error/warning notifications.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(({ dispatch }) => next => action => {
    const result = next(action);

    switch (action.type) {
    case CONFERENCE_JOIN_IN_PROGRESS: {
        const { conference } = action;

        conference.on(
            JitsiConferenceEvents.VIDEO_SIP_GW_AVAILABILITY_CHANGED,
            (status: string) => dispatch(_availabilityChanged(status)));
        conference.on(
            JitsiConferenceEvents.VIDEO_SIP_GW_SESSION_STATE_CHANGED,
            (event: ISipSessionChangedEvent) => {
                const toDispatch = _sessionStateChanged(event);

                // sessionStateChanged can decide there is nothing to dispatch
                if (toDispatch) {
                    dispatch(toDispatch);
                }
            });

        break;
    }
    case SIP_GW_INVITE_ROOMS:
        _inviteRooms(action.rooms, action.conference, dispatch);
        break;
    }

    return result;
});

/**
 * Signals that sip gw availability had changed.
 *
 * @param {string} status - The new status of the service.
 * @returns {{
 *     type: SIP_GW_AVAILABILITY_CHANGED,
 *     status: string
 * }}
 * @private
 */
function _availabilityChanged(status: string) {
    return {
        type: SIP_GW_AVAILABILITY_CHANGED,
        status
    };
}

/**
 * Processes the action from the actionType {@code SIP_GW_INVITE_ROOMS} by
 * inviting rooms into the conference or showing an error message.
 *
 * @param {Array} rooms - The conference rooms to invite.
 * @param {Object} conference - The JitsiConference to invite the rooms to.
 * @param {Function} dispatch - The redux dispatch function for emitting state
 * changes (queuing error notifications).
 * @private
 * @returns {void}
 */
function _inviteRooms(rooms: ISipRoom[], conference: IJitsiConference, dispatch: IStore['dispatch']) {
    for (const room of rooms) {
        const { id: sipAddress, name: displayName } = room;

        if (sipAddress && displayName) {
            const newSession = conference
                .createVideoSIPGWSession(sipAddress, displayName);

            if (newSession instanceof Error) {
                const e = newSession;

                switch (e.message) {
                case JitsiSIPVideoGWStatus.ERROR_NO_CONNECTION: {
                    dispatch(showErrorNotification({
                        descriptionKey: 'videoSIPGW.errorInvite',
                        titleKey: 'videoSIPGW.errorInviteTitle'
                    }));

                    return;
                }
                case JitsiSIPVideoGWStatus.ERROR_SESSION_EXISTS: {
                    dispatch(showWarningNotification({
                        titleKey: 'videoSIPGW.errorAlreadyInvited',
                        titleArguments: { displayName }
                    }, NOTIFICATION_TIMEOUT_TYPE.LONG));

                    return;
                }
                }

                logger.error(
                    'Unknown error trying to create sip videogw session',
                    e);

                return;
            }

            newSession.start();
        } else {
            logger.error(`No display name or sip number for ${
                JSON.stringify(room)}`);
        }
    }
}

/**
 * Signals that a session we created has a change in its status.
 *
 * @param {string} event - The event describing the session state change.
 * @returns {Object|null} - A notification action.
 * @private
 */
function _sessionStateChanged(
        event: ISipSessionChangedEvent) {
    switch (event.newState) {
    case JitsiSIPVideoGWStatus.STATE_PENDING: {
        return showNotification({
            titleKey: 'videoSIPGW.pending',
            titleArguments: {
                displayName: event.displayName
            }
        }, NOTIFICATION_TIMEOUT_TYPE.SHORT);
    }
    case JitsiSIPVideoGWStatus.STATE_FAILED: {
        return showErrorNotification({
            titleKey: 'videoSIPGW.errorInviteFailedTitle',
            titleArguments: {
                displayName: event.displayName
            },
            descriptionKey: 'videoSIPGW.errorInviteFailed'
        });
    }
    case JitsiSIPVideoGWStatus.STATE_OFF: {
        if (event.failureReason === JitsiSIPVideoGWStatus.STATUS_BUSY) {
            return showErrorNotification({
                descriptionKey: 'videoSIPGW.busy',
                titleKey: 'videoSIPGW.busyTitle'
            });
        } else if (event.failureReason) {
            logger.error(`Unknown sip videogw error ${event.newState} ${
                event.failureReason}`);
        }
    }
    }

    // nothing to show
    return null;
}
