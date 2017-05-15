import { Symbol } from '../base/react';

/**
 * Action to remove known DesktopCapturerSources.
 *
 * {
 *     type: RESET_DESKTOP_SOURCES,
 * }
 */
export const RESET_DESKTOP_SOURCES = Symbol('RESET_DESKTOP_SOURCES');

/**
 * Action to replace stored DesktopCapturerSources with new sources.
 *
 * {
 *     type: UPDATE_DESKTOP_SOURCES,
 *     sources: {Array}
 * }
 */
export const UPDATE_DESKTOP_SOURCES = Symbol('UPDATE_DESKTOP_SOURCES');
