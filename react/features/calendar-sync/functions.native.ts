import { NativeModules, Platform } from 'react-native';
import RNCalendarEvents from 'react-native-calendar-events';

import { IReduxState, IStore } from '../app/types';
import { IStateful } from '../base/app/types';
import { CALENDAR_ENABLED } from '../base/flags/constants';
import { getFeatureFlag } from '../base/flags/functions';
import { getShareInfoText } from '../invite/functions';

import { setCalendarAuthorization } from './actions.native';
import { FETCH_END_DAYS, FETCH_START_DAYS } from './constants';
import { _updateCalendarEntries } from './functions.native';
import logger from './logger';

export * from './functions.any';

/**
 * Adds a Jitsi link to a calendar entry.
 *
 * @param {Object} state - The Redux state.
 * @param {string} id - The ID of the calendar entry.
 * @param {string} link - The link to add info with.
 * @returns {Promise<*>}
 */
export function addLinkToCalendarEntry(
        state: IReduxState, id: string, link: string): Promise<any> {
    return new Promise((resolve, reject) => {
        getShareInfoText(state, link, true).then((shareInfoText: string) => {
            RNCalendarEvents.findEventById(id).then((event: any) => {
                const updateText
                    = event.description
                        ? `${event.description}\n\n${shareInfoText}`
                        : shareInfoText;
                const updateObject = {
                    id: event.id,
                    ...Platform.select({
                        ios: {
                            notes: updateText
                        },
                        android: {
                            description: updateText
                        }
                    })
                };

                // @ts-ignore
                RNCalendarEvents.saveEvent(event.title, updateObject)
                .then(resolve, reject);
            }, reject);
        }, reject);
    });
}

/**
 * Determines whether the calendar feature is enabled by the app. For
 * example, Apple through its App Store requires
 * {@code NSCalendarsUsageDescription} in the app's Info.plist or App Store
 * rejects the app. It could also be disabled with a feature flag.
 *
 * @param {Function|Object} stateful - The redux store or {@code getState}
 * function.
 * @returns {boolean} If the app has enabled the calendar feature, {@code true};
 * otherwise, {@code false}.
 */
export function isCalendarEnabled(stateful: IStateful) {
    const flag = getFeatureFlag(stateful, CALENDAR_ENABLED);

    if (typeof flag !== 'undefined') {
        return flag;
    }

    const { calendarEnabled = true } = NativeModules.AppInfo;

    return calendarEnabled;
}

/**
 * Reads the user's calendar and updates the stored entries if need be.
 *
 * @param {Object} store - The redux store.
 * @param {boolean} maybePromptForPermission - Flag to tell the app if it should
 * prompt for a calendar permission if it wasn't granted yet.
 * @param {boolean|undefined} forcePermission - Whether to force to re-ask for
 * the permission or not.
 * @private
 * @returns {void}
 */
export function _fetchCalendarEntries(
        store: IStore,
        maybePromptForPermission: boolean,
        forcePermission?: boolean) {
    const { dispatch, getState } = store;
    const promptForPermission
        = (maybePromptForPermission
        && !getState()['features/calendar-sync'].authorization)
        || forcePermission;

    _ensureCalendarAccess(promptForPermission, dispatch)
        .then(accessGranted => {
            if (accessGranted) {
                const startDate = new Date();
                const endDate = new Date();

                startDate.setDate(startDate.getDate() + FETCH_START_DAYS);
                endDate.setDate(endDate.getDate() + FETCH_END_DAYS);

                RNCalendarEvents.fetchAllEvents(

                    // @ts-ignore
                    startDate.getTime(),
                    endDate.getTime(),
                    [])
                    .then(_updateCalendarEntries.bind(store))
                    .catch(error =>
                        logger.error('Error fetching calendar.', error));
            } else {
                logger.warn('Calendar access not granted.');
            }
        })
        .catch(reason => logger.error('Error accessing calendar.', reason));
}

/**
 * Ensures calendar access if possible and resolves the promise if it's granted.
 *
 * @param {boolean} promptForPermission - Flag to tell the app if it should
 * prompt for a calendar permission if it wasn't granted yet.
 * @param {Function} dispatch - The Redux dispatch function.
 * @private
 * @returns {Promise}
 */
function _ensureCalendarAccess(promptForPermission: boolean | undefined, dispatch: IStore['dispatch']) {
    return new Promise((resolve, reject) => {
        RNCalendarEvents.checkPermissions()
            .then(status => {
                if (status === 'authorized') {
                    resolve(true);
                } else if (promptForPermission) {
                    RNCalendarEvents.requestPermissions()
                        .then(result => {
                            dispatch(setCalendarAuthorization(result));
                            resolve(result === 'authorized');
                        })
                        .catch(reject);
                } else {
                    resolve(false);
                }
            })
            .catch(reject);
    });
}
