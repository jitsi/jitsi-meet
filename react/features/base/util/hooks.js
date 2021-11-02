// @flow
import { useSelector } from 'react-redux';

/**
 * Takes a redux selector and binds it to specific values.
 *
 * @param {Function} selector - The selector function.
 * @param {...any} args - The values to bind to.
 * @returns {any}
 */
export function useBoundSelector(selector: Function, ...args: any[]) {
    return useSelector(state => selector(state, ...args));
}
