// @flow

/**
 * Action to update the current calendar entry list in the store.
 */
export const NEW_CALENDAR_ENTRY_LIST = Symbol('NEW_CALENDAR_ENTRY_LIST');

/**
 * Action to add a new known domain to the list.
 */
export const NEW_KNOWN_DOMAIN = Symbol('NEW_KNOWN_DOMAIN');

/**
 * Action to refresh (re-fetch) the entry list.
 */
export const REFRESH_CALENDAR_ENTRY_LIST
    = Symbol('REFRESH_CALENDAR_ENTRY_LIST');
