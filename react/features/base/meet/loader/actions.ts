import { HIDE_LOADER, SHOW_LOADER } from './actionTypes';
import { IHideLoaderAction, IShowLoaderAction } from './types';

/**
 * Shows the global loader with optional text.
 *
 * @param {string} [text] - Direct text to display (for dynamic content).
 * @param {string} [textKey] - Translation key for i18n support.
 * @param {string} [id] - Optional identifier for this loader instance.
 * @returns {IShowLoaderAction} The action to show the loader.
 */
export const showLoader = (text?: string, textKey?: string, id?: string): IShowLoaderAction => ({
    type: SHOW_LOADER,
    text,
    textKey,
    id,
});

/**
 * Hides the global loader.
 *
 * @param {string} [id] - Optional identifier to hide specific loader instance.
 * @returns {IHideLoaderAction} The action to hide the loader.
 */
export const hideLoader = (id?: string): IHideLoaderAction => ({
    type: HIDE_LOADER,
    id,
});
