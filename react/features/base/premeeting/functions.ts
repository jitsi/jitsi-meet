import { IReduxState } from '../../app/types';

import { PRE_CALL_TEST_PROBLEM } from './constants';


/**
 * The avatar size to container size ration.
 */
const ratio = 1 / 3;

/**
 * The max avatar size.
 */
const maxSize = 190;

/**
 * The window limit height over which the avatar should have the default dimension.
 */
const upperHeightLimit = 760;

/**
 * The window limit height under which the avatar should not be resized anymore.
 */
const lowerHeightLimit = 460;

/**
 * The default top margin of the avatar.
 */
const defaultMarginTop = '10%';

/**
 * The top margin of the avatar when its dimension is small.
 */
const smallMarginTop = '5%';

/**
 * Calculates avatar dimensions based on window height and position.
 *
 * @param {number} height - The window height.
 * @returns {{
 *   marginTop: string,
 *   size: number
 * }}
 */
export function calculateAvatarDimensions(height: number) {
    if (height > upperHeightLimit) {
        return {
            size: maxSize,
            marginTop: defaultMarginTop
        };
    }

    if (height > lowerHeightLimit) {
        const diff = height - lowerHeightLimit;
        const percent = diff * ratio;
        const size = Math.floor(maxSize * percent / 100);
        let marginTop = defaultMarginTop;

        if (height < 600) {
            marginTop = smallMarginTop;
        }

        return {
            size,
            marginTop
        };
    }

    return {
        size: 0,
        marginTop: '0'
    };
}

/**
 * Returns the network problem that the pre-call connectivity check found, if any: either nothing connected through
 * the TURN servers, or only TCP did.
 *
 * @param {Object} state - The state of the app.
 * @returns {string | undefined} One of {@code PRE_CALL_TEST_PROBLEM}, or undefined when there is no problem.
 */
export function getPreCallTestProblem(state: IReduxState): string | undefined {
    const { result } = state['features/base/premeeting'].preCallTestState;

    if (!result) {
        return undefined;
    }

    if (!result.connected) {
        return PRE_CALL_TEST_PROBLEM.BLOCKED;
    }

    return result.relayProtocol === 'tcp' ? PRE_CALL_TEST_PROBLEM.UDP_BLOCKED : undefined;
}

/**
 * Selector for determining if the pre-call test is enabled.
 *
 * @param {Object} state - The state of the app.
 * @returns {boolean}
 */
export function isPreCallTestEnabled(state: IReduxState): boolean {
    const { prejoinConfig } = state['features/base/config'];

    return prejoinConfig?.preCallTestEnabled ?? false;
}

/**
 * Selector for retrieving the pre-call test ICE URL.
 *
 * @param {Object} state - The state of the app.
 * @returns {string | undefined}
 */
export function getPreCallICEUrl(state: IReduxState): string | undefined {
    const { prejoinConfig } = state['features/base/config'];

    return prejoinConfig?.preCallTestICEUrl;
}

/**
 * Selector for retrieving the page with a full network test, linked when the pre-call test finds a problem.
 *
 * @param {Object} state - The state of the app.
 * @returns {string | undefined}
 */
export function getPreCallTestHelpUrl(state: IReduxState): string | undefined {
    const { prejoinConfig } = state['features/base/config'];

    return prejoinConfig?.preCallTestHelpUrl;
}
