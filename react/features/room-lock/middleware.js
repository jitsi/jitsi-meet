/* global APP */
import JitsiMeetJS from '../base/lib-jitsi-meet';

import { CONFERENCE_FAILED } from '../base/conference';
import { MiddlewareRegistry } from '../base/redux';
import { _showPasswordDialog } from './actions';

/**
 * Middleware that captures conference failed and checks for password required
 * error and requests a dialog for user to enter password.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {

    switch (action.type) {
    case CONFERENCE_FAILED: {
        const JitsiConferenceErrors = JitsiMeetJS.errors.conference;

        if (action.conference
            && JitsiConferenceErrors.PASSWORD_REQUIRED === action.error) {
            // XXX temporary solution till we move the whole invite
            // logic in react
            if (typeof APP !== 'undefined') {
                APP.conference.invite.setLockedFromElsewhere(true);
            }

            store.dispatch(_showPasswordDialog(action.conference));
        }
        break;
    }
    }

    return next(action);
});
