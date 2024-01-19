import { IStateful } from '../../app/types';
import { toState } from '../../redux/functions';

/**
 *
 * Returns the client width.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state
 * features/base/config.
 * @returns {number}.
 */
export function getClientWidth(stateful: IStateful) {
    const state = toState(stateful)['features/base/responsive-ui'];

    return state.clientWidth;
}

/**
 *
 * Returns the client height.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state
 * features/base/config.
 * @returns {number}.
 */
export function getClientHeight(stateful: IStateful) {
    const state = toState(stateful)['features/base/responsive-ui'];

    return state.clientHeight;
}
