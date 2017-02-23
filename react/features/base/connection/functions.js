/* @flow */

/**
 * Returns current domain.
 *
 * @param {(Function|Object)} stateOrGetState - Redux getState() method or Redux
 * state.
 * @returns {(string|undefined)}
 */
export function getDomain(stateOrGetState: Function | Object) {
    const state
        = typeof stateOrGetState === 'function'
            ? stateOrGetState()
            : stateOrGetState;
    const { options } = state['features/base/connection'];
    let domain;

    try {
        domain = options.hosts.domain;
    } catch (e) {
        // XXX The value of options or any of the properties descending from it
        // may be undefined at some point in the execution (e.g. on start).
        // Instead of multiple checks for the undefined value, we just wrap it
        // in a try-catch block.
    }

    return domain;
}
