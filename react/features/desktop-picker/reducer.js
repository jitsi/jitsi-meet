import { ReducerRegistry } from '../base/redux';
import {
    RESET_DESKTOP_SOURCES,
    UPDATE_DESKTOP_SOURCES
} from './actionTypes';

const defaultState = {
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
    'features/desktop-picker/sources',
    (state = defaultState, action) => {
        switch (action.type) {
        case RESET_DESKTOP_SOURCES:
            return { ...defaultState };
        case UPDATE_DESKTOP_SOURCES:
            return seperateSourcesByType(action.sources);
        default:
            return state;
        }
    });

/**
 * Converts an array of DesktopCapturerSources to an object with types
 * for keys and values being an array with sources of the key's type.
 *
 * @param {Array} sources - DesktopCapturerSources.
 * @returns {Object} An object with the sources split into seperate arrays
 * based on source type.
 * @private
 */
function seperateSourcesByType(sources = []) {
    const sourcesByType = {
        screen: [],
        window: []
    };

    sources.forEach(source => {
        const sourceIdParts = source.id.split(':');
        const sourceType = sourceIdParts[0];

        if (sourcesByType[sourceType]) {
            sourcesByType[sourceType].push(source);
        }
    });

    return sourcesByType;
}
