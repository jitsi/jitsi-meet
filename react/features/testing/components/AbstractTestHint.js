/* @flow */

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
     * The test hint's identifier string. Must be unique in the app instance
     * scope.
     */
    id: string,

    /**
     * The test hint's (text) value which is to be consumed by the tests.
     */
    value: string
}
