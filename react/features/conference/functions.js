// @flow

/**
 * Maps parts of the redux state to {@link Toolbox} (React {@code Component})
 * props.
 *
 * @param {Object} state - The redux state of which parts are to be mapped to
 * {@code Conference} props.
 * @protected
 * @returns {{
 *     _calleeInfoVisible: boolean
 * }}
 */
export function abstractMapStateToProps(state: Object): Object {
    return {
        /**
         * The indication which determines if the {@code CalleeInfo} component
         * should be shown or not.
         *
         * @private
         * @type {boolean}
         */
        _calleeInfoVisible: state['features/base/jwt'].calleeInfoVisible
    };
}
