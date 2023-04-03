import i18n from 'i18next';
import { batch } from 'react-redux';

import { appNavigate } from '../app/actions';
import { IStore } from '../app/types';
import {
    CONFERENCE_FAILED,
    CONFERENCE_JOINED,
    CONFERENCE_LEFT,
    KICKED_OUT
} from '../base/conference/actionTypes';
import { conferenceLeft } from '../base/conference/actions';
import { getCurrentConference } from '../base/conference/functions';
import { getURLWithoutParamsNormalized } from '../base/connection/utils';
import { hideDialog } from '../base/dialog/actions';
import { isDialogOpen } from '../base/dialog/functions';
import { getLocalizedDateFormatter } from '../base/i18n/dateUtil';
import { pinParticipant } from '../base/participants/actions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { SET_REDUCED_UI } from '../base/responsive-ui/actionTypes';
import { BUTTON_TYPES } from '../base/ui/constants.any';
import { isCalendarEnabled } from '../calendar-sync/functions';
// eslint-disable-next-line lines-around-comment
// @ts-ignore
import FeedbackDialog from '../feedback/components/FeedbackDialog';
import { setFilmstripEnabled } from '../filmstrip/actions.any';
import { hideNotification, showNotification } from '../notifications/actions';
import {
    CALENDAR_NOTIFICATION_ID,
    NOTIFICATION_ICON,
    NOTIFICATION_TIMEOUT_TYPE
} from '../notifications/constants';
import { showSalesforceNotification } from '../salesforce/actions';
import { setToolboxEnabled } from '../toolbox/actions.any';

import { DISMISS_CALENDAR_NOTIFICATION } from './actionTypes';
import { dismissCalendarNotification, notifyKickedOut } from './actions';


let intervalID: any;


MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case CONFERENCE_JOINED: {
        _conferenceJoined(store);

        break;
    }

    case SET_REDUCED_UI: {
        _setReducedUI(store);

        break;
    }

    case KICKED_OUT: {
        const { dispatch } = store;

        dispatch(notifyKickedOut(
            action.participant,
            () => {
                dispatch(conferenceLeft(action.conference));
                dispatch(appNavigate(undefined));
            }
        ));

        break;
    }

    case DISMISS_CALENDAR_NOTIFICATION:
    case CONFERENCE_LEFT:
    case CONFERENCE_FAILED: {
        clearInterval(intervalID);
        intervalID = null;

        break;
    }
    }

    return result;
});

/**
 * Set up state change listener to perform maintenance tasks when the conference
 * is left or failed, close all dialogs and unpin any pinned participants.
 */
StateListenerRegistry.register(
    state => getCurrentConference(state),
    (conference, { dispatch, getState }, prevConference) => {
        const { authRequired, membersOnly, passwordRequired }
            = getState()['features/base/conference'];

        if (conference !== prevConference) {
            // Unpin participant, in order to avoid the local participant
            // remaining pinned, since it's not destroyed across runs.
            dispatch(pinParticipant(null));

            // XXX I wonder if there is a better way to do this. At this stage
            // we do know what dialogs we want to keep but the list of those
            // we want to hide is a lot longer. Thus we take a bit of a shortcut
            // and explicitly check.
            if (typeof authRequired === 'undefined'
                    && typeof passwordRequired === 'undefined'
                    && typeof membersOnly === 'undefined'
                    && !isDialogOpen(getState(), FeedbackDialog)) {
                // Conference changed, left or failed... and there is no
                // pending authentication, nor feedback request, so close any
                // dialog we might have open.
                dispatch(hideDialog());
            }
        }
    });

/**
 * Configures the UI. In reduced UI mode some components will
 * be hidden if there is no space to render them.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @private
 * @returns {void}
 */
function _setReducedUI({ dispatch, getState }: IStore) {
    const { reducedUI } = getState()['features/base/responsive-ui'];

    dispatch(setToolboxEnabled(!reducedUI));
    dispatch(setFilmstripEnabled(!reducedUI));
}

/**
 * Does extra sync up on properties that may need to be updated after the
 * conference was joined.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @private
 * @returns {void}
 */
function _conferenceJoined({ dispatch, getState }: IStore) {
    _setReducedUI({
        dispatch,
        getState
    });

    if (!intervalID) {
        intervalID = setInterval(() =>
            _maybeDisplayCalendarNotification({
                dispatch,
                getState
            }), 10 * 1000);
    }

    dispatch(showSalesforceNotification());
}

/**
 * Periodically checks if there is an event in the calendar for which we
 * need to show a notification.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @private
 * @returns {void}
 */
function _maybeDisplayCalendarNotification({ dispatch, getState }: IStore) {
    const state = getState();

    const calendarEnabled = isCalendarEnabled(state);
    const { events: eventList } = state['features/calendar-sync'];
    const { locationURL } = state['features/base/connection'];
    const { reducedUI } = state['features/base/responsive-ui'];

    const currentConferenceURL
        = locationURL ? getURLWithoutParamsNormalized(locationURL) : '';
    const ALERT_MILLISECONDS = 5 * 60 * 1000;
    const now = Date.now();

    let eventToShow;

    if (!calendarEnabled && reducedUI) {
        return;
    }

    if (eventList?.length) {

        for (const event of eventList) {
            const eventURL
                = event?.url && getURLWithoutParamsNormalized(new URL(event.url));

            if (eventURL && eventURL !== currentConferenceURL) {
                // @ts-ignore
                if ((!eventToShow && event.startDate > now && event.startDate < now + ALERT_MILLISECONDS)

                    // @ts-ignore
                    || (event.startDate < now && event.endDate > now)) {
                    eventToShow = event;
                }
            }
        }
    }

    _calendarNotification(
        {
            dispatch,
            getState
        }, eventToShow
    );
}

/**
 * Calendar notification.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {eventToShow} eventToShow - Next or ongoing event.
 * @private
 * @returns {void}
 */
function _calendarNotification({ dispatch, getState }: IStore, eventToShow: any) {
    const state = getState();

    const { locationURL } = state['features/base/connection'];

    const currentConferenceURL
        = locationURL ? getURLWithoutParamsNormalized(locationURL) : '';
    const now = Date.now();

    if (!eventToShow) {
        return;
    }

    const customActionNameKey = [ 'notify.joinMeeting', 'notify.dontRemindMe' ];
    const customActionType = [ BUTTON_TYPES.PRIMARY, BUTTON_TYPES.DESTRUCTIVE ];
    const customActionHandler = [ () => batch(() => {
        dispatch(hideNotification(CALENDAR_NOTIFICATION_ID));
        if (eventToShow?.url && (eventToShow.url !== currentConferenceURL)) {
            dispatch(appNavigate(eventToShow.url));
        }
    }), () => dispatch(dismissCalendarNotification()) ];
    const description
        = getLocalizedDateFormatter(eventToShow.startDate).fromNow();
    const icon = NOTIFICATION_ICON.WARNING;
    const title = (eventToShow.startDate < now) && (eventToShow.endDate > now)
        ? `${i18n.t('calendarSync.ongoingMeeting')}: \n${eventToShow.title}`
        : `${i18n.t('calendarSync.nextMeeting')}: \n${eventToShow.title}`;
    const uid = CALENDAR_NOTIFICATION_ID;

    dispatch(showNotification({
        customActionHandler,
        customActionNameKey,
        customActionType,
        description,
        icon,
        title,
        uid
    }, NOTIFICATION_TIMEOUT_TYPE.STICKY));
}
