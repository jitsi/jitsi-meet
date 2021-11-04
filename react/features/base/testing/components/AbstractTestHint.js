/* @flow */

import { isTestModeEnabled } from '../functions';

/**
 * Describes the {@link TestHint}'s properties.
 *
 * A test hint is meant to resemble the lack of the ability to execute
 * JavaScript by the mobile torture tests. They are used to expose some of
 * the app's internal state that is not always expressed in a feasible manner by
 * the UI.
 */
export type TestHintProps = {

    /**
     * The indicator which determines whether the test mode is enabled.
     * {@link TestHint} Components are rendered only if this flag is set to
     * {@code true}.
     */
    _testModeEnabled: boolean,

    /**
     * The test hint's identifier string. Must be unique in the app instance
     * scope.
     */
    id: string,

    /**
     * The optional "on press" handler which can be used to bind a click handler
     * to a {@link TestHint}.
     */
    onPress: ?Function,

    /**
     * The test hint's (text) value which is to be consumed by the tests.
     */
    value: string
}

/**
 * Maps (parts of) the redux state to {@link TestHint}'s React {@code Component}
 * props.
 *
 * @param {Object} state - The redux store/state.
 * @private
 * @returns {{
 *     _testModeEnabled: boolean
 * }}
 */
export function _mapStateToProps(state: Object) {
    return {

        /**
         * The indicator which determines whether the test mode is enabled.
         *
         * @protected
         * @type {boolean}
         */
        _testModeEnabled: isTestModeEnabled(state)
    };
}
