// @flow

import { Component } from 'react';

import { JitsiRecordingConstants } from '../../base/lib-jitsi-meet';

/**
 * NOTE: Web currently renders multiple indicators if multiple recording
 * sessions are running. This is however may not be a good UX as it's not
 * obvious why there are multiple similar 'REC' indicators rendered. Mobile
 * only renders one indicator if there is at least one recording session
 * running. These boolean are shared across the two components to make it
 * easier to align web's behaviour to mobile's later if necessary.
 */
export type Props = {

    /**
     * True if there is an active recording with the provided mode therefore the
     * component must be rendered.
     */
    _visible: boolean,

    /**
     * The recording mode this indicator should display.
     */
    mode: string,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * Abstract class for the {@code RecordingLabel} component.
 */
export default class AbstractRecordingLabel<P: Props>
    extends Component<P> {

    /**
     * Implements React {@code Component}'s render.
     *
     * @inheritdoc
     */
    render() {
        return this.props._visible ? this._renderLabel() : null;
    }

    _getLabelKey: () => ?string

    /**
     * Returns the label key that this indicator should render.
     *
     * @protected
     * @returns {?string}
     */
    _getLabelKey() {
        switch (this.props.mode) {
        case JitsiRecordingConstants.mode.STREAM:
            return 'recording.live';
        case JitsiRecordingConstants.mode.FILE:
            return 'recording.rec';
        default:
            // Invalid mode is passed to the component.
            return undefined;
        }
    }

    /**
     * Renders the platform specific label component.
     *
     * @protected
     * @returns {React$Element}
     */
    _renderLabel: () => React$Element<*>

}

/**
 * Maps (parts of) the Redux state to the associated
 * {@code AbstractRecordingLabel}'s props.
 *
 * @param {Object} state - The Redux state.
 * @param {Props} ownProps - The component's own props.
 * @private
 * @returns {{
 *     _visible: boolean
 * }}
 */
export function _mapStateToProps(state: Object, ownProps: Props) {
    const { mode } = ownProps;
    const _recordingSessions = state['features/recording'].sessionDatas;
    const _visible
        = Array.isArray(_recordingSessions)
        && _recordingSessions.some(
            session => session.status === JitsiRecordingConstants.status.ON
            && session.mode === mode
        );

    return {
        _visible
    };
}
