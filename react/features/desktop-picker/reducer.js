import { ReducerRegistry } from '../base/redux';

import {
    RESET_DESKTOP_SOURCES,
    UPDATE_DESKTOP_SOURCES
} from './actionTypes';

const DEFAULT_STATE = {
    screen: [],
    window: []
};

/**
 * Listen for actions that mutate the known available DesktopCapturerSources.
 *
 * @param {Object[]} state - Current state.
 * @param {Object} action - Action object.
 * @param {string} action.type - Type of action.
 * @param {Array} action.sources - DesktopCapturerSources.
 * @returns {Object}
 */
ReducerRegistry.register(
    'features/desktop-picker',
    (state = DEFAULT_STATE, action) => {
        switch (action.type) {
        case RESET_DESKTOP_SOURCES:
            return { ...DEFAULT_STATE };

        case UPDATE_DESKTOP_SOURCES:
            return _seperateSourcesByType(action.sources);

        default:
            return state;
        }
    });

/**
 * Converts an array of DesktopCapturerSources to an object with types for keys
 * and values being an array with sources of the key's type.
 *
 * @param {Array} sources - DesktopCapturerSources.
 * @private
 * @returns {Object} An object with the sources split into seperate arrays based
 * on source type.
 */
function _seperateSourcesByType(sources = []) {
    const sourcesByType = {
        screen: [],
        window: []
    };

    sources.forEach(source => {
        const idParts = source.id.split(':');
        const type = idParts[0];

        if (sourcesByType[type]) {
            sourcesByType[type].push(source);
        }
    });

    return sourcesByType;
}
