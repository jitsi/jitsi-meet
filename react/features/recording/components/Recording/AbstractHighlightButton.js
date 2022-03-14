// @flow

import { Component } from 'react';

import { getActiveSession, isHighlightMeetingMomentDisabled } from '../..';
import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';
import { highlightMeetingMoment } from '../../actions.any';

export type Props = {

    /**
     * Whether or not the conference is in audio only mode.
     */
    _audioOnly: boolean,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * Abstract class for the {@code AbstractHighlightButton} component.
 */
export default class AbstractHighlightButton<P: Props> extends Component<P> {
    /**
     * Initializes a new AbstractVideoTrack instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this._onClick = this._onClick.bind(this);
    }

    /**
   * Handles clicking / pressing the button.
   *
   * @override
   * @protected
   * @returns {void}
   */
    _onClick() {
        const { _disabled, dispatch } = this.props;

        if (!_disabled) {
            dispatch(highlightMeetingMoment());
        }
    }
}

/**
 * Maps (parts of) the Redux state to the associated
 * {@code AbstractVideoQualityLabel}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _audioOnly: boolean
 * }}
 */
export function _abstractMapStateToProps(state: Object) {
    const isRecordingRunning = getActiveSession(state, JitsiRecordingConstants.mode.FILE);
    const isButtonDisabled = isHighlightMeetingMomentDisabled(state);
    const { webhookProxyUrl } = state['features/base/config'];

    return {
        _disabled: !isRecordingRunning || isButtonDisabled,
        _visible: Boolean(webhookProxyUrl)
    };
}
