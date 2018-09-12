// @flow

/**
 * The type of the React {@code Component} props of {@link TranscribingLabel}.
 */
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
 * Maps (parts of) the redux state to the associated props of the
 * {@link AbstractTranscribingLabel} {@code Component}.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {{
 *     _showLabel: boolean
 * }}
 */
export function _mapStateToProps(state: Object) {
    return {
        _showLabel: state['features/transcribing'].isTranscribing
    };
}
