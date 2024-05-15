import { IReduxState } from '../app/types';
import { isButtonEnabled } from '../toolbox/functions';

export * from './functions.any';

/**
 * Returns the config whether Go Live button is enabled.
 *
 * @param {Object} state - The state of the app.
 * @returns {boolean}
 */
export function isGoLiveButtonEnabled(state: IReduxState): boolean {
    return isButtonEnabled('golive', state);
}
