// @flow


export type Props = {

    /**
     * True if the label needs to be rendered, false otherwise.
     */
    _showLabel: boolean,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * Maps (parts of) the redux state to the associated props of this {@code Component}.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {Props}
 */
export function _mapStateToProps(state: Object) {
    const participants = state['features/base/participants'];

    return {
        _showLabel: participants.every(p => p.e2eeEnabled)
    };
}
