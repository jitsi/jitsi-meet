import { getFakeParticipants } from '../base/participants';
import { toState } from '../base/redux';

/**
 * Returns the shared iframes config.
 *
 * @param {Function|Object} stateful - The redux store, the redux
 * {@code getState} function, or the redux state itself.
 * @returns {Object}
 */
export const getSharedIFramesConfig = (stateful: Function | Object) => {
    const state = toState(stateful);
    const { sharedIFrames: sharedIFramesConfig = {} } = state['features/base/config'];

    return sharedIFramesConfig;
};

/**
 * Returns the shared iframe instances.
 *
 * @param {Function|Object} stateful - The redux store, the redux
 * {@code getState} function, or the redux state itself.
 * @returns {Object}
 */
export const getSharedIFrameInstances = (stateful: Function | Object) => {
    const sharedIFrames = getSharedIFramesConfig(stateful).frames || {};

    return sharedIFrames;
};

/**
 * Returns true if an IFrame is shared in the meeting.
 *
 * @param {Object | Function} stateful - The Redux state or a function that gets resolved to the Redux state.
 * @returns {boolean}
 */
export function isIFrameSharingActive(stateful: Object | Function): boolean {
    let isIFrameActive = false;
    const sharedIFrames = getSharedIFramesConfig(stateful);

    // eslint-disable-next-line no-unused-vars
    for (const [ id, p ] of getFakeParticipants(stateful)) {
        for (const shareKey of Object.keys(sharedIFrames.frames || {})) {
            if (p.name === shareKey) {
                isIFrameActive = true;
                break;
            }
        }
    }

    return isIFrameActive;
}

/**
 * Fills the templateURL by replacing the placeholders with data.
 *
 * @param {string} templateUrl - The templateUrl to be templated.
 * @param {string} room - The room value for the template.
 * @param {string} lang - The language value for the template.
 * @returns {string} - The iFrameURL or empty string.
 */
export function getGenericiFrameUrl(templateUrl, room, lang) {
    let iFrameUrl = templateUrl || '';

    iFrameUrl = iFrameUrl.replace('{room}', room);
    iFrameUrl = iFrameUrl.replace('{lang}', lang);

    return `${iFrameUrl}`;
}

/**
 * Returns the shared iframes details.
 *
 * @param {Function|Object} stateful - The redux store, the redux
 * {@code getState} function, or the redux state itself.
 * @returns {Object}
 */
export const getSharedIFramesInfo = (stateful: Function | Object) => {
    const state = toState(stateful);
    const sharedIframesInfo = state['features/shared-iframe'].iframes || {};

    return sharedIframesInfo;
};
