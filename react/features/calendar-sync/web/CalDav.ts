import { IStore } from '../../app/types';
import {
  getCalendarEntries,
  loadCalDavAPI,
  signIn,
  updateCalendarEvent,
  updateProfile
} from '../../caldav-api/actions'; // @ts-ignore
import calDavApi from '../../caldav-api/calDavApi.web';

/**
 * A stateless collection of action creators that implements the expected
 * interface for interacting with the CalDav API in order to get calendar data.
 *
 * @type {Object}
 */
export const calDavCalendarApi = {
  /**
   * Retrieves the current calendar events.
   *
   * @param {number} fetchStartDays - The number of days to go back
   * when fetching.
   * @param {number} fetchEndDays - The number of days to fetch.
   * @returns {function(): Promise<CalendarEntries>}
   */
  getCalendarEntries,

  /**
   * Returns the email address for the currently logged in user.
   *
   * @returns {function(Dispatch<any>): Promise<string|never>}
   */
  getCurrentEmail() {
    return updateProfile();
  },

  /**
   * Initializes the caldav api if needed.
   *
   * @returns {function(Dispatch<any>, Function): Promise<void>}
   */
  load() {
    return (dispatch: IStore['dispatch']) => dispatch(loadCalDavAPI());
  },

  /**
   * Prompts the participant to sign in to the CalDav API Client Library.
   *
   * @returns {function(Dispatch<any>): Promise<string|never>}
   */
  signIn,

  /**
   * Returns whether or not the user is currently signed in.
   *
   * @returns {function(): Promise<boolean>}
   */
  _isSignedIn() {
    return () => calDavApi.isSignedIn();
  },

  /**
   * Updates calendar event by generating new invite URL and editing the event
   * adding some descriptive text and location.
   *
   * @param {string} id - The event id.
   * @param {string} calendarId - The id of the calendar to use.
   * @param {string} location - The location to save to the event.
   * @returns {function(Dispatch<any>): Promise<string|never>}
   */
  updateCalendarEvent
};
