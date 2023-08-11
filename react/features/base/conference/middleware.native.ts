
import { readyToClose } from '../../mobile/external-api/actions';
import { showWarningNotification } from '../../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../../notifications/constants';
import { JitsiConferenceErrors } from '../lib-jitsi-meet';
import MiddlewareRegistry from '../redux/MiddlewareRegistry';

import { CONFERENCE_FAILED } from './actionTypes';
import { leaveConference } from './actions';
import {
    CONFERENCE_DESTROYED_LEAVE_TIMEOUT,
    TRIGGER_READY_TO_CLOSE_REASONS
} from './constants';

import './middleware.any';

MiddlewareRegistry.register(store => next => action => {
    const { dispatch } = store;
    const { error } = action;

    if (action.type === CONFERENCE_FAILED) {
        if (error?.name === JitsiConferenceErrors.CONFERENCE_DESTROYED) {
            const [ reason ] = error.params;

            dispatch(showWarningNotification({
                description: reason,
                titleKey: 'dialog.sessTerminated'
            }, NOTIFICATION_TIMEOUT_TYPE.LONG));

            if (Object.values(TRIGGER_READY_TO_CLOSE_REASONS).includes(reason)) {
                dispatch(readyToClose());

                setTimeout(() => dispatch(leaveConference()), CONFERENCE_DESTROYED_LEAVE_TIMEOUT);
            }
        }
    }

    return next(action);
});
